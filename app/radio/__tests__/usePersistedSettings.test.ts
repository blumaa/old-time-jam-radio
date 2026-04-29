import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { usePersistedSettings } from "../hooks/usePersistedSettings";

describe("usePersistedSettings", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should return default values when localStorage is empty", () => {
    const { result } = renderHook(() => usePersistedSettings());

    expect(result.current.station).toBeNull();
    expect(result.current.speed).toBe(1.0);
    expect(result.current.volume).toBe(0.7);
  });

  it("should persist station to localStorage", () => {
    const { result } = renderHook(() => usePersistedSettings());

    act(() => {
      result.current.setStation("G");
    });

    expect(result.current.station).toBe("G");
    expect(localStorage.getItem("otr-station")).toBe("G");
  });

  it("should persist speed to localStorage", () => {
    const { result } = renderHook(() => usePersistedSettings());

    act(() => {
      result.current.setSpeed(0.5);
    });

    expect(result.current.speed).toBe(0.5);
    expect(localStorage.getItem("otr-speed")).toBe("0.5");
  });

  it("should persist volume to localStorage", () => {
    const { result } = renderHook(() => usePersistedSettings());

    act(() => {
      result.current.setVolume(0.3);
    });

    expect(result.current.volume).toBe(0.3);
    expect(localStorage.getItem("otr-volume")).toBe("0.3");
  });

  it("should read persisted values on mount", () => {
    localStorage.setItem("otr-station", "D");
    localStorage.setItem("otr-speed", "0.75");
    localStorage.setItem("otr-volume", "0.5");

    const { result } = renderHook(() => usePersistedSettings());

    expect(result.current.station).toBe("D");
    expect(result.current.speed).toBe(0.75);
    expect(result.current.volume).toBe(0.5);
  });

  it("should handle invalid speed in localStorage gracefully", () => {
    localStorage.setItem("otr-speed", "not-a-number");

    const { result } = renderHook(() => usePersistedSettings());

    expect(result.current.speed).toBe(1.0);
  });
});
