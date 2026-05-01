import type { SoundTouchNode as SoundTouchNodeType } from "@soundtouchjs/audio-worklet";
import { StaticNoiseGenerator } from "./StaticNoiseGenerator";

export class AudioEngine {
  private audioContext: AudioContext;
  private gainNode: GainNode;
  private stNode: SoundTouchNodeType | null = null;
  private source: AudioBufferSourceNode | null = null;
  private _tempo = 1.0;
  private _playing = false;
  private _onEndedCallback: (() => void) | null = null;
  private _progress = 0;
  private _duration = 0;
  private _startTime = 0;
  private _accumulatedPos = 0;
  private _activeTempo = 1.0;
  private staticNoise: StaticNoiseGenerator;
  private _initialized = false;
  private loadAbortController: AbortController | null = null;

  constructor() {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    this.audioContext = new AudioCtx();
    this.gainNode = this.audioContext.createGain();
    this.gainNode.connect(this.audioContext.destination);
    this.staticNoise = new StaticNoiseGenerator(
      this.audioContext,
      this.gainNode
    );
  }

  private async ensureRunning(): Promise<void> {
    if (this.audioContext.state === "suspended") {
      await this.audioContext.resume();
    }
  }

  async init(): Promise<void> {
    if (!this._initialized) {
      const buffer = this.audioContext.createBuffer(1, 1, this.audioContext.sampleRate);
      const source = this.audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(this.audioContext.destination);
      source.start();

      const { SoundTouchNode } = await import("@soundtouchjs/audio-worklet");
      await SoundTouchNode.register(this.audioContext, "/soundtouch-processor.js");

      this._initialized = true;
    }
    await this.ensureRunning();
  }

  async loadAndPlay(url: string): Promise<void> {
    this.loadAbortController?.abort();
    const controller = new AbortController();
    this.loadAbortController = controller;

    this.stopPlayback();
    await this.ensureRunning();

    try {
      const response = await fetch(url, { signal: controller.signal });
      if (controller.signal.aborted) return;

      const arrayBuffer = await response.arrayBuffer();
      if (controller.signal.aborted) return;

      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      if (controller.signal.aborted) return;

      await this.ensureRunning();

      this._duration = audioBuffer.duration;

      const { SoundTouchNode } = await import("@soundtouchjs/audio-worklet");
      this.stNode = new SoundTouchNode(this.audioContext);
      this.stNode.playbackRate.value = this._tempo;
      this.stNode.pitch.value = 1;
      this.stNode.connect(this.gainNode);

      this.source = this.audioContext.createBufferSource();
      this.source.buffer = audioBuffer;
      this.source.playbackRate.value = this._tempo;
      this.source.connect(this.stNode);

      this.source.onended = () => {
        this._playing = false;
        this._progress = 0;
        this._accumulatedPos = 0;
        this._onEndedCallback?.();
      };

      this._startTime = this.audioContext.currentTime;
      this._accumulatedPos = 0;
      this._activeTempo = this._tempo;
      this.source.start();
      this._playing = true;
    } catch (e: unknown) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      throw e;
    }
  }

  private stopPlayback(): void {
    if (this.source) {
      this.source.onended = null;
      try { this.source.stop(); } catch { /* already stopped */ }
      this.source.disconnect();
      this.source = null;
    }
    if (this.stNode) {
      this.stNode.disconnect();
      this.stNode = null;
    }
    this._playing = false;
    this._progress = 0;
    this._accumulatedPos = 0;
  }

  stop(): void {
    this.loadAbortController?.abort();
    this.loadAbortController = null;
    this.staticNoise.stop();
    this.stopPlayback();
  }

  async playStaticBurst(durationMs = 400): Promise<void> {
    await this.ensureRunning();
    return this.staticNoise.play(durationMs);
  }

  setTempo(tempo: number): void {
    if (this._playing) {
      const elapsed = this.audioContext.currentTime - this._startTime;
      this._accumulatedPos += elapsed * this._activeTempo;
      this._startTime = this.audioContext.currentTime;
    }
    this._tempo = Math.max(0.25, Math.min(1.0, tempo));
    this._activeTempo = this._tempo;
    if (this.source) {
      this.source.playbackRate.value = this._tempo;
    }
    if (this.stNode) {
      this.stNode.playbackRate.value = this._tempo;
    }
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
    if (!this._playing || !this.source) return this._progress;
    const elapsed = this.audioContext.currentTime - this._startTime;
    const position = this._accumulatedPos + elapsed * this._activeTempo;
    return Math.min(position / this._duration, 1);
  }

  isPlaying(): boolean {
    return this._playing;
  }

  onEnded(callback: () => void): void {
    this._onEndedCallback = callback;
  }

  async pause(): Promise<void> {
    if (this._playing) {
      this._progress = this.getProgress();
      await this.audioContext.suspend();
      this._playing = false;
    }
  }

  async unpause(): Promise<void> {
    await this.ensureRunning();
    if (this.source) {
      this._playing = true;
    }
  }

  isPaused(): boolean {
    return this.audioContext.state === "suspended";
  }

  destroy(): void {
    this.stop();
    this.audioContext.close();
  }
}
