"use client";

import { useRef, useState } from "react";

interface AudioPreviewProps {
  url: string;
}

export default function AudioPreview({ url }: AudioPreviewProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  function toggle() {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play();
      setPlaying(true);
    }
  }

  return (
    <span className="audio-preview">
      <button
        className="audio-preview__button"
        onClick={toggle}
        type="button"
        aria-label={playing ? "Pause preview" : "Play preview"}
      >
        {playing ? "⏸" : "▶"}
      </button>
      <audio
        ref={audioRef}
        src={url}
        onEnded={() => setPlaying(false)}
        preload="none"
      />
    </span>
  );
}
