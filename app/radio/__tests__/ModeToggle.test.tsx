import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import ModeToggle from "../components/ModeToggle";

describe("ModeToggle", () => {
  it("renders with role='switch'", () => {
    render(<ModeToggle mode="jam" onModeChange={() => {}} disabled={false} />);
    expect(screen.getByRole("switch")).toBeInTheDocument();
  });

  it("aria-checked is false when mode is jam", () => {
    render(<ModeToggle mode="jam" onModeChange={() => {}} disabled={false} />);
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "false");
  });

  it("aria-checked is true when mode is learn", () => {
    render(<ModeToggle mode="learn" onModeChange={() => {}} disabled={false} />);
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true");
  });

  it("calls onModeChange with 'learn' when clicked in jam mode", async () => {
    const onChange = vi.fn();
    render(<ModeToggle mode="jam" onModeChange={onChange} disabled={false} />);

    await userEvent.click(screen.getByRole("switch"));
    expect(onChange).toHaveBeenCalledWith("learn");
  });

  it("calls onModeChange with 'jam' when clicked in learn mode", async () => {
    const onChange = vi.fn();
    render(<ModeToggle mode="learn" onModeChange={onChange} disabled={false} />);

    await userEvent.click(screen.getByRole("switch"));
    expect(onChange).toHaveBeenCalledWith("jam");
  });

  it("does not call onModeChange when disabled", async () => {
    const onChange = vi.fn();
    render(<ModeToggle mode="jam" onModeChange={onChange} disabled={true} />);

    await userEvent.click(screen.getByRole("switch"));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("renders JAM and LEARN labels", () => {
    render(<ModeToggle mode="jam" onModeChange={() => {}} disabled={false} />);
    expect(screen.getByText("JAM")).toBeInTheDocument();
    expect(screen.getByText("LEARN")).toBeInTheDocument();
  });
});
