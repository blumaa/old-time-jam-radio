"use client";

import type { RadioMode } from "../types";

interface ModeToggleProps {
  mode: RadioMode;
  onModeChange: (mode: RadioMode) => void;
  disabled: boolean;
}

export default function ModeToggle({ mode, onModeChange, disabled }: ModeToggleProps) {
  return (
    <button
      className={`mode-toggle ${mode === "learn" ? "mode-toggle--learn" : ""}`}
      role="switch"
      aria-checked={mode === "learn"}
      aria-label="Mode"
      disabled={disabled}
      type="button"
      onClick={() => onModeChange(mode === "jam" ? "learn" : "jam")}
    >
      <span className={`mode-toggle__label ${mode === "jam" ? "mode-toggle__label--active" : ""}`}>
        JAM
      </span>
      <span className="mode-toggle__thumb" />
      <span className={`mode-toggle__label ${mode === "learn" ? "mode-toggle__label--active" : ""}`}>
        LEARN
      </span>
    </button>
  );
}
