"use client";

import { useContext, useEffect, useState } from "react";
import { AuthContext } from "@/app/contexts/AuthContext";
import { CartContext } from "@/app/contexts/CartContext";
import { DeliveryAuthContext } from "@/app/contexts/DeliveryAuthContext";
import { UserAuthContext } from "@/app/contexts/UserAuthContext";
import { delivery_auth, restaurant_auth, user_auth } from "@/app/helpers/helper";
import { deleteCookie } from "cookies-next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import Swal from "sweetalert2";

const Header = () => {
  const { auth, setAuth } = useContext(AuthContext);
  const { user, setUser } = useContext(UserAuthContext);
  const { delivery, setDelivery } = useContext(DeliveryAuthContext);
  const { cart } = useContext(CartContext);
  const [menuOpen, setMenuOpen] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const installed = window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;
    setIsInstalled(installed);

    const handleInstallPrompt = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };
    const handleInstalled = () => {
      setInstallPrompt(null);
      setIsInstalled(true);
    };

    window.addEventListener("beforeinstallprompt", handleInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const installApp = async () => {
    if (isInstalled) return;
    if (!installPrompt) {
      const isIOS = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
      toast.info(isIOS
        ? "To install, tap Share and choose Add to Home Screen."
        : "Install is not available yet. Try again from your browser’s menu.");
      return;
    }

    installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice?.outcome === "accepted") setIsInstalled(true);
    setInstallPrompt(null);
  };

  const logout = async (type) => {
    const result = await Swal.fire({
      title: "Sign out?",
      text: "You will be signed out of this account.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sign out",
      cancelButtonText: "Stay here",
      confirmButtonColor: "#15803d",
    });
    if (!result.isConfirmed) return;

    try {
      const response = await fetch("/api/v1/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error("Could not clear the server session.");
    } catch (error) {
      console.error("Sign out failed:", error.message);
      toast.error("Unable to sign out. Please try again.");
      return;
    }

    const cookie = type === "user" ? "user_auth" : type === "restaurant" ? "restaurant_auth" : "delivery_auth";
    deleteCookie(cookie);
    if (type === "user") setUser(user_auth());
    if (type === "restaurant") setAuth(restaurant_auth());
    if (type === "delivery") setDelivery(delivery_auth());
    setMenuOpen(false);
    toast.success("Signed out successfully.");
    router.push("/");
  };

  const activeAccount = user || auth || delivery;
  const accountPath = user ? "user" : auth ? "restaurant" : "delivery";
  const links = [
    { href: "/", label: "Home" },
    ...(activeAccount ? [
      { href: `/${accountPath}/dashboard`, label: "Dashboard" },
      { href: `/${accountPath}/profile`, label: "Profile" },
    ] : [
      { href: "/user", label: "Customer sign in" },
      { href: "/restaurant", label: "Business sign in" },
      { href: "/delivery", label: "Delivery sign in" },
    ]),
    { href: "/cart", label: `Cart (${cart.length})` },
  ];

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link className="site-brand" href="/" onClick={() => setMenuOpen(false)}>
          <img src="/logo.png" alt="" />
          <span>FoodFlow AI</span>
        </Link>

        <button
          className="menu-toggle"
          type="button"
          aria-expanded={menuOpen}
          aria-controls="primary-navigation"
          aria-label={menuOpen ? "Close navigation" : "Open navigation"}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span />
          <span />
          <span />
        </button>

        <nav id="primary-navigation" className={`site-nav ${menuOpen ? "is-open" : ""}`}>
          {links.map(({ href, label }) => (
            <Link key={href} href={href} onClick={() => setMenuOpen(false)}>
              {label}
            </Link>
          ))}
        </nav>

        <div className="header-actions">
          <button className="install-button" type="button" onClick={installApp}>
            {isInstalled ? "App installed" : "Install App"}
          </button>
          {user && (
            <button className="header-logout" type="button" onClick={() => logout("user")}>Sign out</button>
          )}
          {auth && (
            <button className="header-logout" type="button" onClick={() => logout("restaurant")}>Sign out</button>
          )}
          {delivery && (
            <button className="header-logout" type="button" onClick={() => logout("delivery")}>Sign out</button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
