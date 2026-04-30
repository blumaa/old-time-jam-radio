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

  const isLearnPlaying = mode === "learn" && !!tuneName;

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
      <div className="radio-display__progress" data-testid="radio-progress">
        <div
          className="radio-display__progress-fill"
          ref={progressFillRef}
        />
      </div>
    </div>
  );
}
