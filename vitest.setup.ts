/// <reference types="vitest/globals" />
import "@testing-library/jest-dom/vitest";

class MockGainNode {
  gain = { value: 1, setValueAtTime: vi.fn() };
  connect = vi.fn().mockReturnThis();
  disconnect = vi.fn();
}

class MockAudioParam {
  value: number;
  constructor(defaultValue = 1) {
    this.value = defaultValue;
  }
  setValueAtTime = vi.fn();
  linearRampToValueAtTime = vi.fn();
  exponentialRampToValueAtTime = vi.fn();
}

class MockAudioBuffer {
  numberOfChannels = 1;
  length = 44100;
  sampleRate = 44100;
  duration = 1;
  getChannelData = vi.fn().mockReturnValue(new Float32Array(44100));
}

class MockAudioBufferSourceNode {
  buffer: MockAudioBuffer | null = null;
  playbackRate = new MockAudioParam(1);
  connect = vi.fn().mockReturnThis();
  disconnect = vi.fn();
  start = vi.fn();
  stop = vi.fn();
  onended: (() => void) | null = null;
}

class MockScriptProcessorNode {
  connect = vi.fn().mockReturnThis();
  disconnect = vi.fn();
  onaudioprocess: ((e: unknown) => void) | null = null;
}

class MockAudioWorkletNode {
  _parameters = new Map<string, MockAudioParam>([
    ["pitch", new MockAudioParam(1)],
    ["tempo", new MockAudioParam(1)],
    ["rate", new MockAudioParam(1)],
    ["pitchSemitones", new MockAudioParam(0)],
    ["playbackRate", new MockAudioParam(1)],
  ]);
  get parameters() {
    return this._parameters;
  }
  connect = vi.fn().mockReturnThis();
  disconnect = vi.fn();
  constructor() {}
}

globalThis.AudioWorkletNode = MockAudioWorkletNode as unknown as typeof AudioWorkletNode;

class MockAudioContext {
  state = "running";
  sampleRate = 44100;
  currentTime = 0;
  destination = {};
  audioWorklet = {
    addModule: vi.fn().mockResolvedValue(undefined),
  };

  createGain() {
    return new MockGainNode();
  }
  createBufferSource() {
    return new MockAudioBufferSourceNode();
  }
  createMediaElementSource() {
    return { connect: vi.fn().mockReturnThis(), disconnect: vi.fn() };
  }
  createScriptProcessor() {
    return new MockScriptProcessorNode();
  }
  createBuffer(channels: number, length: number, sampleRate: number) {
    const buffer = new MockAudioBuffer();
    buffer.numberOfChannels = channels;
    buffer.length = length;
    buffer.sampleRate = sampleRate;
    buffer.duration = length / sampleRate;
    return buffer;
  }
  decodeAudioData() {
    return Promise.resolve(new MockAudioBuffer());
  }
  suspend() {
    this.state = "suspended";
    return Promise.resolve();
  }
  resume() {
    this.state = "running";
    return Promise.resolve();
  }
  close() {
    return Promise.resolve();
  }
}

globalThis.AudioContext = MockAudioContext as unknown as typeof AudioContext;
(globalThis as Record<string, unknown>).webkitAudioContext = MockAudioContext;

// jsdom doesn't implement HTMLMediaElement playback; stub it so AudioEngine's
// <audio> source element behaves like real media: play()/pause() flip `paused`
// and fire the matching events, and duration/currentTime/playbackRate are
// controllable from tests.
if (typeof HTMLMediaElement !== "undefined") {
  type MockMedia = HTMLMediaElement & Record<string, unknown>;

  HTMLMediaElement.prototype.play = vi.fn(function (this: MockMedia) {
    this._paused = false;
    this.dispatchEvent(new Event("play"));
    return Promise.resolve();
  });
  HTMLMediaElement.prototype.pause = vi.fn(function (this: MockMedia) {
    this._paused = true;
    this.dispatchEvent(new Event("pause"));
  });
  HTMLMediaElement.prototype.load = vi.fn();

  const accessor = (
    name: string,
    backing: string,
    fallback: unknown
  ): void => {
    Object.defineProperty(HTMLMediaElement.prototype, name, {
      configurable: true,
      get(this: MockMedia) {
        return this[backing] ?? fallback;
      },
      set(this: MockMedia, value: unknown) {
        this[backing] = value;
      },
    });
  };

  Object.defineProperty(HTMLMediaElement.prototype, "paused", {
    configurable: true,
    get(this: MockMedia) {
      return (this._paused as boolean) ?? true;
    },
  });
  accessor("duration", "_duration", NaN);
  accessor("currentTime", "_currentTime", 0);
  accessor("playbackRate", "_playbackRate", 1);
}
