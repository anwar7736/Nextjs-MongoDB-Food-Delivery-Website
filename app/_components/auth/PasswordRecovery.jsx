"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import ValidationError from "../ValidationError";

export default function PasswordRecovery({ accountType, onClose }) {
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  const sendRequest = async (action, data) => {
    setErrors({});
    setMessage("");
    setIsBusy(true);
    try {
      const response = await fetch("/api/v1/auth/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, accountType, email: email.trim(), ...data }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        setErrors(result.fieldErrors || { [action === "request" ? "email" : "code"]: result.message || "Unable to reset your password." });
        return false;
      }
      if (action === "request") {
        setStep("reset");
        setMessage(result.message);
      } else {
        toast.success(result.message);
        onClose();
        return true;
      }
      return true;
    } catch {
      setErrors({ [action === "request" ? "email" : "code"]: "Unable to reach the password recovery service." });
      return false;
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <section className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4 text-left" aria-labelledby="password-recovery-title">
      <h3 id="password-recovery-title" className="mb-4 text-center font-bold">Reset your password</h3>
      <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="recovery-email">Email</label>
      <input
        className="shadow appearance-none border border-green-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-1"
        id="recovery-email"
        type="email"
        autoComplete="email"
        value={email}
        disabled={step === "reset"}
        onChange={(event) => setEmail(event.target.value)}
      />
      {errors.email && <ValidationError message={errors.email} />}
      {message && <p className="text-sm text-green-700 mt-2" role="status">{message}</p>}

      {step === "email" ? (
        <button
          className="mt-4 w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
          type="button"
          disabled={isBusy}
          onClick={() => sendRequest("request")}
        >
          {isBusy ? "Sending…" : "Send email code"}
        </button>
      ) : (
        <form className="mt-4" onSubmit={(event) => {
          event.preventDefault();
          sendRequest("reset", { code, password, confirmPassword });
        }}>
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="recovery-code">Email code</label>
          <input
            className="shadow appearance-none border border-green-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-1"
            id="recovery-code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
          />
          {errors.code && <ValidationError message={errors.code} />}

          <label className="block text-gray-700 text-sm font-bold mt-4 mb-2" htmlFor="recovery-password">New password</label>
          <input
            className="shadow appearance-none border border-green-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-1"
            id="recovery-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          {errors.password && <ValidationError message={errors.password} />}

          <label className="block text-gray-700 text-sm font-bold mt-4 mb-2" htmlFor="recovery-confirm-password">Confirm new password</label>
          <input
            className="shadow appearance-none border border-green-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-1"
            id="recovery-confirm-password"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
          {errors.confirmPassword && <ValidationError message={errors.confirmPassword} />}

          <button
            className="mt-4 w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
            type="submit"
            disabled={isBusy}
          >
            {isBusy ? "Saving…" : "Reset password"}
          </button>
          <button
            className="mt-3 w-full text-sm text-blue-600 hover:text-blue-800"
            type="button"
            onClick={() => {
              setStep("email");
              setMessage("");
              setErrors({});
            }}
          >
            Change email or request another code
          </button>
        </form>
      )}
      <button className="mt-3 w-full text-sm text-gray-600 hover:text-gray-800" type="button" onClick={onClose}>
        Back to login
      </button>
    </section>
  );
}
