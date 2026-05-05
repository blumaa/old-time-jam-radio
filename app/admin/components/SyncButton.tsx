"use client";

import { useState, useCallback } from "react";
import type { Manifest } from "@/app/radio/types";

interface SyncButtonProps {
  onSync: (added: number, manifest: Manifest) => void;
}

export default function SyncButton({ onSync }: SyncButtonProps) {
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleClick = useCallback(async () => {
    setSyncing(true);
    setResult(null);

    try {
      const response = await fetch("/api/admin/sync", { method: "POST" });
      const data = await response.json();

      if (!response.ok) {
        setResult(`Error: ${data.error}`);
        return;
      }

      if (data.added === 0) {
        setResult("No new tunes found");
      } else {
        setResult(`Added ${data.added} new tune${data.added > 1 ? "s" : ""}`);
        const manifestResponse = await fetch("/api/manifest", { cache: "no-store" });
        if (manifestResponse.ok) {
          const manifest: Manifest = await manifestResponse.json();
          onSync(data.added, manifest);
        }
      }
    } catch {
      setResult("Sync failed");
    } finally {
      setSyncing(false);
    }
  }, [onSync]);

  return (
    <div className="sync-button-wrapper">
      <button
        className="admin-panel__sync-button"
        type="button"
        onClick={handleClick}
        disabled={syncing}
      >
        {syncing ? "Syncing..." : "Sync R2"}
      </button>
      {result && <span className="sync-button-wrapper__result">{result}</span>}
    </div>
  );
}
