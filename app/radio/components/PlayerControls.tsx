"use client";

import type { RadioMode } from "../types";
import Control from "./Control";
import ModeKnob from "./ModeKnob";

interface PlayerControlsProps {
  isPoweredOn: boolean;
  onPowerToggle: () => void;
  isPaused: boolean;
  onPause: () => void;
  onSearch: () => void;
  onQueue: () => void;
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
  onQueue,
  onRestart,
  mode,
  onModeChange,
  hasCurrentTune,
}: PlayerControlsProps) {
  const isJam = mode === "jam";
  const isListen = mode === "listen";
  const transportDisabled = !isPoweredOn || !hasCurrentTune;

  return (
    <div className="player-controls">
      <ModeKnob mode={mode} onModeChange={onModeChange} disabled={!isPoweredOn} />

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

        <Control onClick={onQueue} aria-label="Queue" disabled={!isPoweredOn || !isListen}>
          <svg className="control__icon-svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="4" y1="7" x2="15" y2="7" />
            <line x1="4" y1="12" x2="15" y2="12" />
            <line x1="4" y1="17" x2="11" y2="17" />
            <polyline points="17 15 20 18 17 21" />
          </svg>
        </Control>
      </div>
    </div>
  );
}
