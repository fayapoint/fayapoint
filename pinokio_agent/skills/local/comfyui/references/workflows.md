# Workflow and preset guidance

## Select a path

- **Qwen Image 2512 Lightning:** default for polished, repeatable web artwork and multi-variant packs. Four sampling steps keep iteration practical.
- **Z-Image:** alternate image model for style diversity or comparison. Sample before committing to a large batch.
- **Qwen Image Edit 2509 Lightning:** use a reference image when layout, subject, or identity continuity matters. State both what must remain and what must change.
- **LTX 2.3:** use for short silent MP4 motion clips. `--image` switches from text-to-video to image-to-video and is preferable for animating approved art.
- **Generic API workflow:** use when a saved ComfyUI pipeline contains richer audio, interpolation, upscaling, control, or custom-node logic.

## Production sequence

1. Inspect `status` and `inventory`.
2. Generate a low-cost representative sample.
3. Open the asset and check composition, legibility at target size, continuity, unwanted text, and loop behavior.
4. Lock prompt and seed before creating related variants.
5. Create site derivatives from approved masters; keep the generation report.

For minigames, make variants meaningfully different in setting, action, camera, silhouette, color rhythm, and props. Do not rely only on seed changes. Prefer image-to-video from approved stills so motion variants retain the same visual language.

## LTX notes

- Use frame counts shaped as `1 + 8n` (for example 49, 73, or 97).
- Start with a short, low-resolution sample; video inference is substantially heavier than image inference.
- Describe motion, camera behavior, subject stability, and ending state. For loops, explicitly request a return to the starting pose and framing.
- The built-in `video` preset creates silent H.264 MP4. For synchronized audio, spatial upscaling, multi-stage sampling, interpolation, or specialized LoRAs, export and run the full API-format workflow with `run`.

## Export and override an API workflow

Export the graph using ComfyUI's API-format save option. Then inspect its node IDs and run:

```powershell
python scripts/comfyui_client.py run `
  --workflow workflow_api.json `
  --output-dir generated `
  --set 6.text="Replacement prompt" `
  --set 9.seed=123456
```

JSON-looking override values become JSON types; other values remain strings. To bind a local image to a `LoadImage` node:

```powershell
python scripts/comfyui_client.py run `
  --workflow workflow_api.json `
  --output-dir generated `
  --upload-set 7.image=reference.webp
```

Use `--no-wait` for long queued work and later retrieve it with `history --prompt-id ...`. Use `--dry-run` to validate node availability without submitting.
