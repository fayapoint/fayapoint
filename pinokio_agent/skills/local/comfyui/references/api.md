# ComfyUI API contract

The client relies only on the public local HTTP endpoints exposed by ComfyUI:

- `GET /system_stats`: runtime and device health.
- `GET /queue`: running and pending prompt queues.
- `POST /prompt`: submit an API-format workflow as `{ "prompt": graph }`.
- `GET /history/{prompt_id}`: poll completion and discover output images.
- `GET /view?filename=...&subfolder=...&type=...`: download a completed output.

Image workflows use these built-in nodes: `UNETLoader`, `CLIPLoader`, `VAELoader`, `LoraLoaderModelOnly`, `ModelSamplingAuraFlow`, `CLIPTextEncode`, `EmptySD3LatentImage`, `KSampler`, `VAEDecode`, and `SaveImage`.

Do not expose the API beyond the trusted local machine. ComfyUI's local API is not an authentication boundary.

