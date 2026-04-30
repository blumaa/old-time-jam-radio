"use client";

import { useEffect, useRef } from "react";

interface StaticWaveformProps {
  className?: string;
}

const PIXEL_DENSITY = 0.35;

function parseColor(cssColor: string): [number, number, number] {
  const hex = cssColor.replace("#", "");
  if (hex.length === 6) {
    return [
      parseInt(hex.slice(0, 2), 16),
      parseInt(hex.slice(2, 4), 16),
      parseInt(hex.slice(4, 6), 16),
    ];
  }
  return [44, 24, 16];
}

export default function StaticWaveform({ className }: StaticWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const w = Math.floor(rect.width);
      const h = Math.floor(rect.height);
      if (w === 0 || h === 0) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }
      canvas.width = w;
      canvas.height = h;

      const style = getComputedStyle(canvas);
      const colorStr = style.getPropertyValue("--radio-display-text").trim() || "#2c1810";
      const [r, g, b] = parseColor(colorStr);

      const imageData = ctx.createImageData(w, h);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        if (Math.random() < PIXEL_DENSITY) {
          data[i] = r;
          data[i + 1] = g;
          data[i + 2] = b;
          data[i + 3] = 200 + Math.floor(Math.random() * 55);
        }
      }

      ctx.putImageData(imageData, 0, 0);
      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      data-testid="static-waveform"
    />
  );
}
