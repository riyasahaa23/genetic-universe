"""Export the canonical FastAPI OpenAPI document for frontend generation."""

from __future__ import annotations

import json
import sys
from pathlib import Path

# Allow this script to run from the repository root, apps/api, or the
# packages/contracts workspace script without requiring an editable install.
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.main import create_app


def main() -> None:
    root = Path(__file__).resolve().parents[3]
    target = root / "packages" / "contracts" / "openapi.json"
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(create_app().openapi(), indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(f"wrote {target}")


if __name__ == "__main__":
    main()
