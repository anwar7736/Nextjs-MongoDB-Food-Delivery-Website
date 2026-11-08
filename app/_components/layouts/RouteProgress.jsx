"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function RouteProgress() {
  const pathname = usePathname();
  const previousPathname = useRef(pathname);
  const hideTimer = useRef(null);
  const timeoutTimer = useRef(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const clearTimers = () => {
      window.clearTimeout(hideTimer.current);
      window.clearTimeout(timeoutTimer.current);
    };

    const startNavigation = () => {
      clearTimers();
      setIsComplete(false);
      setIsNavigating(true);
      timeoutTimer.current = window.setTimeout(() => {
        setIsComplete(true);
        hideTimer.current = window.setTimeout(() => setIsNavigating(false), 220);
      }, 15000);
    };

    const handleClick = (event) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) return;

      const link = event.target.closest("a[href]");
      if (!link || link.target === "_blank" || link.hasAttribute("download")) return;

      const destination = new URL(link.href, window.location.href);
      if (destination.origin !== window.location.origin) return;
      if (`${destination.pathname}${destination.search}` === `${window.location.pathname}${window.location.search}`) return;

      startNavigation();
    };

    const handlePopState = () => startNavigation();

    document.addEventListener("click", handleClick, true);
    window.addEventListener("popstate", handlePopState);

    return () => {
      clearTimers();
      document.removeEventListener("click", handleClick, true);
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  useEffect(() => {
    if (previousPathname.current === pathname) return;

    previousPathname.current = pathname;
    setIsNavigating(true);
    setIsComplete(true);
    window.clearTimeout(timeoutTimer.current);
    hideTimer.current = window.setTimeout(() => setIsNavigating(false), 220);
  }, [pathname]);

  if (!isNavigating) return null;

  return (
    <div
      className={`route-progress${isComplete ? " is-complete" : ""}`}
      role="progressbar"
      aria-label="Loading page"
      aria-valuetext={isComplete ? "Page loaded" : "Loading page"}
    >
      <span className="route-progress-fill" />
    </div>
  );
}
