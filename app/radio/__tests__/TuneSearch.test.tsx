import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import TuneSearch from "../components/TuneSearch";
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
  makeTune({ title: "Cluck Old Hen", key: "D", url: "cluck.mp3" }),
];

describe("TuneSearch", () => {
  it("renders nothing when isOpen is false", () => {
    const { container } = render(
      <TuneSearch
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

  it("renders input and results when isOpen is true", () => {
    render(
      <TuneSearch
        isOpen={true}
        query=""
        results={mockResults}
        onQueryChange={() => {}}
        onSelectTune={() => {}}
        onClose={() => {}}
      />
    );
    expect(screen.getByRole("searchbox")).toBeInTheDocument();
    expect(screen.getAllByRole("option")).toHaveLength(3);
  });

  it("input value reflects query prop", () => {
    render(
      <TuneSearch
        isOpen={true}
        query="sal"
        results={mockResults}
        onQueryChange={() => {}}
        onSelectTune={() => {}}
        onClose={() => {}}
      />
    );
    expect(screen.getByRole("searchbox")).toHaveValue("sal");
  });

  it("typing calls onQueryChange", async () => {
    const onQueryChange = vi.fn();
    render(
      <TuneSearch
        isOpen={true}
        query=""
        results={[]}
        onQueryChange={onQueryChange}
        onSelectTune={() => {}}
        onClose={() => {}}
      />
    );

    await userEvent.type(screen.getByRole("searchbox"), "a");
    expect(onQueryChange).toHaveBeenCalledWith("a");
  });

  it("clicking a result calls onSelectTune with the correct tune", async () => {
    const onSelectTune = vi.fn();
    render(
      <TuneSearch
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

  it("shows key badge for each result", () => {
    render(
      <TuneSearch
        isOpen={true}
        query=""
        results={mockResults}
        onQueryChange={() => {}}
        onSelectTune={() => {}}
        onClose={() => {}}
      />
    );

    const badges = screen.getAllByTestId("tune-search-key");
    expect(badges).toHaveLength(3);
    expect(badges[0]).toHaveTextContent("A");
    expect(badges[2]).toHaveTextContent("D");
  });
});
