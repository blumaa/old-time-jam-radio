import {
  GetObjectCommand,
  PutObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { cookies } from "next/headers";
import type { Manifest, Tune } from "@/app/radio/types";
import { getR2Client, R2_BUCKET } from "../../_lib/r2";

const AUDIO_EXT = /\.(mp3|m4a)$/i;
const TRACK_NUM_PREFIX = /^\d[\d\-]*[\s.\-]+/;
const TRAILING_COPY = /\s*\(\d+\)\s*$/;
const TRAILING_DIGITS = /-\d+$/;

function parseTuneFromKey(key: string): Omit<Tune, "key" | "confidence"> {
  const ext = key.split(".").pop()!.toLowerCase() as "mp3" | "m4a";
  const parts = key.split("/");
  const filename = parts[parts.length - 1];

  let title = filename.replace(AUDIO_EXT, "");
  title = title.replace(TRACK_NUM_PREFIX, "");
  title = title.replace(TRAILING_COPY, "");
  title = title.replace(TRAILING_DIGITS, "").trim();

  const artist = parts.length >= 2 ? parts[0] : "Unknown Artist";

  return {
    title,
    artist,
    url: key,
    duration: 0,
    format: ext,
  };
}

async function listAllAudioKeys(s3: ReturnType<typeof getR2Client>): Promise<string[]> {
  const keys: string[] = [];
  let continuationToken: string | undefined;

  do {
    const response = await s3.send(
      new ListObjectsV2Command({
        Bucket: R2_BUCKET,
        MaxKeys: 1000,
        ContinuationToken: continuationToken,
      })
    );

    for (const obj of response.Contents ?? []) {
      if (obj.Key && AUDIO_EXT.test(obj.Key) && !obj.Key.includes("/._")) {
        keys.push(obj.Key);
      }
    }

    continuationToken = response.IsTruncated
      ? response.NextContinuationToken
      : undefined;
  } while (continuationToken);

  return keys;
}

export async function POST() {
  const cookieStore = await cookies();
  if (cookieStore.get("otr-admin")?.value !== "authenticated") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const s3 = getR2Client();

    const bucketKeys = await listAllAudioKeys(s3);

    const manifestResponse = await s3.send(
      new GetObjectCommand({
        Bucket: R2_BUCKET,
        Key: "manifest.json",
      })
    );
    const body = await manifestResponse.Body?.transformToString();
    const manifest: Manifest = body ? JSON.parse(body) : [];

    const existingUrls = new Set(manifest.map((t) => t.url));
    const newTunes: Tune[] = [];

    for (const key of bucketKeys) {
      if (existingUrls.has(key)) continue;
      const parsed = parseTuneFromKey(key);
      newTunes.push({ ...parsed, key: "G", confidence: 0 });
    }

    if (newTunes.length > 0) {
      const updated = [...manifest, ...newTunes].sort((a, b) =>
        a.title.toLowerCase().localeCompare(b.title.toLowerCase())
      );

      await s3.send(
        new PutObjectCommand({
          Bucket: R2_BUCKET,
          Key: "manifest.json",
          Body: JSON.stringify(updated, null, 2),
          ContentType: "application/json",
        })
      );

      return Response.json(
        { added: newTunes.length, total: updated.length, newTunes },
        { status: 200 }
      );
    }

    return Response.json(
      { added: 0, total: manifest.length },
      { status: 200 }
    );
  } catch {
    return Response.json(
      { error: "Failed to sync" },
      { status: 500 }
    );
  }
}
