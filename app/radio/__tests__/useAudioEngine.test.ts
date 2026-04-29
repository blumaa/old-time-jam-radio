import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useAudioEngine } from "../hooks/useAudioEngine";

const mockEngine = {
  resume: vi.fn().mockResolvedValue(undefined),
  loadAndPlay: vi.fn().mockResolvedValue(undefined),
  stop: vi.fn(),
  setTempo: vi.fn(),
  setVolume: vi.fn(),
  getProgress: vi.fn().mockReturnValue(0),
  isPlaying: vi.fn().mockReturnValue(false),
  onEnded: vi.fn(),
  playStaticBurst: vi.fn().mockResolvedValue(undefined),
  destroy: vi.fn(),
  getVolume: vi.fn().mockReturnValue(1),
  getTempo: vi.fn().mockReturnValue(1),
};

let constructorCallCount = 0;

vi.mock("../audio/AudioEngine", () => ({
  AudioEngine: class {
    constructor() {
      constructorCallCount++;
      Object.assign(this, mockEngine);
    }
  },
}));

describe("useAudioEngine", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    constructorCallCount = 0;
  });

  it("should lazily create AudioEngine on first play", async () => {
    const { result } = renderHook(() => useAudioEngine());

    expect(constructorCallCount).toBe(0);

    await act(async () => {
      await result.current.play("https://example.com/tune.mp3");
    });

    expect(constructorCallCount).toBe(1);
  });

  it("should reuse the same AudioEngine instance across calls", async () => {
    const { result } = renderHook(() => useAudioEngine());

    await act(async () => {
      await result.current.play("https://example.com/tune1.mp3");
    });
    await act(async () => {
      await result.current.play("https://example.com/tune2.mp3");
    });

    expect(constructorCallCount).toBe(1);
  });

  it("should call resume and loadAndPlay on play", async () => {
    const { result } = renderHook(() => useAudioEngine());

    await act(async () => {
      await result.current.play("https://example.com/tune.mp3");
    });

    expect(mockEngine.resume).toHaveBeenCalled();
    expect(mockEngine.loadAndPlay).toHaveBeenCalledWith(
      "https://example.com/tune.mp3"
    );
  });

  it("should call engine.stop on stop", async () => {
    const { result } = renderHook(() => useAudioEngine());

    await act(async () => {
      await result.current.play("https://example.com/tune.mp3");
    });

    act(() => {
      result.current.stop();
    });

    expect(mockEngine.stop).toHaveBeenCalled();
  });

  it("should register onEnded callback before engine exists", async () => {
    const { result } = renderHook(() => useAudioEngine());
    const callback = vi.fn();

    act(() => {
      result.current.onEnded(callback);
    });

    expect(mockEngine.onEnded).not.toHaveBeenCalled();

    await act(async () => {
      await result.current.play("https://example.com/tune.mp3");
    });

    expect(mockEngine.onEnded).toHaveBeenCalledWith(callback);
  });

  it("should register onEnded callback after engine exists", async () => {
    const { result } = renderHook(() => useAudioEngine());

    await act(async () => {
      await result.current.play("https://example.com/tune.mp3");
    });

    const callback = vi.fn();
    act(() => {
      result.current.onEnded(callback);
    });

    expect(mockEngine.onEnded).toHaveBeenCalledWith(callback);
  });

  it("should destroy engine on unmount", async () => {
    const { result, unmount } = renderHook(() => useAudioEngine());

    await act(async () => {
      await result.current.play("https://example.com/tune.mp3");
    });

    unmount();

    expect(mockEngine.destroy).toHaveBeenCalled();
  });
});
