// SSOT for selectable color schemes.
//
// Each `value` (except "default") must have a matching `[data-theme="<value>"]`
// block in `styles/themes.css` that overrides the palette-layer CSS variables.
// "default" means "no data-theme attribute" — the original amber/wood palette
// defined in `styles/global.css` :root.

export interface RadioTheme {
  value: string;
  label: string;
}

export const DEFAULT_THEME = "default";

export const THEMES: readonly RadioTheme[] = [
  { value: "default", label: "Amber (default)" },
  { value: "midnight", label: "Midnight" },
  { value: "blonde", label: "Blonde" },
  { value: "xclues", label: "xClues" },
  { value: "superhuman", label: "Superhuman" },
  { value: "stripe", label: "Stripe" },
  { value: "spotify", label: "Spotify" },
  { value: "linear", label: "Linear" },
  { value: "notion", label: "Notion" },
  { value: "framer", label: "Framer" },
  { value: "claude", label: "Claude" },
  { value: "pinterest", label: "Pinterest" },
  { value: "raycast", label: "Raycast" },
  { value: "supabase", label: "Supabase" },
  { value: "vercel", label: "Vercel" },
] as const;

export const THEME_STORAGE_KEY = "ot-dial-theme-v1";
