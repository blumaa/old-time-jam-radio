import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useStationPlayback } from "../hooks/useStationPlayback";
import type { Manifest } from "../types";

const mockManifest: Manifest = [
  { title: "Tune G1", artist: "Artist G", key: "G", url: "tunes/g1.mp3", duration: 90, confidence: 1.0, format: "mp3" },
  { title: "Tune G2", artist: "Artist G", key: "G", url: "tunes/g2.mp3", duration: 95, confidence: 0.9, format: "mp3" },
  { title: "Tune D1", artist: "Artist D", key: "D", url: "tunes/d1.mp3", duration: 100, confidence: 0.8, format: "mp3" },
  { title: "Tune A1", artist: "Artist A", key: "A", url: "tunes/a1.mp3", duration: 110, confidence: 0.7, format: "mp3" },
  { title: "Tune A2", artist: "Artist A", key: "A", url: "tunes/a2.mp3", duration: 120, confidence: 0.6, format: "mp3" },
];

function createMocks() {
  return {
    play: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn(),
    playStaticBurst: vi.fn().mockResolvedValue(undefined),
    onEnded: vi.fn(),
  };
}

function renderPlaybackHook(manifest: Manifest, mocks: ReturnType<typeof createMocks>) {
  return renderHook(() =>
    useStationPlayback({
      manifest,
      play: mocks.play,
      stop: mocks.stop,
      playStaticBurst: mocks.playStaticBurst,
      onEnded: mocks.onEnded,
      r2PublicUrl: "https://r2.example.com",
    })
  );
}

