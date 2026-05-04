import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useShareTune } from "../hooks/useShareTune";
import type { Tune } from "../types";

const testManifest: Tune[] = [
  {
    title: "Salt Creek",
    artist: "Brad Leftwich",
    key: "A",
    url: "Salt Creek.mp3",
    duration: 120,
    confidence: 0.9,
    format: "mp3",
  },
  {
    title: "Cluck Old Hen",
    artist: "Dan Gellert",
    key: "D",
    url: "Cluck Old Hen.m4a",
    duration: 90,
    confidence: 0.85,
    format: "m4a",
  },
];

describe("useShareTune", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.history.replaceState({}, "", "/");
  });

  describe("reading shared tune from URL", () => {
    it("should return null when no tune param in URL", () => {
      const { result } = renderHook(() => useShareTune(testManifest));
      expect(result.current.sharedTune).toBeNull();
    });

    it("should resolve tune from URL param", () => {
      window.history.replaceState({}, "", "/?tune=Salt+Creek.mp3");
      const { result } = renderHook(() => useShareTune(testManifest));
      expect(result.current.sharedTune).toEqual(testManifest[0]);
    });

    it("should return null for unknown tune param", () => {
      window.history.replaceState({}, "", "/?tune=nonexistent.mp3");
      const { result } = renderHook(() => useShareTune(testManifest));
      expect(result.current.sharedTune).toBeNull();
    });

    it("should return null when manifest is empty", () => {
      window.history.replaceState({}, "", "/?tune=Salt+Creek.mp3");
      const { result } = renderHook(() => useShareTune([]));
      expect(result.current.sharedTune).toBeNull();
    });
  });

  describe("building share URL", () => {
    it("should build a share URL with encoded tune filename", () => {
      const { result } = renderHook(() => useShareTune(testManifest));
      const url = result.current.buildShareUrl(testManifest[0]);
      expect(url).toContain("?tune=Salt+Creek.mp3");
    });

    it("should use current origin in share URL", () => {
      const { result } = renderHook(() => useShareTune(testManifest));
      const url = result.current.buildShareUrl(testManifest[0]);
      expect(url).toMatch(/^https?:\/\//);
      expect(url).toContain(window.location.origin);
    });
  });

  describe("copying to clipboard", () => {
    it("should copy share URL to clipboard and return true", async () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, { clipboard: { writeText } });

      const { result } = renderHook(() => useShareTune(testManifest));

      let copied: boolean = false;
      await act(async () => {
        copied = await result.current.copyShareLink(testManifest[0]);
      });

      expect(copied).toBe(true);
      expect(writeText).toHaveBeenCalledWith(
        expect.stringContaining("?tune=Salt+Creek.mp3")
      );
    });

    it("should return false when clipboard write fails", async () => {
      const writeText = vi.fn().mockRejectedValue(new Error("denied"));
      Object.assign(navigator, { clipboard: { writeText } });

      const { result } = renderHook(() => useShareTune(testManifest));

      let copied: boolean = true;
      await act(async () => {
        copied = await result.current.copyShareLink(testManifest[0]);
      });

      expect(copied).toBe(false);
    });
  });

  describe("clearing shared tune param", () => {
    it("should remove tune param from URL", () => {
      window.history.replaceState({}, "", "/?tune=Salt+Creek.mp3");
      const { result } = renderHook(() => useShareTune(testManifest));
      expect(result.current.sharedTune).not.toBeNull();

      act(() => {
        result.current.clearShareParam();
      });

      expect(window.location.search).toBe("");
    });
  });
});
