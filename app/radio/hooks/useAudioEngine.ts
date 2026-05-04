"use client";

import { useRef, useCallback, useEffect } from "react";
import { AudioEngine } from "../audio/AudioEngine";

export function useAudioEngine() {
  const engineRef = useRef<AudioEngine | null>(null);
  const onEndedRef = useRef<(() => void) | null>(null);

  const getEngine = useCallback(() => {
    if (!engineRef.current) {
      engineRef.current = new AudioEngine();
      if (onEndedRef.current) {
        engineRef.current.onEnded(onEndedRef.current);
      }
    }
    return engineRef.current;
  }, []);

  useEffect(() => {
    return () => {
      engineRef.current?.destroy();
      engineRef.current = null;
    };
  }, []);

  const init = useCallback(async () => {
    const engine = getEngine();
    await engine.init();
  }, [getEngine]);

  const play = useCallback(
    async (url: string) => {
      const engine = getEngine();
      await engine.loadAndPlay(url);
    },
    [getEngine]
  );

  const stop = useCallback(() => {
    engineRef.current?.stop();
  }, []);

  const setTempo = useCallback((tempo: number) => {
    engineRef.current?.setTempo(tempo);
  }, []);

  const setVolume = useCallback((volume: number) => {
    engineRef.current?.setVolume(volume);
  }, []);

  const getProgress = useCallback(() => {
    return engineRef.current?.getProgress() ?? 0;
  }, []);

  const isPlaying = useCallback(() => {
    return engineRef.current?.isPlaying() ?? false;
  }, []);

  const onEnded = useCallback((callback: () => void) => {
    onEndedRef.current = callback;
    engineRef.current?.onEnded(callback);
  }, []);

  const pause = useCallback(async () => {
    await engineRef.current?.pause();
  }, []);

  const unpause = useCallback(async () => {
    await engineRef.current?.unpause();
  }, []);

  const isPaused = useCallback(() => {
    return engineRef.current?.isPaused() ?? false;
  }, []);

  const seek = useCallback(async (fraction: number) => {
    await engineRef.current?.seek(fraction);
  }, []);

  const playStaticBurst = useCallback(
    async (durationMs = 400) => {
      const engine = getEngine();
      await engine.playStaticBurst(durationMs);
    },
    [getEngine]
  );

  return {
    init,
    play,
    stop,
    pause,
    unpause,
    setTempo,
    setVolume,
    getProgress,
    isPlaying,
    isPaused,
    onEnded,
    seek,
    playStaticBurst,
  };
}
