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

  async loadAndPlay(url: string): Promise<void> {
    this.stop();

    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

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
    await this.audioContext.resume();
    this._playing = true;
  }

  stop(): void {
    if (this.shifter) {
      this.shifter.disconnect();
      this.shifter.off();
      this.shifter = null;
    }
    this._playing = false;
    this._progress = 0;
  }

  async playStaticBurst(durationMs = 400): Promise<void> {
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

  async resume(): Promise<void> {
    await this.audioContext.resume();
  }

  destroy(): void {
    this.stop();
    this.audioContext.close();
  }
}
