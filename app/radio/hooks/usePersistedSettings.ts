"use client";

import { useState, useCallback } from "react";

const STATION_KEY = "otr-station";
const SPEED_KEY = "otr-speed";
const VOLUME_KEY = "otr-volume";

export function usePersistedSettings() {
  const [station, setStationState] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(STATION_KEY);
  });

  const [speed, setSpeedState] = useState<number>(() => {
    if (typeof window === "undefined") return 1.0;
    const stored = localStorage.getItem(SPEED_KEY);
    if (!stored) return 1.0;
    const parsed = parseFloat(stored);
    return isNaN(parsed) ? 1.0 : parsed;
  });

  const setStation = useCallback((s: string) => {
    setStationState(s);
    localStorage.setItem(STATION_KEY, s);
  }, []);

  const setSpeed = useCallback((s: number) => {
    setSpeedState(s);
    localStorage.setItem(SPEED_KEY, String(s));
  }, []);

  const [volume, setVolumeState] = useState<number>(() => {
    if (typeof window === "undefined") return 0.7;
    const stored = localStorage.getItem(VOLUME_KEY);
    if (!stored) return 0.7;
    const parsed = parseFloat(stored);
    return isNaN(parsed) ? 0.7 : parsed;
  });

  const setVolume = useCallback((v: number) => {
    setVolumeState(v);
    localStorage.setItem(VOLUME_KEY, String(v));
  }, []);

  return { station, speed, volume, setStation, setSpeed, setVolume };
}
