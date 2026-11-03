"use client";

import { useEffect, useRef, useState } from "react";

const supportOptions = [
  {
    label: "Chat with AI",
    description: "Coming soon",
    icon: "chat",
    comingSoon: true,
  },
  {
    label: "Call us",
    description: "+880 1794-030592",
    icon: "phone",
    href: "tel:+8801794030592",
  },
  {
    label: "WhatsApp",
    description: "Chat with us on WhatsApp",
    icon: "whatsapp",
    href: "https://wa.me/8801794030592",
  },
  {
    label: "Facebook",
    description: "Message us on Facebook",
    icon: "messenger",
    href: "https://www.facebook.com/share/19Mi4A2SNF/",
    external: true,
  },
];

function OptionIcon({ type }) {
  if (type === "phone") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3H4a1 1 0 0 0-1 1c0 9.4 7.6 17 17 17a1 1 0 0 0 1-1v-3l-5-2-2 2c-3.1-1.3-5.7-3.9-7-7l2-2-2-5Z" /></svg>;
  }
  if (type === "whatsapp") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11.7a8 8 0 0 1-11.8 7L4 20l1.3-4A8 8 0 1 1 20 11.7Z" /><path d="M9 8.5c.3-.5.6-.5.9-.5h.4c.2 0 .4.1.5.4l.7 1.6c.1.3.1.5-.1.7l-.5.6c-.2.2-.2.4 0 .6.5.9 1.2 1.5 2.1 2 .3.1.5.1.7-.1l.7-.8c.2-.2.4-.2.7-.1l1.5.7c.3.1.4.3.4.5 0 .3-.2 1.1-.7 1.5-.5.5-1.3.7-2 .5-1.1-.3-2.5-.9-3.9-2.2-1.2-1.1-2-2.5-2.2-3.5-.2-.7.1-1.4.5-1.9Z" /></svg>;
  }
  if (type === "messenger") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3C6.8 3 3 6.7 3 11.5c0 2.5 1.1 4.7 3 6.2V21l3.1-1.7c.9.2 1.8.4 2.9.4 5.2 0 9-3.7 9-8.5S17.2 3 12 3Z" /><path className="support-icon-cutout" d="m7.5 14.5 3.2-3.4 2.1 1.7 3.7-3.3-3.2 3.5-2.1-1.7-3.7 3.2Z" /></svg>;
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v11H9l-5 4V5Z" /><path d="M8 9h8M8 12h5" /></svg>;
}

export default function SupportWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const widgetRef = useRef(null);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (widgetRef.current && !widgetRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div className="support-widget" ref={widgetRef}>
      {isOpen && (
        <section className="support-panel" aria-label="Contact FoodFlow AI">
          <div className="support-panel-header">
            <div>
              <strong>Get in touch</strong>
              <span>We’re here to help</span>
            </div>
            <button
              className="support-close"
              type="button"
              aria-label="Close support options"
              onClick={() => setIsOpen(false)}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
            </button>
          </div>
          <div className="support-options">
            {supportOptions.map((option) => {
              const content = (
                <>
                  <span className={`support-option-icon support-icon-${option.icon}`}>
                    <OptionIcon type={option.icon} />
                  </span>
                  <span className="support-option-copy">
                    <strong>{option.label}</strong>
                    <span>{option.description}</span>
                  </span>
                  {option.comingSoon && <span className="support-coming-soon">Soon</span>}
                </>
              );

              return option.href ? (
                <a
                  className="support-option"
                  href={option.href}
                  key={option.label}
                  target={option.external ? "_blank" : undefined}
                  rel={option.external ? "noopener noreferrer" : undefined}
                >
                  {content}
                </a>
              ) : (
                <div className="support-option support-option-soon" key={option.label}>
                  {content}
                </div>
              );
            })}
          </div>
        </section>
      )}
      <button
        className={`support-launcher${isOpen ? " is-open" : ""}`}
        type="button"
        aria-label={isOpen ? "Close contact options" : "Open contact options"}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        <img src="/support-avatar.svg" alt="" />
        <span className="support-online-indicator" aria-label="Available now" />
      </button>
    </div>
  );
}
