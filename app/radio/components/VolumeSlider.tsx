interface VolumeSliderProps {
  volume: number;
  onVolumeChange: (volume: number) => void;
  disabled: boolean;
}

export default function VolumeSlider({
  volume,
  onVolumeChange,
  disabled,
}: VolumeSliderProps) {
  return (
    <div className="radio-slider" data-testid="volume-slider">
      <label className="radio-slider__label" htmlFor="volume-slider">
        Volume
      </label>
      <input
        id="volume-slider"
        className="radio-slider__input"
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={volume}
        onInput={(e) => onVolumeChange(parseFloat((e.target as HTMLInputElement).value))}
        disabled={disabled}
        aria-label="Volume"
      />
      <span className="radio-slider__value">
        {Math.round(volume * 100)}%
      </span>
    </div>
  );
}
