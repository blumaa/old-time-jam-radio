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
        variant="rocker"
        checked={mode === "learn"}
        onChange={(checked) => onModeChange(checked ? "learn" : "jam")}
        disabled={!isPoweredOn}
        aria-label="Mode"
        labels={["Jam", "Learn"]}
      />

      <div className="player-controls__buttons">
        <Control onClick={onPowerToggle} aria-label="Power" active={isPoweredOn}>
          <div className="control__indicator" />
        </Control>

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

        <Control onClick={onSearch} aria-label="Search tunes" disabled={!isPoweredOn || isJam}>
          <svg className="control__icon-svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <circle cx="10" cy="10" r="6" />
            <line x1="14.5" y1="14.5" x2="20" y2="20" />
          </svg>
        </Control>
      </div>
    </div>
  );
}
