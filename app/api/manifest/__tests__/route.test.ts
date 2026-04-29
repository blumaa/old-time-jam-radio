import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Manifest } from "@/app/radio/types";

const mockManifest: Manifest = [
  {
    title: "Turkey in the Straw",
    artist: "Traditional",
    key: "G",
    url: "tunes/turkey-in-the-straw.mp3",
    duration: 187.4,
    confidence: 0.82,
    format: "mp3",
  },
  {
    title: "Salt Creek",
    artist: "Traditional",
    key: "A",
    url: "tunes/salt-creek.m4a",
    duration: 145.2,
    confidence: 1.0,
    format: "m4a",
  },
];

const mockSend = vi.fn();

vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: class {
    send = mockSend;
  },
  GetObjectCommand: class {
    constructor(public input: unknown) {}
  },
  PutObjectCommand: class {
    constructor(public input: unknown) {}
  },
}));

const mockCookieGet = vi.fn();
vi.mock("next/headers", () => ({
  cookies: () => Promise.resolve({ get: mockCookieGet }),
}));

describe("GET /api/manifest", () => {
  beforeEach(() => {
    mockSend.mockReset();
    mockCookieGet.mockReset();
    process.env.R2_ACCOUNT_ID = "test-account";
    process.env.R2_ACCESS_KEY_ID = "test-key";
    process.env.R2_SECRET_ACCESS_KEY = "test-secret";
    process.env.R2_BUCKET_NAME = "test-bucket";
  });

  it("should return manifest JSON from R2", async () => {
    mockSend.mockResolvedValue({
      Body: {
        transformToString: () => Promise.resolve(JSON.stringify(mockManifest)),
      },
    });

    const { GET } = await import("../route");
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveLength(2);
    expect(data[0].title).toBe("Turkey in the Straw");
    expect(data[1].key).toBe("A");
  });

  it("should return 500 when R2 request fails", async () => {
    mockSend.mockRejectedValue(new Error("R2 error"));

    const { GET } = await import("../route");
    const response = await GET();

    expect(response.status).toBe(500);
  });
});

describe("PUT /api/manifest", () => {
  beforeEach(() => {
    mockSend.mockReset();
    mockCookieGet.mockReset();
    process.env.R2_ACCOUNT_ID = "test-account";
    process.env.R2_ACCESS_KEY_ID = "test-key";
    process.env.R2_SECRET_ACCESS_KEY = "test-secret";
    process.env.R2_BUCKET_NAME = "test-bucket";
  });

  it("should reject requests without auth cookie", async () => {
    mockCookieGet.mockReturnValue(undefined);

    const { PUT } = await import("../route");
    const request = new Request("http://localhost/api/manifest", {
      method: "PUT",
      body: JSON.stringify(mockManifest),
      headers: { "Content-Type": "application/json" },
    });

    const response = await PUT(request);
    expect(response.status).toBe(401);
  });

  it("should write manifest to R2 with valid auth", async () => {
    mockSend.mockResolvedValue({});
    mockCookieGet.mockReturnValue({ value: "authenticated" });

    const { PUT } = await import("../route");
    const request = new Request("http://localhost/api/manifest", {
      method: "PUT",
      body: JSON.stringify(mockManifest),
      headers: { "Content-Type": "application/json" },
    });

    const response = await PUT(request);
    expect(response.status).toBe(200);
  });
});
