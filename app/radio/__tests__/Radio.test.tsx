import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Radio from "../Radio";

vi.mock("soundtouchjs", () => ({
  PitchShifter: class {
    tempo = 1;
    pitch = 1;
    duration = 120;
    connect = vi.fn();
    disconnect = vi.fn();
    on = vi.fn();
    off = vi.fn();
  },
}));

describe("Radio", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should show loading spinner while manifest is fetching", () => {
    vi.spyOn(global, "fetch").mockImplementation(() => new Promise(() => {}));

    render(<Radio />);
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByLabelText("Loading")).toBeInTheDocument();
  });

  it("should render radio facade after manifest loads", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve([
          {
            title: "Test Tune",
            artist: "Test Artist",
            key: "G",
            url: "tunes/test.mp3",
            duration: 120,
            confidence: 0.9,
            format: "mp3",
          },
        ]),
    } as Response);

    render(<Radio />);

    await waitFor(() => {
      expect(screen.getByTestId("radio-facade")).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: /power/i })).toBeInTheDocument();
    expect(screen.getByTestId("station-selector")).toBeInTheDocument();
    expect(screen.getByTestId("volume-slider")).toBeInTheDocument();
    expect(screen.getByTestId("speed-selector")).toBeInTheDocument();
    expect(screen.getAllByRole("slider")).toHaveLength(2);
  });

  it("should show error message on fetch failure", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: false,
      status: 500,
    } as Response);

    render(<Radio />);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
  });

  it("should render mode toggle, pause, and restart buttons after manifest loads", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve([
          {
            title: "Test Tune",
            artist: "Test Artist",
            key: "G",
            url: "tunes/test.mp3",
            duration: 120,
            confidence: 0.9,
            format: "mp3",
          },
        ]),
    } as Response);

    render(<Radio />);

    await waitFor(() => {
      expect(screen.getByTestId("radio-facade")).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: /switch to/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /pause|resume/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /restart/i })).toBeInTheDocument();
  });
});
