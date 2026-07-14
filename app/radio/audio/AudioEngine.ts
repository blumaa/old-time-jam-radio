import type { SoundTouchNode as SoundTouchNodeType } from "@soundtouchjs/audio-worklet";
import { StaticNoiseGenerator } from "./StaticNoiseGenerator";

/**
 * Audio graph:
 *
 *   <audio> ─▶ MediaElementAudioSourceNode ─▶ SoundTouchNode ─▶ gain ─▶ destination
 *
 * The tune plays through a real <audio> element (not decodeAudioData + a
 * buffer source). This is deliberate and load-bearing:
 *
 *  - Web Audio alone does not request Android audio focus, so Chrome never
 *    shows a media notification and never routes hardware media keys
 *    (headset/Bluetooth). A genuine, audible media element does. Routing the
 *    tune through the element is the only documented way to get the Media
 *    Session working on Android — and it makes play/pause native across every
 *    platform (Mac keyboard, Android headset, lock screen).
 *
 *  - Pitch-preserved speed is split for realtime safety: the element does the
 *    time change via `playbackRate` (a perfect resample; but with
 *    `preservesPitch = false` it also lowers pitch by the same factor), and
 *    SoundTouch restores pitch with a duration-preserving pitch shift
 *    (`pitch = 1 / speed`, `tempo = 1`). SoundTouch's *time-stretch* would
 *    drift unboundedly when fed a realtime source (input:output ratio ≠ 1);
 *    its *pitch-shift* preserves duration, so sample flow stays ~1:1 and the
 *    worklet's FIFO stays bounded.
 *
 * Single source of truth for playback state is the element itself:
 * `audioElement.paused` / `.currentTime` / `.duration`.
 */
export class AudioEngine {
  private audioContext: AudioContext;
  private gainNode: GainNode;
  private audioElement: HTMLAudioElement;
  private mediaElementSource: MediaElementAudioSourceNode | null = null;
  private stNode: SoundTouchNodeType | null = null;
  private staticNoise: StaticNoiseGenerator;
  private _tempo = 1.0;
  private _onEndedCallback: (() => void) | null = null;
  private _onPlayStateChange: ((paused: boolean) => void) | null = null;
  private _initialized = false;
  private _loadToken = 0;

  constructor() {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    this.audioContext = new AudioCtx();
    this.gainNode = this.audioContext.createGain();
    this.gainNode.connect(this.audioContext.destination);

    this.audioElement = document.createElement("audio");
    // crossOrigin is required so MediaElementAudioSourceNode is not "tainted"
    // (a tainted element feeds silence into the graph). The tunes are served
    // from R2 with CORS headers, so anonymous mode succeeds.
    this.audioElement.crossOrigin = "anonymous";
    this.audioElement.preload = "auto";
    this.audioElement.setAttribute("playsinline", "");
    this.audioElement.style.display = "none";
    // SoundTouch owns pitch correction; disable the browser's own so the
    // element's playbackRate lowers pitch by exactly the speed factor.
    this.setPreservesPitch(false);
    document.body.appendChild(this.audioElement);

    this.audioElement.addEventListener("ended", () => {
      this._onEndedCallback?.();
    });
    // The element is the single source of truth: mirror its state to listeners
    // regardless of who changed it (our UI, a media key, or the OS lock screen).
    this.audioElement.addEventListener("play", () =>
      this._onPlayStateChange?.(false)
    );
    this.audioElement.addEventListener("pause", () =>
      this._onPlayStateChange?.(true)
    );

    this.staticNoise = new StaticNoiseGenerator(
      this.audioContext,
      this.gainNode
    );
  }

  private setPreservesPitch(value: boolean): void {
    const el = this.audioElement as HTMLAudioElement & {
      mozPreservesPitch?: boolean;
      webkitPreservesPitch?: boolean;
    };
    el.preservesPitch = value;
    el.mozPreservesPitch = value;
    el.webkitPreservesPitch = value;
  }

  private async ensureRunning(): Promise<void> {
    if (this.audioContext.state === "suspended") {
      await this.audioContext.resume();
    }
  }

  async init(): Promise<void> {
    if (!this._initialized) {
      const { SoundTouchNode } = await import("@soundtouchjs/audio-worklet");
      await SoundTouchNode.register(
        this.audioContext,
        "/soundtouch-processor.js"
      );

      // Built once and reused for every tune: createMediaElementSource can only
      // be called a single time per element.
      this.mediaElementSource = this.audioContext.createMediaElementSource(
        this.audioElement
      );
      this.stNode = new SoundTouchNode(this.audioContext);
      this.mediaElementSource.connect(this.stNode);
      this.stNode.connect(this.gainNode);
      this.applyTempo();

      this._initialized = true;
    }
    await this.ensureRunning();
  }

  async loadAndPlay(url: string): Promise<void> {
    const token = ++this._loadToken;
    await this.init();
    if (token !== this._loadToken) return;

    this.audioElement.src = url;
    // Some browsers reset preservesPitch when the source changes.
    this.setPreservesPitch(false);
    this.applyTempo();
    try {
      await this.audioElement.play();
    } catch (e: unknown) {
      // A newer load (or stop) interrupted this one — expected, not an error.
      if (token !== this._loadToken) return;
      if (e instanceof DOMException && e.name === "AbortError") return;
      throw e;
    }
  }

  async seek(fraction: number): Promise<void> {
    const duration = this.audioElement.duration;
    if (!duration || Number.isNaN(duration)) return;
    this.audioElement.currentTime = Math.max(0, Math.min(1, fraction)) * duration;
  }

  stop(): void {
    this._loadToken++;
    this.staticNoise.stop();
    this.audioElement.pause();
    this.audioElement.removeAttribute("src");
    this.audioElement.load();
  }

  async playStaticBurst(durationMs = 400): Promise<void> {
    await this.ensureRunning();
    return this.staticNoise.play(durationMs);
  }

  private applyTempo(): void {
    // Element handles the time change (and, with preservesPitch off, drops
    // pitch by `_tempo`); SoundTouch shifts pitch back up to restore it.
    this.audioElement.playbackRate = this._tempo;
    if (this.stNode) {
      this.stNode.tempo.value = 1;
      this.stNode.pitch.value = 1 / this._tempo;
    }
  }

  setTempo(tempo: number): void {
    this._tempo = Math.max(0.25, Math.min(1.0, tempo));
    this.applyTempo();
  }

  getTempo(): number {
    return this._tempo;
  }

  setVolume(volume: number): void {
    this.gainNode.gain.value = Math.max(0, Math.min(1, volume));
  }

  getVolume(): number {
    return this.gainNode.gain.value;
  }

  getProgress(): number {
    const duration = this.audioElement.duration;
    if (!duration || Number.isNaN(duration)) return 0;
    return Math.min(this.audioElement.currentTime / duration, 1);
  }

  isPlaying(): boolean {
    return !!this.audioElement.src && !this.audioElement.paused;
  }

  onEnded(callback: () => void): void {
    this._onEndedCallback = callback;
  }

  onPlayStateChange(callback: (paused: boolean) => void): void {
    this._onPlayStateChange = callback;
  }

  async pause(): Promise<void> {
    this.audioElement.pause();
  }

  async unpause(): Promise<void> {
    await this.ensureRunning();
    if (!this.audioElement.src) return;
    await this.audioElement.play();
  }

  // Single source of truth for paused: the element itself.
  isPaused(): boolean {
    return this.audioElement.paused;
  }

  destroy(): void {
    this.stop();
    this.staticNoise.stop();
    this.audioElement.remove();
    this.audioContext.close();
  }
}
