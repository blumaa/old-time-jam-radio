import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import Control from "../components/Control";

describe("Control", () => {
  describe("button variant", () => {
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

  describe("rocker variant", () => {
    it("renders with role switch", () => {
      render(
        <Control
          variant="rocker"
          checked={false}
          onChange={vi.fn()}
          aria-label="Mode"
          labels={["Jam", "Learn"]}
        />
      );
      expect(screen.getByRole("switch", { name: "Mode" })).toBeInTheDocument();
    });

    it("aria-checked is false when unchecked", () => {
      render(
        <Control
          variant="rocker"
          checked={false}
          onChange={vi.fn()}
          aria-label="Mode"
          labels={["Jam", "Learn"]}
        />
      );
      expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "false");
    });

    it("aria-checked is true when checked", () => {
      render(
        <Control
          variant="rocker"
          checked={true}
          onChange={vi.fn()}
          aria-label="Mode"
          labels={["Jam", "Learn"]}
        />
      );
      expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true");
    });

    it("calls onChange with toggled value on click", async () => {
      const onChange = vi.fn();
      render(
        <Control
          variant="rocker"
          checked={false}
          onChange={onChange}
          aria-label="Mode"
          labels={["Jam", "Learn"]}
        />
      );
      await userEvent.click(screen.getByRole("switch"));
      expect(onChange).toHaveBeenCalledWith(true);
    });

    it("does not call onChange when disabled", async () => {
      const onChange = vi.fn();
      render(
        <Control
          variant="rocker"
          checked={false}
          onChange={onChange}
          aria-label="Mode"
          labels={["Jam", "Learn"]}
          disabled
        />
      );
      await userEvent.click(screen.getByRole("switch"));
      expect(onChange).not.toHaveBeenCalled();
    });

    it("renders both labels", () => {
      render(
        <Control
          variant="rocker"
          checked={false}
          onChange={vi.fn()}
          aria-label="Mode"
          labels={["Jam", "Learn"]}
        />
      );
      expect(screen.getByText("Jam")).toBeInTheDocument();
      expect(screen.getByText("Learn")).toBeInTheDocument();
    });

    it("has rocker class", () => {
      render(
        <Control
          variant="rocker"
          checked={false}
          onChange={vi.fn()}
          aria-label="Mode"
          labels={["Jam", "Learn"]}
        />
      );
      expect(screen.getByRole("switch")).toHaveClass("control--rocker");
    });
  });
});
