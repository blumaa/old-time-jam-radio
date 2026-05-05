"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import type { Tune, Manifest } from "@/app/radio/types";
import TuneList from "./components/TuneList";
import TuneEditor from "./components/TuneEditor";
import SyncButton from "./components/SyncButton";

const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_URL ?? "";
const PAGE_SIZE = 25;

type SortDirection = "asc" | "desc" | null;

export default function AdminPanel() {
  const [manifest, setManifest] = useState<Manifest>([]);
  const [filter, setFilter] = useState("");
  const [filterKey, setFilterKey] = useState<string>("all");
  const [editingTune, setEditingTune] = useState<Tune | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/manifest", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : []))
      .then((data: Manifest) => {
        if (!cancelled) {
          setManifest(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredTunes = useMemo(() => {
    return manifest.filter((tune) => {
      const matchesText =
        tune.title.toLowerCase().includes(filter.toLowerCase()) ||
        tune.artist.toLowerCase().includes(filter.toLowerCase());
      const matchesKey = filterKey === "all" || tune.key === filterKey;
      return matchesText && matchesKey;
    });
  }, [manifest, filter, filterKey]);

  const sortedTunes = useMemo(() => {
    if (!sortDirection) return filteredTunes;
    return [...filteredTunes].sort((a, b) => {
      const diff = a.confidence - b.confidence;
      return sortDirection === "asc" ? diff : -diff;
    });
  }, [filteredTunes, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(sortedTunes.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const pagedTunes = sortedTunes.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  const keys = Array.from(new Set(manifest.map((t) => t.key))).sort();

  function handleSortByConfidence() {
    setSortDirection((prev) => {
      if (prev === null) return "asc";
      if (prev === "asc") return "desc";
      return null;
    });
    setCurrentPage(1);
  }

  function handleFilterChange(value: string) {
    setFilter(value);
    setCurrentPage(1);
  }

  function handleKeyFilterChange(value: string) {
    setFilterKey(value);
    setCurrentPage(1);
  }

  async function handleSave(updated: Tune) {
    const verified = { ...updated, confidence: 1.0 };

    const newManifest = manifest.map((t) =>
      t.url === updated.url ? verified : t
    );

    const response = await fetch("/api/manifest", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newManifest),
    });

    if (!response.ok) {
      alert(`Save failed: ${response.status} ${response.statusText}`);
      return;
    }

    setManifest(newManifest);
    setEditingTune(null);
  }

  async function handleDelete(tune: Tune) {
    if (!confirm(`Delete "${tune.title}"?`)) return;

    const response = await fetch("/api/admin/tunes", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: tune.url }),
    });

    if (response.ok) {
      setManifest((prev) => prev.filter((t) => t.url !== tune.url));
    }
  }

  const handleSync = useCallback((added: number, newManifest: Manifest) => {
    if (added > 0) {
      setManifest(newManifest);
    }
  }, []);

  if (loading) return <p>Loading manifest...</p>;

  return (
    <div className="admin-panel">
      <h1 className="admin-panel__title">Tune Manager</h1>
      <div className="admin-panel__header">
        <div className="admin-panel__stats">
          {manifest.length} tunes &middot; {keys.length} keys
          {sortedTunes.length !== manifest.length && (
            <> &middot; {sortedTunes.length} shown</>
          )}
        </div>
        <SyncButton onSync={handleSync} />
      </div>
      <div className="admin-panel__filters">
        <input
          className="admin-panel__search"
          type="text"
          placeholder="Search tunes..."
          value={filter}
          onChange={(e) => handleFilterChange(e.target.value)}
        />
        <select
          className="admin-panel__key-filter"
          value={filterKey}
          onChange={(e) => handleKeyFilterChange(e.target.value)}
        >
          <option value="all">All keys</option>
          {keys.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
      </div>

      {editingTune && (
        <TuneEditor
          tune={editingTune}
          onSave={handleSave}
          onCancel={() => setEditingTune(null)}
        />
      )}

      <TuneList
        tunes={pagedTunes}
        r2PublicUrl={R2_PUBLIC_URL}
        onEdit={setEditingTune}
        onDelete={handleDelete}
        sortDirection={sortDirection}
        onSortByConfidence={handleSortByConfidence}
      />

      {totalPages > 1 && (
        <div className="admin-panel__pagination">
          <button
            type="button"
            onClick={() => setCurrentPage((p) => p - 1)}
            disabled={safePage <= 1}
          >
            Previous
          </button>
          <span>Page {safePage} of {totalPages}</span>
          <button
            type="button"
            onClick={() => setCurrentPage((p) => p + 1)}
            disabled={safePage >= totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
