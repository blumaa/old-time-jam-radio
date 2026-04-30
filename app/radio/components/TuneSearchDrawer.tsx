"use client";

import { useState, useEffect, useCallback } from "react";
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
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setVisible(true);
        });
      });
    } else {
      setVisible(false);
    }
  }, [isOpen]);

  const handleTransitionEnd = useCallback(() => {
    if (!visible) {
      setMounted(false);
    }
  }, [visible]);

  if (!mounted) return null;

  return (
    <div
      className={`tune-search-drawer ${visible ? "tune-search-drawer--open" : ""}`}
      data-testid="tune-search-drawer"
      onTransitionEnd={handleTransitionEnd}
    >
      <div
        className="tune-search-drawer__backdrop"
        data-testid="tune-search-backdrop"
        onClick={onClose}
      />
      <div className="tune-search-drawer__panel">
        <TuneSearch
          isOpen={true}
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
