import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import TuneSearchDrawer from "../components/TuneSearchDrawer";
import type { Tune } from "../types";

const makeTune = (overrides: Partial<Tune> = {}): Tune => ({
  title: "Sally Ann",
  artist: "Highwoods Stringband",
  key: "A",
  url: "sally.mp3",
  duration: 180,
  confidence: 1.0,
  format: "mp3",
  ...overrides,
});

const mockResults: Tune[] = [
  makeTune({ title: "Sally Ann", key: "A" }),
  makeTune({ title: "Salt Creek", key: "A", url: "salt.mp3" }),
];

describe("TuneSearchDrawer", () => {
  it("renders nothing when isOpen is false", () => {
    const { container } = render(
      <TuneSearchDrawer
        isOpen={false}
        query=""
        results={[]}
        onQueryChange={() => {}}
        onSelectTune={() => {}}
        onClose={() => {}}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders backdrop and panel when open", () => {
    render(
      <TuneSearchDrawer
        isOpen={true}
        query=""
        results={mockResults}
        onQueryChange={() => {}}
        onSelectTune={() => {}}
        onClose={() => {}}
      />
    );

    expect(screen.getByTestId("tune-search-drawer")).toBeInTheDocument();
    expect(screen.getByTestId("tune-search-backdrop")).toBeInTheDocument();
    expect(screen.getByRole("searchbox")).toBeInTheDocument();
    expect(screen.getAllByRole("option")).toHaveLength(2);
  });

  it("clicking backdrop calls onClose", async () => {
    const onClose = vi.fn();
    render(
      <TuneSearchDrawer
        isOpen={true}
        query=""
        results={[]}
        onQueryChange={() => {}}
        onSelectTune={() => {}}
        onClose={onClose}
      />
    );

    await userEvent.click(screen.getByTestId("tune-search-backdrop"));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("selecting a tune calls onSelectTune", async () => {
    const onSelectTune = vi.fn();
    render(
      <TuneSearchDrawer
        isOpen={true}
        query=""
        results={mockResults}
        onQueryChange={() => {}}
        onSelectTune={onSelectTune}
        onClose={() => {}}
      />
    );

    await userEvent.click(screen.getByText("Sally Ann"));
    expect(onSelectTune).toHaveBeenCalledWith(mockResults[0]);
  });

  it("typing in search calls onQueryChange", async () => {
    const onQueryChange = vi.fn();
    render(
      <TuneSearchDrawer
        isOpen={true}
        query=""
        results={[]}
        onQueryChange={onQueryChange}
        onSelectTune={() => {}}
        onClose={() => {}}
      />
    );

    await userEvent.type(screen.getByRole("searchbox"), "s");
    expect(onQueryChange).toHaveBeenCalledWith("s");
  });
});
