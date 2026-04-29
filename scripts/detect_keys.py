#!/usr/bin/env python3
"""
Three-tier key detection pipeline for old-time music files.

Tier 1: Match tune names against Slippery Hill reference (fuzzy match)
Tier 2: Essentia audio analysis fallback
Tier 3: Flag low-confidence for manual review

Usage:
    python scripts/detect_keys.py ./audio \
        --reference scripts/tune_keys_reference.json \
        --output manifest.json \
        --threshold 0.5

Dependencies:
    pip install essentia mutagen thefuzz python-Levenshtein
"""

import argparse
import json
import os
import sys
import hashlib
from pathlib import Path

try:
    from mutagen import File as MutagenFile
    from mutagen.mp3 import MP3
    from mutagen.mp4 import MP4
except ImportError:
    print("Install mutagen: pip install mutagen")
    sys.exit(1)

SUPPORTED_EXTENSIONS = {".mp3", ".m4a", ".wav", ".flac", ".ogg"}


def extract_title(filepath: str) -> str:
    """Extract title from ID3/M4A metadata, fall back to cleaned filename."""
    try:
        audio = MutagenFile(filepath)
        if audio and audio.tags:
            if isinstance(audio, MP3) and audio.tags:
                title_frames = audio.tags.getall("TIT2")
                if title_frames:
                    return str(title_frames[0])
            elif isinstance(audio, MP4) and "\xa9nam" in audio.tags:
                return audio.tags["\xa9nam"][0]
            elif hasattr(audio.tags, "get"):
                title = audio.tags.get("title")
                if title:
                    return str(title[0]) if isinstance(title, list) else str(title)
    except Exception:
        pass

    name = Path(filepath).stem
    name = name.replace("_", " ").replace("-", " ")
    return name.title()


def extract_duration(filepath: str) -> float:
    """Extract duration in seconds from audio file."""
    try:
        audio = MutagenFile(filepath)
        if audio and audio.info:
            return audio.info.length
    except Exception:
        pass
    return 0.0


def get_format(filepath: str) -> str:
    """Get audio format from file extension."""
    ext = Path(filepath).suffix.lower()
    return ext.lstrip(".")


def deduplicate_filename(filename: str, existing: set[str]) -> str:
    """Ensure unique filename by appending hash suffix if needed."""
    if filename not in existing:
        return filename

    stem = Path(filename).stem
    ext = Path(filename).suffix
    file_hash = hashlib.md5(filename.encode()).hexdigest()[:6]
    new_name = f"{stem}-{file_hash}{ext}"
    counter = 1
    while new_name in existing:
        new_name = f"{stem}-{file_hash}-{counter}{ext}"
        counter += 1
    return new_name


def tier1_slippery_hill(title: str, reference: dict, threshold: float = 0.85) -> tuple[str | None, float]:
    """Match title against Slippery Hill reference using fuzzy matching."""
    try:
        from thefuzz import fuzz
    except ImportError:
        return None, 0.0

    title_lower = title.lower().strip()

    if title_lower in reference:
        key = reference[title_lower]
        if "," not in key:
            return key, 1.0
        else:
            return None, 0.0

    best_match = None
    best_score = 0
    for ref_title, ref_key in reference.items():
        score = fuzz.ratio(title_lower, ref_title) / 100.0
        if score > best_score:
            best_score = score
            best_match = ref_key

    if best_score >= threshold and best_match and "," not in best_match:
        return best_match, best_score

    return None, best_score


def tier2_essentia(filepath: str) -> tuple[str | None, float]:
    """Detect key using Essentia's KeyExtractor."""
    try:
        import essentia.standard as es
    except ImportError:
        print("Warning: essentia not installed, skipping audio analysis")
        return None, 0.0

    try:
        audio = es.MonoLoader(filename=filepath, sampleRate=44100)()
        key, scale, strength = es.KeyExtractor()(audio)

        if scale == "minor":
            key_str = f"{key}m"
        else:
            key_str = key

        return key_str, float(strength)
    except Exception as e:
        print(f"  Essentia error for {filepath}: {e}")
        return None, 0.0


def process_files(
    audio_dir: str,
    reference_path: str | None,
    threshold: float,
) -> tuple[list[dict], list[dict]]:
    """Process all audio files and return manifest + needs_review lists."""

    reference = {}
    if reference_path and os.path.exists(reference_path):
        with open(reference_path) as f:
            reference = json.load(f)
        print(f"Loaded {len(reference)} tunes from reference")

    manifest = []
    needs_review = []
    used_filenames: set[str] = set()

    audio_files = []
    for root, _dirs, files in os.walk(audio_dir):
        for filename in files:
            ext = Path(filename).suffix.lower()
            if ext in SUPPORTED_EXTENSIONS:
                audio_files.append(os.path.join(root, filename))

    print(f"Found {len(audio_files)} audio files")

    for i, filepath in enumerate(sorted(audio_files)):
        filename = os.path.basename(filepath)
        title = extract_title(filepath)
        duration = extract_duration(filepath)
        fmt = get_format(filepath)

        safe_filename = deduplicate_filename(filename, used_filenames)
        used_filenames.add(safe_filename)
        url = f"tunes/{safe_filename}"

        key = None
        confidence = 0.0
        source = "none"

        if reference:
            key, confidence = tier1_slippery_hill(title, reference)
            if key:
                source = "slippery-hill"
                print(f"  [{i+1}/{len(audio_files)}] {title} -> {key} (Slippery Hill, {confidence:.0%})")

        if not key:
            key, confidence = tier2_essentia(filepath)
            if key:
                source = "essentia"
                print(f"  [{i+1}/{len(audio_files)}] {title} -> {key} (Essentia, {confidence:.0%})")

        if not key:
            key = "?"
            confidence = 0.0
            print(f"  [{i+1}/{len(audio_files)}] {title} -> UNKNOWN")

        entry = {
            "title": title,
            "key": key,
            "url": url,
            "duration": round(duration, 1),
            "confidence": round(confidence, 2),
            "format": fmt,
        }

        manifest.append(entry)

        if confidence < threshold or key == "?":
            needs_review.append({
                **entry,
                "source": source,
                "original_file": filepath,
            })

    return manifest, needs_review


def main():
    parser = argparse.ArgumentParser(description="Detect keys for old-time music files")
    parser.add_argument("audio_dir", help="Directory containing audio files")
    parser.add_argument("--reference", default=None,
                        help="Path to Slippery Hill reference JSON")
    parser.add_argument("--output", default="manifest.json",
                        help="Output manifest JSON path")
    parser.add_argument("--threshold", type=float, default=0.5,
                        help="Confidence threshold for review flagging")
    args = parser.parse_args()

    if not os.path.isdir(args.audio_dir):
        print(f"Error: {args.audio_dir} is not a directory")
        sys.exit(1)

    manifest, needs_review = process_files(
        args.audio_dir,
        args.reference,
        args.threshold,
    )

    with open(args.output, "w") as f:
        json.dump(manifest, f, indent=2)
    print(f"\nWrote {len(manifest)} tunes to {args.output}")

    if needs_review:
        review_path = args.output.replace(".json", "-needs-review.json")
        with open(review_path, "w") as f:
            json.dump(needs_review, f, indent=2)
        print(f"Wrote {len(needs_review)} tunes needing review to {review_path}")


if __name__ == "__main__":
    main()
