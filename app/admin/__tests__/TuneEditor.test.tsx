import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import TuneEditor from "../components/TuneEditor";
import type { Tune } from "@/app/radio/types";

const makeTune = (overrides: Partial<Tune> = {}): Tune => ({
  title: "Sally Ann",
  artist: "Highwoods Stringband",
  key: "A",
  url: "sally.mp3",
  duration: 180,
  confidence: 0.45,
  format: "mp3",
  ...overrides,
});

describe("TuneEditor", () => {
  it("passes updated key without modifying confidence", async () => {
    const onSave = vi.fn();
    const tune = makeTune({ key: "A", confidence: 0.45 });
    render(<TuneEditor tune={tune} onSave={onSave} onCancel={() => {}} />);

    await userEvent.selectOptions(screen.getByLabelText("Key"), "G");
    await userEvent.click(screen.getByText("Save"));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ key: "G", confidence: 0.45 })
    );
  });

  it("calls onCancel when cancel is clicked", async () => {
    const onCancel = vi.fn();
    render(<TuneEditor tune={makeTune()} onSave={() => {}} onCancel={onCancel} />);

    await userEvent.click(screen.getByText("Cancel"));

    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("updates title field", async () => {
    const onSave = vi.fn();
    render(<TuneEditor tune={makeTune()} onSave={onSave} onCancel={() => {}} />);

    const input = screen.getByLabelText("Title");
    await userEvent.clear(input);
    await userEvent.type(input, "Cluck Old Hen");
    await userEvent.click(screen.getByText("Save"));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Cluck Old Hen" })
    );
  });
});
