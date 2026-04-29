"use client";

import { useState, useCallback } from "react";
import type { Tune, RadioMode } from "../types";

const STATION_KEY = "otr-station";
const SPEED_KEY = "otr-speed";
const VOLUME_KEY = "otr-volume";
const MODE_KEY = "otr-mode";
const LEARNING_TUNE_KEY = "otr-learning-tune";

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

  const [mode, setModeState] = useState<RadioMode>(() => {
    if (typeof window === "undefined") return "jam";
    const stored = localStorage.getItem(MODE_KEY);
    return stored === "jam" || stored === "learn" ? stored : "jam";
  });

  const setMode = useCallback((m: RadioMode) => {
    setModeState(m);
    localStorage.setItem(MODE_KEY, m);
  }, []);

  const [learningTune, setLearningTuneState] = useState<Tune | null>(() => {
    if (typeof window === "undefined") return null;
    const stored = localStorage.getItem(LEARNING_TUNE_KEY);
    if (!stored) return null;
    try {
      return JSON.parse(stored) as Tune;
    } catch {
      return null;
    }
  });

  const setLearningTune = useCallback((t: Tune | null) => {
    setLearningTuneState(t);
    if (t) {
      localStorage.setItem(LEARNING_TUNE_KEY, JSON.stringify(t));
    } else {
      localStorage.removeItem(LEARNING_TUNE_KEY);
    }
  }, []);

  return {
    station, speed, volume, mode, learningTune,
    setStation, setSpeed, setVolume, setMode, setLearningTune,
  };
}
