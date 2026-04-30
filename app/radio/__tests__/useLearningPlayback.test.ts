import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useLearningPlayback } from "../hooks/useLearningPlayback";
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
  makeTune({ title: "Grey Eagle", key: "G", url: "grey.mp3" }),
];

function createMocks() {
  return {
    play: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn(),
  };
}

function renderLearningHook(
  mocks: ReturnType<typeof createMocks>,
  opts: { initialTune?: Tune | null } = {}
) {
  return renderHook(() =>
    useLearningPlayback({
      manifest: mockManifest,
      play: mocks.play,
      stop: mocks.stop,
      r2PublicUrl: "https://r2.example.com",
      initialTune: opts.initialTune ?? null,
    })
  );
}

describe("useLearningPlayback", () => {
  let mocks: ReturnType<typeof createMocks>;

  beforeEach(() => {
    mocks = createMocks();
  });

  it("returns null currentTune initially", () => {
    const { result } = renderLearningHook(mocks);
    expect(result.current.currentTune).toBeNull();
    expect(result.current.playCount).toBe(0);
  });

  it("sets currentTune from initialTune", () => {
    const tune = makeTune({ title: "Initial" });
    const { result } = renderLearningHook(mocks, { initialTune: tune });
    expect(result.current.currentTune).toEqual(tune);
    expect(result.current.playCount).toBe(0);
  });

  it("selectTune sets currentTune, calls play, resets playCount to 1", async () => {
    const { result } = renderLearningHook(mocks);
    const tune = mockManifest[0];

    await act(async () => {
      await result.current.selectTune(tune);
    });

    expect(result.current.currentTune).toEqual(tune);
    expect(result.current.playCount).toBe(1);
    expect(mocks.stop).toHaveBeenCalled();
    expect(mocks.play).toHaveBeenCalledWith("https://r2.example.com/sally.mp3");
  });

  it("selectTune closes search", async () => {
    const { result } = renderLearningHook(mocks);

    act(() => {
      result.current.openSearch();
    });
    expect(result.current.isSearchOpen).toBe(true);

    await act(async () => {
      await result.current.selectTune(mockManifest[0]);
    });
    expect(result.current.isSearchOpen).toBe(false);
  });

  it("handleTuneEnded increments playCount and replays", async () => {
    const { result } = renderLearningHook(mocks);

    await act(async () => {
      await result.current.selectTune(mockManifest[0]);
    });

    expect(result.current.playCount).toBe(1);

    await act(async () => {
      await result.current.handleTuneEnded();
    });

    expect(result.current.playCount).toBe(2);
    expect(mocks.play).toHaveBeenCalledTimes(2);
  });

  it("openSearch and closeSearch toggle isSearchOpen", () => {
    const { result } = renderLearningHook(mocks);

    expect(result.current.isSearchOpen).toBe(false);

    act(() => {
      result.current.openSearch();
    });
    expect(result.current.isSearchOpen).toBe(true);

    act(() => {
      result.current.closeSearch();
    });
    expect(result.current.isSearchOpen).toBe(false);
  });

  it("setSearchQuery updates searchResults", () => {
    const { result } = renderLearningHook(mocks);

    act(() => {
      result.current.setSearchQuery("sal");
    });

    expect(result.current.searchQuery).toBe("sal");
    expect(result.current.searchResults).toHaveLength(2);
    expect(result.current.searchResults[0].title).toBe("Sally Ann");
    expect(result.current.searchResults[1].title).toBe("Salt Creek");
  });

  it("setStationFilter filters search results by key", () => {
    const { result } = renderLearningHook(mocks);

    act(() => {
      result.current.setSearchQuery("");
      result.current.setStationFilter("D");
    });

    expect(result.current.searchResults.every((t) => t.key === "D")).toBe(true);
  });

  it("replayTune restarts the current tune", async () => {
    const { result } = renderLearningHook(mocks);

    await act(async () => {
      await result.current.selectTune(mockManifest[0]);
    });

    await act(async () => {
      await result.current.replayTune();
    });

    expect(mocks.stop).toHaveBeenCalled();
    expect(mocks.play).toHaveBeenCalledTimes(2);
    expect(mocks.play.mock.calls[1][0]).toBe("https://r2.example.com/sally.mp3");
  });

  it("replayTune does nothing when no tune is selected", async () => {
    const { result } = renderLearningHook(mocks);

    await act(async () => {
      await result.current.replayTune();
    });

    expect(mocks.play).not.toHaveBeenCalled();
  });
});
