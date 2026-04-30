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

    expect(global.fetch).toHaveBeenCalledWith(
      "https://example.com/tune.mp3",
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
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

  it("should init by playing silent buffer and resuming AudioContext", async () => {
    const ctx = (engine as unknown as { audioContext: AudioContext }).audioContext;
    const resumeSpy = vi.fn().mockResolvedValue(undefined);
    ctx.resume = resumeSpy;

    await engine.init();

    expect(resumeSpy).toHaveBeenCalled();
  });

  it("should only init once (idempotent)", async () => {
    const ctx = (engine as unknown as { audioContext: AudioContext }).audioContext;
    const resumeSpy = vi.fn().mockResolvedValue(undefined);
    ctx.resume = resumeSpy;

    await engine.init();
    await engine.init();

    expect(resumeSpy).toHaveBeenCalledTimes(1);
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

  it("should abort previous loadAndPlay when called again", async () => {
    let fetchCount = 0;
    vi.spyOn(global, "fetch").mockImplementation(
      () => {
        fetchCount++;
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024)),
            } as Response);
          }, 100);
        });
      }
    );

    vi.useFakeTimers();

    const first = engine.loadAndPlay("https://example.com/tune1.mp3");
    const second = engine.loadAndPlay("https://example.com/tune2.mp3");

    await vi.advanceTimersByTimeAsync(200);
    await Promise.allSettled([first, second]);

    expect(fetchCount).toBe(2);
    expect(engine.isPlaying()).toBe(true);

    vi.useRealTimers();
  });

  it("should abort in-flight load when stop is called", async () => {
    const abortSpy = vi.fn();
    vi.spyOn(global, "fetch").mockImplementation(
      (_url, options) => {
        options?.signal?.addEventListener("abort", abortSpy);
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024)),
            } as Response);
          }, 100);
        });
      }
    );

    vi.useFakeTimers();
    const loadPromise = engine.loadAndPlay("https://example.com/tune.mp3");
    engine.stop();

    expect(abortSpy).toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(200);
    await loadPromise;

    expect(engine.isPlaying()).toBe(false);
    vi.useRealTimers();
  });

  it("should stop static noise when stop is called", async () => {
    vi.useFakeTimers();
    const staticPromise = engine.playStaticBurst(400);

    let resolved = false;
    staticPromise.then(() => { resolved = true; });

    engine.stop();
    await vi.advanceTimersByTimeAsync(0);

    expect(resolved).toBe(true);
    vi.useRealTimers();
  });
});