describe("useStationPlayback", () => {
  let mocks: ReturnType<typeof createMocks>;

  beforeEach(() => {
    mocks = createMocks();
  });

  it("should return stations derived from manifest keys with All first", () => {
    const { result } = renderPlaybackHook(mockManifest, mocks);

    expect(result.current.stations).toEqual(["All", "G", "A", "D"]);
  });

  it("should initialize with null currentStation and null currentTune", () => {
    const { result } = renderPlaybackHook(mockManifest, mocks);

    expect(result.current.currentStation).toBeNull();
    expect(result.current.currentTune).toBeNull();
  });

  it("should call stop, playStaticBurst, then play on switchStation", async () => {
    const { result } = renderPlaybackHook(mockManifest, mocks);

    await act(async () => {
      await result.current.switchStation("G");
    });

    expect(mocks.stop).toHaveBeenCalled();
    expect(mocks.playStaticBurst).toHaveBeenCalledWith(400);
    expect(mocks.play).toHaveBeenCalled();

    const stopOrder = mocks.stop.mock.invocationCallOrder[0];
    const staticOrder = mocks.playStaticBurst.mock.invocationCallOrder[0];
    const playOrder = mocks.play.mock.invocationCallOrder[0];
    expect(stopOrder).toBeLessThan(staticOrder);
    expect(staticOrder).toBeLessThan(playOrder);
  });

  it("should set currentStation and currentTune after switchStation", async () => {
    const { result } = renderPlaybackHook(mockManifest, mocks);

    await act(async () => {
      await result.current.switchStation("G");
    });

    expect(result.current.currentStation).toBe("G");
    expect(result.current.currentTune).not.toBeNull();
    expect(result.current.currentTune!.key).toBe("G");
  });

  it("should set isPlayingStatic during static burst", async () => {
    let resolveStatic!: () => void;
    mocks.playStaticBurst.mockImplementation(
      () => new Promise<void>((resolve) => { resolveStatic = resolve; })
    );

    const { result } = renderPlaybackHook(mockManifest, mocks);

    let switchPromise: Promise<void>;
    act(() => {
      switchPromise = result.current.switchStation("G");
    });

    expect(result.current.isPlayingStatic).toBe(true);

    await act(async () => {
      resolveStatic();
      await switchPromise!;
    });

    expect(result.current.isPlayingStatic).toBe(false);
  });

  it("should auto-advance to next tune via onEnded callback", async () => {
    const { result } = renderPlaybackHook(mockManifest, mocks);

    await act(async () => {
      await result.current.switchStation("G");
    });

    expect(mocks.play).toHaveBeenCalledTimes(1);

    const onEndedCallback = mocks.onEnded.mock.calls[0][0];

    await act(async () => {
      await onEndedCallback();
    });

    expect(mocks.play).toHaveBeenCalledTimes(2);
  });

  it("should reshuffle queue when all station tunes have played", async () => {
    const singleTuneManifest: Manifest = [
      { title: "Tune D1", artist: "Artist D", key: "D", url: "tunes/d1.mp3", duration: 100, confidence: 0.8, format: "mp3" },
    ];

    const { result } = renderPlaybackHook(singleTuneManifest, mocks);

    await act(async () => {
      await result.current.switchStation("D");
    });

    expect(mocks.play).toHaveBeenCalledTimes(1);

    const onEndedCallback = mocks.onEnded.mock.calls[0][0];

    await act(async () => {
      await onEndedCallback();
    });

    expect(mocks.play).toHaveBeenCalledTimes(2);
  });

  it("should not call play when switching to a station with no tunes", async () => {
    const { result } = renderPlaybackHook(mockManifest, mocks);

    await act(async () => {
      await result.current.switchStation("F#");
    });

    expect(mocks.stop).toHaveBeenCalled();
    expect(mocks.play).not.toHaveBeenCalled();
  });

  it("should skip to next tune when skipTune is called", async () => {
    const { result } = renderPlaybackHook(mockManifest, mocks);

    await act(async () => {
      await result.current.switchStation("G");
    });

    const firstTune = result.current.currentTune;
    expect(mocks.play).toHaveBeenCalledTimes(1);

    await act(async () => {
      await result.current.skipTune();
    });

    expect(mocks.stop).toHaveBeenCalled();
    expect(mocks.play).toHaveBeenCalledTimes(2);
    expect(result.current.currentTune).not.toBe(firstTune);
  });

  it("should replay current tune when replayTune is called", async () => {
    const { result } = renderPlaybackHook(mockManifest, mocks);

    await act(async () => {
      await result.current.switchStation("G");
    });

    const firstUrl = mocks.play.mock.calls[0][0];
    expect(mocks.play).toHaveBeenCalledTimes(1);

    await act(async () => {
      await result.current.replayTune();
    });

    expect(mocks.stop).toHaveBeenCalled();
    expect(mocks.play).toHaveBeenCalledTimes(2);
    expect(mocks.play.mock.calls[1][0]).toBe(firstUrl);
  });

  it("should not error when skipTune is called with no station", async () => {
    const { result } = renderPlaybackHook(mockManifest, mocks);

    await act(async () => {
      await result.current.skipTune();
    });

    expect(mocks.play).not.toHaveBeenCalled();
  });

  it("should not error when replayTune is called with no current tune", async () => {
    const { result } = renderPlaybackHook(mockManifest, mocks);

    await act(async () => {
      await result.current.replayTune();
    });

    expect(mocks.play).not.toHaveBeenCalled();
  });

  it("should not register onEnded callback when enabled is false", () => {
    renderHook(() =>
      useStationPlayback({
        manifest: mockManifest,
        play: mocks.play,
        stop: mocks.stop,
        playStaticBurst: mocks.playStaticBurst,
        onEnded: mocks.onEnded,
        r2PublicUrl: "https://r2.example.com",
        enabled: false,
      })
    );

    const lastCallback = mocks.onEnded.mock.calls.at(-1)?.[0];
    expect(lastCallback).toBeDefined();
    lastCallback();
    expect(mocks.play).not.toHaveBeenCalled();
  });

  it("should register onEnded callback when enabled is true", async () => {
    const { result } = renderHook(() =>
      useStationPlayback({
        manifest: mockManifest,
        play: mocks.play,
        stop: mocks.stop,
        playStaticBurst: mocks.playStaticBurst,
        onEnded: mocks.onEnded,
        r2PublicUrl: "https://r2.example.com",
        enabled: true,
      })
    );

    await act(async () => {
      await result.current.switchStation("G");
    });

    const onEndedCallback = mocks.onEnded.mock.calls.at(-1)?.[0];
    await act(async () => {
      await onEndedCallback();
    });

    expect(mocks.play).toHaveBeenCalledTimes(2);
  });
});
