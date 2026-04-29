import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import RadioFacade from "../components/RadioFacade";

describe("RadioFacade", () => {
  it("should render nameplate with radio title", () => {
    render(
      <RadioFacade isPoweredOn={false}>
        <div>child</div>
      </RadioFacade>
    );

    expect(screen.getByText(/old-time jam radio/i)).toBeInTheDocument();
  });

  it("should render speaker grille slats", () => {
    render(
      <RadioFacade isPoweredOn={false}>
        <div>child</div>
      </RadioFacade>
    );

    const facade = screen.getByTestId("radio-facade");
    const slats = facade.querySelectorAll(".radio-facade__grille-slat");
    expect(slats.length).toBeGreaterThan(0);
  });

  it("should render children in controls area", () => {
    render(
      <RadioFacade isPoweredOn={false}>
        <div data-testid="test-child">child content</div>
      </RadioFacade>
    );

    expect(screen.getByTestId("test-child")).toBeInTheDocument();
  });
});
