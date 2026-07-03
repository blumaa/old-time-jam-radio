import { describe, it, expect } from "vitest";
import {
  modeToAngle,
  clampAngle,
  nearestMode,
  nextMode,
  pointerAngle,
  KNOB_STEP,
} from "../components/knobGeometry";

describe("modeKnob geometry", () => {
  it("maps modes to detent angles", () => {
    expect(modeToAngle("jam")).toBe(-KNOB_STEP);
    expect(modeToAngle("learn")).toBe(0);
    expect(modeToAngle("listen")).toBe(KNOB_STEP);
  });

  it("clamps rotation to dial travel", () => {
    expect(clampAngle(200)).toBe(KNOB_STEP);
    expect(clampAngle(-200)).toBe(-KNOB_STEP);
    expect(clampAngle(10)).toBe(10);
  });

  it("snaps arbitrary angles to the nearest detent's mode", () => {
    expect(nearestMode(-KNOB_STEP)).toBe("jam");
    expect(nearestMode(-5)).toBe("learn");
    expect(nearestMode(5)).toBe("learn");
    expect(nearestMode(KNOB_STEP - 4)).toBe("listen");
    expect(nearestMode(999)).toBe("listen"); // beyond travel clamps
  });

  it("cycles forward through modes and wraps", () => {
    expect(nextMode("jam")).toBe("learn");
    expect(nextMode("learn")).toBe("listen");
    expect(nextMode("listen")).toBe("jam");
  });

  it("computes pointer angle from knob center (up=0, right=+90)", () => {
    // Directly above center → 0°
    expect(Math.round(pointerAngle(100, 0, 100, 100))).toBe(0);
    // Directly right → +90°
    expect(Math.round(pointerAngle(200, 100, 100, 100))).toBe(90);
    // Directly left → −90°
    expect(Math.round(pointerAngle(0, 100, 100, 100))).toBe(-90);
  });
});
