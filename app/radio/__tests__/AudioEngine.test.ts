import { describe, it, expect, vi, beforeEach } from "vitest";
import { AudioEngine } from "../audio/AudioEngine";

vi.mock("soundtouchjs", () => {
  const mockConnect = vi.fn();
  const mockDisconnect = vi.fn();
  const mockOn = vi.fn();
  const mockOff = vi.fn();

  return {
    PitchShifter: class MockPitchShifter {
      _tempo = 1;
      duration = 120;
      percentagePlayed = 0;
      listeners: Array<{ name: string; cb: (detail: unknown) => void }> = [];

      connect = mockConnect;
      disconnect = mockDisconnect;
      on = mockOn;
      off = mockOff;

      set tempo(v: number) {
        this._tempo = v;
      }
      get tempo() {
        return this._tempo;
      }
      set pitch(v: number) {
        /* noop */
        void v;
      }
    },
  };
});

describe("AudioEngine", () => {
  let engine: AudioEngine;

  beforeEach(() => {
    vi.restoreAllMocks();
    engine = new AudioEngine();
  });

  afterEach(() => {
    engine.destroy();
  });

  it("should create an AudioContext on construction", () => {
    expect(engine).toBeDefined();
  });

  it("should set volume via gain node", () => {
    engine.setVolume(0.5);
    expect(engine.getVolume()).toBe(0.5);
  });

  it("should clamp volume between 0 and 1", () => {
    engine.setVolume(1.5);
    expect(engine.getVolume()).toBe(1);

    engine.setVolume(-0.5);
    expect(engine.getVolume()).toBe(0);
  });

  it("should store tempo value", () => {
    engine.setTempo(0.5);
    expect(engine.getTempo()).toBe(0.5);
  });

  it("should clamp tempo between 0.25 and 1.0", () => {
    engine.setTempo(0.1);
    expect(engine.getTempo()).toBe(0.25);

    engine.setTempo(1.5);
    expect(engine.getTempo()).toBe(1.0);
  });

  it("should load and decode audio from a URL", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024)),
    } as Response);

    await engine.loadAndPlay("https://example.com/tune.mp3");

    expect(global.fetch).toHaveBeenCalledWith("https://example.com/tune.mp3");
  });

  it("should stop playback", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024)),
    } as Response);

    await engine.loadAndPlay("https://example.com/tune.mp3");
    engine.stop();

    expect(engine.isPlaying()).toBe(false);
  });

  it("should report playing state correctly", () => {
    expect(engine.isPlaying()).toBe(false);
  });

  it("should resume audio context for iOS Safari", async () => {
    const resumeSpy = vi.fn().mockResolvedValue(undefined);
    (engine as unknown as { audioContext: { resume: typeof resumeSpy } }).audioContext.resume =
      resumeSpy;

    await engine.resume();
    expect(resumeSpy).toHaveBeenCalled();
  });

  it("should register onEnded callback", () => {
    const callback = vi.fn();
    engine.onEnded(callback);
    expect(callback).not.toHaveBeenCalled();
  });

  it("should clean up on destroy", () => {
    engine.destroy();
    expect(engine.isPlaying()).toBe(false);
  });
});
