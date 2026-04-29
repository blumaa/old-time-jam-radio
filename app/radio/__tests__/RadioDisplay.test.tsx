import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
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
});
