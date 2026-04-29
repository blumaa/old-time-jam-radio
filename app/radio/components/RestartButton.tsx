"use client";

interface RestartButtonProps {
  onClick: () => void;
  disabled: boolean;
}

export default function RestartButton({ onClick, disabled }: RestartButtonProps) {
  return (
    <button
      className="transport-button"
      onClick={onClick}
      aria-label="Restart"
      disabled={disabled}
      type="button"
    >
      <span className="transport-button__icon">↺</span>
    </button>
  );
}
