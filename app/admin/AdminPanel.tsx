"use client";

import { useEffect, useState } from "react";
import type { Tune, Manifest } from "@/app/radio/types";
import TuneList from "./components/TuneList";
import TuneEditor from "./components/TuneEditor";

const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_URL ?? "";

export default function AdminPanel() {
  const [manifest, setManifest] = useState<Manifest>([]);
  const [filter, setFilter] = useState("");
  const [filterKey, setFilterKey] = useState<string>("all");
  const [editingTune, setEditingTune] = useState<Tune | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/manifest")
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

  const filteredTunes = manifest.filter((tune) => {
    const matchesText = tune.title
      .toLowerCase()
      .includes(filter.toLowerCase());
    const matchesKey = filterKey === "all" || tune.key === filterKey;
    return matchesText && matchesKey;
  });

  const keys = Array.from(new Set(manifest.map((t) => t.key))).sort();

  async function handleSave(updated: Tune) {
    const newManifest = manifest.map((t) =>
      t.url === updated.url ? updated : t
    );
    setManifest(newManifest);
    setEditingTune(null);

    await fetch("/api/manifest", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newManifest),
    });
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

  if (loading) return <p>Loading manifest...</p>;

  return (
    <div className="admin-panel">
      <h1 className="admin-panel__title">Tune Manager</h1>
      <div className="admin-panel__stats">
        {manifest.length} tunes &middot; {keys.length} keys
      </div>
      <div className="admin-panel__filters">
        <input
          className="admin-panel__search"
          type="text"
          placeholder="Search tunes..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <select
          className="admin-panel__key-filter"
          value={filterKey}
          onChange={(e) => setFilterKey(e.target.value)}
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
        tunes={filteredTunes}
        r2PublicUrl={R2_PUBLIC_URL}
        onEdit={setEditingTune}
        onDelete={handleDelete}
      />
    </div>
  );
}
