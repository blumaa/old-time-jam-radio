"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import type { Manifest, RadioMode } from "./types";
import LoadingSpinner from "./components/LoadingSpinner";
import RadioFacade from "./components/RadioFacade";
import RadioDisplay from "./components/RadioDisplay";
import StationSelector from "./components/StationSelector";
import SpeedSlider from "./components/SpeedSlider";
import PlayerControls from "./components/PlayerControls";
import TuneSearchDrawer from "./components/TuneSearchDrawer";
import QueueDrawer from "./components/QueueDrawer";
import { useAudioEngine } from "./hooks/useAudioEngine";
import { useStationPlayback } from "./hooks/useStationPlayback";
import { useLearningPlayback } from "./hooks/useLearningPlayback";
import { useListenQueue } from "./hooks/useListenQueue";
import { usePersistedSettings } from "./hooks/usePersistedSettings";
import { useShareTune } from "./hooks/useShareTune";
import "@/styles/radio.css";

const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_URL ?? "";

export default function Radio() {
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPoweredOn, setIsPoweredOn] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [progress, setProgress] = useState(0);

  const progressRef = useRef<number>(0);
  const pauseInFlightRef = useRef(false);

  const {
    station: persistedStation,
    speed,
    volume,
    mode,
    learningTune,
    listenQueue,
    setStation: persistStation,
    setSpeed: persistSpeed,
    setMode: persistMode,
    setLearningTune: persistLearningTune,
    setListenQueue: persistListenQueue,
  } = usePersistedSettings();

  const {
    init,
    play,
    stop,
    pause,
    unpause,
    isPaused: getEngineIsPaused,
    setTempo,
    setVolume: setEngineVolume,
    getProgress,
    onEnded,
    onPlayStateChange,
    seek,
    playStaticBurst,
  } = useAudioEngine();

  useEffect(() => {
    async function fetchManifest() {
      try {
        const response = await fetch("/api/manifest", { cache: "no-store" });
        if (!response.ok) throw new Error("Failed to load manifest");
        const data: Manifest = await response.json();
        setManifest(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
      }
    }
    fetchManifest();
  }, []);

  const {
    currentStation,
    currentTune: jamCurrentTune,
    isPlayingStatic,
    stations,
    switchStation,
    skipTune: jamSkipTune,
    replayTune: jamReplayTune,
    handleTuneEnded: jamHandleTuneEnded,
  } = useStationPlayback({
    manifest: manifest ?? [],
    play,
    stop,
    playStaticBurst,
    r2PublicUrl: R2_PUBLIC_URL,
  });

  const learning = useLearningPlayback({
    manifest: manifest ?? [],
    play,
    stop,
    r2PublicUrl: R2_PUBLIC_URL,
    initialTune: learningTune,
  });

  const listen = useListenQueue({
    manifest: manifest ?? [],
    play,
    stop,
    r2PublicUrl: R2_PUBLIC_URL,
    initialQueue: listenQueue.queue,
    initialIndex: listenQueue.index,
    onQueueChange: persistListenQueue,
  });

  // Search UI is shared; it drives whichever mode owns a search (learn or listen).
  const activeSearch = mode === "listen" ? listen : learning;

  const { sharedTune, copyShareLink, clearShareParam } = useShareTune(manifest ?? []);

  const sharedTuneRef = useRef(sharedTune);
  useEffect(() => {
    if (sharedTune) {
      sharedTuneRef.current = sharedTune;
      persistMode("learn");
    }
  }, [sharedTune, persistMode]);

  const currentTune =
    mode === "jam"
      ? jamCurrentTune
      : mode === "learn"
        ? learning.currentTune
        : listen.currentTune;

  useEffect(() => {
    if (!isPoweredOn) return;
    onEnded(() => {
      if (mode === "jam") {
        jamHandleTuneEnded();
      } else if (mode === "learn") {
        learning.handleTuneEnded();
      } else {
        listen.handleTuneEnded();
      }
    });
  }, [isPoweredOn, mode, onEnded, jamHandleTuneEnded, learning, listen]);

  useEffect(() => {
    if (!isPoweredOn) return;

    const tick = () => {
      setProgress(getProgress());
      progressRef.current = requestAnimationFrame(tick);
    };
    progressRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(progressRef.current);
    };
  }, [isPoweredOn, getProgress]);

  const handlePowerToggle = useCallback(async () => {
    if (isPoweredOn) {
      stop();
      setIsPoweredOn(false);
      setIsPaused(false);
      setProgress(0);
    } else {
      await init();
      setIsPoweredOn(true);
      setIsPaused(false);
      setEngineVolume(volume);
      setTempo(speed);
      const pendingShare = sharedTuneRef.current;
      if (pendingShare) {
        sharedTuneRef.current = null;
        clearShareParam();
        learning.selectTune(pendingShare);
        persistLearningTune(pendingShare);
      } else if (mode === "jam") {
        const startStation =
          persistedStation && stations.includes(persistedStation)
            ? persistedStation
            : stations[0] ?? null;
        if (startStation) {
          switchStation(startStation);
        }
      } else if (mode === "learn" && learningTune) {
        learning.selectTune(learningTune);
      } else if (mode === "listen" && listen.currentTune) {
        listen.replayTune();
      }
    }
  }, [isPoweredOn, stop, init, persistedStation, stations, switchStation, setEngineVolume, volume, setTempo, speed, mode, learningTune, learning, listen, clearShareParam, persistLearningTune]);

  const handleStationChange = useCallback(
    (station: string) => {
      if (!isPoweredOn) return;
      persistStation(station);
      if (mode === "jam") {
        switchStation(station);
      } else if (mode === "learn") {
        learning.setStationFilter(station);
      } else {
        listen.setStationFilter(station);
      }
    },
    [isPoweredOn, persistStation, switchStation, mode, learning, listen]
  );

  const handleSpeedChange = useCallback(
    (newSpeed: number) => {
      persistSpeed(newSpeed);
      setTempo(newSpeed);
    },
    [persistSpeed, setTempo]
  );

  const handleModeChange = useCallback(
    (newMode: RadioMode) => {
      const tuneBeforeSwitch = currentTune;
      stop();
      setIsPaused(false);
      setProgress(0);
      persistMode(newMode);
      if (newMode === "jam" && isPoweredOn) {
        const station =
          persistedStation && stations.includes(persistedStation)
            ? persistedStation
            : stations[0] ?? null;
        if (station) {
          switchStation(station);
        }
      } else if (newMode === "learn" && isPoweredOn && tuneBeforeSwitch) {
        learning.selectTune(tuneBeforeSwitch);
        persistLearningTune(tuneBeforeSwitch);
      } else if (newMode === "listen" && isPoweredOn && listen.currentTune) {
        listen.replayTune();
      }
    },
    [stop, persistMode, isPoweredOn, persistedStation, stations, switchStation, currentTune, learning, listen, persistLearningTune]
  );

  const handlePause = useCallback(async () => {
    // Guard against overlapping toggles (double-tap, rapid headset presses).
    // Each branch awaits the engine, so without this two calls could read the
    // same pre-toggle state and both pause or both resume.
    if (pauseInFlightRef.current) return;
    pauseInFlightRef.current = true;
    try {
      // Branch on the engine (single source of truth), not the React mirror.
      // React `isPaused` is updated by the element's play/pause events via
      // onPlayStateChange below — the one writer, whoever triggers the change
      // (this button, a media key, or the OS lock screen).
      if (getEngineIsPaused()) {
        await unpause();
      } else {
        await pause();
      }
    } finally {
      pauseInFlightRef.current = false;
    }
  }, [pause, unpause, getEngineIsPaused]);

  // Mirror the element's real play/pause state into React (single source of
  // truth = the element). Fires for our UI, hardware media keys, and the OS.
  useEffect(() => {
    onPlayStateChange(setIsPaused);
  }, [onPlayStateChange]);


  const handleRestart = useCallback(async () => {
    if (mode === "jam") {
      await jamReplayTune();
    } else if (mode === "learn") {
      await learning.replayTune();
    } else {
      await listen.replayTune();
    }
    setIsPaused(false);
  }, [mode, jamReplayTune, learning, listen]);

  // Skip forward: jam picks a new random tune, listen advances the queue,
  // learn has no next tune so it restarts the practice loop.
  const handleSkipNext = useCallback(async () => {
    if (mode === "jam") {
      await jamSkipTune();
    } else if (mode === "listen") {
      const nextIndex = listen.currentIndex + 1;
      if (nextIndex >= listen.queue.length) return;
      await listen.jumpToQueueIndex(nextIndex);
    } else {
      await learning.replayTune();
    }
    setIsPaused(false);
  }, [mode, jamSkipTune, learning, listen]);

  // Skip back: listen steps to the previous queue item (restarts if at the
  // start); jam/learn have no history, so restart the current tune.
  const handleSkipPrevious = useCallback(async () => {
    if (mode === "listen") {
      const prevIndex = listen.currentIndex - 1;
      if (prevIndex >= 0) {
        await listen.jumpToQueueIndex(prevIndex);
      } else {
        await listen.replayTune();
      }
      setIsPaused(false);
      return;
    }
    await handleRestart();
  }, [mode, listen, handleRestart]);

  // Media Session: routes OS transport controls — headphone buttons, keyboard
  // media keys (Mac F7/F8/F9), lock screen — to the app. Works because the tune
  // plays through a real <audio> element in AudioEngine, so the OS activates a
  // session and derives playbackState from the element automatically (we don't
  // set it manually). We only supply metadata and the transport handlers.
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;

    if (!isPoweredOn) {
      navigator.mediaSession.setActionHandler("play", null);
      navigator.mediaSession.setActionHandler("pause", null);
      navigator.mediaSession.setActionHandler("nexttrack", null);
      navigator.mediaSession.setActionHandler("previoustrack", null);
      return;
    }

    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTune?.title ?? "Old-Time Radio",
      artist: currentTune?.artist ?? "",
    });

    // handlePause() reads the element's live state and is re-entrancy-guarded,
    // so a single toggle handles both the "play" and "pause" actions correctly.
    const togglePlayback = () => handlePause();
    navigator.mediaSession.setActionHandler("play", togglePlayback);
    navigator.mediaSession.setActionHandler("pause", togglePlayback);
    navigator.mediaSession.setActionHandler("nexttrack", () => {
      handleSkipNext();
    });
    navigator.mediaSession.setActionHandler("previoustrack", () => {
      handleSkipPrevious();
    });

    return () => {
      navigator.mediaSession.setActionHandler("play", null);
      navigator.mediaSession.setActionHandler("pause", null);
      navigator.mediaSession.setActionHandler("nexttrack", null);
      navigator.mediaSession.setActionHandler("previoustrack", null);
    };
  }, [
    isPoweredOn,
    handlePause,
    handleSkipNext,
    handleSkipPrevious,
    currentTune,
  ]);

  const handleSeek = useCallback(async (fraction: number) => {
    if (!isPoweredOn || !currentTune) return;
    await seek(fraction);
  }, [isPoweredOn, currentTune, seek]);

  const handleShare = useCallback(async () => {
    if (!currentTune) return;
    await copyShareLink(currentTune);
  }, [currentTune, copyShareLink]);

  const handleSelectTune = useCallback(
    async (tune: typeof learning.searchResults[number]) => {
      if (mode === "listen") {
        // Listen: append to the queue (auto-starts if empty). Search stays open
        // so several tunes can be added.
        await listen.addToQueue(tune);
      } else {
        // Learn: replace and loop the single tune.
        await learning.selectTune(tune);
        persistLearningTune(tune);
      }
      setIsPaused(false);
    },
    [mode, learning, listen, persistLearningTune]
  );

  if (error) {
    return (
      <RadioFacade isPoweredOn={false}>
        <div className="radio-display radio-display--on" role="alert">
          <div className="radio-display__info">
            <span className="radio-display__key">!</span>
          </div>
          <div className="radio-display__marquee" data-testid="radio-marquee">
            <span className="radio-display__marquee-content">
              Lost the signal...
            </span>
          </div>
          <button
            className="station-selector__button radio-display__retry-button"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      </RadioFacade>
    );
  }

  if (!manifest) {
    return <LoadingSpinner />;
  }

  const displayTuneName = currentTune?.title ?? null;
  const displayArtist = currentTune?.artist ?? null;

  return (
    <div data-testid="radio">
      <RadioFacade isPoweredOn={isPoweredOn}>
        <RadioDisplay
          tuneName={displayTuneName}
          artist={displayArtist}
          stationKey={mode === "jam" ? currentStation : currentTune?.key ?? null}
          speed={speed}
          progress={progress}
          isPoweredOn={isPoweredOn}
          isPlayingStatic={isPlayingStatic}
          mode={mode}
          playCount={mode === "learn" ? learning.playCount : 0}
          onSeek={isPoweredOn && mode === "learn" && currentTune ? handleSeek : undefined}
          onShare={isPoweredOn && mode === "learn" && currentTune ? handleShare : undefined}
        />
        <StationSelector
          stations={stations}
          currentStation={currentStation}
          onStationChange={handleStationChange}
          disabled={!isPoweredOn}
        />
        <SpeedSlider
          speed={speed}
          onSpeedChange={handleSpeedChange}
          disabled={!isPoweredOn}
        />
        <PlayerControls
          isPoweredOn={isPoweredOn}
          onPowerToggle={handlePowerToggle}
          isPaused={isPaused}
          onPause={handlePause}
          onSearch={() => activeSearch.openSearch()}
          onQueue={() => setIsQueueOpen(true)}
          onRestart={handleRestart}
          mode={mode}
          onModeChange={handleModeChange}
          hasCurrentTune={!!currentTune}
        />
        <TuneSearchDrawer
          isOpen={activeSearch.isSearchOpen}
          query={activeSearch.searchQuery}
          results={activeSearch.searchResults}
          onQueryChange={activeSearch.setSearchQuery}
          onSelectTune={handleSelectTune}
          onClose={activeSearch.closeSearch}
        />
        <QueueDrawer
          isOpen={isQueueOpen}
          queue={listen.queue}
          currentIndex={listen.currentIndex}
          onJump={listen.jumpToQueueIndex}
          onRemove={listen.removeFromQueue}
          onClose={() => setIsQueueOpen(false)}
        />
      </RadioFacade>
    </div>
  );
}
