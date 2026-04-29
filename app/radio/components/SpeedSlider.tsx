"use client";

const SPEED_PRESETS = [0.25, 0.5, 0.75, 1] as const;

const LABELS: Record<number, string> = {
  0.25: ".25",
  0.5: ".5",
  0.75: ".75",
  1: "1",
};

interface SpeedSliderProps {
  speed: number;
  onSpeedChange: (speed: number) => void;
  disabled: boolean;
}

export default function SpeedSlider({
  speed,
  onSpeedChange,
  disabled,
}: SpeedSliderProps) {
  return (
    <div className="speed-control" data-testid="speed-selector">
      <div className="radio-slider">
        <label className="radio-slider__label" htmlFor="speed-control">
          Speed
        </label>
        <input
          id="speed-control"
          className="radio-slider__input"
          type="range"
          min="0.25"
          max="1"
          step="0.01"
          value={speed}
          onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
          disabled={disabled}
          aria-label="Playback speed"
        />
        <span className="radio-slider__value">{speed.toFixed(2)}x</span>
      </div>
      <div className="speed-presets" role="radiogroup" aria-label="Speed presets">
        {SPEED_PRESETS.map((preset) => (
          <button
            key={preset}
            role="radio"
            aria-checked={speed === preset}
            aria-label={`${preset}x`}
            className="speed-presets__button"
            disabled={disabled}
            onClick={() => onSpeedChange(preset)}
          >
            {LABELS[preset]}
          </button>
        ))}
      </div>
    </div>
  );
}
