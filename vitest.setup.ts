/// <reference types="vitest/globals" />
import "@testing-library/jest-dom/vitest";

class MockGainNode {
  gain = { value: 1, setValueAtTime: vi.fn() };
  connect = vi.fn().mockReturnThis();
  disconnect = vi.fn();
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

class MockAudioContext {
  state = "running";
  sampleRate = 44100;
  destination = {};

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
  resume() {
    return Promise.resolve();
  }
  close() {
    return Promise.resolve();
  }
}

globalThis.AudioContext = MockAudioContext as unknown as typeof AudioContext;
(globalThis as Record<string, unknown>).webkitAudioContext = MockAudioContext;
