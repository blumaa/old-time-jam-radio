"use client";

import { useState, useCallback } from "react";
import type { Tune, RadioMode } from "../types";

const STATION_KEY = "otr-station";
const SPEED_KEY = "otr-speed";
const VOLUME_KEY = "otr-volume";
const MODE_KEY = "otr-mode";
const LEARNING_TUNE_KEY = "otr-learning-tune";
const LISTEN_QUEUE_KEY = "otr-listen-queue";

interface ListenQueueState {
  queue: Tune[];
  index: number;
}

const EMPTY_LISTEN_QUEUE: ListenQueueState = { queue: [], index: -1 };

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
    return stored === "jam" || stored === "learn" || stored === "listen"
      ? stored
      : "jam";
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

  const [listenQueue, setListenQueueState] = useState<ListenQueueState>(() => {
    if (typeof window === "undefined") return EMPTY_LISTEN_QUEUE;
    const stored = localStorage.getItem(LISTEN_QUEUE_KEY);
    if (!stored) return EMPTY_LISTEN_QUEUE;
    try {
      const parsed = JSON.parse(stored) as Partial<ListenQueueState>;
      if (!Array.isArray(parsed.queue)) return EMPTY_LISTEN_QUEUE;
      const index = typeof parsed.index === "number" ? parsed.index : -1;
      return { queue: parsed.queue as Tune[], index };
    } catch {
      return EMPTY_LISTEN_QUEUE;
    }
  });

  const setListenQueue = useCallback((queue: Tune[], index: number) => {
    setListenQueueState({ queue, index });
    if (queue.length > 0) {
      localStorage.setItem(LISTEN_QUEUE_KEY, JSON.stringify({ queue, index }));
    } else {
      localStorage.removeItem(LISTEN_QUEUE_KEY);
    }
  }, []);

  return {
    station, speed, volume, mode, learningTune, listenQueue,
    setStation, setSpeed, setVolume, setMode, setLearningTune, setListenQueue,
  };
}
