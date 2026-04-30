import { describe, it, expect } from "vitest";
import { buildTuneUrl } from "../utils/buildTuneUrl";

describe("buildTuneUrl", () => {
  const r2 = "https://r2.example.com";

  it("encodes each path segment independently", () => {
    const tune = { url: "A/My Tune.mp3" };
    expect(buildTuneUrl(r2, tune)).toBe(
      "https://r2.example.com/A/My%20Tune.mp3"
    );
  });

  it("handles simple paths without special characters", () => {
    const tune = { url: "D/reel.mp3" };
    expect(buildTuneUrl(r2, tune)).toBe("https://r2.example.com/D/reel.mp3");
  });

  it("encodes ampersands and other special characters", () => {
    const tune = { url: "G/Tom & Jerry's Reel.mp3" };
    expect(buildTuneUrl(r2, tune)).toBe(
      "https://r2.example.com/G/Tom%20%26%20Jerry's%20Reel.mp3"
    );
  });

  it("handles deeply nested paths", () => {
    const tune = { url: "station/artist/album/tune.mp3" };
    expect(buildTuneUrl(r2, tune)).toBe(
      "https://r2.example.com/station/artist/album/tune.mp3"
    );
  });
});
