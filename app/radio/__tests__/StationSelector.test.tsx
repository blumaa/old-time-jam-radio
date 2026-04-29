import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import StationSelector from "../components/StationSelector";

describe("StationSelector", () => {
  const stations = ["G", "D", "A"];

  it("should render a button for each station", () => {
    render(
      <StationSelector
        stations={stations}
        currentStation="G"
        onStationChange={() => {}}
        disabled={false}
      />
    );

    expect(screen.getByRole("radio", { name: "G" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "D" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "A" })).toBeInTheDocument();
  });

  it("should mark current station as checked", () => {
    render(
      <StationSelector
        stations={stations}
        currentStation="D"
        onStationChange={() => {}}
        disabled={false}
      />
    );

    expect(screen.getByRole("radio", { name: "D" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("radio", { name: "G" })).toHaveAttribute("aria-checked", "false");
    expect(screen.getByRole("radio", { name: "A" })).toHaveAttribute("aria-checked", "false");
  });

  it("should fire onStationChange when a station is clicked", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <StationSelector
        stations={stations}
        currentStation="G"
        onStationChange={onChange}
        disabled={false}
      />
    );

    await user.click(screen.getByRole("radio", { name: "A" }));
    expect(onChange).toHaveBeenCalledWith("A");
  });

  it("should not fire onStationChange when disabled", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <StationSelector
        stations={stations}
        currentStation="G"
        onStationChange={onChange}
        disabled={true}
      />
    );

    await user.click(screen.getByRole("radio", { name: "A" }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("should have radiogroup role on container", () => {
    render(
      <StationSelector
        stations={stations}
        currentStation="G"
        onStationChange={() => {}}
        disabled={false}
      />
    );

    expect(screen.getByRole("radiogroup")).toBeInTheDocument();
  });
});
