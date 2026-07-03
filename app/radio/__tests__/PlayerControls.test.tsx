import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import PlayerControls from "../components/PlayerControls";

const defaultProps = {
  isPoweredOn: true,
  onPowerToggle: vi.fn(),
  isPaused: false,
  onPause: vi.fn(),
  onSearch: vi.fn(),
  onQueue: vi.fn(),
  onRestart: vi.fn(),
  mode: "learn" as const,
  onModeChange: vi.fn(),
  hasCurrentTune: true,
};

describe("PlayerControls", () => {
  it("renders 5 button controls and a mode knob", () => {
    render(<PlayerControls {...defaultProps} />);
    expect(screen.getByRole("button", { name: "Power" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Search tunes" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Queue" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Pause" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Restart" })).toBeInTheDocument();
    expect(screen.getByRole("radiogroup", { name: "Mode" })).toBeInTheDocument();
  });

  it("renders mode knob before button row", () => {
    const { container } = render(<PlayerControls {...defaultProps} />);
    const knob = container.querySelector(".mode-knob");
    const buttonRow = container.querySelector(".player-controls__buttons");
    expect(knob).toBeTruthy();
    expect(buttonRow).toBeTruthy();
    expect(knob!.compareDocumentPosition(buttonRow!)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it("renders transport buttons in correct DOM order", () => {
    render(<PlayerControls {...defaultProps} />);
    const buttons = screen.getAllByRole("button");
    const labels = buttons.map((btn) => btn.getAttribute("aria-label"));
    expect(labels).toEqual(["Power", "Pause", "Restart", "Search tunes", "Queue"]);
  });

  it("disables search, restart, and queue in jam mode", () => {
    render(<PlayerControls {...defaultProps} mode="jam" />);
    expect(screen.getByRole("button", { name: "Search tunes" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Restart" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Queue" })).toBeDisabled();
  });

  it("enables search and restart in learn mode; queue stays disabled", () => {
    render(<PlayerControls {...defaultProps} mode="learn" />);
    expect(screen.getByRole("button", { name: "Search tunes" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Restart" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Queue" })).toBeDisabled();
  });

  it("enables queue in listen mode", () => {
    render(<PlayerControls {...defaultProps} mode="listen" />);
    expect(screen.getByRole("button", { name: "Queue" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Search tunes" })).toBeEnabled();
  });

  it("disables controls when powered off", () => {
    render(<PlayerControls {...defaultProps} isPoweredOn={false} />);
    expect(screen.getByRole("button", { name: "Search tunes" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Pause" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Restart" })).toBeDisabled();
    expect(screen.getByRole("radio", { name: "Jam" })).toBeDisabled();
  });

  it("disables pause and restart when no current tune", () => {
    render(<PlayerControls {...defaultProps} hasCurrentTune={false} />);
    expect(screen.getByRole("button", { name: "Pause" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Restart" })).toBeDisabled();
  });

  it("shows Resume label when paused", () => {
    render(<PlayerControls {...defaultProps} isPaused={true} />);
    expect(screen.getByRole("button", { name: "Resume" })).toBeInTheDocument();
  });

  it("fires onPowerToggle", async () => {
    const onPowerToggle = vi.fn();
    render(<PlayerControls {...defaultProps} onPowerToggle={onPowerToggle} />);
    await userEvent.click(screen.getByRole("button", { name: "Power" }));
    expect(onPowerToggle).toHaveBeenCalledOnce();
  });

  it("fires onSearch", async () => {
    const onSearch = vi.fn();
    render(<PlayerControls {...defaultProps} onSearch={onSearch} />);
    await userEvent.click(screen.getByRole("button", { name: "Search tunes" }));
    expect(onSearch).toHaveBeenCalledOnce();
  });

  it("fires onQueue in listen mode", async () => {
    const onQueue = vi.fn();
    render(<PlayerControls {...defaultProps} mode="listen" onQueue={onQueue} />);
    await userEvent.click(screen.getByRole("button", { name: "Queue" }));
    expect(onQueue).toHaveBeenCalledOnce();
  });

  it("fires onPause", async () => {
    const onPause = vi.fn();
    render(<PlayerControls {...defaultProps} onPause={onPause} />);
    await userEvent.click(screen.getByRole("button", { name: "Pause" }));
    expect(onPause).toHaveBeenCalledOnce();
  });

  it("fires onRestart", async () => {
    const onRestart = vi.fn();
    render(<PlayerControls {...defaultProps} onRestart={onRestart} />);
    await userEvent.click(screen.getByRole("button", { name: "Restart" }));
    expect(onRestart).toHaveBeenCalledOnce();
  });

  it("fires onModeChange when a mode label is clicked", async () => {
    const onModeChange = vi.fn();
    render(<PlayerControls {...defaultProps} mode="jam" onModeChange={onModeChange} />);
    await userEvent.click(screen.getByRole("radio", { name: "Listen" }));
    expect(onModeChange).toHaveBeenCalledWith("listen");
  });
});
