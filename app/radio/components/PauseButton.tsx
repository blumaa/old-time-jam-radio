"use client";

interface PauseButtonProps {
  isPaused: boolean;
  onClick: () => void;
  disabled: boolean;
}

export default function PauseButton({ isPaused, onClick, disabled }: PauseButtonProps) {
  return (
    <button
      className={`transport-button ${isPaused ? "transport-button--active" : ""}`}
      onClick={onClick}
      aria-label={isPaused ? "Resume" : "Pause"}
      disabled={disabled}
      type="button"
    >
      <span className="transport-button__icon">
        {isPaused ? "▶" : "❙❙"}
      </span>
    </button>
  );
}
