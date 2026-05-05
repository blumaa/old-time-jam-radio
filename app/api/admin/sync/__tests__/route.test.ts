import { describe, it, expect, vi, beforeEach } from "vitest";

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
  ListObjectsV2Command: class {
    constructor(public input: unknown) {}
  },
}));

const mockCookieGet = vi.fn();
vi.mock("next/headers", () => ({
  cookies: () => Promise.resolve({ get: mockCookieGet }),
}));

describe("POST /api/admin/sync", () => {
  beforeEach(() => {
    mockSend.mockReset();
    mockCookieGet.mockReset();
    process.env.R2_ACCOUNT_ID = "test-account";
    process.env.R2_ACCESS_KEY_ID = "test-key";
    process.env.R2_SECRET_ACCESS_KEY = "test-secret";
    process.env.R2_BUCKET_NAME = "test-bucket";
  });

  it("should reject unauthenticated requests", async () => {
    mockCookieGet.mockReturnValue(undefined);

    const { POST } = await import("../route");
    const response = await POST();
    expect(response.status).toBe(401);
  });

  it("should detect new audio files not in manifest", async () => {
    mockCookieGet.mockReturnValue({ value: "authenticated" });

    const existingManifest = [
      { title: "Existing Tune", artist: "Artist", key: "G", url: "existing.mp3", duration: 0, confidence: 0.9, format: "mp3" },
    ];

    let callIndex = 0;
    mockSend.mockImplementation(() => {
      callIndex++;
      if (callIndex === 1) {
        // ListObjectsV2
        return Promise.resolve({
          Contents: [
            { Key: "existing.mp3" },
            { Key: "New Tune.mp3" },
            { Key: "Dan Gellert/Album/Salt Creek.m4a" },
            { Key: "manifest.json" },
            { Key: "image.png" },
          ],
          IsTruncated: false,
        });
      }
      if (callIndex === 2) {
        // GetObjectCommand (manifest)
        return Promise.resolve({
          Body: { transformToString: () => Promise.resolve(JSON.stringify(existingManifest)) },
        });
      }
      // PutObjectCommand
      return Promise.resolve({});
    });

    const { POST } = await import("../route");
    const response = await POST();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.added).toBe(2);
    expect(data.total).toBe(3);
  });

  it("should parse title from filename", async () => {
    mockCookieGet.mockReturnValue({ value: "authenticated" });

    let putBody: string | undefined;
    let callIndex = 0;
    mockSend.mockImplementation((cmd: { input: unknown }) => {
      callIndex++;
      if (callIndex === 1) {
        return Promise.resolve({
          Contents: [{ Key: "09 Salt Creek.mp3" }],
          IsTruncated: false,
        });
      }
      if (callIndex === 2) {
        return Promise.resolve({
          Body: { transformToString: () => Promise.resolve("[]") },
        });
      }
      // PutObjectCommand - capture the body
      putBody = (cmd.input as { Body: string }).Body;
      return Promise.resolve({});
    });

    const { POST } = await import("../route");
    await POST();

    const manifest = JSON.parse(putBody!);
    expect(manifest[0].title).toBe("Salt Creek");
    expect(manifest[0].key).toBe("G");
    expect(manifest[0].confidence).toBe(0);
  });

  it("should parse artist from directory path", async () => {
    mockCookieGet.mockReturnValue({ value: "authenticated" });

    let putBody: string | undefined;
    let callIndex = 0;
    mockSend.mockImplementation((cmd: { input: unknown }) => {
      callIndex++;
      if (callIndex === 1) {
        return Promise.resolve({
          Contents: [{ Key: "Dan Gellert/Some Album/Cluck Old Hen.mp3" }],
          IsTruncated: false,
        });
      }
      if (callIndex === 2) {
        return Promise.resolve({
          Body: { transformToString: () => Promise.resolve("[]") },
        });
      }
      putBody = (cmd.input as { Body: string }).Body;
      return Promise.resolve({});
    });

    const { POST } = await import("../route");
    await POST();

    const manifest = JSON.parse(putBody!);
    expect(manifest[0].artist).toBe("Dan Gellert");
  });

  it("should not duplicate existing manifest entries", async () => {
    mockCookieGet.mockReturnValue({ value: "authenticated" });

    const existingManifest = [
      { title: "Salt Creek", artist: "Brad Leftwich", key: "A", url: "Salt Creek.mp3", duration: 120, confidence: 1.0, format: "mp3" },
    ];

    let putBody: string | undefined;
    let callIndex = 0;
    mockSend.mockImplementation((cmd: { input: unknown }) => {
      callIndex++;
      if (callIndex === 1) {
        return Promise.resolve({
          Contents: [{ Key: "Salt Creek.mp3" }],
          IsTruncated: false,
        });
      }
      if (callIndex === 2) {
        return Promise.resolve({
          Body: { transformToString: () => Promise.resolve(JSON.stringify(existingManifest)) },
        });
      }
      putBody = (cmd.input as { Body: string }).Body;
      return Promise.resolve({});
    });

    const { POST } = await import("../route");
    const response = await POST();
    const data = await response.json();

    expect(data.added).toBe(0);
    // Should not have called PutObjectCommand since nothing changed
    expect(putBody).toBeUndefined();
  });

  it("should handle paginated bucket listing", async () => {
    mockCookieGet.mockReturnValue({ value: "authenticated" });

    let callIndex = 0;
    mockSend.mockImplementation(() => {
      callIndex++;
      if (callIndex === 1) {
        return Promise.resolve({
          Contents: [{ Key: "tune1.mp3" }],
          IsTruncated: true,
          NextContinuationToken: "token123",
        });
      }
      if (callIndex === 2) {
        return Promise.resolve({
          Contents: [{ Key: "tune2.mp3" }],
          IsTruncated: false,
        });
      }
      if (callIndex === 3) {
        return Promise.resolve({
          Body: { transformToString: () => Promise.resolve("[]") },
        });
      }
      return Promise.resolve({});
    });

    const { POST } = await import("../route");
    const response = await POST();
    const data = await response.json();

    expect(data.added).toBe(2);
  });
});
