export interface Tune {
  title: string;
  artist: string;
  key: string;
  url: string;
  duration: number;
  confidence: number;
  format: "mp3" | "m4a";
}

export type Manifest = Tune[];

export const SUPPORTED_STATIONS = ["C", "D", "G", "A"] as const;
export type StationKey = (typeof SUPPORTED_STATIONS)[number];

export type RadioMode = "jam" | "learn" | "listen";
