"use client";

import type { ReactNode } from "react";

interface RadioFacadeProps {
  isPoweredOn: boolean;
  children: ReactNode;
}

export default function RadioFacade({ isPoweredOn, children }: RadioFacadeProps) {
  return (
    <div
      className={`radio-facade ${isPoweredOn ? "radio-facade--on" : ""}`}
      data-testid="radio-facade"
    >
      <div className="radio-facade__body">
        <div className="radio-facade__speaker-grille">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="radio-facade__grille-slat" />
          ))}
        </div>
        <div className="radio-facade__nameplate">Old-Time Jam Radio</div>
        <div className="radio-facade__controls">{children}</div>
      </div>
    </div>
  );
}
