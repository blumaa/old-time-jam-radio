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

  it("should return default mode as 'jam'", () => {
    const { result } = renderHook(() => usePersistedSettings());
    expect(result.current.mode).toBe("jam");
  });

  it("should persist mode to localStorage", () => {
    const { result } = renderHook(() => usePersistedSettings());

    act(() => {
      result.current.setMode("learn");
    });

    expect(result.current.mode).toBe("learn");
    expect(localStorage.getItem("otr-mode")).toBe("learn");
  });

  it("should read persisted mode on mount", () => {
    localStorage.setItem("otr-mode", "learn");

    const { result } = renderHook(() => usePersistedSettings());
    expect(result.current.mode).toBe("learn");
  });

  it("should handle invalid mode gracefully", () => {
    localStorage.setItem("otr-mode", "invalid");

    const { result } = renderHook(() => usePersistedSettings());
    expect(result.current.mode).toBe("jam");
  });

  it("should return default learningTune as null", () => {
    const { result } = renderHook(() => usePersistedSettings());
    expect(result.current.learningTune).toBeNull();
  });

  it("should persist learningTune as JSON", () => {
    const { result } = renderHook(() => usePersistedSettings());
    const tune = {
      title: "Sally Ann",
      artist: "Highwoods",
      key: "A",
      url: "sally.mp3",
      duration: 180,
      confidence: 1.0,
      format: "mp3" as const,
    };

    act(() => {
      result.current.setLearningTune(tune);
    });

    expect(result.current.learningTune).toEqual(tune);
    expect(JSON.parse(localStorage.getItem("otr-learning-tune")!)).toEqual(tune);
  });

  it("should clear learningTune when set to null", () => {
    const { result } = renderHook(() => usePersistedSettings());

    act(() => {
      result.current.setLearningTune({
        title: "Test",
        artist: "Test",
        key: "G",
        url: "test.mp3",
        duration: 0,
        confidence: 0,
        format: "mp3",
      });
    });

    act(() => {
      result.current.setLearningTune(null);
    });

    expect(result.current.learningTune).toBeNull();
  });

  it("should handle corrupted learningTune JSON gracefully", () => {
    localStorage.setItem("otr-learning-tune", "not-valid-json{{{");

    const { result } = renderHook(() => usePersistedSettings());
    expect(result.current.learningTune).toBeNull();
  });
});
