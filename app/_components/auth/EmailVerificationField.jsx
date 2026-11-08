"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import ValidationError from "../ValidationError";

export default function EmailVerificationField({ accountType, email, register, errors, setError, clearErrors }) {
  const [isSending, setIsSending] = useState(false);

  const sendCode = async () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("email", { type: "validate", message: "Provide a valid email address." });
      return;
    }

    setIsSending(true);
    clearErrors(["email", "emailVerificationCode"]);
    try {
      const response = await fetch("/api/v1/auth/registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "request", accountType, email }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        Object.entries(result.fieldErrors || {}).forEach(([field, message]) => {
          setError(field, { type: "server", message });
        });
        toast.error(result.message || "Unable to send the verification code.");
        return;
      }

      toast.success(result.message);
    } catch {
      toast.error("Unable to reach the email verification service.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="mb-6">
      <label className="block text-gray-700 text-sm font-bold mb-2 text-start" htmlFor="emailVerificationCode">
        Email verification code
      </label>
      <div className="flex gap-2">
        <input
          className="shadow appearance-none border border-green-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-1"
          id="emailVerificationCode"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="6-digit code"
          {...register("emailVerificationCode", {
            required: "Enter the code sent to your email.",
            pattern: { value: /^\d{6}$/, message: "Enter the six-digit verification code." },
          })}
        />
        <button
          className="bg-gray-700 hover:bg-gray-800 text-white font-bold px-3 rounded whitespace-nowrap disabled:opacity-50"
          type="button"
          disabled={isSending}
          onClick={sendCode}
        >
          {isSending ? "Sending…" : "Send code"}
        </button>
      </div>
      {errors.emailVerificationCode && <ValidationError message={errors.emailVerificationCode.message} />}
    </div>
  );
}
