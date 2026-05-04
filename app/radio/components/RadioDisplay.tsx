"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { RadioMode } from "../types";
import StaticWaveform from "./StaticWaveform";

interface RadioDisplayProps {
  tuneName: string | null;
  artist: string | null;
  stationKey: string | null;
  speed: number;
  progress: number;
  isPoweredOn: boolean;
  isPlayingStatic?: boolean;
  mode?: RadioMode;
  playCount?: number;
  onSeek?: (fraction: number) => void;
  onShare?: () => void;
}

function formatDisplayText(tuneName: string | null, artist: string | null): string {
  if (!tuneName) return "No signal...";
  if (!artist) return tuneName;
  return `${tuneName} -- ${artist}`;
}

export default function RadioDisplay({
  tuneName,
  artist,
  stationKey,
  speed,
  progress,
  isPoweredOn,
  isPlayingStatic = false,
  mode = "jam",
  playCount = 0,
  onSeek,
  onShare,
}: RadioDisplayProps) {
  const measureRef = useRef<HTMLSpanElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressFillRef = useRef<HTMLDivElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  const displayText = formatDisplayText(tuneName, artist);

  const checkOverflow = useCallback(() => {
    if (!measureRef.current || !containerRef.current) return;
    setIsOverflowing(measureRef.current.scrollWidth > containerRef.current.clientWidth);
  }, []);

  useEffect(() => {
    checkOverflow();
  }, [displayText, checkOverflow]);

  useEffect(() => {
    if (!containerRef.current || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(checkOverflow);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [checkOverflow]);

  useEffect(() => {
    progressFillRef.current?.style.setProperty("--progress", `${progress * 100}%`);
  }, [progress]);

  const progressBarRef = useRef<HTMLDivElement>(null);

  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!onSeek || !progressBarRef.current) return;
      const rect = progressBarRef.current.getBoundingClientRect();
      const fraction = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      onSeek(fraction);
    },
    [onSeek]
  );

  const isLearnPlaying = mode === "learn" && !!tuneName;
  const showShare = mode === "learn" && !!tuneName && !!onShare;

  return (
    <div
      className={`radio-display ${isPoweredOn ? "radio-display--on" : "radio-display--off"}`}
      data-testid="radio-display"
    >
      <div className="radio-display__info">
        <span className={`radio-display__key${stationKey ? "" : " radio-display__key--hidden"}`}>
          {stationKey ?? " "}
        </span>
        {isLearnPlaying && playCount > 0 && (
          <span className="radio-display__loop-indicator" data-testid="loop-indicator">
            ↻ ×{playCount}
          </span>
        )}
        <span className="radio-display__speed">{speed.toFixed(2)}x</span>
      </div>
      <div
        className={`radio-display__marquee${!isPlayingStatic && isOverflowing ? " radio-display__marquee--scrolling" : ""}`}
        ref={containerRef}
        data-testid="radio-marquee"
      >
        {isPlayingStatic ? (
          <StaticWaveform className="radio-display__static-waveform" />
        ) : (
          <>
            <span
              className="radio-display__marquee-content"
              ref={measureRef}
              aria-hidden={isOverflowing}
            >
              {displayText}
            </span>
            {isOverflowing && (
              <span className="radio-display__marquee-content" aria-hidden>
                {displayText}
              </span>
            )}
          </>
        )}
      </div>
      {showShare && (
        <button
          className="radio-display__share-button"
          onClick={onShare}
          aria-label="Share tune"
          type="button"
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" y1="2" x2="12" y2="15" />
          </svg>
        </button>
      )}
      <div
        className={`radio-display__progress${onSeek ? " radio-display__progress--seekable" : ""}`}
        data-testid="radio-progress"
        ref={progressBarRef}
        onClick={handleProgressClick}
        role={onSeek ? "slider" : undefined}
        aria-label={onSeek ? "Seek" : undefined}
        aria-valuenow={onSeek ? Math.round(progress * 100) : undefined}
        aria-valuemin={onSeek ? 0 : undefined}
        aria-valuemax={onSeek ? 100 : undefined}
        tabIndex={onSeek ? 0 : undefined}
      >
        <div
          className="radio-display__progress-fill"
          ref={progressFillRef}
        />
      </div>
    </div>
  );
}
