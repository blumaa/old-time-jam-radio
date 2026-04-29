import type { Tune, Manifest } from "../types";

describe("Tune type", () => {
  it("should accept a valid tune object", () => {
    const tune: Tune = {
      title: "Turkey in the Straw",
      artist: "Traditional",
      key: "G",
      url: "tunes/turkey-in-the-straw.mp3",
      duration: 187.4,
      confidence: 0.82,
      format: "mp3",
    };

    expect(tune.title).toBe("Turkey in the Straw");
    expect(tune.artist).toBe("Traditional");
    expect(tune.key).toBe("G");
    expect(tune.url).toBe("tunes/turkey-in-the-straw.mp3");
    expect(tune.duration).toBe(187.4);
    expect(tune.confidence).toBe(0.82);
    expect(tune.format).toBe("mp3");
  });

  it("should accept m4a format", () => {
    const tune: Tune = {
      title: "Salt Creek",
      artist: "Traditional",
      key: "A",
      url: "tunes/salt-creek.m4a",
      duration: 145.2,
      confidence: 1.0,
      format: "m4a",
    };

    expect(tune.format).toBe("m4a");
  });
});

describe("Manifest type", () => {
  it("should be an array of Tune objects", () => {
    const manifest: Manifest = [
      {
        title: "Turkey in the Straw",
        artist: "Traditional",
        key: "G",
        url: "tunes/turkey-in-the-straw.mp3",
        duration: 187.4,
        confidence: 0.82,
        format: "mp3",
      },
      {
        title: "Salt Creek",
        artist: "Traditional",
        key: "A",
        url: "tunes/salt-creek.m4a",
        duration: 145.2,
        confidence: 1.0,
        format: "m4a",
      },
    ];

    expect(manifest).toHaveLength(2);
    expect(manifest[0].title).toBe("Turkey in the Straw");
    expect(manifest[1].key).toBe("A");
  });
});
