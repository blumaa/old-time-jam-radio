#!/usr/bin/env python3
"""
Build manifest.json from R2 bucket by reading ID3/M4A metadata.

Downloads partial files (first 256KB) to extract artist/title from tags.
Falls back to "Unknown Artist" and filename-based title when tags are missing.

Usage:
    scripts/.venv/bin/python scripts/build_manifest.py
"""

import json
import os
import re
import io
import tempfile
from pathlib import Path

import boto3
import mutagen
from mutagen.easyid3 import EasyID3
from mutagen.mp4 import MP4

AUDIO_EXTS = re.compile(r"\.(mp3|m4a)$", re.IGNORECASE)
TRACK_NUM_PREFIX = re.compile(r"^\d[\d\-]*[\s.\-]+")

ROCKINGHAMS_TRACKS = {
    1: "Red Steer",
    2: "Battleship Of Maine",
    3: "Western Country",
    4: "Lonesome Pine Special",
    5: "Charleston No. 1 And 3",
    6: "Whitesburg",
    7: "The Winding Stream",
    8: "The Brush Fork Of John's Creek",
    9: "Young And Tender Ladies",
    10: "Ladies On The Steamboat",
    11: "Sugar Hill",
    12: "Trouble On The Mind",
    13: "Baby-O",
    14: "Big Ass Blues",
    15: "Newport Breakdown",
    16: "My Old Kentucky Home",
    17: "Shout Lulu",
    18: "The Cyclone Of Rye Cove",
    19: "Rebel Raid",
    20: "Prairie County Waltz",
}

KNOWN_KEYS = {
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
    "saddle up the grey": "A",
    "peckerwood": "A",
    "lazy john": "A",
    "hell & scissors": "A",
    "rusty night dance": "A",
    "hickory": "A",
    "oldtime fire on the": "A",
    "texas barbed wire": "A",
    "brush gap": "A",
    "shucking the brush": "A",
    "booth shot lincoln": "A",
    "june apple": "A",

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
    "georgia railroad": "D",
    "red steer": "D",
    "mississippi echoes": "D",
    "new money": "D",
    "knock around the kitchen until the cook comes home": "D",
    "raleigh and spencer": "D",
    "silverlake waltz": "D",
    "old folks, you better get to bed": "D",
    "16 days in georgia": "D",
    "zollies retreat": "D",
    "meriweather": "D",
    "marjories favorite": "D",
    "safe harbor reel": "D",
    "chips and sauce": "D",
    "wolf creek": "D",

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
    "cornstalk fiddle and a shoestring bow": "G",
    "hey little boy whered you get your britches": "G",
    "great big taters in the sandy lan": "G",
    "railroading through the rocky mountains": "G",
    "sheep shuckin corn": "G",
    "hard times coming cornbread molasses sassafras tea": "G",
    "promised day": "G",
    "i m going back to dixie": "G",
    "the tom big bee river": "G",
    "old man can your dog catch a rabbit": "G",
    "laughing boy": "G",
    "i truly understand": "G",

    "elk river blues": "Em",
    "carroll county blues": "Em",
    "down south blues": "Em",
    "polecat blues": "Em",
    "coon dog": "Em",
    "broke and ain t got a dime": "Em",

    "blacksnake bit me on the toe": "Am",
    "indian squaw": "Am",
    "jim shank": "Am",
    "flatwoods": "Am",
    "take sick and die": "Am",
    "old sage fields": "Am",
    "devil on dry river": "Am",

    "iowa center": "C",
    "johnny booker": "C",
    "paddy wont you drink some good old cider": "C",
    "rattlin down the acorns": "C",

    # Typos in filenames
    "smokey hornnpipe": "D",

    # Rockinghams - Shout Lulu
    "red steer": "D",
    "ladies on the steamboat": "D",
    "ladies on a steamboat": "D",
    "sugar hill": "D",
    "shout lulu": "G",
    "baby-o": "G",
    "battleship of maine": "D",
    "charleston no. 1 and 3": "C",
    "old baldy": "G",
    "prairie county waltz": "C",
    "the brush fork of john's creek": "A",
    "the cyclone of rye cove": "A",
    "whitesburg": "A",
}


