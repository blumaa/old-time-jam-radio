#!/usr/bin/env node
/**
 * Assign known keys to tunes in the manifest based on tune title matching.
 * Updates both the local manifest.json and the R2 copy.
 */

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { config } from "dotenv";
import { resolve } from "path";
import { readFileSync, writeFileSync } from "fs";

config({ path: resolve(process.cwd(), ".env.local") });

// Known old-time tune keys — sourced from Slippery Hill, common session knowledge
const KNOWN_KEYS = {
  // A tunes
  "apple blossom": "A",
  "big indian creek": "A",
  "blackfoot": "A",
  "bonapartes retreat": "A",
  "cider": "A",
  "cotton eyed joe": "A",
  "cottoned eyed joe": "A",
  "cumberland gap": "A",
  "dry and dusty": "A",
  "forked deer": "A",
  "glory in the meeting house": "A",
  "ida red": "A",
  "jeff city": "A",
  "katy hill": "A",
  "leather britches": "A",
  "mississippi sawyer": "A",
  "old joe clark": "A",
  "old bunch of keys": "A",
  "roustabout": "A",
  "sail away ladies": "A",
  "sally johnson": "A",
  "shelvin rock": "A",
  "train 45": "A",
  "texas gales": "A",
  "turkey in the peapatch": "A",
  "wolf and lamb": "A",
  "yew piney mountain": "A",

  // D tunes
  "billy in the lowground": "D",
  "cluck old hen": "D",
  "fisher s hornpipe": "D",
  "fishers hornpipe": "D",
  "five miles from town": "D",
  "john henry": "D",
  "old john henry": "D",
  "johnny come along": "D",
  "ladies in the ballroom": "D",
  "ladies on the steamboat": "D",
  "ladies on a steamboat": "D",
  "lost john": "D",
  "muddy creek": "D",
  "old davy dugger": "D",
  "peas in the pot": "D",
  "prettiest little gal in the county": "D",
  "richmond cotillion": "D",
  "sugar hill": "D",
  "trouble among the yearlings": "D",
  "wild hog in the woods": "D",
  "wolves a-howling": "D",
  "smokey hornpipe": "D",

  // G tunes
  "biddy": "G",
  "black eyed susie": "G",
  "bud, oh bud": "G",
  "ground hog": "G",
  "grey eagle": "G",
  "icy mountain": "G",
  "jaybird died with a whooping cough": "G",
  "kitty puss": "G",
  "liza jane": "G",
  "liza jane with singing": "G",
  "mary wants a lover": "G",
  "old paint": "G",
  "pay day": "G",
  "piney woods gal": "G",
  "piney woods": "G",
  "red rocking chair": "G",
  "rocky pallet": "G",
  "shortenin bread": "G",
  "sleepy lou": "G",
  "susanna gal": "G",
  "the coo coo": "G",

  // E tunes / Em / modal
  "elk river blues": "Em",
  "carroll county blues": "Em",
  "down south blues": "Em",
  "polecat blues": "Em",
  "coon dog": "Em",

  // Am / minor tunes
  "blacksnake bit me on the toe": "Am",
  "indian squaw": "Am",
  "jim shank": "Am",
  "flatwoods": "Am",
  "take sick and die": "Am",
  "old sage fields": "Am",

  // C tunes
  "iowa center": "C",
  "johnny booker": "C",
  "paddy wont you drink some good old cider": "C",
  "rattlin down the acorns": "C",

  // Other
  "georgia railroad": "D",
  "red steer": "D",
  "cornstalk fiddle and a shoestring bow": "G",
  "hey little boy whered you get your britches": "G",
  "great big taters in the sandy lan": "G",
  "mississippi echoes": "D",
  "new money": "D",
  "saddle up the grey": "A",
  "peckerwood": "A",
  "lazy john": "A",
  "knock around the kitchen until the cook comes home": "D",
  "railroading through the rocky mountains": "G",
  "sheep shuckin corn": "G",
  "raleigh and spencer": "D",
  "silverlake waltz": "D",
  "hard times coming cornbread molasses sassafras tea": "G",
  "hell & scissors": "A",
  "broke and ain t got a dime": "Em",
  "promised day": "G",
  "i m going back to dixie": "G",
  "the tom big bee river": "G",
  "old folks, you better get to bed": "D",
  "16 days in georgia": "D",
  "rusty night dance": "A",
  "zollies retreat": "D",
  "meriweather": "D",
  "old man can your dog catch a rabbit": "G",

  // Fiddlin Earl White - extract tune names from compound filenames
  "hickory": "A",
  "marjories favorite": "D",
  "laughing boy": "G",
  "i truly understand": "G",
  "oldtime fire on the": "A",
  "safe harbor reel": "D",
  "texas barbed wire": "A",
  "brush gap": "A",
  "chips and sauce": "D",
  "devil on dry river": "Am",
  "shucking the brush": "A",
  "wolf creek": "D",

  // Dan Gellert misc
  "booth shot lincoln": "A",
  "june apple": "A",
};

function normalizeTitle(title) {
  return title
    .toLowerCase()
    .replace(/[_\-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function findKey(title) {
  const norm = normalizeTitle(title);

  // Direct match
  if (KNOWN_KEYS[norm]) return KNOWN_KEYS[norm];

  // Check if title contains a known tune name
  for (const [tuneName, key] of Object.entries(KNOWN_KEYS)) {
    if (norm.includes(tuneName)) return key;
  }

  // Handle "FiddlinEarlWhite-..." pattern
  if (norm.includes("fiddlinearlwhite")) {
    const parts = norm.split("-");
    // Last part before "feat" is usually the tune name
    for (const part of parts) {
      const cleaned = part.replace(/feat.*$/, "").trim();
      if (cleaned.length > 3) {
        // Try matching cleaned part words
        for (const [tuneName, key] of Object.entries(KNOWN_KEYS)) {
          const tuneWords = tuneName.replace(/\s+/g, "");
          if (cleaned.includes(tuneWords) || tuneWords.includes(cleaned)) {
            return key;
          }
        }
      }
    }
  }

  return null;
}

async function main() {
  const manifest = JSON.parse(readFileSync("manifest.json", "utf-8"));

  let matched = 0;
  let unmatched = 0;
  const unmatchedTitles = [];

  for (const tune of manifest) {
    const key = findKey(tune.title);
    if (key) {
      tune.key = key;
      matched++;
    } else {
      unmatched++;
      unmatchedTitles.push(tune.title);
    }
  }

  console.log(`Matched: ${matched}/${manifest.length}`);
  console.log(`Unmatched: ${unmatched}`);
  if (unmatchedTitles.length > 0) {
    console.log("\nUnmatched titles:");
    unmatchedTitles.forEach((t) => console.log(`  - ${t}`));
  }

  // Show key distribution
  const keyCounts = {};
  for (const tune of manifest) {
    keyCounts[tune.key] = (keyCounts[tune.key] || 0) + 1;
  }
  console.log("\nKey distribution:");
  for (const [key, count] of Object.entries(keyCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${key}: ${count} tunes`);
  }

  // Write local
  writeFileSync("manifest.json", JSON.stringify(manifest, null, 2));
  console.log("\nWrote local manifest.json");

  // Upload to R2
  const client = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  });

  await client.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: "manifest.json",
      Body: JSON.stringify(manifest, null, 2),
      ContentType: "application/json",
    })
  );
  console.log("Uploaded manifest.json to R2");
}

main().catch(console.error);
