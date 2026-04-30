"use client";

import type { Tune } from "../types";
import TuneSearch from "./TuneSearch";

interface TuneSearchDrawerProps {
  isOpen: boolean;
  query: string;
  results: Tune[];
  onQueryChange: (query: string) => void;
  onSelectTune: (tune: Tune) => void;
  onClose: () => void;
}

export default function TuneSearchDrawer({
  isOpen,
  query,
  results,
  onQueryChange,
  onSelectTune,
  onClose,
}: TuneSearchDrawerProps) {
  return (
    <div
      className={`tune-search-drawer ${isOpen ? "tune-search-drawer--open" : ""}`}
      data-testid="tune-search-drawer"
    >
      <div
        className="tune-search-drawer__backdrop"
        data-testid="tune-search-backdrop"
        onClick={onClose}
      />
      <div className="tune-search-drawer__panel">
        <TuneSearch
          isOpen={isOpen}
          query={query}
          results={results}
          onQueryChange={onQueryChange}
          onSelectTune={onSelectTune}
          onClose={onClose}
        />
      </div>
    </div>
  );
}
