"use client";

import { useState } from "react";

interface PasswordGateProps {
  onSuccess: () => void;
}

export default function PasswordGate({ onSuccess }: PasswordGateProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        onSuccess();
      } else {
        setError("Invalid password");
      }
    } catch {
      setError("Connection error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="password-gate">
      <h1 className="password-gate__title">Admin Access</h1>
      <form className="password-gate__form" onSubmit={handleSubmit}>
        <input
          className="password-gate__input"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoFocus
        />
        <button
          className="password-gate__button"
          type="submit"
          disabled={loading}
        >
          {loading ? "..." : "Enter"}
        </button>
        {error && (
          <p className="password-gate__error" role="alert">
            {error}
          </p>
        )}
      </form>
    </div>
  );
}
