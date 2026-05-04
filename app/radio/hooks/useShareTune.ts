"use client";

import { useMemo, useCallback } from "react";
import type { Tune, Manifest } from "../types";

const TUNE_PARAM = "tune";

export function useShareTune(manifest: Manifest) {
  const sharedTune = useMemo<Tune | null>(() => {
    if (typeof window === "undefined" || manifest.length === 0) return null;
    const params = new URLSearchParams(window.location.search);
    const tuneUrl = params.get(TUNE_PARAM);
    if (!tuneUrl) return null;
    return manifest.find((t) => t.url === tuneUrl) ?? null;
  }, [manifest]);

  const buildShareUrl = useCallback((tune: Tune): string => {
    const url = new URL(window.location.origin);
    url.searchParams.set(TUNE_PARAM, tune.url);
    return url.toString();
  }, []);

  const copyShareLink = useCallback(
    async (tune: Tune): Promise<boolean> => {
      try {
        await navigator.clipboard.writeText(buildShareUrl(tune));
        return true;
      } catch {
        return false;
      }
    },
    [buildShareUrl]
  );

  const clearShareParam = useCallback(() => {
    const url = new URL(window.location.href);
    url.searchParams.delete(TUNE_PARAM);
    window.history.replaceState({}, "", url.pathname + url.search);
  }, []);

  return { sharedTune, buildShareUrl, copyShareLink, clearShareParam };
}
