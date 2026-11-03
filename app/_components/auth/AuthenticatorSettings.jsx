"use client";

import { useState } from "react";
import { setCookie } from "cookies-next";
import { toast } from "react-toastify";

export default function AuthenticatorSettings({ accountType, account }) {
  const [isEnabled, setIsEnabled] = useState(Boolean(account?.twoFactorEnabled));
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  const sendRequest = async (action, token) => {
    setIsBusy(true);
    try {
      const response = await fetch("/api/v1/authenticator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          accountType,
          accountId: account._id,
          password,
          code: token,
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        toast.error(result.message || "Unable to update authenticator settings.");
        return false;
      }

      if (action === "setup") {
        setQrCode(result.qrCode);
        toast.info(result.message);
      } else {
        const enabled = action === "confirm";
        setIsEnabled(enabled);
        setQrCode("");
        setPassword("");
        setCode("");
        setCookie(`${accountType}_auth`, JSON.stringify({ ...account, twoFactorEnabled: enabled }));
        toast.success(result.message);
      }
      return true;
    } catch {
      toast.error("Unable to reach the authenticator service.");
      return false;
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <section className="security-card" aria-labelledby="security-title">
      <div className="security-card-heading">
        <div>
          <p className="eyebrow">Account security</p>
          <h2 id="security-title">Authenticator app</h2>
        </div>
        <span className={`security-status ${isEnabled ? "is-enabled" : ""}`}>
          {isEnabled ? "Enabled" : "Not enabled"}
        </span>
      </div>
      <p className="security-description">
        {isEnabled
          ? "Your account asks for a time-based code whenever you sign in."
          : "Add a second layer of protection with an authenticator app such as Google Authenticator or Microsoft Authenticator."}
      </p>

      {!isEnabled && !qrCode && (
        <div className="security-actions">
          <input
            className="form-input"
            type="password"
            autoComplete="current-password"
            placeholder="Confirm your current password"
            aria-label="Confirm your current password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <button
            className="primary-button"
            type="button"
            disabled={isBusy || !password}
            onClick={() => sendRequest("setup")}
          >
            {isBusy ? "Preparing…" : "Set up 2FA"}
          </button>
        </div>
      )}

      {!isEnabled && qrCode && (
        <div className="security-enrollment">
          <img className="authenticator-qr" src={qrCode} alt="QR code for your authenticator app" />
          <div className="security-enrollment-copy">
            <p>Scan this QR code with your authenticator app, then enter the six-digit code it displays.</p>
            <label className="form-label" htmlFor="setup-authenticator-code">Six-digit code</label>
            <input
              id="setup-authenticator-code"
              className="form-input authenticator-code-input"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
            />
            <div className="security-actions">
              <button
                className="primary-button"
                type="button"
                disabled={isBusy || code.length !== 6}
                onClick={() => sendRequest("confirm", code)}
              >
                {isBusy ? "Verifying…" : "Confirm and enable"}
              </button>
              <button className="text-button" type="button" disabled={isBusy} onClick={() => setQrCode("")}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {isEnabled && (
        <div className="security-actions">
          <input
            className="form-input"
            type="password"
            autoComplete="current-password"
            placeholder="Confirm your current password"
            aria-label="Confirm your current password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <input
            className="form-input authenticator-code-input"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="6-digit code"
            aria-label="Authenticator code"
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
          />
          <button
            className="danger-button"
            type="button"
            disabled={isBusy || !password || code.length !== 6}
            onClick={() => sendRequest("disable", code)}
          >
            {isBusy ? "Verifying…" : "Disable 2FA"}
          </button>
        </div>
      )}
    </section>
  );
}
