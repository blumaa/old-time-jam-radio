import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import PowerButton from "../components/PowerButton";

describe("PowerButton", () => {
  it("should render a button", () => {
    render(<PowerButton isPoweredOn={false} onClick={vi.fn()} />);
    expect(screen.getByRole("button", { name: /power/i })).toBeInTheDocument();
  });

  it("should call onClick when clicked", async () => {
    const onClick = vi.fn();
    render(<PowerButton isPoweredOn={false} onClick={onClick} />);

    await userEvent.click(screen.getByRole("button", { name: /power/i }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("should indicate powered on state", () => {
    render(<PowerButton isPoweredOn={true} onClick={vi.fn()} />);
    const button = screen.getByRole("button", { name: /power/i });
    expect(button).toHaveClass("power-button--on");
  });

  it("should indicate powered off state", () => {
    render(<PowerButton isPoweredOn={false} onClick={vi.fn()} />);
    const button = screen.getByRole("button", { name: /power/i });
    expect(button).not.toHaveClass("power-button--on");
  });
});
