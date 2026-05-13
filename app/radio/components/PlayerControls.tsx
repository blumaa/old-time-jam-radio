"use client";

import type { RadioMode } from "../types";
import Control from "./Control";

interface PlayerControlsProps {
  isPoweredOn: boolean;
  onPowerToggle: () => void;
  isPaused: boolean;
  onPause: () => void;
  onSearch: () => void;
  onRestart: () => void;
  mode: RadioMode;
  onModeChange: (mode: RadioMode) => void;
  hasCurrentTune: boolean;
}

export default function PlayerControls({
  isPoweredOn,
  onPowerToggle,
  isPaused,
  onPause,
  onSearch,
  onRestart,
  mode,
  onModeChange,
  hasCurrentTune,
}: PlayerControlsProps) {
  const isJam = mode === "jam";
  const transportDisabled = !isPoweredOn || !hasCurrentTune;

  return (
    <div className="player-controls">
      <Control
        onClick={onPause}
        aria-label={isPaused ? "Resume" : "Pause"}
        disabled={transportDisabled}
        active={isPaused}
      >
        <span className="control__icon">{isPaused ? "▶" : "❙❙"}</span>
      </Control>

      <Control onClick={onRestart} aria-label="Restart" disabled={transportDisabled || isJam}>
        <span className="control__icon">↺</span>
      </Control>

      <Control onClick={onPowerToggle} aria-label="Power" active={isPoweredOn}>
        <div className="control__indicator" />
      </Control>

      <Control onClick={onSearch} aria-label="Search tunes" disabled={!isPoweredOn || isJam}>
        <svg className="control__icon-svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <circle cx="10" cy="10" r="6" />
          <line x1="14.5" y1="14.5" x2="20" y2="20" />
        </svg>
      </Control>

      <Control
        onClick={() => onModeChange(isJam ? "learn" : "jam")}
        disabled={!isPoweredOn}
        aria-label={isJam ? "Switch to learn mode" : "Switch to jam mode"}
      >
        {isJam ? (
          <span className="control__icon">♫</span>
        ) : (
          <svg className="control__icon-svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15z" />
          </svg>
        )}
      </Control>
    </div>
  );
}
