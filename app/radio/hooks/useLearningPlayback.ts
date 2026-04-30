"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import type { Tune, Manifest } from "../types";
import { searchTunes } from "./learningPlayback";
import { buildTuneUrl } from "../utils/buildTuneUrl";

interface UseLearningPlaybackOptions {
  manifest: Manifest;
  play: (url: string) => Promise<void>;
  stop: () => void;
  r2PublicUrl: string;
  initialTune: Tune | null;
}

export function useLearningPlayback({
  manifest,
  play,
  stop,
  r2PublicUrl,
  initialTune,
}: UseLearningPlaybackOptions) {
  const [currentTune, setCurrentTune] = useState<Tune | null>(initialTune);
  const [playCount, setPlayCount] = useState(0);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [stationFilter, setStationFilter] = useState<string | null>(null);

  const currentTuneRef = useRef<Tune | null>(currentTune);
  useEffect(() => {
    currentTuneRef.current = currentTune;
  }, [currentTune]);

  const replayCurrentTune = useCallback(async () => {
    const tune = currentTuneRef.current;
    if (!tune) return;
    stop();
    await play(buildTuneUrl(r2PublicUrl, tune));
  }, [stop, play, r2PublicUrl]);

  const handleTuneEnded = useCallback(async () => {
    setPlayCount((c) => c + 1);
    await replayCurrentTune();
  }, [replayCurrentTune]);

  const selectTune = useCallback(
    async (tune: Tune) => {
      stop();
      setCurrentTune(tune);
      currentTuneRef.current = tune;
      setPlayCount(1);
      setIsSearchOpen(false);
      await play(buildTuneUrl(r2PublicUrl, tune));
    },
    [stop, play, r2PublicUrl]
  );

  const openSearch = useCallback(() => setIsSearchOpen(true), []);
  const closeSearch = useCallback(() => setIsSearchOpen(false), []);

  const replayTune = useCallback(async () => {
    await replayCurrentTune();
  }, [replayCurrentTune]);

  const searchResults = useMemo(
    () => searchTunes(manifest, searchQuery, stationFilter),
    [manifest, searchQuery, stationFilter]
  );

  return {
    currentTune,
    playCount,
    isSearchOpen,
    searchQuery,
    searchResults,
    selectTune,
    openSearch,
    closeSearch,
    setSearchQuery,
    setStationFilter,
    replayTune,
    handleTuneEnded,
  };
}
