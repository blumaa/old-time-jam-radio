import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { AudioEngine } from "../audio/AudioEngine";

// SoundTouch worklet: expose the AudioParams the engine drives (tempo/pitch)
// plus register/connect. Nodes are plain objects; the graph wiring is asserted
// via the mocked AudioContext, not real audio.
vi.mock("@soundtouchjs/audio-worklet", () => {
  class SoundTouchNode {
    static register = vi.fn().mockResolvedValue(undefined);
    tempo = { value: 1 };
    pitch = { value: 1 };
    playbackRate = { value: 1 };
    connect = vi.fn().mockReturnThis();
    disconnect = vi.fn();
  }
  return { SoundTouchNode };
});

// Reach past `private` for white-box assertions on the internal graph.
type Internals = {
  // `duration` is read-only on the DOM type; the mock makes it writable.
  audioElement: Omit<HTMLMediaElement, "duration"> & { duration: number };
  stNode: { tempo: { value: number }; pitch: { value: number } } | null;
  audioContext: AudioContext;
  gainNode: { gain: { value: number } };
};
const peek = (engine: AudioEngine) => engine as unknown as Internals;

describe("AudioEngine", () => {
  let engine: AudioEngine;

  beforeEach(() => {
    engine = new AudioEngine();
  });

  afterEach(() => {
    engine.destroy();
    vi.clearAllMocks();
  });

  describe("media element source", () => {
    it("creates a hidden CORS-enabled <audio> element with pitch owned by SoundTouch", () => {
      const el = peek(engine).audioElement;
      expect(el).toBeInstanceOf(HTMLAudioElement);
      expect(el.crossOrigin).toBe("anonymous");
      expect(el.style.display).toBe("none");
      // preservesPitch off: the element's playbackRate lowers pitch, which
      // SoundTouch restores. If it were on, pitch would be double-corrected.
      expect(el.preservesPitch).toBe(false);
      expect(document.body.contains(el)).toBe(true);
    });

    it("builds the graph once and resumes the context on init", async () => {
      const { SoundTouchNode } = await import("@soundtouchjs/audio-worklet");
      const ctx = peek(engine).audioContext;
      const createSrc = vi.spyOn(ctx, "createMediaElementSource");

      await engine.init();
      await engine.init();

      expect(SoundTouchNode.register).toHaveBeenCalledTimes(1);
      expect(createSrc).toHaveBeenCalledTimes(1);
      expect(ctx.state).toBe("running");
    });
  });

  describe("playback", () => {
    it("loads a tune into the element and plays it", async () => {
      await engine.loadAndPlay("https://example.com/tune.mp3");
      const el = peek(engine).audioElement;

      expect(el.src).toContain("tune.mp3");
      expect(el.play).toHaveBeenCalled();
      expect(engine.isPlaying()).toBe(true);
    });

    it("lets the latest load win when called in quick succession", async () => {
      await Promise.all([
        engine.loadAndPlay("https://example.com/first.mp3"),
        engine.loadAndPlay("https://example.com/second.mp3"),
      ]);

      expect(peek(engine).audioElement.src).toContain("second.mp3");
    });

    it("stops by pausing and clearing the source", async () => {
      await engine.loadAndPlay("https://example.com/tune.mp3");
      engine.stop();

      const el = peek(engine).audioElement;
      expect(el.pause).toHaveBeenCalled();
      expect(el.getAttribute("src")).toBeNull();
      expect(engine.isPlaying()).toBe(false);
    });

    it("fires the onEnded callback when the element ends", async () => {
      const callback = vi.fn();
      engine.onEnded(callback);
      await engine.loadAndPlay("https://example.com/tune.mp3");

      peek(engine).audioElement.dispatchEvent(new Event("ended"));

      expect(callback).toHaveBeenCalled();
    });
  });

  describe("pause state (single source of truth = the element)", () => {
    it("reports isPaused straight from the element", async () => {
      await engine.loadAndPlay("https://example.com/tune.mp3");
      expect(engine.isPaused()).toBe(false);

      await engine.pause();
      expect(engine.isPaused()).toBe(true);

      await engine.unpause();
      expect(engine.isPaused()).toBe(false);
    });

    it("notifies onPlayStateChange for any transition (UI, media key, or OS)", async () => {
      const onState = vi.fn();
      engine.onPlayStateChange(onState);
      await engine.loadAndPlay("https://example.com/tune.mp3");

      await engine.pause();
      expect(onState).toHaveBeenLastCalledWith(true);

      await engine.unpause();
      expect(onState).toHaveBeenLastCalledWith(false);
    });

    it("does not resume when there is no loaded tune", async () => {
      await engine.init();
      const el = peek(engine).audioElement;
      (el.play as ReturnType<typeof vi.fn>).mockClear();

      await engine.unpause();

      expect(el.play).not.toHaveBeenCalled();
    });
  });

  describe("pitch-preserved speed", () => {
    it("splits speed between the element (time) and SoundTouch (pitch)", async () => {
      await engine.init();
      engine.setTempo(0.5);

      const { audioElement, stNode } = peek(engine);
      expect(audioElement.playbackRate).toBe(0.5); // element slows time
      expect(audioElement.preservesPitch).toBe(false);
      expect(stNode!.tempo.value).toBe(1); // no realtime-unsafe time-stretch
      expect(stNode!.pitch.value).toBe(2); // 1 / 0.5 restores original pitch
    });

    it("clamps tempo to the 0.25–1.0 range", () => {
      engine.setTempo(5);
      expect(engine.getTempo()).toBe(1);
      engine.setTempo(0.01);
      expect(engine.getTempo()).toBe(0.25);
    });

    it("reapplies tempo to each newly loaded tune", async () => {
      engine.setTempo(0.5);
      await engine.loadAndPlay("https://example.com/tune.mp3");
      expect(peek(engine).audioElement.playbackRate).toBe(0.5);
    });
  });

  describe("progress and seek", () => {
    it("returns 0 progress before metadata is known", () => {
      expect(engine.getProgress()).toBe(0);
    });

    it("computes progress from the element clock", async () => {
      await engine.loadAndPlay("https://example.com/tune.mp3");
      const el = peek(engine).audioElement;
      el.duration = 100;
      el.currentTime = 25;

      expect(engine.getProgress()).toBe(0.25);
    });

    it("seeks to a fraction of the duration", async () => {
      await engine.loadAndPlay("https://example.com/tune.mp3");
      const el = peek(engine).audioElement;
      el.duration = 200;

      await engine.seek(0.5);

      expect(el.currentTime).toBe(100);
    });

    it("ignores seeks before duration is known", async () => {
      await engine.loadAndPlay("https://example.com/tune.mp3");
      const el = peek(engine).audioElement;
      await engine.seek(0.5);
      expect(el.currentTime).toBe(0);
    });
  });

  describe("volume", () => {
    it("clamps and reports gain", () => {
      engine.setVolume(0.3);
      expect(engine.getVolume()).toBe(0.3);
      engine.setVolume(5);
      expect(engine.getVolume()).toBe(1);
      engine.setVolume(-1);
      expect(engine.getVolume()).toBe(0);
    });
  });

  describe("teardown", () => {
    it("removes the element and closes the context on destroy", () => {
      const el = peek(engine).audioElement;
      const ctx = peek(engine).audioContext;
      const close = vi.spyOn(ctx, "close");

      engine.destroy();

      expect(document.body.contains(el)).toBe(false);
      expect(close).toHaveBeenCalled();
    });
  });
});
