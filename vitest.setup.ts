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

// jsdom doesn't implement HTMLMediaElement playback or srcObject; stub them so
// AudioEngine's MediaStream sink element can be created/played in tests.
if (typeof HTMLMediaElement !== "undefined") {
  HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
  HTMLMediaElement.prototype.pause = vi.fn();
  Object.defineProperty(HTMLMediaElement.prototype, "srcObject", {
    configurable: true,
    get() {
      return this._srcObject ?? null;
    },
    set(value) {
      this._srcObject = value;
    },
  });
}
