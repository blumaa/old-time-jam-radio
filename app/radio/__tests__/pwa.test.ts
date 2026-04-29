import { existsSync } from "fs";
import { resolve } from "path";
import { describe, it, expect } from "vitest";

describe("PWA assets", () => {
  it("should have a 192x192 icon", () => {
    expect(existsSync(resolve(process.cwd(), "public/icon-192.png"))).toBe(true);
  });

  it("should have a 512x512 icon", () => {
    expect(existsSync(resolve(process.cwd(), "public/icon-512.png"))).toBe(true);
  });
});
