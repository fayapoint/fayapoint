---
name: local-comfyui
description: Operate a trusted local ComfyUI API for health and model discovery, repeatable Qwen or Z-Image batches, Qwen image edits, LTX video, local input uploads, generic API-workflow execution, output recovery, and explicit queue or memory management. Use when Codex needs to create, edit, animate, or manage project visual assets with a running local ComfyUI.
---

# Local ComfyUI

Use `scripts/comfyui_client.py`. It targets `COMFYUI_URL`, falling back to `http://127.0.0.1:8000`.

## Operating workflow

1. Run `status` and `inventory` before substantial work. Use discovered model names instead of assuming another installation matches this one.
2. Choose the smallest suitable path:
   - `image-batch --preset qwen-2512` for consistent production packs.
   - `image-batch --preset z-image` for an alternate model/style.
   - `image-edit` when a source image, composition, or character must be preserved.
   - `video` for silent LTX 2.3 text-to-video or image-to-video clips.
   - `run` for exported API-format workflows, including custom nodes, audio/video, upscale, or advanced pipelines.
3. Generate one representative asset first, inspect it visually, then expand the batch.
4. Preserve stable seeds, prompts, manifests, and generated reports beside project assets.
5. Do not interrupt work, clear queues, unload models, or free memory unless the user requested it or it is necessary for the active operation. Use explicit `manage` flags.

## Common commands

```powershell
python scripts/comfyui_client.py status
python scripts/comfyui_client.py inventory --json
python scripts/comfyui_client.py image-batch --manifest MANIFEST.json --output-dir OUTPUT_DIR --limit 1
python scripts/comfyui_client.py image-edit --image INPUT.webp --prompt "Preserve the composition; ..." --output EDIT.webp
python scripts/comfyui_client.py video --image INPUT.webp --prompt "Subtle loopable motion; ..." --output CLIP.mp4
python scripts/comfyui_client.py run --workflow WORKFLOW_API.json --output-dir OUTPUT_DIR --set 6.text="New prompt"
python scripts/comfyui_client.py history --prompt-id PROMPT_ID --output-dir OUTPUT_DIR
```

`run` requires a backend/API-format graph, not the regular ComfyUI interface JSON. Apply scalar changes with repeatable `--set NODE.INPUT=VALUE`; upload local images and assign them with `--upload-set NODE.INPUT=FILE`. Use `--dry-run` to check node availability without queuing.

Use `assets/workflows/qwen-image-2512-api.json` as a ready API-workflow example and override its prompt, seed, or dimensions with `run --set`.

For batch manifests, each job needs `id`, `prompt`, `seed`, and an output path relative to `--output-dir`. Jobs may override `preset`, `negative`, `width`, and `height`. Existing files are preserved unless `--force` is supplied.

Read [references/workflows.md](references/workflows.md) for preset and workflow-export guidance, and [references/api.md](references/api.md) for the local API and safety contract.
