import { describe, it, expect } from "vitest";
import { searchTunes } from "../hooks/learningPlayback";
import type { Tune } from "../types";

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

const tunes: Tune[] = [
  makeTune({ title: "Sally Ann", artist: "Highwoods Stringband", key: "A" }),
  makeTune({ title: "Salt Creek", artist: "Brad Leftwich", key: "A", url: "salt-creek.mp3" }),
  makeTune({ title: "Cluck Old Hen", artist: "Dirk Powell", key: "D", url: "cluck.mp3" }),
  makeTune({ title: "Grey Eagle", artist: "Tommy Jarrell", key: "G", url: "grey-eagle.mp3" }),
  makeTune({ title: "Elk River Blues", artist: "Ernie Carpenter", key: "Em", url: "elk.mp3" }),
];

describe("searchTunes", () => {
  it("filters by title substring (case-insensitive)", () => {
    const results = searchTunes(tunes, "sal", null);
    expect(results).toHaveLength(2);
    expect(results[0].title).toBe("Sally Ann");
    expect(results[1].title).toBe("Salt Creek");
  });

  it("filters by artist substring", () => {
    const results = searchTunes(tunes, "jarrell", null);
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe("Grey Eagle");
  });

  it("ranks title matches before artist matches", () => {
    const tunesWithOverlap = [
      makeTune({ title: "Old Paint", artist: "Sally Smith", key: "G", url: "paint.mp3" }),
      makeTune({ title: "Sally Ann", artist: "Highwoods", key: "A", url: "sally.mp3" }),
    ];
    const results = searchTunes(tunesWithOverlap, "sally", null);
    expect(results[0].title).toBe("Sally Ann");
    expect(results[1].title).toBe("Old Paint");
  });

  it("filters by station key", () => {
    const results = searchTunes(tunes, "", "A");
    expect(results.every((t) => t.key === "A")).toBe(true);
    expect(results).toHaveLength(2);
  });

  it("returns all tunes when query is empty and station is null", () => {
    const results = searchTunes(tunes, "", null);
    expect(results).toHaveLength(5);
  });

  it("returns all tunes when station is 'All'", () => {
    const results = searchTunes(tunes, "", "All");
    expect(results).toHaveLength(5);
  });

  it("returns empty array for no matches", () => {
    const results = searchTunes(tunes, "zzzzz", null);
    expect(results).toHaveLength(0);
  });

  it("limits results to 20", () => {
    const manyTunes = Array.from({ length: 30 }, (_, i) =>
      makeTune({ title: `Tune ${i}`, url: `tune-${i}.mp3` })
    );
    const results = searchTunes(manyTunes, "Tune", null);
    expect(results).toHaveLength(20);
  });

  it("returns newly-synced tunes with default key when no station filter", () => {
    const tunesWithNewSync = [
      ...tunes,
      makeTune({ title: "New Synced Tune", key: "G", confidence: 0, url: "new-synced.mp3" }),
    ];
    const results = searchTunes(tunesWithNewSync, "New Synced", null);
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe("New Synced Tune");
  });
});
