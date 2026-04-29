interface StationSelectorProps {
  stations: string[];
  currentStation: string | null;
  onStationChange: (station: string) => void;
  disabled: boolean;
}

export default function StationSelector({
  stations,
  currentStation,
  onStationChange,
  disabled,
}: StationSelectorProps) {
  return (
    <div
      className="station-selector"
      role="radiogroup"
      aria-label="Station"
      data-testid="station-selector"
    >
      {stations.map((station) => (
        <button
          key={station}
          role="radio"
          aria-checked={station === currentStation}
          aria-label={station}
          className="station-selector__button"
          disabled={disabled}
          onClick={() => onStationChange(station)}
        >
          {station}
        </button>
      ))}
    </div>
  );
}
