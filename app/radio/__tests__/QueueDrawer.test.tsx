import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import type { ComponentProps } from "react";
import QueueDrawer from "../components/QueueDrawer";
import type { Tune } from "../types";

const makeTune = (overrides: Partial<Tune> = {}): Tune => ({
  title: "Sally Ann",
  artist: "Highwoods Stringband",
  key: "A",
  url: "sally-ann.mp3",
  duration: 180,
  confidence: 1.0,
  format: "mp3",
  ...overrides,
});

const queue: Tune[] = [
  makeTune({ title: "Sally Ann", key: "A", url: "sally.mp3" }),
  makeTune({ title: "Cluck Old Hen", key: "D", url: "cluck.mp3" }),
];

function renderDrawer(props: Partial<ComponentProps<typeof QueueDrawer>> = {}) {
  const onJump = vi.fn();
  const onRemove = vi.fn();
  const onClose = vi.fn();
  render(
    <QueueDrawer
      isOpen
      queue={queue}
      currentIndex={0}
      onJump={onJump}
      onRemove={onRemove}
      onClose={onClose}
      {...props}
    />
  );
  return { onJump, onRemove, onClose };
}

describe("QueueDrawer", () => {
  it("renders every queued tune", () => {
    renderDrawer();
    expect(screen.getByText("Sally Ann")).toBeInTheDocument();
    expect(screen.getByText("Cluck Old Hen")).toBeInTheDocument();
  });

  it("marks the current tune with aria-current", () => {
    renderDrawer({ currentIndex: 1 });
    const current = screen.getByRole("button", { name: /^Cluck Old Hen/ });
    expect(current).toHaveAttribute("aria-current", "true");
  });

  it("calls onJump with the tapped index", () => {
    const { onJump } = renderDrawer();
    fireEvent.click(screen.getByRole("button", { name: /^Cluck Old Hen/ }));
    expect(onJump).toHaveBeenCalledWith(1);
  });

  it("calls onRemove with the tune's index", () => {
    const { onRemove } = renderDrawer();
    fireEvent.click(
      screen.getByRole("button", { name: "Remove Sally Ann from queue" })
    );
    expect(onRemove).toHaveBeenCalledWith(0);
  });

  it("closes on backdrop click and close button", () => {
    const { onClose } = renderDrawer();
    fireEvent.click(screen.getByTestId("queue-drawer-backdrop"));
    fireEvent.click(screen.getByRole("button", { name: "Close queue" }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("shows an empty state when the queue is empty", () => {
    renderDrawer({ queue: [] });
    expect(screen.getByText(/No tunes queued/)).toBeInTheDocument();
  });
});
