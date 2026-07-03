"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import type { Tune, Manifest } from "../types";
import { searchTunes } from "./learningPlayback";
import { buildTuneUrl } from "../utils/buildTuneUrl";

interface UseListenQueueOptions {
  manifest: Manifest;
  play: (url: string) => Promise<void>;
  stop: () => void;
  r2PublicUrl: string;
  initialQueue?: Tune[];
  initialIndex?: number;
  onQueueChange?: (queue: Tune[], index: number) => void;
}

function clampIndex(queue: Tune[], index: number): number {
  if (queue.length === 0) return -1;
  return Math.min(Math.max(index, 0), queue.length - 1);
}

/**
 * Listen mode: an ordered queue of tunes that plays through and loops back to
 * the start (auto-repeat). Distinct from learn mode, which loops a single tune.
 */
export function useListenQueue({
  manifest,
  play,
  stop,
  r2PublicUrl,
  initialQueue,
  initialIndex,
  onQueueChange,
}: UseListenQueueOptions) {
  const seed = initialQueue ?? [];
  const [queue, setQueue] = useState<Tune[]>(seed);
  const [currentIndex, setCurrentIndex] = useState<number>(
    seed.length > 0 ? clampIndex(seed, initialIndex ?? 0) : -1
  );
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [stationFilter, setStationFilter] = useState<string | null>(null);

  const currentTune = queue[currentIndex] ?? null;

  // Refs mirror state for async callbacks (avoid stale closures).
  const queueRef = useRef<Tune[]>(queue);
  const indexRef = useRef<number>(currentIndex);
  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);
  useEffect(() => {
    indexRef.current = currentIndex;
  }, [currentIndex]);

  // Persistence follows state (SSOT).
  useEffect(() => {
    onQueueChange?.(queue, currentIndex);
  }, [queue, currentIndex, onQueueChange]);

  const playTune = useCallback(
    async (tune: Tune) => {
      stop();
      await play(buildTuneUrl(r2PublicUrl, tune));
    },
    [stop, play, r2PublicUrl]
  );

  const addToQueue = useCallback(
    async (tune: Tune) => {
      const wasEmpty = queueRef.current.length === 0;
      const newQueue = [...queueRef.current, tune];
      setQueue(newQueue);
      queueRef.current = newQueue;
      if (wasEmpty) {
        setCurrentIndex(0);
        indexRef.current = 0;
        await playTune(tune);
      }
    },
    [playTune]
  );

  const removeFromQueue = useCallback(
    async (index: number) => {
      const q = queueRef.current;
      if (index < 0 || index >= q.length) return;
      const newQueue = q.filter((_, i) => i !== index);
      setQueue(newQueue);
      queueRef.current = newQueue;

      const curr = indexRef.current;
      if (newQueue.length === 0) {
        setCurrentIndex(-1);
        indexRef.current = -1;
        stop();
        return;
      }
      if (index < curr) {
        const ni = curr - 1;
        setCurrentIndex(ni);
        indexRef.current = ni;
      } else if (index === curr) {
        // Removed the playing tune: same slot now holds the next tune (clamped).
        const ni = Math.min(curr, newQueue.length - 1);
        setCurrentIndex(ni);
        indexRef.current = ni;
        await playTune(newQueue[ni]);
      }
    },
    [playTune, stop]
  );

  const jumpToQueueIndex = useCallback(
    async (index: number) => {
      const q = queueRef.current;
      if (index < 0 || index >= q.length) return;
      setCurrentIndex(index);
      indexRef.current = index;
      await playTune(q[index]);
    },
    [playTune]
  );

  const clearQueue = useCallback(() => {
    setQueue([]);
    queueRef.current = [];
    setCurrentIndex(-1);
    indexRef.current = -1;
    stop();
  }, [stop]);

  const handleTuneEnded = useCallback(async () => {
    const q = queueRef.current;
    if (q.length === 0) return;
    const next = (indexRef.current + 1) % q.length;
    setCurrentIndex(next);
    indexRef.current = next;
    await playTune(q[next]);
  }, [playTune]);

  const replayTune = useCallback(async () => {
    const tune = queueRef.current[indexRef.current];
    if (!tune) return;
    await playTune(tune);
  }, [playTune]);

  const openSearch = useCallback(() => setIsSearchOpen(true), []);
  const closeSearch = useCallback(() => setIsSearchOpen(false), []);

  const searchResults = useMemo(
    () => searchTunes(manifest, searchQuery, stationFilter),
    [manifest, searchQuery, stationFilter]
  );

  return {
    currentTune,
    queue,
    currentIndex,
    isSearchOpen,
    searchQuery,
    searchResults,
    addToQueue,
    removeFromQueue,
    jumpToQueueIndex,
    clearQueue,
    handleTuneEnded,
    replayTune,
    openSearch,
    closeSearch,
    setSearchQuery,
    setStationFilter,
  };
}
