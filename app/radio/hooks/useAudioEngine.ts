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

  const play = useCallback(
    async (url: string) => {
      const engine = getEngine();
      await engine.resume();
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

  const playStaticBurst = useCallback(
    async (durationMs = 400) => {
      const engine = getEngine();
      await engine.resume();
      await engine.playStaticBurst(durationMs);
    },
    [getEngine]
  );

  return {
    play,
    stop,
    setTempo,
    setVolume,
    getProgress,
    isPlaying,
    onEnded,
    playStaticBurst,
  };
}
