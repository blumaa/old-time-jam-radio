"use client";

import { useRef, useEffect } from "react";
import type { Tune } from "../types";

interface TuneSearchProps {
  isOpen: boolean;
  query: string;
  results: Tune[];
  onQueryChange: (query: string) => void;
  onSelectTune: (tune: Tune) => void;
  onClose: () => void;
}

export default function TuneSearch({
  isOpen,
  query,
  results,
  onQueryChange,
  onSelectTune,
  onClose,
}: TuneSearchProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="tune-search" role="listbox" aria-label="Tune search results" onClick={(e) => e.stopPropagation()}>
      <div className="tune-search__header">
        <input
          ref={inputRef}
          className="tune-search__input"
          type="search"
          role="searchbox"
          placeholder="Search tunes..."
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") onClose();
          }}
        />
      </div>
      <div className="tune-search__results">
        {results.map((tune) => (
          <button
            key={tune.url}
            className="tune-search__result-item"
            role="option"
            aria-selected={false}
            onClick={() => onSelectTune(tune)}
            type="button"
          >
            <span className="tune-search__result-title">{tune.title}</span>
            <span className="tune-search__key-badge" data-testid="tune-search-key">
              {tune.key}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
