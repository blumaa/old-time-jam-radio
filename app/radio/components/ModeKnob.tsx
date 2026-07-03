"use client";

import { useRef, useState, useCallback } from "react";
import type { PointerEvent as ReactPointerEvent, KeyboardEvent } from "react";
import type { RadioMode } from "../types";
import {
  KNOB_MODES,
  KNOB_LABELS,
  modeToAngle,
  clampAngle,
  nearestMode,
  nextMode,
  pointerAngle,
} from "./knobGeometry";

interface ModeKnobProps {
  mode: RadioMode;
  onModeChange: (mode: RadioMode) => void;
  disabled?: boolean;
}

const DRAG_THRESHOLD = 4; // px of travel before a press counts as a drag, not a tap

export default function ModeKnob({ mode, onModeChange, disabled }: ModeKnobProps) {
  const dialRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const [dragAngle, setDragAngle] = useState<number | null>(null);

  // Live rotation follows the finger while dragging, else rests at the detent.
  const angle = dragAngle ?? modeToAngle(mode);

  const centerOf = (el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    return { cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
  };

  const handlePointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (disabled) return;
      e.currentTarget.setPointerCapture?.(e.pointerId);
      dragStart.current = { x: e.clientX, y: e.clientY, moved: false };
    },
    [disabled]
  );

  const handlePointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      const start = dragStart.current;
      if (!start || !dialRef.current) return;
      if (
        !start.moved &&
        Math.hypot(e.clientX - start.x, e.clientY - start.y) < DRAG_THRESHOLD
      ) {
        return;
      }
      start.moved = true;
      const { cx, cy } = centerOf(dialRef.current);
      setDragAngle(clampAngle(pointerAngle(e.clientX, e.clientY, cx, cy)));
    },
    []
  );

  const handlePointerUp = useCallback(
    () => {
      const start = dragStart.current;
      dragStart.current = null;
      if (!start) return;
      if (start.moved && dragAngle !== null) {
        onModeChange(nearestMode(dragAngle));
      } else {
        // A tap on the dial advances to the next mode.
        onModeChange(nextMode(mode));
      }
      setDragAngle(null);
    },
    [dragAngle, mode, onModeChange]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (disabled) return;
      const i = KNOB_MODES.indexOf(mode);
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        onModeChange(KNOB_MODES[Math.min(i + 1, KNOB_MODES.length - 1)]);
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        onModeChange(KNOB_MODES[Math.max(i - 1, 0)]);
      }
    },
    [disabled, mode, onModeChange]
  );

  return (
    <div
      className={`mode-knob ${disabled ? "mode-knob--disabled" : ""}`}
      role="radiogroup"
      aria-label="Mode"
    >
      <div className="mode-knob__labels">
        {KNOB_MODES.map((m) => (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={mode === m}
            aria-label={KNOB_LABELS[m]}
            className={`mode-knob__label ${
              mode === m ? "mode-knob__label--active" : ""
            }`}
            disabled={disabled}
            onClick={() => onModeChange(m)}
          >
            {KNOB_LABELS[m]}
          </button>
        ))}
      </div>

      <div
        ref={dialRef}
        className={`mode-knob__dial ${dragAngle !== null ? "mode-knob__dial--dragging" : ""}`}
        data-testid="mode-knob-dial"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onKeyDown={handleKeyDown}
        tabIndex={disabled ? -1 : 0}
        aria-hidden="true"
      >
        <div
          className="mode-knob__pointer-wrap"
          style={{ transform: `rotate(${angle}deg)` }}
        >
          <span className="mode-knob__pointer" />
        </div>
      </div>
    </div>
  );
}
