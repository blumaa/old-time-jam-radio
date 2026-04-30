import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import AdminPanel from "../AdminPanel";
import type { Tune } from "@/app/radio/types";

const sampleManifest: Tune[] = [
  {
    title: "Sally Ann",
    artist: "Highwoods Stringband",
    key: "?",
    url: "sally.mp3",
    duration: 180,
    confidence: 0.45,
    format: "mp3",
  },
  {
    title: "Salt Creek",
    artist: "Brad Leftwich",
    key: "A",
    url: "salt.mp3",
    duration: 150,
    confidence: 0.9,
    format: "mp3",
  },
];

let lastPutBody: unknown = null;

beforeEach(() => {
  lastPutBody = null;
  vi.stubGlobal("fetch", vi.fn((url: string, opts?: RequestInit) => {
    if (url === "/api/manifest" && (!opts || opts.method === undefined || opts.method === "GET")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(sampleManifest),
      });
    }
    if (url === "/api/manifest" && opts?.method === "PUT") {
      lastPutBody = JSON.parse(opts.body as string);
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true }) });
    }
    return Promise.resolve({ ok: false, json: () => Promise.resolve({}) });
  }));
});

describe("AdminPanel edit flow", () => {
  it("sets confidence to 1.0 when key is changed and saved", async () => {
    render(<AdminPanel />);

    await waitFor(() => {
      expect(screen.getByText("Sally Ann")).toBeInTheDocument();
    });

    const editButtons = screen.getAllByText("Edit");
    await userEvent.click(editButtons[0]);

    const keySelect = screen.getByLabelText("Key");
    await userEvent.selectOptions(keySelect, "G");
    await userEvent.click(screen.getByText("Save"));

    await waitFor(() => {
      expect(lastPutBody).not.toBeNull();
    });

    const savedManifest = lastPutBody as Tune[];
    const savedTune = savedManifest.find((t) => t.url === "sally.mp3");
    expect(savedTune).toBeDefined();
    expect(savedTune!.key).toBe("G");
    expect(savedTune!.confidence).toBe(1.0);
  });

  it("sets confidence to 1.0 when changing a real key (A → D)", async () => {
    render(<AdminPanel />);

    await waitFor(() => {
      expect(screen.getByText("Salt Creek")).toBeInTheDocument();
    });

    const editButtons = screen.getAllByText("Edit");
    await userEvent.click(editButtons[1]);

    const keySelect = screen.getByLabelText("Key");
    expect(keySelect).toHaveValue("A");
    await userEvent.selectOptions(keySelect, "D");
    await userEvent.click(screen.getByText("Save"));

    await waitFor(() => {
      expect(lastPutBody).not.toBeNull();
    });

    const savedManifest = lastPutBody as Tune[];
    const savedTune = savedManifest.find((t) => t.url === "salt.mp3");
    expect(savedTune!.key).toBe("D");
    expect(savedTune!.confidence).toBe(1.0);
  });

  it("shows updated confidence in table after save", async () => {
    render(<AdminPanel />);

    await waitFor(() => {
      expect(screen.getByText("Sally Ann")).toBeInTheDocument();
    });

    expect(screen.getByText("45%")).toBeInTheDocument();

    const editButtons = screen.getAllByText("Edit");
    await userEvent.click(editButtons[0]);

    await userEvent.selectOptions(screen.getByLabelText("Key"), "G");
    await userEvent.click(screen.getByText("Save"));

    await waitFor(() => {
      expect(screen.getByText("100%")).toBeInTheDocument();
    });
  });

  it("sets confidence to 1.0 even when key is unchanged", async () => {
    render(<AdminPanel />);

    await waitFor(() => {
      expect(screen.getByText("Sally Ann")).toBeInTheDocument();
    });

    const editButtons = screen.getAllByText("Edit");
    await userEvent.click(editButtons[0]);

    await userEvent.click(screen.getByText("Save"));

    await waitFor(() => {
      expect(lastPutBody).not.toBeNull();
    });

    const savedManifest = lastPutBody as Tune[];
    const savedTune = savedManifest.find((t) => t.url === "sally.mp3");
    expect(savedTune!.key).toBe("?");
    expect(savedTune!.confidence).toBe(1.0);
  });
});
