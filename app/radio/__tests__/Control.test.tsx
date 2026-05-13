import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import Control from "../components/Control";

describe("Control", () => {
  it("renders a button element", () => {
    render(
      <Control onClick={vi.fn()} aria-label="Power">
        <span>icon</span>
      </Control>
    );
    expect(screen.getByRole("button", { name: "Power" })).toBeInTheDocument();
  });

  it("calls onClick when clicked", async () => {
    const onClick = vi.fn();
    render(
      <Control onClick={onClick} aria-label="Test">
        <span>icon</span>
      </Control>
    );
    await userEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("does not call onClick when disabled", async () => {
    const onClick = vi.fn();
    render(
      <Control onClick={onClick} aria-label="Test" disabled>
        <span>icon</span>
      </Control>
    );
    await userEvent.click(screen.getByRole("button"));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("adds active class when active", () => {
    render(
      <Control onClick={vi.fn()} aria-label="Power" active>
        <span>icon</span>
      </Control>
    );
    expect(screen.getByRole("button")).toHaveClass("control--active");
  });

  it("does not add active class when inactive", () => {
    render(
      <Control onClick={vi.fn()} aria-label="Power">
        <span>icon</span>
      </Control>
    );
    expect(screen.getByRole("button")).not.toHaveClass("control--active");
  });

  it("renders children", () => {
    render(
      <Control onClick={vi.fn()} aria-label="Test">
        <span data-testid="child">content</span>
      </Control>
    );
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("has base control class", () => {
    render(
      <Control onClick={vi.fn()} aria-label="Test">
        <span>icon</span>
      </Control>
    );
    expect(screen.getByRole("button")).toHaveClass("control");
  });
});
