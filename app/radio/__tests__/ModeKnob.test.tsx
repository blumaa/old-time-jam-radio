import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import type { ComponentProps } from "react";
import ModeKnob from "../components/ModeKnob";

function renderKnob(props: Partial<ComponentProps<typeof ModeKnob>> = {}) {
  const onModeChange = vi.fn();
  render(<ModeKnob mode="learn" onModeChange={onModeChange} {...props} />);
  return { onModeChange };
}

describe("ModeKnob", () => {
  it("renders a radio for each mode", () => {
    renderKnob();
    expect(screen.getByRole("radio", { name: "Jam" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Learn" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Listen" })).toBeInTheDocument();
  });

  it("marks the current mode as checked", () => {
    renderKnob({ mode: "listen" });
    expect(screen.getByRole("radio", { name: "Listen" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Jam" })).not.toBeChecked();
  });

  it("selects a mode when its label is clicked", () => {
    const { onModeChange } = renderKnob({ mode: "learn" });
    fireEvent.click(screen.getByRole("radio", { name: "Listen" }));
    expect(onModeChange).toHaveBeenCalledWith("listen");
  });

  it("tapping the dial advances to the next mode", () => {
    const { onModeChange } = renderKnob({ mode: "learn" });
    const dial = screen.getByTestId("mode-knob-dial");
    fireEvent.pointerDown(dial, { pointerId: 1, clientX: 100, clientY: 100 });
    fireEvent.pointerUp(dial, { pointerId: 1, clientX: 100, clientY: 100 });
    expect(onModeChange).toHaveBeenCalledWith("listen");
  });

  it("rotates the pointer to the current mode's detent", () => {
    renderKnob({ mode: "jam" });
    const wrap = screen
      .getByTestId("mode-knob-dial")
      .querySelector(".mode-knob__pointer-wrap") as HTMLElement;
    expect(wrap.style.transform).toBe("rotate(-52deg)");
  });

  it("moves selection with arrow keys", () => {
    const { onModeChange } = renderKnob({ mode: "learn" });
    const dial = screen.getByTestId("mode-knob-dial");
    fireEvent.keyDown(dial, { key: "ArrowRight" });
    expect(onModeChange).toHaveBeenCalledWith("listen");
    fireEvent.keyDown(dial, { key: "ArrowLeft" });
    expect(onModeChange).toHaveBeenCalledWith("jam");
  });

  it("disables interaction when disabled", () => {
    const { onModeChange } = renderKnob({ disabled: true });
    fireEvent.click(screen.getByRole("radio", { name: "Jam" }));
    expect(screen.getByRole("radio", { name: "Jam" })).toBeDisabled();
    expect(onModeChange).not.toHaveBeenCalled();
  });
});
