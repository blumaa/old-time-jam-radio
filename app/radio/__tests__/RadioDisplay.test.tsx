import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

  it("in learn mode idle, shows 'Find a tune' prompt", () => {
    render(
      <RadioDisplay
        tuneName={null}
        artist={null}
        stationKey={null}
        speed={1.0}
        progress={0}
        isPoweredOn={true}
        mode="learn"
      />
    );

    expect(screen.getByText("Find a tune")).toBeInTheDocument();
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

  it("in learn mode, clicking display calls onDisplayClick", async () => {
    const onDisplayClick = vi.fn();
    render(
      <RadioDisplay
        tuneName={null}
        artist={null}
        stationKey={null}
        speed={1.0}
        progress={0}
        isPoweredOn={true}
        mode="learn"
        onDisplayClick={onDisplayClick}
      />
    );

    await userEvent.click(screen.getByTestId("radio-display"));
    expect(onDisplayClick).toHaveBeenCalledOnce();
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
