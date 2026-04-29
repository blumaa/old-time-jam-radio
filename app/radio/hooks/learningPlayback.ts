import type { Tune } from "../types";

const MAX_RESULTS = 20;

export function searchTunes(
  tunes: Tune[],
  query: string,
  stationKey: string | null
): Tune[] {
  const q = query.toLowerCase().trim();

  const filtered = stationKey && stationKey !== "All"
    ? tunes.filter((t) => t.key === stationKey)
    : tunes;

  if (!q) return filtered.slice(0, MAX_RESULTS);

  const titleMatches: Tune[] = [];
  const artistMatches: Tune[] = [];

  for (const tune of filtered) {
    if (tune.title.toLowerCase().includes(q)) {
      titleMatches.push(tune);
    } else if (tune.artist.toLowerCase().includes(q)) {
      artistMatches.push(tune);
    }
  }

  return [...titleMatches, ...artistMatches].slice(0, MAX_RESULTS);
}
