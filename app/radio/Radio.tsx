"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import type { Manifest } from "./types";
import LoadingSpinner from "./components/LoadingSpinner";
import RadioFacade from "./components/RadioFacade";
import RadioDisplay from "./components/RadioDisplay";
import PowerButton from "./components/PowerButton";
import StationSelector from "./components/StationSelector";
import SpeedSlider from "./components/SpeedSlider";
import VolumeSlider from "./components/VolumeSlider";
import { useAudioEngine } from "./hooks/useAudioEngine";
import { useStationPlayback } from "./hooks/useStationPlayback";
import { usePersistedSettings } from "./hooks/usePersistedSettings";
import "@/styles/radio.css";

const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_URL ?? "";

export default function Radio() {
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPoweredOn, setIsPoweredOn] = useState(false);
  const [progress, setProgress] = useState(0);

  const progressRef = useRef<number>(0);

  const {
    station: persistedStation,
    speed,
    volume,
    setStation: persistStation,
    setSpeed: persistSpeed,
    setVolume: persistVolume,
  } = usePersistedSettings();

  const {
    play,
    stop,
    setTempo,
    setVolume: setEngineVolume,
    getProgress,
    onEnded,
    playStaticBurst,
  } = useAudioEngine();

  useEffect(() => {
    async function fetchManifest() {
      try {
        const response = await fetch("/api/manifest");
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
    currentTune,
    isPlayingStatic,
    stations,
    switchStation,
  } = useStationPlayback({
    manifest: manifest ?? [],
    play,
    stop,
    playStaticBurst,
    onEnded,
    r2PublicUrl: R2_PUBLIC_URL,
  });

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

  const handlePowerToggle = useCallback(() => {
    if (isPoweredOn) {
      stop();
      setIsPoweredOn(false);
      setProgress(0);
    } else {
      setIsPoweredOn(true);
      setEngineVolume(volume);
      setTempo(speed);
      const startStation =
        persistedStation && stations.includes(persistedStation)
          ? persistedStation
          : stations[0] ?? null;
      if (startStation) {
        switchStation(startStation);
      }
    }
  }, [isPoweredOn, stop, persistedStation, stations, switchStation, setEngineVolume, volume, setTempo, speed]);

  const handleStationChange = useCallback(
    (station: string) => {
      if (!isPoweredOn) return;
      persistStation(station);
      switchStation(station);
    },
    [isPoweredOn, persistStation, switchStation]
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
            className="station-selector__button"
            onClick={() => window.location.reload()}
            style={{ marginTop: "var(--space-sm)", alignSelf: "center" }}
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

  const displayTuneName = isPlayingStatic
    ? "Tuning..."
    : (currentTune?.title ?? null);

  const displayArtist = isPlayingStatic
    ? null
    : (currentTune?.artist ?? null);

  return (
    <div data-testid="radio">
      <RadioFacade isPoweredOn={isPoweredOn}>
        <RadioDisplay
          tuneName={displayTuneName}
          artist={displayArtist}
          stationKey={currentStation}
          speed={speed}
          progress={progress}
          isPoweredOn={isPoweredOn}
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
        <PowerButton isPoweredOn={isPoweredOn} onClick={handlePowerToggle} />
      </RadioFacade>
    </div>
  );
}
