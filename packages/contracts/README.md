# Shared API contract

`openapi.json` is generated from the canonical FastAPI application in `apps/api`.

The web application should consume generated TypeScript types and use:

```text
openapi-fetch → typed REST operations
TanStack Query → cache, retries, loading state and invalidation
native WebSocket → ordered run event playback
```

Do not hand-write a second copy of the backend response shapes in the frontend.

Regenerate with:

```bash
python apps/api/scripts/export-openapi.py
```
