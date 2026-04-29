import type { Tune } from "../types";
import { SUPPORTED_STATIONS } from "../types";

export function buildStationMap(tunes: Tune[]): Map<string, Tune[]> {
  const grouped = new Map<string, Tune[]>();
  const allTunes: Tune[] = [];
  for (const tune of tunes) {
    if (!SUPPORTED_STATIONS.includes(tune.key as typeof SUPPORTED_STATIONS[number])) continue;
    const existing = grouped.get(tune.key) ?? [];
    existing.push(tune);
    grouped.set(tune.key, existing);
    allTunes.push(tune);
  }
  if (allTunes.length === 0) return new Map();
  const map = new Map<string, Tune[]>();
  map.set("All", allTunes);
  for (const key of SUPPORTED_STATIONS) {
    const stationTunes = grouped.get(key);
    if (stationTunes) map.set(key, stationTunes);
  }
  return map;
}

export function getShuffledQueue(tunes: Tune[]): Tune[] {
  const shuffled = [...tunes];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function getNextTune(queue: Tune[]): {
  tune: Tune | null;
  remaining: Tune[];
} {
  if (queue.length === 0) {
    return { tune: null, remaining: [] };
  }
  const [tune, ...remaining] = queue;
  return { tune, remaining };
}
