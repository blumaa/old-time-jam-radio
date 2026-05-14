"use client";

import type { ReactNode } from "react";

type ButtonProps = {
  variant?: "button";
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  "aria-label": string;
  children: ReactNode;
};

type RockerProps = {
  variant: "rocker";
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  "aria-label": string;
  labels: [string, string];
};

type ControlProps = ButtonProps | RockerProps;

export default function Control(props: ControlProps) {
  if (props.variant === "rocker") {
    const { checked, onChange, disabled, labels } = props;

    return (
      <button
        className={`control--rocker ${checked ? "control--rocker-on" : ""}`}
        role="switch"
        aria-checked={checked}
        aria-label={props["aria-label"]}
        disabled={disabled}
        type="button"
        onClick={() => onChange(!checked)}
      >
        <span className={`control--rocker__option ${!checked ? "control--rocker__option--active" : ""}`}>
          {labels[0]}
        </span>
        <span className={`control--rocker__option ${checked ? "control--rocker__option--active" : ""}`}>
          {labels[1]}
        </span>
      </button>
    );
  }

  const { onClick, disabled, active, children } = props;
  const className = ["control", active ? "control--active" : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      className={className}
      onClick={onClick}
      aria-label={props["aria-label"]}
      disabled={disabled}
      type="button"
    >
      {children}
    </button>
  );
}
