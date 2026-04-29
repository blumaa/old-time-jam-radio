"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import type { Tune, Manifest } from "../types";
import { buildStationMap, getShuffledQueue, getNextTune } from "./stationPlayback";

interface UseStationPlaybackOptions {
  manifest: Manifest;
  play: (url: string) => Promise<void>;
  stop: () => void;
  playStaticBurst: (durationMs?: number) => Promise<void>;
  onEnded: (callback: () => void) => void;
  r2PublicUrl: string;
}

export function useStationPlayback({
  manifest,
  play,
  stop,
  playStaticBurst,
  onEnded,
  r2PublicUrl,
}: UseStationPlaybackOptions) {
  const [currentStation, setCurrentStation] = useState<string | null>(null);
  const [currentTune, setCurrentTune] = useState<Tune | null>(null);
  const [isPlayingStatic, setIsPlayingStatic] = useState(false);

  const stationMap = useMemo(() => buildStationMap(manifest), [manifest]);
  const stationMapRef = useRef(stationMap);
  useEffect(() => {
    stationMapRef.current = stationMap;
  }, [stationMap]);

  const queueRef = useRef<Tune[]>([]);
  const stationRef = useRef<string | null>(null);

  const playNextTune = useCallback(async () => {
    const station = stationRef.current;
    if (!station) return;

    const stationTunes = stationMapRef.current.get(station);
    if (!stationTunes || stationTunes.length === 0) return;

    let { tune, remaining } = getNextTune(queueRef.current);

    if (!tune) {
      queueRef.current = getShuffledQueue(stationTunes);
      ({ tune, remaining } = getNextTune(queueRef.current));
    }

    if (!tune) return;

    queueRef.current = remaining;
    setCurrentTune(tune);

    const url = `${r2PublicUrl}/${tune.url.split("/").map(encodeURIComponent).join("/")}`;
    await play(url);
  }, [play, r2PublicUrl]);

  useEffect(() => {
    onEnded(() => {
      playNextTune();
    });
  }, [onEnded, playNextTune]);

  const switchStation = useCallback(
    async (station: string) => {
      stop();
      stationRef.current = station;
      setCurrentStation(station);

      const stationTunes = stationMapRef.current.get(station);
      if (!stationTunes || stationTunes.length === 0) return;

      queueRef.current = getShuffledQueue(stationTunes);

      setIsPlayingStatic(true);
      await playStaticBurst(400);
      setIsPlayingStatic(false);

      await playNextTune();
    },
    [stop, playStaticBurst, playNextTune]
  );

  const skipTune = useCallback(async () => {
    if (!stationRef.current) return;
    stop();
    await playNextTune();
  }, [stop, playNextTune]);

  const currentTuneRef = useRef<Tune | null>(null);
  useEffect(() => {
    currentTuneRef.current = currentTune;
  }, [currentTune]);

  const replayTune = useCallback(async () => {
    const tune = currentTuneRef.current;
    if (!tune) return;
    stop();
    const url = `${r2PublicUrl}/${tune.url.split("/").map(encodeURIComponent).join("/")}`;
    await play(url);
  }, [stop, play, r2PublicUrl]);

  const stations = useMemo(() => Array.from(stationMap.keys()), [stationMap]);

  return {
    currentStation,
    currentTune,
    isPlayingStatic,
    stations,
    switchStation,
    skipTune,
    replayTune,
  };
}
