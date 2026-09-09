"""Fail when the checked-in OpenAPI contract is stale."""

from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.main import create_app


def main() -> int:
    root = Path(__file__).resolve().parents[3]
    target = root / "packages" / "contracts" / "openapi.json"
    expected = json.dumps(create_app().openapi(), indent=2, sort_keys=True) + "\n"
    if not target.is_file() or target.read_text(encoding="utf-8") != expected:
        print("OpenAPI contract is stale. Run: python apps/api/scripts/export-openapi.py")
        return 1
    print("OpenAPI contract is current")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
