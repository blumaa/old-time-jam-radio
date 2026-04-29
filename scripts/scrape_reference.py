#!/usr/bin/env python3
"""
One-time scraper for Slippery Hill tune key reference data.
Builds a local lookup table: tune name -> key.

Usage:
    python scripts/scrape_reference.py --output scripts/tune_keys_reference.json
    python scripts/scrape_reference.py --keys G A D --output scripts/tune_keys_reference.json
"""

import argparse
import json
import time
import sys

try:
    import requests
    from bs4 import BeautifulSoup
except ImportError:
    print("Install dependencies: pip install requests beautifulsoup4")
    sys.exit(1)

BASE_URL = "https://www.slippery-hill.com/what-key"
DEFAULT_KEYS = ["c", "g", "d", "a", "e", "b", "f"]
USER_AGENT = "OldTimeDial-KeyScraper/1.0 (personal music practice tool)"
RATE_LIMIT_SECONDS = 1


def scrape_key_page(key: str) -> list[dict]:
    """Scrape a single key page from Slippery Hill."""
    tunes = []
    page = 0

    while True:
        url = f"{BASE_URL}/{key.lower()}"
        if page > 0:
            url += f"?page={page}"

        headers = {"User-Agent": USER_AGENT}

        try:
            response = requests.get(url, headers=headers, timeout=30)
            if response.status_code != 200:
                print(f"  Page {page}: HTTP {response.status_code}, stopping.")
                break

            soup = BeautifulSoup(response.text, "html.parser")

            view_rows = soup.select(".views-row")
            if not view_rows:
                break
            for row in view_rows:
                title_el = row.select_one("h2 a span, h2 a")
                if title_el:
                    title = title_el.get_text(strip=True)
                    if title:
                        tunes.append({"title": title, "key": key.upper()})

            next_link = soup.select_one("a[rel='next'], .pager-next a, li.pager__item--next a")
            if not next_link:
                break

            page += 1
            time.sleep(RATE_LIMIT_SECONDS)

        except requests.RequestException as e:
            print(f"  Error on page {page}: {e}")
            break

    return tunes


def main():
    parser = argparse.ArgumentParser(description="Scrape Slippery Hill for tune keys")
    parser.add_argument("--output", default="scripts/tune_keys_reference.json",
                        help="Output JSON file path")
    parser.add_argument("--keys", nargs="+", default=DEFAULT_KEYS,
                        help="Keys to scrape (default: all common keys)")
    args = parser.parse_args()

    all_tunes = {}

    for key in args.keys:
        print(f"Scraping key: {key.upper()}...")
        tunes = scrape_key_page(key)
        print(f"  Found {len(tunes)} tunes")

        for tune in tunes:
            title_lower = tune["title"].lower().strip()
            if title_lower not in all_tunes:
                all_tunes[title_lower] = tune["key"]
            else:
                existing = all_tunes[title_lower]
                if existing != tune["key"]:
                    all_tunes[title_lower] = f"{existing},{tune['key']}"

        time.sleep(RATE_LIMIT_SECONDS)

    output = {title: key for title, key in sorted(all_tunes.items())}

    with open(args.output, "w") as f:
        json.dump(output, f, indent=2)

    print(f"\nWrote {len(output)} tunes to {args.output}")


if __name__ == "__main__":
    main()
