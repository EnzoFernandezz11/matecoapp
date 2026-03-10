import argparse
import time
from datetime import datetime, timezone

import requests


DEFAULT_INTERVAL_SECONDS = 600
DEFAULT_TIMEOUT_SECONDS = 15


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def ping_healthcheck(url: str, timeout_seconds: int) -> None:
    response = requests.get(url, timeout=timeout_seconds)
    response.raise_for_status()


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Keep a backend service warm by hitting its health endpoint periodically."
    )
    parser.add_argument(
        "--url",
        required=True,
        help="Health endpoint URL, e.g. https://your-backend-domain/health",
    )
    parser.add_argument(
        "--interval",
        type=int,
        default=DEFAULT_INTERVAL_SECONDS,
        help=f"Seconds between requests (default: {DEFAULT_INTERVAL_SECONDS}).",
    )
    parser.add_argument(
        "--timeout",
        type=int,
        default=DEFAULT_TIMEOUT_SECONDS,
        help=f"HTTP timeout in seconds (default: {DEFAULT_TIMEOUT_SECONDS}).",
    )

    args = parser.parse_args()

    print(f"[{utc_now()}] Keep-alive started for {args.url} every {args.interval}s")

    while True:
        try:
            ping_healthcheck(args.url, args.timeout)
            print(f"[{utc_now()}] OK -> {args.url}")
        except requests.RequestException as exc:
            print(f"[{utc_now()}] ERROR -> {args.url}: {exc}")

        time.sleep(max(1, args.interval))


if __name__ == "__main__":
    main()
