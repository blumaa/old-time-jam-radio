import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import PauseButton from "../components/PauseButton";

describe("PauseButton", () => {
  it("renders a button with aria-label 'Pause' when not paused", () => {
    render(<PauseButton isPaused={false} onClick={() => {}} disabled={false} />);
    expect(screen.getByRole("button", { name: "Pause" })).toBeInTheDocument();
  });

  it("renders with aria-label 'Resume' when paused", () => {
    render(<PauseButton isPaused={true} onClick={() => {}} disabled={false} />);
    expect(screen.getByRole("button", { name: "Resume" })).toBeInTheDocument();
  });

  it("calls onClick when clicked", async () => {
    const onClick = vi.fn();
    render(<PauseButton isPaused={false} onClick={onClick} disabled={false} />);

    await userEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("does not call onClick when disabled", async () => {
    const onClick = vi.fn();
    render(<PauseButton isPaused={false} onClick={onClick} disabled={true} />);

    await userEvent.click(screen.getByRole("button"));
    expect(onClick).not.toHaveBeenCalled();
  });
});
