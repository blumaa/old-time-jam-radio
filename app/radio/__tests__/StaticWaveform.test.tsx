import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import StaticWaveform from "../components/StaticWaveform";

const mockCtx = {
  clearRect: vi.fn(),
  fillRect: vi.fn(),
  fillStyle: "",
};

describe("StaticWaveform", () => {
  beforeEach(() => {
    vi.spyOn(window, "requestAnimationFrame").mockImplementation(() => {
      return Math.random();
    });
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      mockCtx as unknown as CanvasRenderingContext2D
    );
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renders a canvas element", () => {
    render(<StaticWaveform />);
    const canvas = screen.getByTestId("static-waveform");
    expect(canvas.tagName).toBe("CANVAS");
  });

  it("applies className prop", () => {
    render(<StaticWaveform className="radio-display__static-waveform" />);
    const canvas = screen.getByTestId("static-waveform");
    expect(canvas).toHaveClass("radio-display__static-waveform");
  });

  it("starts animation loop on mount", () => {
    render(<StaticWaveform />);
    expect(window.requestAnimationFrame).toHaveBeenCalled();
  });

  it("cancels animation loop on unmount", () => {
    const { unmount } = render(<StaticWaveform />);
    unmount();
    expect(window.cancelAnimationFrame).toHaveBeenCalled();
  });
});
