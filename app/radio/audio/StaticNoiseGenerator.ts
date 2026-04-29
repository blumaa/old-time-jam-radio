export class StaticNoiseGenerator {
  private audioContext: AudioContext;
  private gainNode: GainNode;

  constructor(audioContext: AudioContext, gainNode: GainNode) {
    this.audioContext = audioContext;
    this.gainNode = gainNode;
  }

  play(durationMs: number): Promise<void> {
    const sampleRate = this.audioContext.sampleRate;
    const length = Math.floor((durationMs / 1000) * sampleRate);
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const channelData = buffer.getChannelData(0);

    const amplitude = 0.075;
    const fadeLength = Math.floor(sampleRate * 0.04);

    for (let i = 0; i < length; i++) {
      let envelope = 1;
      if (i < fadeLength) {
        envelope = i / fadeLength;
      } else if (i > length - fadeLength) {
        envelope = (length - i) / fadeLength;
      }
      channelData[i] = (Math.random() * 2 - 1) * amplitude * envelope;
    }

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.gainNode);
    source.start();

    return new Promise((resolve) => {
      setTimeout(() => {
        source.stop();
        source.disconnect();
        resolve();
      }, durationMs);
    });
  }
}
