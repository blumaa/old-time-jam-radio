"use client";

import type { ReactNode } from "react";

interface ControlProps {
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  "aria-label": string;
  children: ReactNode;
}

export default function Control({ onClick, disabled, active, children, ...rest }: ControlProps) {
  const className = ["control", active ? "control--active" : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      className={className}
      onClick={onClick}
      aria-label={rest["aria-label"]}
      disabled={disabled}
      type="button"
    >
      {children}
    </button>
  );
}
