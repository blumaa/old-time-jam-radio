import { PitchShifter } from "soundtouchjs";
import { StaticNoiseGenerator } from "./StaticNoiseGenerator";

export class AudioEngine {
  private audioContext: AudioContext;
  private gainNode: GainNode;
  private shifter: PitchShifter | null = null;
  private _tempo = 1.0;
  private _playing = false;
  private _onEndedCallback: (() => void) | null = null;
  private _progress = 0;
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

      this.shifter = new PitchShifter(
        this.audioContext,
        audioBuffer,
        16384,
        () => {
          this._playing = false;
          this._progress = 0;
          this._onEndedCallback?.();
        }
      );

      this.shifter.tempo = this._tempo;
      this.shifter.pitch = 1;

      this.shifter.on("play", (detail: { percentagePlayed: number }) => {
        this._progress = detail.percentagePlayed / 100;
      });

      this.shifter.connect(this.gainNode);
      this._playing = true;
    } catch (e: unknown) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      throw e;
    }
  }

  private stopPlayback(): void {
    if (this.shifter) {
      this.shifter.disconnect();
      this.shifter.off();
      this.shifter = null;
    }
    this._playing = false;
    this._progress = 0;
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
    this._tempo = Math.max(0.25, Math.min(1.0, tempo));
    if (this.shifter) {
      this.shifter.tempo = this._tempo;
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
    return this._progress;
  }

  isPlaying(): boolean {
    return this._playing;
  }

  onEnded(callback: () => void): void {
    this._onEndedCallback = callback;
  }

  async pause(): Promise<void> {
    if (this._playing) {
      await this.audioContext.suspend();
      this._playing = false;
    }
  }

  async unpause(): Promise<void> {
    await this.ensureRunning();
    if (this.shifter) {
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
