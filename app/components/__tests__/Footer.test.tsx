import { render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import Footer from "../Footer";

afterEach(cleanup);

describe("Footer", () => {
  it("shows the educational-use notice", () => {
    render(<Footer />);
    expect(
      screen.getByText(/content of this site is for/i)
    ).toBeInTheDocument();
  });

  it("links the educational-use phrase to the copyright page", () => {
    render(<Footer />);
    const link = screen.getByRole("link", { name: /educational use only/i });
    expect(link).toHaveAttribute("href", "/copyright");
  });
});
