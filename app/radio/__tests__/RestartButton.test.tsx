import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import RestartButton from "../components/RestartButton";

describe("RestartButton", () => {
  it("renders a button with aria-label 'Restart'", () => {
    render(<RestartButton onClick={() => {}} disabled={false} />);
    expect(screen.getByRole("button", { name: "Restart" })).toBeInTheDocument();
  });

  it("calls onClick when clicked", async () => {
    const onClick = vi.fn();
    render(<RestartButton onClick={onClick} disabled={false} />);

    await userEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("does not call onClick when disabled", async () => {
    const onClick = vi.fn();
    render(<RestartButton onClick={onClick} disabled={true} />);

    await userEvent.click(screen.getByRole("button"));
    expect(onClick).not.toHaveBeenCalled();
  });
});
