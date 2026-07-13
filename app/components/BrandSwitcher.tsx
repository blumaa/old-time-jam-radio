"use client";

import { useEffect, useSyncExternalStore } from "react";
import { THEMES, DEFAULT_THEME, THEME_STORAGE_KEY } from "@/app/theme/themes";
import "@/styles/brand-switcher.css";

// Fired after a local theme change so useSyncExternalStore re-reads storage
// (the native `storage` event only fires in *other* tabs).
const THEME_CHANGE_EVENT = "ot-dial-theme-change";

function subscribe(callback: () => void): () => void {
  window.addEventListener("storage", callback);
  window.addEventListener(THEME_CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(THEME_CHANGE_EVENT, callback);
  };
}

// Dev-only palette preview. Sets `data-theme` on <html>; the matching
// `[data-theme]` block in styles/themes.css re-skins the whole radio.
function applyTheme(value: string) {
  const root = document.documentElement;
  if (value === DEFAULT_THEME) {
    root.removeAttribute("data-theme");
  } else {
    root.setAttribute("data-theme", value);
  }
}

function readStoredTheme(): string {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY) ?? DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

export default function BrandSwitcher() {
  // Read the persisted theme without setState-in-effect (Vercel rule 6.5).
  // Server + first hydration render use DEFAULT; React re-renders with the
  // stored value after hydration — no mismatch warning. The layout's
  // pre-hydration script already applied data-theme, so there is no flicker.
  const theme = useSyncExternalStore(
    subscribe,
    readStoredTheme,
    () => DEFAULT_THEME
  );

  // Apply the theme to the DOM as a side effect (not setState) — runs only on
  // the client after hydration, so the server never emits data-theme and there
  // is no hydration mismatch. Reading the stored value into the select is
  // handled by useSyncExternalStore above, which keeps this off the render path.
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  if (process.env.NODE_ENV === "production") return null;

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    applyTheme(value);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, value);
    } catch {
      // Ignore storage failures (private mode, quota) — preview still works.
    }
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  };

  return (
    <div className="brand-switcher" data-testid="brand-switcher">
      <label className="brand-switcher__label" htmlFor="brand-switcher-select">
        Theme
      </label>
      <select
        id="brand-switcher-select"
        className="brand-switcher__select"
        value={theme}
        onChange={handleChange}
      >
        {THEMES.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>
    </div>
  );
}
