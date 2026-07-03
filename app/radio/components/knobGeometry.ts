import type { RadioMode } from "../types";

/** Modes in dial order, left → right. */
export const KNOB_MODES: RadioMode[] = ["jam", "learn", "listen"];

export const KNOB_LABELS: Record<RadioMode, string> = {
  jam: "Jam",
  learn: "Learn",
  listen: "Listen",
};

/** Degrees between adjacent detents. Three positions span 2×STEP. */
export const KNOB_STEP = 52;

/** Rotation (deg, clockwise) for a mode's detent: jam −52°, learn 0°, listen +52°. */
export function modeToAngle(mode: RadioMode): number {
  return (KNOB_MODES.indexOf(mode) - 1) * KNOB_STEP;
}

/** Clamp a free rotation to the dial's travel. */
export function clampAngle(angle: number): number {
  const max = KNOB_STEP;
  return Math.max(-max, Math.min(max, angle));
}

/** Snap an arbitrary rotation to the nearest detent's mode. */
export function nearestMode(angle: number): RadioMode {
  const index = Math.round(clampAngle(angle) / KNOB_STEP) + 1;
  const clampedIndex = Math.max(0, Math.min(KNOB_MODES.length - 1, index));
  return KNOB_MODES[clampedIndex];
}

/** Mode reached by cycling forward one step (wraps). */
export function nextMode(mode: RadioMode): RadioMode {
  const i = KNOB_MODES.indexOf(mode);
  return KNOB_MODES[(i + 1) % KNOB_MODES.length];
}

/**
 * Angle (deg, clockwise from straight up) of a pointer at (px,py) relative to a
 * knob centered at (cx,cy). Up = 0, right = +90, left = −90.
 */
export function pointerAngle(
  px: number,
  py: number,
  cx: number,
  cy: number
): number {
  return (Math.atan2(px - cx, cy - py) * 180) / Math.PI;
}
