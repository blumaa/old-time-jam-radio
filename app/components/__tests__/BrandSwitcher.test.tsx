import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import BrandSwitcher from "../BrandSwitcher";
import { THEMES, THEME_STORAGE_KEY } from "@/app/theme/themes";

afterEach(() => {
  cleanup();
  document.documentElement.removeAttribute("data-theme");
  localStorage.clear();
  vi.unstubAllEnvs();
});

describe("BrandSwitcher", () => {
  it("renders every theme as an option", () => {
    render(<BrandSwitcher />);
    for (const theme of THEMES) {
      expect(
        screen.getByRole("option", { name: theme.label })
      ).toBeInTheDocument();
    }
  });

  it("applies the chosen theme to the document element and persists it", async () => {
    render(<BrandSwitcher />);
    await userEvent.selectOptions(screen.getByRole("combobox"), "spotify");

    expect(document.documentElement.getAttribute("data-theme")).toBe("spotify");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("spotify");
  });

  it("removes the attribute when returning to the default theme", async () => {
    render(<BrandSwitcher />);
    const select = screen.getByRole("combobox");

    await userEvent.selectOptions(select, "spotify");
    await userEvent.selectOptions(select, "default");

    expect(document.documentElement.hasAttribute("data-theme")).toBe(false);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("default");
  });

  it("restores a persisted theme on mount", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "linear");
    render(<BrandSwitcher />);

    // useSyncExternalStore reflects it in the select; the DOM-sync effect
    // applies data-theme after hydration (no server render → no mismatch).
    expect(screen.getByRole("combobox")).toHaveValue("linear");
    expect(document.documentElement.getAttribute("data-theme")).toBe("linear");
  });

  it("leaves data-theme unset for the default theme", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "default");
    render(<BrandSwitcher />);

    expect(document.documentElement.getAttribute("data-theme")).toBeNull();
  });

  it("renders nothing in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    const { container } = render(<BrandSwitcher />);
    expect(container).toBeEmptyDOMElement();
  });
});
