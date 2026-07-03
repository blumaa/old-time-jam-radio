"use client";

import type { Tune } from "../types";
import TuneSearch from "./TuneSearch";
import Drawer from "./Drawer";

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
    <Drawer isOpen={isOpen} onClose={onClose} testId="tune-search-drawer">
      <TuneSearch
        isOpen={isOpen}
        query={query}
        results={results}
        onQueryChange={onQueryChange}
        onSelectTune={onSelectTune}
        onClose={onClose}
      />
    </Drawer>
  );
}
