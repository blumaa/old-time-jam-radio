#!/usr/bin/env node
/**
 * Generate manifest.json from R2 bucket contents and upload it.
 * Cleans filenames into tune titles. Keys default to "?" (assign later).
 *
 * Usage: node scripts/generate-manifest.mjs
 */

import { S3Client, ListObjectsV2Command, PutObjectCommand } from "@aws-sdk/client-s3";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

const client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET = process.env.R2_BUCKET_NAME;
const AUDIO_EXTS = /\.(mp3|m4a|wav|flac|ogg)$/i;

function cleanTitle(key) {
  const filename = key.split("/").pop();
  let name = filename.replace(AUDIO_EXTS, "");
  // Strip leading track numbers like "01 ", "07-08-07 - ", "01. "
  name = name.replace(/^\d[\d\-]*[\s.\-]+/, "");
  // Strip "Artist - " prefix patterns
  name = name.replace(/^[^-]+ - [^-]+ - /, "");
  // Clean up
  name = name.replace(/_/g, " ").replace(/\s+/g, " ").trim();
  // Remove trailing "-1", "-2" etc (duplicate markers)
  name = name.replace(/-\d+$/, "").trim();
  return name || filename;
}

async function listAllObjects() {
  let token;
  const all = [];
  do {
    const res = await client.send(
      new ListObjectsV2Command({ Bucket: BUCKET, ContinuationToken: token, MaxKeys: 1000 })
    );
    if (res.Contents) all.push(...res.Contents);
    token = res.NextContinuationToken;
  } while (token);
  return all;
}

async function main() {
  const objects = await listAllObjects();

  const audioFiles = objects.filter(
    (o) => AUDIO_EXTS.test(o.Key) && !o.Key.includes("/._") && !o.Key.includes(".DS_Store")
  );

  console.log(`Found ${audioFiles.length} audio files`);

  const manifest = audioFiles.map((obj) => {
    const ext = obj.Key.split(".").pop().toLowerCase();
    return {
      title: cleanTitle(obj.Key),
      key: "?",
      url: obj.Key,
      duration: 0,
      confidence: 0,
      format: ext,
    };
  });

  // Sort by title
  manifest.sort((a, b) => a.title.localeCompare(b.title));

  // Upload manifest to R2
  await client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: "manifest.json",
      Body: JSON.stringify(manifest, null, 2),
      ContentType: "application/json",
    })
  );

  console.log(`Uploaded manifest.json with ${manifest.length} tunes`);

  // Also write locally for reference
  const fs = await import("fs");
  fs.writeFileSync("manifest.json", JSON.stringify(manifest, null, 2));
  console.log("Wrote local manifest.json");

  // Show a sample
  console.log("\nSample entries:");
  manifest.slice(0, 10).forEach((t) => console.log(`  ${t.title} (${t.format})`));
}

main().catch(console.error);
