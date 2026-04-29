declare module "soundtouchjs" {
  export class PitchShifter {
    constructor(
      context: AudioContext,
      buffer: AudioBuffer,
      bufferSize: number,
      onEnd?: () => void
    );
    tempo: number;
    pitch: number;
    rate: number;
    pitchSemitones: number;
    duration: number;
    timePlayed: number;
    formattedDuration: string;
    formattedTimePlayed: string;
    percentagePlayed: number;
    connect(toNode: AudioNode): void;
    disconnect(): void;
    on(
      eventName: string,
      cb: (detail: { timePlayed: number; formattedTimePlayed: string; percentagePlayed: number }) => void
    ): void;
    off(eventName?: string | null): void;
  }

  export class SoundTouch {
    tempo: number;
    rate: number;
    pitch: number;
    pitchSemitones: number;
  }

  export class SimpleFilter {
    constructor(source: WebAudioBufferSource, pipe: SoundTouch, onEnd?: () => void);
    sourcePosition: number;
  }

  export class WebAudioBufferSource {
    constructor(buffer: AudioBuffer);
  }

  export function getWebAudioNode(
    context: AudioContext,
    filter: SimpleFilter,
    onUpdate?: (sourcePosition: number) => void,
    bufferSize?: number
  ): ScriptProcessorNode;
}
