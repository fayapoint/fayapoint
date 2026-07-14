# ComfyUI local API contract

The client uses ComfyUI's local HTTP API:

- `GET /system_stats`: runtime, version, and GPU memory.
- `GET /object_info`: installed nodes and model option discovery.
- `GET /queue`: running and pending work.
- `POST /prompt`: submit an API-format graph.
- `GET /history/{prompt_id}`: poll status and recover output metadata.
- `GET /view`: download an image, animation, video, or other file from history metadata.
- `POST /upload/image`: upload an input image for `LoadImage`.
- `POST /interrupt`: interrupt current execution.
- `POST /queue` with `{ "clear": true }`: clear pending work.
- `POST /free`: unload models and/or release cached memory.

The client treats any history output containing `filename`, `subfolder`, and `type` as downloadable. This covers `SaveImage` and `SaveVideo` outputs without hard-coding a file extension.

## Safety boundary

Use only a trusted local ComfyUI instance. The API is powerful, can invoke custom nodes, and is not an authentication boundary. Do not expose it publicly. Do not load untrusted workflow JSON or model files. Queue and memory mutations require explicit client flags.

## Generic workflow rules

The `/prompt` endpoint accepts an API graph keyed by node ID:

```json
{
  "6": {
    "class_type": "CLIPTextEncode",
    "inputs": {
      "text": "Prompt",
      "clip": ["2", 0]
    }
  }
}
```

The normal browser workflow includes layout metadata and is not interchangeable with this graph. Export a workflow in API format before using `run`. The client validates all `class_type` values against `/object_info` before submission, but ComfyUI remains the final validator for types and connections.
