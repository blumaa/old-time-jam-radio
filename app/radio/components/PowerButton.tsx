"use client";

interface PowerButtonProps {
  isPoweredOn: boolean;
  onClick: () => void;
}

export default function PowerButton({ isPoweredOn, onClick }: PowerButtonProps) {
  return (
    <button
      className={`power-button ${isPoweredOn ? "power-button--on" : ""}`}
      onClick={onClick}
      aria-label="Power"
      aria-pressed={isPoweredOn}
      type="button"
    >
      <div className="power-button__indicator" />
    </button>
  );
}
