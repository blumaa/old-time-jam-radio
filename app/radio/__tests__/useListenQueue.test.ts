import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useListenQueue } from "../hooks/useListenQueue";
import type { Tune, Manifest } from "../types";

const makeTune = (overrides: Partial<Tune> = {}): Tune => ({
  title: "Sally Ann",
  artist: "Highwoods Stringband",
  key: "A",
  url: "sally-ann.mp3",
  duration: 180,
  confidence: 1.0,
  format: "mp3",
  ...overrides,
});

const mockManifest: Manifest = [
  makeTune({ title: "Sally Ann", key: "A", url: "sally.mp3" }),
  makeTune({ title: "Salt Creek", key: "A", url: "salt.mp3" }),
  makeTune({ title: "Cluck Old Hen", key: "D", url: "cluck.mp3" }),
];

function createMocks() {
  return {
    play: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn(),
  };
}

function renderQueue(
  mocks: ReturnType<typeof createMocks>,
  opts: { initialQueue?: Tune[]; initialIndex?: number } = {}
) {
  return renderHook(() =>
    useListenQueue({
      manifest: mockManifest,
      play: mocks.play,
      stop: mocks.stop,
      r2PublicUrl: "https://r2.example.com",
      initialQueue: opts.initialQueue,
      initialIndex: opts.initialIndex,
    })
  );
}

describe("useListenQueue", () => {
  let mocks: ReturnType<typeof createMocks>;
  beforeEach(() => {
    mocks = createMocks();
  });

  it("starts empty", () => {
    const { result } = renderQueue(mocks);
    expect(result.current.queue).toEqual([]);
    expect(result.current.currentTune).toBeNull();
    expect(result.current.currentIndex).toBe(-1);
  });

  it("addToQueue on empty queue starts playback", async () => {
    const { result } = renderQueue(mocks);
    await act(async () => {
      await result.current.addToQueue(mockManifest[0]);
    });
    expect(result.current.currentIndex).toBe(0);
    expect(result.current.currentTune).toEqual(mockManifest[0]);
    expect(mocks.play).toHaveBeenCalledWith("https://r2.example.com/sally.mp3");
  });

  it("addToQueue while playing appends without interrupting", async () => {
    const { result } = renderQueue(mocks);
    await act(async () => {
      await result.current.addToQueue(mockManifest[0]);
    });
    await act(async () => {
      await result.current.addToQueue(mockManifest[1]);
    });
    expect(result.current.queue).toHaveLength(2);
    expect(result.current.currentIndex).toBe(0);
    expect(mocks.play).toHaveBeenCalledTimes(1);
  });

  it("auto-advances and loops back at the end", async () => {
    const { result } = renderQueue(mocks, {
      initialQueue: [mockManifest[0], mockManifest[1], mockManifest[2]],
      initialIndex: 0,
    });

    await act(async () => {
      await result.current.handleTuneEnded();
    });
    expect(result.current.currentIndex).toBe(1);

    await act(async () => {
      await result.current.handleTuneEnded();
    });
    expect(result.current.currentIndex).toBe(2);

    await act(async () => {
      await result.current.handleTuneEnded();
    });
    expect(result.current.currentIndex).toBe(0); // wrapped
  });

  it("jumpToQueueIndex plays the chosen tune", async () => {
    const { result } = renderQueue(mocks, {
      initialQueue: [mockManifest[0], mockManifest[1], mockManifest[2]],
      initialIndex: 0,
    });
    await act(async () => {
      await result.current.jumpToQueueIndex(2);
    });
    expect(result.current.currentIndex).toBe(2);
    expect(mocks.play).toHaveBeenLastCalledWith("https://r2.example.com/cluck.mp3");
  });

  it("removeFromQueue before current shifts index; current keeps playing", async () => {
    const { result } = renderQueue(mocks, {
      initialQueue: [mockManifest[0], mockManifest[1], mockManifest[2]],
      initialIndex: 2,
    });
    await act(async () => {
      await result.current.removeFromQueue(0);
    });
    expect(result.current.currentIndex).toBe(1);
    expect(result.current.currentTune).toEqual(mockManifest[2]);
    expect(mocks.play).not.toHaveBeenCalled();
  });

  it("removeFromQueue of current plays the next tune", async () => {
    const { result } = renderQueue(mocks, {
      initialQueue: [mockManifest[0], mockManifest[1], mockManifest[2]],
      initialIndex: 1,
    });
    await act(async () => {
      await result.current.removeFromQueue(1);
    });
    expect(result.current.queue).toEqual([mockManifest[0], mockManifest[2]]);
    expect(result.current.currentIndex).toBe(1);
    expect(result.current.currentTune).toEqual(mockManifest[2]);
  });

  it("removing the last tune empties and stops", async () => {
    const { result } = renderQueue(mocks, {
      initialQueue: [mockManifest[0]],
      initialIndex: 0,
    });
    await act(async () => {
      await result.current.removeFromQueue(0);
    });
    expect(result.current.queue).toEqual([]);
    expect(result.current.currentIndex).toBe(-1);
    expect(result.current.currentTune).toBeNull();
    expect(mocks.stop).toHaveBeenCalled();
  });

  it("clearQueue empties and stops", async () => {
    const { result } = renderQueue(mocks, {
      initialQueue: [mockManifest[0], mockManifest[1]],
      initialIndex: 0,
    });
    act(() => {
      result.current.clearQueue();
    });
    expect(result.current.queue).toEqual([]);
    expect(result.current.currentIndex).toBe(-1);
    expect(mocks.stop).toHaveBeenCalled();
  });

  it("search filters results by query and station", () => {
    const { result } = renderQueue(mocks);
    act(() => {
      result.current.setSearchQuery("sal");
    });
    expect(result.current.searchResults).toHaveLength(2);
    act(() => {
      result.current.setSearchQuery("");
      result.current.setStationFilter("D");
    });
    expect(result.current.searchResults.every((t) => t.key === "D")).toBe(true);
  });
});
