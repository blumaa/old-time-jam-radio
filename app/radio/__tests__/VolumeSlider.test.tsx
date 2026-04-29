import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import VolumeSlider from "../components/VolumeSlider";

describe("VolumeSlider", () => {
  it("should render a range input", () => {
    render(<VolumeSlider volume={0.7} onVolumeChange={() => {}} disabled={false} />);

    const slider = screen.getByRole("slider");
    expect(slider).toBeInTheDocument();
    expect(slider).toHaveAttribute("min", "0");
    expect(slider).toHaveAttribute("max", "1");
    expect(slider).toHaveAttribute("step", "0.01");
  });

  it("should display volume as percentage", () => {
    render(<VolumeSlider volume={0.7} onVolumeChange={() => {}} disabled={false} />);

    expect(screen.getByText("70%")).toBeInTheDocument();
  });

  it("should fire onVolumeChange on input", () => {
    const onChange = vi.fn();
    render(<VolumeSlider volume={0.5} onVolumeChange={onChange} disabled={false} />);

    fireEvent.input(screen.getByRole("slider"), { target: { value: "0.8" } });
    expect(onChange).toHaveBeenCalledWith(0.8);
  });

  it("should be disabled when disabled prop is true", () => {
    render(<VolumeSlider volume={0.5} onVolumeChange={() => {}} disabled={true} />);

    expect(screen.getByRole("slider")).toBeDisabled();
  });

  it("should show VOLUME label", () => {
    render(<VolumeSlider volume={0.5} onVolumeChange={() => {}} disabled={false} />);

    expect(screen.getByText("Volume")).toBeInTheDocument();
  });
});
