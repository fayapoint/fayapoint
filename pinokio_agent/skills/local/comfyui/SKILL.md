---
name: local-comfyui
description: Generate repeatable image batches with a running local ComfyUI HTTP API and save optimized web assets plus a generation report. Use for FayAi arcade art, visual variants, campaign packs, or other project-bound image batches when ComfyUI is already available.
---

# Local ComfyUI

Use the included client for repeatable image batches. Keep runtime-specific details in command-line arguments; never store ports, absolute paths, credentials, or secrets in this skill.

## Workflow

1. Confirm the ComfyUI API is reachable with `GET /system_stats` and the queue is not unexpectedly busy with `GET /queue`.
2. Write a JSON manifest containing distinct prompts, stable seeds, IDs, and destination-relative output names.
3. Generate a small representative sample before the full batch.
4. Inspect the sample visually, then run the full manifest. Existing outputs are skipped unless `--force` is supplied.
5. Keep `_generation-report.json` beside the generated assets so prompts and seeds remain auditable.
6. Optimize derivatives for the site without overwriting the report or original project source files.

## Client

Run:

```powershell
python scripts/comfyui_client.py image-batch --base-url http://127.0.0.1:PORT --manifest MANIFEST.json --output-dir OUTPUT_DIR
```

Useful options:

- `--limit N`: generate only the first N manifest jobs for visual QA.
- `--force`: regenerate files that already exist.
- `--width`, `--height`, `--quality`: control the web derivative.
- `--timeout`: maximum wait per queued prompt.

The client uses Qwen Image 2512 with its four-step Lightning LoRA. If the configured model names differ, pass the matching names explicitly.

## Manifest format

```json
{
  "jobs": [
    {
      "id": "stable-job-id",
      "prompt": "Complete positive prompt",
      "seed": 123456,
      "output": "game-name/variant-01.webp"
    }
  ]
}
```

See [references/api.md](references/api.md) for the API contract used by the client.

