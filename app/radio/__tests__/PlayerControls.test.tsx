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
  onRestart: vi.fn(),
  mode: "learn" as const,
  onModeChange: vi.fn(),
  hasCurrentTune: true,
};

describe("PlayerControls", () => {
  it("renders 4 button controls and 1 rocker switch", () => {
    render(<PlayerControls {...defaultProps} />);
    expect(screen.getByRole("button", { name: "Power" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Search tunes" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Pause" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Restart" })).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: "Mode" })).toBeInTheDocument();
  });

  it("renders rocker switch before button row", () => {
    const { container } = render(<PlayerControls {...defaultProps} />);
    const rocker = container.querySelector(".control--rocker");
    const buttonRow = container.querySelector(".player-controls__buttons");
    expect(rocker).toBeTruthy();
    expect(buttonRow).toBeTruthy();
    expect(rocker!.compareDocumentPosition(buttonRow!)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it("renders buttons in correct DOM order", () => {
    render(<PlayerControls {...defaultProps} />);
    const buttons = screen.getAllByRole("button");
    const labels = buttons.map((btn) => btn.getAttribute("aria-label"));
    expect(labels).toEqual(["Power", "Pause", "Restart", "Search tunes"]);
  });

  it("disables search and restart in jam mode", () => {
    render(<PlayerControls {...defaultProps} mode="jam" />);
    expect(screen.getByRole("button", { name: "Search tunes" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Restart" })).toBeDisabled();
  });

  it("enables search and restart in learn mode", () => {
    render(<PlayerControls {...defaultProps} mode="learn" />);
    expect(screen.getByRole("button", { name: "Search tunes" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Restart" })).toBeEnabled();
  });

  it("disables non-power controls when powered off", () => {
    render(<PlayerControls {...defaultProps} isPoweredOn={false} />);
    expect(screen.getByRole("button", { name: "Search tunes" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Pause" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Restart" })).toBeDisabled();
    expect(screen.getByRole("switch", { name: "Mode" })).toBeDisabled();
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

  it("fires onModeChange with learn when in jam mode", async () => {
    const onModeChange = vi.fn();
    render(<PlayerControls {...defaultProps} mode="jam" onModeChange={onModeChange} />);
    await userEvent.click(screen.getByRole("switch", { name: "Mode" }));
    expect(onModeChange).toHaveBeenCalledWith("learn");
  });

  it("fires onModeChange with jam when in learn mode", async () => {
    const onModeChange = vi.fn();
    render(<PlayerControls {...defaultProps} mode="learn" onModeChange={onModeChange} />);
    await userEvent.click(screen.getByRole("switch", { name: "Mode" }));
    expect(onModeChange).toHaveBeenCalledWith("jam");
  });
});