def get_s3_client():
    return boto3.client(
        "s3",
        region_name="auto",
        endpoint_url=f"https://{os.environ['R2_ACCOUNT_ID']}.r2.cloudflarestorage.com",
        aws_access_key_id=os.environ["R2_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["R2_SECRET_ACCESS_KEY"],
    )


def list_audio_files(client, bucket):
    files = []
    token = None
    while True:
        kwargs = {"Bucket": bucket, "MaxKeys": 1000}
        if token:
            kwargs["ContinuationToken"] = token
        resp = client.list_objects_v2(**kwargs)
        for obj in resp.get("Contents", []):
            key = obj["Key"]
            if AUDIO_EXTS.search(key) and "/._" not in key and ".DS_Store" not in key:
                files.append(key)
        token = resp.get("NextContinuationToken")
        if not token:
            break
    return files


def read_metadata(client, bucket, key):
    """Download file to temp, read metadata with mutagen."""
    artist = None
    title = None

    try:
        with tempfile.NamedTemporaryFile(suffix=Path(key).suffix, delete=True) as tmp:
            client.download_fileobj(bucket, key, tmp)
            tmp.flush()

            tags = mutagen.File(tmp.name, easy=True)
            if tags:
                artist = (tags.get("artist") or tags.get("albumartist") or [None])[0]
                title = (tags.get("title") or [None])[0]
    except Exception as e:
        print(f"  Warning: could not read tags from {key}: {e}")

    return artist, title


def parse_filename(key):
    """Extract title and artist from filename when ID3 tags are missing."""
    filename = key.split("/")[-1]
    name = AUDIO_EXTS.sub("", filename)
    name = TRACK_NUM_PREFIX.sub("", name)
    name = name.replace("_", " ").strip()
    name = re.sub(r"-\d+$", "", name).strip()
    name = re.sub(r"\s*\(\d+\)\s*$", "", name).strip()

    # "Tune Name - Artist info - Context" pattern
    parts = [p.strip() for p in name.split(" - ") if p.strip()]
    if len(parts) >= 2:
        title = parts[0]
        artist_part = parts[1]
        # Strip suffixes like "fiddling", "playing", "band"
        artist = re.sub(r"\s+(fiddling|playing|picking|singing)\b.*$", "", artist_part, flags=re.IGNORECASE).strip()
        return title, artist

    return name or filename, None


def normalize_title(title):
    s = title.lower()
    s = s.replace("_", " ").replace("-", " ")
    s = re.sub(r"[''`/]", " ", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s


_NORMALIZED_KEYS = {normalize_title(k): v for k, v in KNOWN_KEYS.items()}


def load_reference(path):
    """Load Slippery Hill reference JSON."""
    if not Path(path).exists():
        return {}
    with open(path) as f:
        return json.load(f)


def find_key(title, reference=None):
    norm = normalize_title(title)

    # Tier 0: hardcoded overrides (highest priority)
    if norm in _NORMALIZED_KEYS:
        return _NORMALIZED_KEYS[norm], 1.0
    for tune_name, key in _NORMALIZED_KEYS.items():
        if tune_name in norm:
            return key, 0.9

    if not reference:
        return None, 0.0

    # Tier 1a: exact match in Slippery Hill reference
    if norm in reference:
        ref_key = reference[norm]
        if "," not in ref_key:
            return ref_key, 1.0

    # Tier 1b: fuzzy match against reference
    try:
        from thefuzz import fuzz
    except ImportError:
        return None, 0.0

    best_key = None
    best_score = 0.0
    for ref_title, ref_key in reference.items():
        if "," in ref_key:
            continue
        score = fuzz.ratio(norm, ref_title) / 100.0
        if score > best_score:
            best_score = score
            best_key = ref_key

    if best_score >= 0.85 and best_key:
        return best_key, best_score

    return None, best_score


def main():
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).resolve().parent.parent / ".env.local")

    client = get_s3_client()
    bucket = os.environ["R2_BUCKET_NAME"]

    ref_path = Path(__file__).resolve().parent / "tune_keys_reference.json"
    reference = load_reference(ref_path)
    if reference:
        print(f"Loaded {len(reference)} tunes from Slippery Hill reference")

    print("Listing audio files in R2...")
    audio_keys = list_audio_files(client, bucket)
    print(f"Found {len(audio_keys)} audio files\n")

    manifest = []
    no_artist = []
    no_title = []

    for i, key in enumerate(audio_keys):
        ext = key.rsplit(".", 1)[-1].lower()
        print(f"[{i+1}/{len(audio_keys)}] {key}")

        artist, title = read_metadata(client, bucket, key)
        filename_title, filename_artist = parse_filename(key)

        if not title:
            title = filename_title
            no_title.append(key)

        # Rockinghams track override — replace "Track XX" with actual names
        if "Rockinghams/Shout Lulu/" in key:
            match = re.search(r"/(\d+)\s", key)
            if match:
                track_num = int(match.group(1))
                if track_num in ROCKINGHAMS_TRACKS:
                    title = ROCKINGHAMS_TRACKS[track_num]

        if not artist:
            artist = filename_artist or "Unknown Artist"
            if not filename_artist:
                no_artist.append(key)

        tune_key, confidence = find_key(title, reference)
        if not tune_key:
            tune_key = "?"
            confidence = 0.0

        manifest.append({
            "title": title.strip(),
            "artist": artist.strip(),
            "key": tune_key,
            "url": key,
            "duration": 0,
            "confidence": round(confidence, 2),
            "format": ext,
        })

    manifest.sort(key=lambda t: t["title"].lower())

    # Stats
    key_counts = {}
    for t in manifest:
        key_counts[t["key"]] = key_counts.get(t["key"], 0) + 1

    print(f"\n{'='*50}")
    print(f"Total: {len(manifest)} tunes")
    print(f"Missing artist (Unknown Artist): {len(no_artist)}")
    print(f"Missing title (from filename): {len(no_title)}")
    print(f"\nKey distribution:")
    for k, count in sorted(key_counts.items(), key=lambda x: -x[1]):
        print(f"  {k}: {count}")

    if no_artist:
        print(f"\nFiles with no artist tag:")
        for f in no_artist:
            print(f"  - {f}")

    unmatched = [t for t in manifest if t["key"] == "?"]
    if unmatched:
        print(f"\nUnmatched keys ({len(unmatched)}):")
        for t in unmatched:
            print(f"  - {t['title']} ({t['url']})")

    # Write local
    out_path = Path(__file__).resolve().parent.parent / "manifest.json"
    out_path.write_text(json.dumps(manifest, indent=2))
    print(f"\nWrote local {out_path}")

    # Upload to R2
    client.put_object(
        Bucket=bucket,
        Key="manifest.json",
        Body=json.dumps(manifest, indent=2),
        ContentType="application/json",
    )
    print("Uploaded manifest.json to R2")


if __name__ == "__main__":
    main()
