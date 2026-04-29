import { describe, it, expect, vi, beforeEach } from "vitest";
import { StaticNoiseGenerator } from "../audio/StaticNoiseGenerator";

describe("StaticNoiseGenerator", () => {
  let audioContext: AudioContext;
  let gainNode: GainNode;
  let generator: StaticNoiseGenerator;

  beforeEach(() => {
    audioContext = new AudioContext();
    gainNode = audioContext.createGain();
    generator = new StaticNoiseGenerator(audioContext, gainNode);
  });

  it("should create an instance", () => {
    expect(generator).toBeInstanceOf(StaticNoiseGenerator);
  });

  it("should create a buffer source and connect to gain node on play", async () => {
    const createBufferSpy = vi.spyOn(audioContext, "createBuffer");
    const createSourceSpy = vi.spyOn(audioContext, "createBufferSource");

    const promise = generator.play(100);

    expect(createBufferSpy).toHaveBeenCalledWith(
      1,
      expect.any(Number),
      audioContext.sampleRate
    );
    expect(createSourceSpy).toHaveBeenCalled();

    await promise;
  });

  it("should fill buffer with random noise samples", () => {
    const mockChannelData = new Float32Array(4410);
    const createBufferSpy = vi
      .spyOn(audioContext, "createBuffer")
      .mockReturnValue({
        numberOfChannels: 1,
        length: 4410,
        sampleRate: 44100,
        duration: 0.1,
        getChannelData: vi.fn().mockReturnValue(mockChannelData),
        copyFromChannel: vi.fn(),
        copyToChannel: vi.fn(),
      });

    generator.play(100);

    expect(createBufferSpy).toHaveBeenCalled();
    const hasNonZero = mockChannelData.some((v) => v !== 0);
    expect(hasNonZero).toBe(true);
  });

  it("should resolve the promise after the specified duration", async () => {
    vi.useFakeTimers();

    const promise = generator.play(400);
    let resolved = false;
    promise.then(() => {
      resolved = true;
    });

    await vi.advanceTimersByTimeAsync(399);
    expect(resolved).toBe(false);

    await vi.advanceTimersByTimeAsync(1);
    expect(resolved).toBe(true);

    vi.useRealTimers();
  });
});
