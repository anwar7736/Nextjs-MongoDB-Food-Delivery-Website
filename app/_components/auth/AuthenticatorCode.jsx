"use client";

import { useState } from "react";

export default function AuthenticatorCode({ onVerify, onCancel }) {
  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const handleChange = async (event) => {
    const nextCode = event.target.value.replace(/\D/g, "").slice(0, 6);
    setCode(nextCode);
    if (nextCode.length !== 6 || isVerifying) return;

    setIsVerifying(true);
    const verified = await onVerify(nextCode);
    if (!verified) setCode("");
    setIsVerifying(false);
  };

  return (
    <section className="auth-card auth-code-card" aria-labelledby="auth-code-title">
      <div className="auth-icon" aria-hidden="true">✓</div>
      <h2 id="auth-code-title">Verify it’s you</h2>
      <p>Enter the six-digit code from your authenticator app. We’ll verify it automatically.</p>
      <label className="form-label" htmlFor="authenticator-code">Authenticator code</label>
      <input
        id="authenticator-code"
        className="form-input authenticator-code-input"
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]*"
        maxLength={6}
        value={code}
        onChange={handleChange}
        disabled={isVerifying}
        autoFocus
        aria-describedby="auth-code-status"
      />
      <p id="auth-code-status" className="auth-code-status" aria-live="polite">
        {isVerifying ? "Checking your code…" : `${code.length}/6 digits`}
      </p>
      <button className="text-button" type="button" onClick={onCancel} disabled={isVerifying}>
        Back to password
      </button>
    </section>
  );
}
