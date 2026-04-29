import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import SpeedSlider from "../components/SpeedSlider";

describe("SpeedSlider", () => {
  it("should render a range slider and 4 preset buttons", () => {
    render(<SpeedSlider speed={1} onSpeedChange={vi.fn()} disabled={false} />);
    expect(screen.getByRole("slider")).toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(4);
  });

  it("should display correct preset labels", () => {
    render(<SpeedSlider speed={1} onSpeedChange={vi.fn()} disabled={false} />);
    expect(screen.getByText(".25")).toBeInTheDocument();
    expect(screen.getByText(".5")).toBeInTheDocument();
    expect(screen.getByText(".75")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("should mark active preset button with aria-checked", () => {
    render(<SpeedSlider speed={0.75} onSpeedChange={vi.fn()} disabled={false} />);
    expect(screen.getByRole("radio", { name: "0.75x" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("radio", { name: "1x" })).toHaveAttribute("aria-checked", "false");
  });

  it("should call onSpeedChange with preset value on button click", async () => {
    const onSpeedChange = vi.fn();
    render(<SpeedSlider speed={1} onSpeedChange={onSpeedChange} disabled={false} />);

    await userEvent.click(screen.getByText(".5"));
    expect(onSpeedChange).toHaveBeenCalledWith(0.5);
  });

  it("should display current speed value from slider", () => {
    render(<SpeedSlider speed={0.63} onSpeedChange={vi.fn()} disabled={false} />);
    expect(screen.getByText("0.63x")).toBeInTheDocument();
  });

  it("should have no active preset when speed is between presets", () => {
    render(<SpeedSlider speed={0.63} onSpeedChange={vi.fn()} disabled={false} />);
    const buttons = screen.getAllByRole("radio");
    buttons.forEach((button) => {
      expect(button).toHaveAttribute("aria-checked", "false");
    });
  });

  it("should disable slider and all buttons when disabled", () => {
    render(<SpeedSlider speed={1} onSpeedChange={vi.fn()} disabled={true} />);
    expect(screen.getByRole("slider")).toBeDisabled();
    screen.getAllByRole("radio").forEach((button) => {
      expect(button).toBeDisabled();
    });
  });

  it("should have correct min and max on slider", () => {
    render(<SpeedSlider speed={0.5} onSpeedChange={vi.fn()} disabled={false} />);
    const slider = screen.getByRole("slider");
    expect(slider).toHaveAttribute("min", "0.25");
    expect(slider).toHaveAttribute("max", "1");
  });
});
