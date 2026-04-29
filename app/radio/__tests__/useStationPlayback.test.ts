import { describe, it, expect } from "vitest";
import {
  buildStationMap,
  getShuffledQueue,
  getNextTune,
} from "../hooks/stationPlayback";
import type { Tune } from "../types";

const mockTunes: Tune[] = [
  { title: "Tune A1", artist: "Artist A", key: "A", url: "tunes/a1.mp3", duration: 100, confidence: 0.9, format: "mp3" },
  { title: "Tune A2", artist: "Artist A", key: "A", url: "tunes/a2.mp3", duration: 110, confidence: 0.8, format: "mp3" },
  { title: "Tune A3", artist: "Artist A", key: "A", url: "tunes/a3.mp3", duration: 120, confidence: 0.7, format: "mp3" },
  { title: "Tune G1", artist: "Artist G", key: "G", url: "tunes/g1.mp3", duration: 90, confidence: 1.0, format: "mp3" },
  { title: "Tune G2", artist: "Artist G", key: "G", url: "tunes/g2.mp3", duration: 95, confidence: 0.95, format: "mp3" },
  { title: "Tune D1", artist: "Artist D", key: "D", url: "tunes/d1.mp3", duration: 105, confidence: 0.85, format: "m4a" },
];

describe("buildStationMap", () => {
  it("should group tunes by key", () => {
    const stations = buildStationMap(mockTunes);

    expect(stations.get("A")).toHaveLength(3);
    expect(stations.get("G")).toHaveLength(2);
    expect(stations.get("D")).toHaveLength(1);
  });

  it("should include All station containing every supported tune", () => {
    const stations = buildStationMap(mockTunes);

    expect(stations.has("All")).toBe(true);
    expect(stations.get("All")).toHaveLength(6);
  });

  it("should return an empty map for empty manifest", () => {
    const stations = buildStationMap([]);
    expect(stations.size).toBe(0);
  });

  it("should return station keys with All first, then SUPPORTED_STATIONS order", () => {
    const stations = buildStationMap(mockTunes);
    const keys = Array.from(stations.keys());

    expect(keys).toEqual(["All", "G", "A", "D"]);
  });

  it("should only include supported stations (All, G, A, D)", () => {
    const mixedTunes: Tune[] = [
      ...mockTunes,
      { title: "Tune Em1", artist: "Artist Em", key: "Em", url: "tunes/em1.mp3", duration: 100, confidence: 0.9, format: "mp3" },
      { title: "Tune C1", artist: "Artist C", key: "C", url: "tunes/c1.mp3", duration: 100, confidence: 0.9, format: "mp3" },
      { title: "Track 01", artist: "Unknown", key: "?", url: "tunes/track01.m4a", duration: 0, confidence: 0, format: "m4a" },
    ];
    const stations = buildStationMap(mixedTunes);

    expect(stations.has("All")).toBe(true);
    expect(stations.has("G")).toBe(true);
    expect(stations.has("D")).toBe(true);
    expect(stations.has("A")).toBe(true);
    expect(stations.has("Em")).toBe(false);
    expect(stations.has("C")).toBe(false);
    expect(stations.has("?")).toBe(false);
    expect(stations.size).toBe(4);
  });

  it("should return empty map when no tunes match supported stations", () => {
    const unsupportedTunes: Tune[] = [
      { title: "Tune Em1", artist: "Artist Em", key: "Em", url: "tunes/em1.mp3", duration: 100, confidence: 0.9, format: "mp3" },
      { title: "Track 01", artist: "Unknown", key: "?", url: "tunes/track01.m4a", duration: 0, confidence: 0, format: "m4a" },
    ];
    const stations = buildStationMap(unsupportedTunes);

    expect(stations.size).toBe(0);
  });
});

describe("getShuffledQueue", () => {
  it("should return all tunes for a station", () => {
    const aTunes = mockTunes.filter((t) => t.key === "A");
    const queue = getShuffledQueue(aTunes);

    expect(queue).toHaveLength(3);
    expect(queue.map((t) => t.title).sort()).toEqual(
      ["Tune A1", "Tune A2", "Tune A3"]
    );
  });

  it("should return a different order (probabilistic)", () => {
    const aTunes = mockTunes.filter((t) => t.key === "A");
    const results = new Set<string>();

    for (let i = 0; i < 20; i++) {
      const queue = getShuffledQueue(aTunes);
      results.add(queue.map((t) => t.title).join(","));
    }

    expect(results.size).toBeGreaterThan(1);
  });
});

describe("getNextTune", () => {
  it("should return the next tune in the queue", () => {
    const aTunes = mockTunes.filter((t) => t.key === "A");
    const queue = [...aTunes];
    const { tune, remaining } = getNextTune(queue);

    expect(tune).toBe(queue[0]);
    expect(remaining).toHaveLength(2);
  });

  it("should reshuffle when queue is exhausted", () => {
    const aTunes = mockTunes.filter((t) => t.key === "A");

    let { tune, remaining } = getNextTune([...aTunes]);
    expect(tune).toBeDefined();

    ({ tune, remaining } = getNextTune(remaining));
    expect(tune).toBeDefined();

    ({ tune, remaining } = getNextTune(remaining));
    expect(tune).toBeDefined();

    // Queue empty — getNextTune should return null tune
    ({ tune, remaining } = getNextTune(remaining));
    expect(tune).toBeNull();
    expect(remaining).toHaveLength(0);
  });

  it("should not repeat tunes within a cycle", () => {
    const aTunes = mockTunes.filter((t) => t.key === "A");
    const played: string[] = [];
    let queue = [...aTunes];

    for (let i = 0; i < aTunes.length; i++) {
      const result = getNextTune(queue);
      if (result.tune) played.push(result.tune.title);
      queue = result.remaining;
    }

    const unique = new Set(played);
    expect(unique.size).toBe(aTunes.length);
  });
});
