import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import RadioDisplay from "../components/RadioDisplay";

describe("RadioDisplay", () => {
  it("should show tune name and artist when powered on", () => {
    render(
      <RadioDisplay
        tuneName="Turkey in the Straw"
        artist="Dan Gellert"
        stationKey="G"
        speed={0.75}
        progress={0.5}
        isPoweredOn={true}
      />
    );

    expect(screen.getByText(/Turkey in the Straw/)).toBeInTheDocument();
    expect(screen.getByText(/Dan Gellert/)).toBeInTheDocument();
  });

  it("should show tune name before artist with separator", () => {
    render(
      <RadioDisplay
        tuneName="Cluck Old Hen"
        artist="Brad Leftwich"
        stationKey="G"
        speed={1.0}
        progress={0}
        isPoweredOn={true}
      />
    );

    const marquee = screen.getByTestId("radio-marquee");
    expect(marquee.textContent).toContain("Cluck Old Hen");
    expect(marquee.textContent).toContain("Brad Leftwich");
    const text = marquee.textContent ?? "";
    expect(text.indexOf("Cluck Old Hen")).toBeLessThan(text.indexOf("Brad Leftwich"));
  });

  it("should show only tune name when artist is null", () => {
    render(
      <RadioDisplay
        tuneName="Salt Creek"
        artist={null}
        stationKey="A"
        speed={1.0}
        progress={0}
        isPoweredOn={true}
      />
    );

    const marquee = screen.getByTestId("radio-marquee");
    expect(marquee.textContent).toContain("Salt Creek");
    expect(marquee.textContent).not.toContain("--");
  });

  it("should show station key", () => {
    render(
      <RadioDisplay
        tuneName="Salt Creek"
        artist="Traditional"
        stationKey="A"
        speed={1.0}
        progress={0}
        isPoweredOn={true}
      />
    );

    expect(screen.getByText("A")).toBeInTheDocument();
  });

  it("should show speed value", () => {
    render(
      <RadioDisplay
        tuneName="Salt Creek"
        artist="Traditional"
        stationKey="A"
        speed={0.5}
        progress={0}
        isPoweredOn={true}
      />
    );

    expect(screen.getByText("0.50x")).toBeInTheDocument();
  });

  it("should be dark when powered off", () => {
    render(
      <RadioDisplay
        tuneName={null}
        artist={null}
        stationKey={null}
        speed={1.0}
        progress={0}
        isPoweredOn={false}
      />
    );

    const display = screen.getByTestId("radio-display");
    expect(display).toHaveClass("radio-display--off");
  });

  it("should render progress bar", () => {
    render(
      <RadioDisplay
        tuneName="Test"
        artist="Test Artist"
        stationKey="G"
        speed={1.0}
        progress={0.6}
        isPoweredOn={true}
      />
    );

    const progress = screen.getByTestId("radio-progress");
    expect(progress).toBeInTheDocument();
  });

  it("should show 'No signal...' when tuneName is null", () => {
    render(
      <RadioDisplay
        tuneName={null}
        artist={null}
        stationKey="G"
        speed={1.0}
        progress={0}
        isPoweredOn={true}
      />
    );

    const marquee = screen.getByTestId("radio-marquee");
    expect(marquee.textContent).toContain("No signal...");
  });

  it("in learn mode playing, shows loop icon and play count", () => {
    render(
      <RadioDisplay
        tuneName="Sally Ann"
        artist="Highwoods"
        stationKey="A"
        speed={0.5}
        progress={0.3}
        isPoweredOn={true}
        mode="learn"
        playCount={3}
      />
    );

    expect(screen.getByText(/Sally Ann/)).toBeInTheDocument();
    expect(screen.getByTestId("loop-indicator")).toHaveTextContent("×3");
  });

  it("should show static waveform when isPlayingStatic is true", () => {
    render(
      <RadioDisplay
        tuneName={null}
        artist={null}
        stationKey="G"
        speed={1.0}
        progress={0}
        isPoweredOn={true}
        isPlayingStatic={true}
      />
    );

    expect(screen.getByTestId("static-waveform")).toBeInTheDocument();
    expect(screen.getByTestId("radio-marquee")).toBeInTheDocument();
  });

  it("should show marquee text when isPlayingStatic is false", () => {
    render(
      <RadioDisplay
        tuneName="Salt Creek"
        artist="Traditional"
        stationKey="A"
        speed={1.0}
        progress={0}
        isPoweredOn={true}
        isPlayingStatic={false}
      />
    );

    expect(screen.queryByTestId("static-waveform")).not.toBeInTheDocument();
    expect(screen.getByTestId("radio-marquee")).toBeInTheDocument();
    expect(screen.getByText(/Salt Creek/)).toBeInTheDocument();
  });

  describe("progress bar seek", () => {
    it("should call onSeek with click fraction", () => {
      const onSeek = vi.fn();
      render(
        <RadioDisplay
          tuneName="Salt Creek"
          artist="Traditional"
          stationKey="A"
          speed={1.0}
          progress={0.3}
          isPoweredOn={true}
          onSeek={onSeek}
        />
      );

      const progressBar = screen.getByTestId("radio-progress");
      Object.defineProperty(progressBar, "getBoundingClientRect", {
        value: () => ({ left: 0, width: 200, top: 0, bottom: 10, right: 200, height: 10 }),
      });

      fireEvent.click(progressBar, { clientX: 100 });
      expect(onSeek).toHaveBeenCalledWith(0.5);
    });

    it("should not call onSeek when prop is not provided", () => {
      render(
        <RadioDisplay
          tuneName="Salt Creek"
          artist="Traditional"
          stationKey="A"
          speed={1.0}
          progress={0.3}
          isPoweredOn={true}
        />
      );

      const progressBar = screen.getByTestId("radio-progress");
      expect(progressBar).not.toHaveAttribute("role");
      expect(progressBar).not.toHaveClass("radio-display__progress--seekable");
    });

    it("should add seekable class and slider role when onSeek provided", () => {
      const onSeek = vi.fn();
      render(
        <RadioDisplay
          tuneName="Salt Creek"
          artist="Traditional"
          stationKey="A"
          speed={1.0}
          progress={0.5}
          isPoweredOn={true}
          onSeek={onSeek}
        />
      );

      const progressBar = screen.getByTestId("radio-progress");
      expect(progressBar).toHaveClass("radio-display__progress--seekable");
      expect(progressBar).toHaveAttribute("role", "slider");
      expect(progressBar).toHaveAttribute("aria-valuenow", "50");
    });

    it("should clamp click fraction to [0, 1]", () => {
      const onSeek = vi.fn();
      render(
        <RadioDisplay
          tuneName="Salt Creek"
          artist="Traditional"
          stationKey="A"
          speed={1.0}
          progress={0.3}
          isPoweredOn={true}
          onSeek={onSeek}
        />
      );

      const progressBar = screen.getByTestId("radio-progress");
      Object.defineProperty(progressBar, "getBoundingClientRect", {
        value: () => ({ left: 100, width: 200, top: 0, bottom: 10, right: 300, height: 10 }),
      });

      fireEvent.click(progressBar, { clientX: 50 });
      expect(onSeek).toHaveBeenCalledWith(0);

      onSeek.mockClear();
      fireEvent.click(progressBar, { clientX: 400 });
      expect(onSeek).toHaveBeenCalledWith(1);
    });
  });

  it("in jam mode with default new props, renders identically to existing behavior", () => {
    render(
      <RadioDisplay
        tuneName="Cluck Old Hen"
        artist="Brad Leftwich"
        stationKey="D"
        speed={1.0}
        progress={0.5}
        isPoweredOn={true}
        mode="jam"
      />
    );

    expect(screen.getByText(/Cluck Old Hen/)).toBeInTheDocument();
    expect(screen.queryByText("Find a tune")).not.toBeInTheDocument();
    expect(screen.queryByTestId("loop-indicator")).not.toBeInTheDocument();
  });
});
