"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import type { Manifest, RadioMode } from "./types";
import LoadingSpinner from "./components/LoadingSpinner";
import RadioFacade from "./components/RadioFacade";
import RadioDisplay from "./components/RadioDisplay";
import PowerButton from "./components/PowerButton";
import PauseButton from "./components/PauseButton";
import RestartButton from "./components/RestartButton";
import StationSelector from "./components/StationSelector";
import SpeedSlider from "./components/SpeedSlider";
import VolumeSlider from "./components/VolumeSlider";
import ModeToggle from "./components/ModeToggle";
import TuneSearchDrawer from "./components/TuneSearchDrawer";
import { useAudioEngine } from "./hooks/useAudioEngine";
import { useStationPlayback } from "./hooks/useStationPlayback";
import { useLearningPlayback } from "./hooks/useLearningPlayback";
import { usePersistedSettings } from "./hooks/usePersistedSettings";
import { useShareTune } from "./hooks/useShareTune";
import "@/styles/radio.css";

const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_URL ?? "";

export default function Radio() {
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPoweredOn, setIsPoweredOn] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);

  const progressRef = useRef<number>(0);

  const {
    station: persistedStation,
    speed,
    volume,
    mode,
    learningTune,
    setStation: persistStation,
    setSpeed: persistSpeed,
    setVolume: persistVolume,
    setMode: persistMode,
    setLearningTune: persistLearningTune,
  } = usePersistedSettings();

  const {
    init,
    play,
    stop,
    pause,
    unpause,
    setTempo,
    setVolume: setEngineVolume,
    getProgress,
    onEnded,
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

  const { sharedTune, copyShareLink, clearShareParam } = useShareTune(manifest ?? []);

  const sharedTuneRef = useRef(sharedTune);
  useEffect(() => {
    if (sharedTune) {
      sharedTuneRef.current = sharedTune;
      persistMode("learn");
    }
  }, [sharedTune, persistMode]);

  const currentTune = mode === "jam" ? jamCurrentTune : learning.currentTune;

  useEffect(() => {
    if (!isPoweredOn) return;
    onEnded(() => {
      if (mode === "jam") {
        jamHandleTuneEnded();
      } else {
        learning.handleTuneEnded();
      }
    });
  }, [isPoweredOn, mode, onEnded, jamHandleTuneEnded, learning]);

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
      }
    }
  }, [isPoweredOn, stop, init, persistedStation, stations, switchStation, setEngineVolume, volume, setTempo, speed, mode, learningTune, learning, clearShareParam, persistLearningTune]);

  const handleStationChange = useCallback(
    (station: string) => {
      if (!isPoweredOn) return;
      persistStation(station);
      if (mode === "jam") {
        switchStation(station);
      } else {
        learning.setStationFilter(station);
      }
    },
    [isPoweredOn, persistStation, switchStation, mode, learning]
  );

  const handleSpeedChange = useCallback(
    (newSpeed: number) => {
      persistSpeed(newSpeed);
      setTempo(newSpeed);
    },
    [persistSpeed, setTempo]
  );

  const handleVolumeChange = useCallback(
    (newVolume: number) => {
      persistVolume(newVolume);
      setEngineVolume(newVolume);
    },
    [persistVolume, setEngineVolume]
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
      }
    },
    [stop, persistMode, isPoweredOn, persistedStation, stations, switchStation, currentTune, learning, persistLearningTune]
  );

  const handlePause = useCallback(async () => {
    if (isPaused) {
      await unpause();
      setIsPaused(false);
    } else {
      await pause();
      setIsPaused(true);
    }
  }, [isPaused, pause, unpause]);

  useEffect(() => {
    if (!("mediaSession" in navigator)) return;

    if (!isPoweredOn) {
      navigator.mediaSession.playbackState = "none";
      navigator.mediaSession.setActionHandler("play", null);
      navigator.mediaSession.setActionHandler("pause", null);
      return;
    }

    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTune?.title ?? "Old-Time Radio",
      artist: currentTune?.artist ?? "",
    });

    navigator.mediaSession.playbackState = isPaused ? "paused" : "playing";

    navigator.mediaSession.setActionHandler("play", () => handlePause());
    navigator.mediaSession.setActionHandler("pause", () => handlePause());

    return () => {
      navigator.mediaSession.setActionHandler("play", null);
      navigator.mediaSession.setActionHandler("pause", null);
      navigator.mediaSession.playbackState = "none";
    };
  }, [isPoweredOn, isPaused, handlePause, currentTune]);

  const handleRestart = useCallback(async () => {
    if (mode === "jam") {
      await jamReplayTune();
    } else {
      await learning.replayTune();
    }
    setIsPaused(false);
  }, [mode, jamReplayTune, learning]);

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
      await learning.selectTune(tune);
      persistLearningTune(tune);
      setIsPaused(false);
    },
    [learning, persistLearningTune]
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
          stationKey={mode === "learn" ? currentTune?.key ?? null : currentStation}
          speed={speed}
          progress={progress}
          isPoweredOn={isPoweredOn}
          isPlayingStatic={isPlayingStatic}
          mode={mode}
          playCount={learning.playCount}
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
        <VolumeSlider
          volume={volume}
          onVolumeChange={handleVolumeChange}
          disabled={!isPoweredOn}
        />
        <div className="radio-transport">
          <div className={`transport-button-slot radio-transport__search ${mode === "jam" ? "transport-button-slot--hidden" : ""}`}>
            <button
              className="transport-button"
              onClick={() => learning.openSearch()}
              disabled={!isPoweredOn}
              aria-label="Search tunes"
              type="button"
            >
              <svg className="transport-button__icon-svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <circle cx="10" cy="10" r="6" />
                <line x1="14.5" y1="14.5" x2="20" y2="20" />
              </svg>
            </button>
          </div>
          <div className="radio-transport__controls">
            <PowerButton isPoweredOn={isPoweredOn} onClick={handlePowerToggle} />
            <div className="radio-transport__stack">
              <div className="transport-button-slot">
                <PauseButton
                  isPaused={isPaused}
                  onClick={handlePause}
                  disabled={!isPoweredOn || !currentTune}
                />
              </div>
              <div className={`transport-button-slot ${mode === "jam" ? "transport-button-slot--hidden" : ""}`}>
                <RestartButton
                  onClick={handleRestart}
                  disabled={!isPoweredOn || !currentTune}
                />
              </div>
            </div>
          </div>
          <ModeToggle
            mode={mode}
            onModeChange={handleModeChange}
            disabled={!isPoweredOn}
          />
        </div>
        <TuneSearchDrawer
          isOpen={learning.isSearchOpen}
          query={learning.searchQuery}
          results={learning.searchResults}
          onQueryChange={learning.setSearchQuery}
          onSelectTune={handleSelectTune}
          onClose={learning.closeSearch}
        />
      </RadioFacade>
    </div>
  );
}
