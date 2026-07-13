import { describe, it, expect, vi, beforeEach } from "vitest";
import { AudioEngine } from "../audio/AudioEngine";

const { mockConnect, mockDisconnect, mockRegister } = vi.hoisted(() => ({
  mockConnect: vi.fn(),
  mockDisconnect: vi.fn(),
  mockRegister: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@soundtouchjs/audio-worklet", () => {
  return {
    SoundTouchNode: class MockSoundTouchNode {
      static register = mockRegister;

      _parameters = new Map([
        ["pitch", { value: 1 }],
        ["tempo", { value: 1 }],
        ["rate", { value: 1 }],
        ["pitchSemitones", { value: 0 }],
        ["playbackRate", { value: 1 }],
      ]);
      get parameters() {
        return this._parameters;
      }
      get pitch() {
        return this._parameters.get("pitch");
      }
      get tempo() {
        return this._parameters.get("tempo");
      }
      get playbackRate() {
        return this._parameters.get("playbackRate");
      }

      connect = mockConnect;
      disconnect = mockDisconnect;

      constructor() {}
    },
  };
});

describe("AudioEngine", () => {
  let engine: AudioEngine;

  beforeEach(() => {
    vi.restoreAllMocks();
    mockConnect.mockClear();
    mockDisconnect.mockClear();
    mockRegister.mockClear();
    engine = new AudioEngine();
  });

  afterEach(() => {
    engine.destroy();
  });

  it("should create an AudioContext on construction", () => {
    expect(engine).toBeDefined();
  });

  describe("media-session keep-alive element", () => {
    it("creates a hidden looping silent <audio> file element", () => {
      const el = document.querySelector("audio") as HTMLAudioElement;
      expect(el).not.toBeNull();
      expect(el.style.display).toBe("none");
      expect(el.loop).toBe(true);
      // A real media file (not a MediaStream) so the OS activates a Media
      // Session and routes hardware/keyboard media keys to the app.
      expect(el.getAttribute("src")).toBe("/silence.mp3");
    });

    it("plays the keep-alive element on init to activate the session", async () => {
      const el = document.querySelector("audio") as HTMLAudioElement;
      (el.play as ReturnType<typeof vi.fn>).mockClear();
      await engine.init();
      expect(el.play).toHaveBeenCalled();
    });

    it("keeps the keep-alive element playing across pause/unpause so the session stays active", async () => {
      const el = document.querySelector("audio") as HTMLAudioElement;
      await engine.loadAndPlay("http://example.com/tune.mp3");
      (el.pause as ReturnType<typeof vi.fn>).mockClear();

      // Pausing the tune must NOT pause the keep-alive element — that would
      // deactivate the media session and drop the hardware media keys.
      await engine.pause();
      expect(el.pause).not.toHaveBeenCalled();

      await engine.unpause();
      expect(el.pause).not.toHaveBeenCalled();
    });

    it("removes the keep-alive element on destroy", () => {
      const before = document.querySelectorAll("audio").length;
      engine.destroy();
      expect(document.querySelectorAll("audio").length).toBe(before - 1);
      // re-create so afterEach destroy() is a no-op-safe double call
      engine = new AudioEngine();
    });
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

  it("should register worklet on init", async () => {
    await engine.init();
    expect(mockRegister).toHaveBeenCalledWith(
      expect.anything(),
      "/soundtouch-processor.js"
    );
  });

  it("should only register worklet once across multiple init calls", async () => {
    await engine.init();
    await engine.init();
    expect(mockRegister).toHaveBeenCalledTimes(1);
  });

  it("should load and decode audio from a URL", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024)),
    } as Response);

    await engine.init();
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

    await engine.init();
    await engine.loadAndPlay("https://example.com/tune.mp3");
    engine.stop();

    expect(engine.isPlaying()).toBe(false);
  });

  it("should report playing state correctly", () => {
    expect(engine.isPlaying()).toBe(false);
  });

  it("should init by playing silent buffer and resuming AudioContext", async () => {
    const ctx = (engine as unknown as { audioContext: AudioContext }).audioContext;
    await ctx.suspend();

    await engine.init();

    expect(ctx.state).toBe("running");
  });

  it("should only play silent buffer once but always resume", async () => {
    const ctx = (engine as unknown as { audioContext: AudioContext }).audioContext;
    const startSpy = vi.fn();
    ctx.createBufferSource = vi.fn().mockReturnValue({
      buffer: null,
      connect: vi.fn(),
      start: startSpy,
      stop: vi.fn(),
      onended: null,
      playbackRate: { value: 1 },
    });

    await engine.init();
    await engine.init();

    expect(startSpy).toHaveBeenCalledTimes(1);
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

    await engine.init();
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
    await engine.init();
    const loadPromise = engine.loadAndPlay("https://example.com/tune.mp3");
    await vi.advanceTimersByTimeAsync(0);
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
    await vi.advanceTimersByTimeAsync(0);

    let resolved = false;
    staticPromise.then(() => { resolved = true; });

    engine.stop();
    await vi.advanceTimersByTimeAsync(0);

    expect(resolved).toBe(true);
    vi.useRealTimers();
  });

  describe("SoundTouchNode integration", () => {
    beforeEach(async () => {
      await engine.init();
      vi.spyOn(global, "fetch").mockResolvedValue({
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024)),
      } as Response);
    });

    it("should set playbackRate on source and SoundTouchNode when loading", async () => {
      engine.setTempo(0.75);
      await engine.loadAndPlay("https://example.com/tune.mp3");

      const stNode = (engine as unknown as { stNode: { playbackRate: { value: number } } }).stNode;
      const source = (engine as unknown as { source: { playbackRate: { value: number } } }).source;
      expect(stNode.playbackRate.value).toBe(0.75);
      expect(source.playbackRate.value).toBe(0.75);
    });

    it("should update playbackRate on source and SoundTouchNode in real time", async () => {
      await engine.loadAndPlay("https://example.com/tune.mp3");
      engine.setTempo(0.5);

      const stNode = (engine as unknown as { stNode: { playbackRate: { value: number } } }).stNode;
      const source = (engine as unknown as { source: { playbackRate: { value: number } } }).source;
      expect(stNode.playbackRate.value).toBe(0.5);
      expect(source.playbackRate.value).toBe(0.5);
    });

    it("should fire onEnded when source ends naturally", async () => {
      const callback = vi.fn();
      engine.onEnded(callback);
      await engine.loadAndPlay("https://example.com/tune.mp3");

      const source = (engine as unknown as { source: { onended: (() => void) | null } }).source;
      source.onended?.();

      expect(engine.isPlaying()).toBe(false);
      expect(callback).toHaveBeenCalled();
    });

    it("should not fire onEnded when stopped manually", async () => {
      const callback = vi.fn();
      engine.onEnded(callback);
      await engine.loadAndPlay("https://example.com/tune.mp3");

      engine.stop();

      expect(callback).not.toHaveBeenCalled();
      expect(engine.isPlaying()).toBe(false);
    });

    it("should stop source on stopPlayback", async () => {
      await engine.loadAndPlay("https://example.com/tune.mp3");
      const source = (engine as unknown as { source: { stop: ReturnType<typeof vi.fn> } }).source;

      engine.stop();
      expect(source.stop).toHaveBeenCalled();
    });

    it("should create a fresh SoundTouchNode per tune", async () => {
      await engine.loadAndPlay("https://example.com/tune1.mp3");
      const firstNode = (engine as unknown as { stNode: unknown }).stNode;

      await engine.loadAndPlay("https://example.com/tune2.mp3");
      const secondNode = (engine as unknown as { stNode: unknown }).stNode;

      expect(firstNode).not.toBe(secondNode);
    });

    it("should disconnect old SoundTouchNode when stopping", async () => {
      await engine.loadAndPlay("https://example.com/tune.mp3");

      engine.stop();
      expect(mockDisconnect).toHaveBeenCalled();
      expect((engine as unknown as { stNode: unknown }).stNode).toBeNull();
    });
  });

  describe("progress tracking", () => {
    function getContext(e: AudioEngine): AudioContext & { currentTime: number } {
      return (e as unknown as { audioContext: AudioContext & { currentTime: number } }).audioContext;
    }

    beforeEach(async () => {
      await engine.init();
      vi.spyOn(global, "fetch").mockResolvedValue({
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024)),
      } as Response);
    });

    it("should report 0 progress when not playing", () => {
      expect(engine.getProgress()).toBe(0);
    });

    it("should calculate progress from currentTime and duration", async () => {
      const ctx = getContext(engine);
      ctx.currentTime = 10;

      await engine.loadAndPlay("https://example.com/tune.mp3");

      ctx.currentTime = 10.5;
      expect(engine.getProgress()).toBeCloseTo(0.5);
    });

    it("should account for tempo when calculating progress", async () => {
      const ctx = getContext(engine);
      ctx.currentTime = 10;
      engine.setTempo(0.5);

      await engine.loadAndPlay("https://example.com/tune.mp3");

      ctx.currentTime = 11;
      expect(engine.getProgress()).toBeCloseTo(0.5);
    });

    it("should handle tempo change mid-playback", async () => {
      const ctx = getContext(engine);
      ctx.currentTime = 0;

      await engine.loadAndPlay("https://example.com/tune.mp3");

      ctx.currentTime = 0.5;
      engine.setTempo(0.5);

      ctx.currentTime = 1.5;
      expect(engine.getProgress()).toBeCloseTo(1.0);
    });

    it("should clamp progress to 1", async () => {
      const ctx = getContext(engine);
      ctx.currentTime = 0;

      await engine.loadAndPlay("https://example.com/tune.mp3");

      ctx.currentTime = 5;
      expect(engine.getProgress()).toBe(1);
    });

    it("should preserve progress across pause and unpause", async () => {
      const ctx = getContext(engine);
      ctx.currentTime = 0;

      await engine.loadAndPlay("https://example.com/tune.mp3");

      ctx.currentTime = 0.5;
      const progressBeforePause = engine.getProgress();

      await engine.pause();
      expect(engine.getProgress()).toBeCloseTo(progressBeforePause);

      await engine.unpause();
      expect(engine.getProgress()).toBeCloseTo(progressBeforePause);
    });
  });

  describe("seek", () => {
    function getContext(e: AudioEngine): AudioContext & { currentTime: number } {
      return (e as unknown as { audioContext: AudioContext & { currentTime: number } }).audioContext;
    }

    beforeEach(async () => {
      await engine.init();
      vi.spyOn(global, "fetch").mockResolvedValue({
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024)),
      } as Response);
    });

    it("should seek to the correct position", async () => {
      const ctx = getContext(engine);
      ctx.currentTime = 0;
      await engine.loadAndPlay("https://example.com/tune.mp3");

      ctx.currentTime = 0;
      await engine.seek(0.5);

      ctx.currentTime = 0;
      expect(engine.getProgress()).toBeCloseTo(0.5);
    });

    it("should continue playing after seek", async () => {
      await engine.loadAndPlay("https://example.com/tune.mp3");
      await engine.seek(0.25);

      expect(engine.isPlaying()).toBe(true);
    });

    it("should remain paused after seek while paused", async () => {
      const ctx = getContext(engine);
      ctx.currentTime = 0;
      await engine.loadAndPlay("https://example.com/tune.mp3");
      await engine.pause();

      await engine.seek(0.5);

      expect(engine.isPlaying()).toBe(false);
      expect(engine.isPaused()).toBe(true);
      expect(engine.getProgress()).toBeCloseTo(0.5);
    });

    it("should clamp seek fraction to [0, 1]", async () => {
      const ctx = getContext(engine);
      ctx.currentTime = 0;
      await engine.loadAndPlay("https://example.com/tune.mp3");

      ctx.currentTime = 0;
      await engine.seek(1.5);
      expect(engine.getProgress()).toBeCloseTo(1.0);

      await engine.seek(-0.5);
      expect(engine.getProgress()).toBeCloseTo(0);
    });

    it("should no-op when no buffer is loaded", async () => {
      await engine.seek(0.5);
      expect(engine.isPlaying()).toBe(false);
      expect(engine.getProgress()).toBe(0);
    });

    it("should create a new source node after seek", async () => {
      await engine.loadAndPlay("https://example.com/tune.mp3");
      const sourceBefore = (engine as unknown as { source: unknown }).source;

      await engine.seek(0.5);
      const sourceAfter = (engine as unknown as { source: unknown }).source;

      expect(sourceAfter).not.toBe(sourceBefore);
    });
  });

  describe("AudioContext state guard", () => {
    function getContext(e: AudioEngine): AudioContext {
      return (e as unknown as { audioContext: AudioContext }).audioContext;
    }

    it("should resume suspended context before loadAndPlay", async () => {
      vi.spyOn(global, "fetch").mockResolvedValue({
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024)),
      } as Response);

      await engine.init();
      const ctx = getContext(engine);
      await ctx.suspend();
      expect(ctx.state).toBe("suspended");

      await engine.loadAndPlay("https://example.com/tune.mp3");

      expect(ctx.state).toBe("running");
    });

    it("should resume context that auto-suspends during fetch/decode", async () => {
      await engine.init();
      const ctx = getContext(engine);

      vi.spyOn(global, "fetch").mockImplementation(async () => {
        await ctx.suspend();
        return {
          arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024)),
        } as Response;
      });

      await engine.loadAndPlay("https://example.com/tune.mp3");

      expect(ctx.state).toBe("running");
    });

    it("should resume suspended context before playStaticBurst", async () => {
      vi.useFakeTimers();
      const ctx = getContext(engine);
      await ctx.suspend();

      const burstPromise = engine.playStaticBurst(100);
      expect(ctx.state).toBe("running");

      await vi.advanceTimersByTimeAsync(200);
      await burstPromise;
      vi.useRealTimers();
    });

    it("should always resume context on init even if already initialized", async () => {
      const ctx = getContext(engine);
      await engine.init();
      await ctx.suspend();
      expect(ctx.state).toBe("suspended");

      await engine.init();
      expect(ctx.state).toBe("running");
    });

    it("should unpause context even when no source is loaded", async () => {
      vi.spyOn(global, "fetch").mockResolvedValue({
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024)),
      } as Response);

      await engine.init();
      const ctx = getContext(engine);
      await engine.loadAndPlay("https://example.com/tune.mp3");
      await engine.pause();
      expect(ctx.state).toBe("suspended");

      engine.stop();
      await engine.unpause();
      expect(ctx.state).toBe("running");
    });

    it("should report isPaused based on context state alone", async () => {
      const ctx = getContext(engine);
      expect(engine.isPaused()).toBe(false);

      await ctx.suspend();
      expect(engine.isPaused()).toBe(true);
    });
  });
});
