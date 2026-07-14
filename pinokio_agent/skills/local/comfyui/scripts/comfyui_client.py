#!/usr/bin/env python3
"""Operate a trusted local ComfyUI instance through its public HTTP API."""

from __future__ import annotations

import argparse
import json
import mimetypes
import os
import time
import urllib.error
import urllib.parse
import urllib.request
import uuid
from io import BytesIO
from pathlib import Path
from typing import Any

from PIL import Image


DEFAULT_BASE_URL = os.environ.get("COMFYUI_URL", "http://127.0.0.1:8000")
DEFAULT_NEGATIVE = (
    "text, letters, words, typography, logo, watermark, signature, UI screenshot, "
    "blurry, low quality, malformed hands, extra fingers, duplicated objects, cropped subject"
)


def request_bytes(
    url: str,
    *,
    method: str = "GET",
    data: bytes | None = None,
    headers: dict[str, str] | None = None,
    timeout: int = 60,
) -> bytes:
    request = urllib.request.Request(url, data=data, method=method, headers=headers or {})
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            return response.read()
    except urllib.error.HTTPError as error:
        body = error.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"ComfyUI HTTP {error.code} for {url}: {body[:2000]}") from error


def request_json(
    base_url: str,
    path: str,
    *,
    method: str = "GET",
    payload: dict[str, Any] | None = None,
    timeout: int = 60,
) -> dict[str, Any]:
    data = None if payload is None else json.dumps(payload).encode("utf-8")
    headers = {"Content-Type": "application/json"} if data else {}
    raw = request_bytes(f"{base_url.rstrip('/')}{path}", method=method, data=data, headers=headers, timeout=timeout)
    return json.loads(raw) if raw else {}


def upload_file(base_url: str, path: Path, *, overwrite: bool = False) -> dict[str, Any]:
    boundary = f"----codex-comfyui-{uuid.uuid4().hex}"
    mime = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
    parts = [
        f"--{boundary}\r\nContent-Disposition: form-data; name=\"image\"; filename=\"{path.name}\"\r\nContent-Type: {mime}\r\n\r\n".encode(),
        path.read_bytes(),
        f"\r\n--{boundary}\r\nContent-Disposition: form-data; name=\"overwrite\"\r\n\r\n{str(overwrite).lower()}\r\n--{boundary}--\r\n".encode(),
    ]
    raw = request_bytes(
        f"{base_url.rstrip('/')}/upload/image",
        method="POST",
        data=b"".join(parts),
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
    )
    return json.loads(raw)


def uploaded_name(upload: dict[str, Any]) -> str:
    subfolder = upload.get("subfolder", "")
    return f"{subfolder}/{upload['name']}" if subfolder else upload["name"]


def submit_graph(base_url: str, graph: dict[str, Any], client_id: str | None = None) -> str:
    payload: dict[str, Any] = {"prompt": graph, "client_id": client_id or uuid.uuid4().hex}
    response = request_json(base_url, "/prompt", method="POST", payload=payload)
    if "prompt_id" not in response:
        raise RuntimeError(f"ComfyUI rejected workflow: {json.dumps(response, ensure_ascii=False)[:3000]}")
    return response["prompt_id"]


def wait_for_history(base_url: str, prompt_id: str, timeout: int) -> dict[str, Any]:
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        history = request_json(base_url, f"/history/{prompt_id}")
        entry = history.get(prompt_id)
        if entry:
            status = entry.get("status", {})
            if status.get("status_str") == "error":
                raise RuntimeError(f"ComfyUI failed prompt {prompt_id}: {json.dumps(status, ensure_ascii=False)}")
            if status.get("completed") or status.get("status_str") == "success":
                return entry
        time.sleep(1)
    raise TimeoutError(f"Timed out after {timeout}s waiting for ComfyUI prompt {prompt_id}")


def artifacts_from_history(entry: dict[str, Any]) -> list[dict[str, str]]:
    artifacts: list[dict[str, str]] = []
    seen: set[tuple[str, str, str]] = set()
    for node_id, output in entry.get("outputs", {}).items():
        for output_key, values in output.items():
            if not isinstance(values, list):
                continue
            for value in values:
                if not isinstance(value, dict) or "filename" not in value:
                    continue
                record = {
                    "node_id": str(node_id),
                    "output_key": str(output_key),
                    "filename": str(value["filename"]),
                    "subfolder": str(value.get("subfolder", "")),
                    "type": str(value.get("type", "output")),
                }
                key = (record["filename"], record["subfolder"], record["type"])
                if key not in seen:
                    seen.add(key)
                    artifacts.append(record)
    return artifacts


def fetch_artifact(base_url: str, artifact: dict[str, str]) -> bytes:
    query = urllib.parse.urlencode(
        {"filename": artifact["filename"], "subfolder": artifact["subfolder"], "type": artifact["type"]}
    )
    return request_bytes(f"{base_url.rstrip('/')}/view?{query}", timeout=300)


def download_artifacts(base_url: str, entry: dict[str, Any], output_dir: Path) -> list[dict[str, str]]:
    output_dir.mkdir(parents=True, exist_ok=True)
    downloaded: list[dict[str, str]] = []
    used: set[str] = set()
    for artifact in artifacts_from_history(entry):
        name = Path(artifact["filename"]).name
        if name in used:
            name = f"node-{artifact['node_id']}-{name}"
        used.add(name)
        destination = output_dir / name
        destination.write_bytes(fetch_artifact(base_url, artifact))
        downloaded.append({**artifact, "path": str(destination)})
    return downloaded


def save_webp(data: bytes, destination: Path, quality: int) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(BytesIO(data)) as image:
        image.convert("RGB").save(destination, "WEBP", quality=quality, method=6)


def first_artifact(entry: dict[str, Any]) -> dict[str, str]:
    artifacts = artifacts_from_history(entry)
    if not artifacts:
        raise RuntimeError("Workflow completed but returned no downloadable artifacts")
    return artifacts[0]


def parse_value(value: str) -> Any:
    try:
        return json.loads(value)
    except json.JSONDecodeError:
        return value


def apply_overrides(graph: dict[str, Any], overrides: list[str]) -> None:
    for override in overrides:
        if "=" not in override or "." not in override.split("=", 1)[0]:
            raise ValueError(f"Invalid override '{override}'. Expected NODE.INPUT=VALUE")
        target, raw_value = override.split("=", 1)
        node_id, input_name = target.split(".", 1)
        if node_id not in graph:
            raise KeyError(f"Workflow has no node '{node_id}'")
        graph[node_id].setdefault("inputs", {})[input_name] = parse_value(raw_value)


def validate_graph(base_url: str, graph: dict[str, Any]) -> None:
    object_info = request_json(base_url, "/object_info")
    missing = sorted({str(node.get("class_type")) for node in graph.values() if node.get("class_type") not in object_info})
    if missing:
        raise RuntimeError(f"Workflow requires unavailable nodes: {', '.join(missing)}")


def qwen_graph(
    prompt: str,
    negative: str,
    width: int,
    height: int,
    seed: int,
    prefix: str,
    *,
    unet: str,
    clip: str,
    vae: str,
    lora: str,
) -> dict[str, Any]:
    return {
        "1": {"class_type": "UNETLoader", "inputs": {"unet_name": unet, "weight_dtype": "default"}},
        "2": {"class_type": "CLIPLoader", "inputs": {"clip_name": clip, "type": "qwen_image", "device": "default"}},
        "3": {"class_type": "VAELoader", "inputs": {"vae_name": vae}},
        "4": {"class_type": "LoraLoaderModelOnly", "inputs": {"model": ["1", 0], "lora_name": lora, "strength_model": 1.0}},
        "5": {"class_type": "ModelSamplingAuraFlow", "inputs": {"model": ["4", 0], "shift": 3.1}},
        "6": {"class_type": "CLIPTextEncode", "inputs": {"clip": ["2", 0], "text": prompt}},
        "7": {"class_type": "CLIPTextEncode", "inputs": {"clip": ["2", 0], "text": negative}},
        "8": {"class_type": "EmptySD3LatentImage", "inputs": {"width": width, "height": height, "batch_size": 1}},
        "9": {"class_type": "KSampler", "inputs": {"model": ["5", 0], "positive": ["6", 0], "negative": ["7", 0], "latent_image": ["8", 0], "seed": seed, "steps": 4, "cfg": 1.0, "sampler_name": "euler", "scheduler": "simple", "denoise": 1.0}},
        "10": {"class_type": "VAEDecode", "inputs": {"samples": ["9", 0], "vae": ["3", 0]}},
        "11": {"class_type": "SaveImage", "inputs": {"images": ["10", 0], "filename_prefix": prefix}},
    }


def z_image_graph(
    prompt: str,
    negative: str,
    width: int,
    height: int,
    seed: int,
    prefix: str,
    *,
    unet: str,
    clip: str,
    vae: str,
) -> dict[str, Any]:
    return {
        "1": {"class_type": "UNETLoader", "inputs": {"unet_name": unet, "weight_dtype": "default"}},
        "2": {"class_type": "CLIPLoader", "inputs": {"clip_name": clip, "type": "lumina2", "device": "default"}},
        "3": {"class_type": "VAELoader", "inputs": {"vae_name": vae}},
        "4": {"class_type": "ModelSamplingAuraFlow", "inputs": {"model": ["1", 0], "shift": 3.0}},
        "5": {"class_type": "CLIPTextEncode", "inputs": {"clip": ["2", 0], "text": prompt}},
        "6": {"class_type": "CLIPTextEncode", "inputs": {"clip": ["2", 0], "text": negative}},
        "7": {"class_type": "EmptySD3LatentImage", "inputs": {"width": width, "height": height, "batch_size": 1}},
        "8": {"class_type": "KSampler", "inputs": {"model": ["4", 0], "positive": ["5", 0], "negative": ["6", 0], "latent_image": ["7", 0], "seed": seed, "steps": 30, "cfg": 4.0, "sampler_name": "res_multistep", "scheduler": "simple", "denoise": 1.0}},
        "9": {"class_type": "VAEDecode", "inputs": {"samples": ["8", 0], "vae": ["3", 0]}},
        "10": {"class_type": "SaveImage", "inputs": {"images": ["9", 0], "filename_prefix": prefix}},
    }


def qwen_edit_graph(args: argparse.Namespace, server_image: str, width: int, height: int, prefix: str) -> dict[str, Any]:
    megapixels = max(0.1, width * height / 1_000_000)
    return {
        "1": {"class_type": "UNETLoader", "inputs": {"unet_name": args.unet, "weight_dtype": "default"}},
        "2": {"class_type": "CLIPLoader", "inputs": {"clip_name": args.clip, "type": "qwen_image", "device": "default"}},
        "3": {"class_type": "VAELoader", "inputs": {"vae_name": args.vae}},
        "4": {"class_type": "LoraLoaderModelOnly", "inputs": {"model": ["1", 0], "lora_name": args.lora, "strength_model": 1.0}},
        "5": {"class_type": "ModelSamplingAuraFlow", "inputs": {"model": ["4", 0], "shift": 3.1}},
        "6": {"class_type": "LoadImage", "inputs": {"image": server_image}},
        "7": {"class_type": "ImageScaleToTotalPixels", "inputs": {"image": ["6", 0], "upscale_method": "lanczos", "megapixels": megapixels, "resolution_steps": 1}},
        "8": {"class_type": "TextEncodeQwenImageEdit", "inputs": {"clip": ["2", 0], "prompt": args.prompt, "vae": ["3", 0], "image": ["7", 0]}},
        "9": {"class_type": "CLIPTextEncode", "inputs": {"clip": ["2", 0], "text": args.negative}},
        "10": {"class_type": "EmptySD3LatentImage", "inputs": {"width": width, "height": height, "batch_size": 1}},
        "11": {"class_type": "KSampler", "inputs": {"model": ["5", 0], "positive": ["8", 0], "negative": ["9", 0], "latent_image": ["10", 0], "seed": args.seed, "steps": 4, "cfg": 1.0, "sampler_name": "euler", "scheduler": "simple", "denoise": 1.0}},
        "12": {"class_type": "VAEDecode", "inputs": {"samples": ["11", 0], "vae": ["3", 0]}},
        "13": {"class_type": "SaveImage", "inputs": {"images": ["12", 0], "filename_prefix": prefix}},
    }


def ltx_video_graph(args: argparse.Namespace, prefix: str, server_image: str | None) -> dict[str, Any]:
    graph: dict[str, Any] = {
        "1": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": args.checkpoint}},
        "2": {"class_type": "LoraLoaderModelOnly", "inputs": {"model": ["1", 0], "lora_name": args.lora, "strength_model": args.lora_strength}},
        "3": {"class_type": "LTXAVTextEncoderLoader", "inputs": {"text_encoder": args.text_encoder, "ckpt_name": args.checkpoint, "device": "default"}},
        "4": {"class_type": "CLIPTextEncode", "inputs": {"clip": ["3", 0], "text": args.prompt}},
        "5": {"class_type": "CLIPTextEncode", "inputs": {"clip": ["3", 0], "text": args.negative}},
        "6": {"class_type": "LTXVConditioning", "inputs": {"positive": ["4", 0], "negative": ["5", 0], "frame_rate": args.fps}},
    }
    if server_image:
        graph.update({
            "7": {"class_type": "LoadImage", "inputs": {"image": server_image}},
            "8": {"class_type": "LTXVImgToVideo", "inputs": {"positive": ["6", 0], "negative": ["6", 1], "vae": ["1", 2], "image": ["7", 0], "width": args.width, "height": args.height, "length": args.length, "batch_size": 1, "strength": args.strength}},
            "9": {"class_type": "ModelSamplingLTXV", "inputs": {"model": ["2", 0], "max_shift": 2.05, "base_shift": 0.95, "latent": ["8", 2]}},
            "10": {"class_type": "KSampler", "inputs": {"model": ["9", 0], "positive": ["8", 0], "negative": ["8", 1], "latent_image": ["8", 2], "seed": args.seed, "steps": args.steps, "cfg": 1.0, "sampler_name": "euler", "scheduler": "simple", "denoise": 1.0}},
            "11": {"class_type": "VAEDecodeTiled", "inputs": {"samples": ["10", 0], "vae": ["1", 2], "tile_size": 256, "overlap": 64, "temporal_size": 32, "temporal_overlap": 4}},
            "12": {"class_type": "CreateVideo", "inputs": {"images": ["11", 0], "fps": args.fps, "bit_depth": 8}},
            "13": {"class_type": "SaveVideo", "inputs": {"video": ["12", 0], "filename_prefix": prefix, "format": "mp4", "codec": "h264"}},
        })
    else:
        graph.update({
            "7": {"class_type": "EmptyLTXVLatentVideo", "inputs": {"width": args.width, "height": args.height, "length": args.length, "batch_size": 1}},
            "8": {"class_type": "ModelSamplingLTXV", "inputs": {"model": ["2", 0], "max_shift": 2.05, "base_shift": 0.95, "latent": ["7", 0]}},
            "9": {"class_type": "KSampler", "inputs": {"model": ["8", 0], "positive": ["6", 0], "negative": ["6", 1], "latent_image": ["7", 0], "seed": args.seed, "steps": args.steps, "cfg": 1.0, "sampler_name": "euler", "scheduler": "simple", "denoise": 1.0}},
            "10": {"class_type": "VAEDecodeTiled", "inputs": {"samples": ["9", 0], "vae": ["1", 2], "tile_size": 256, "overlap": 64, "temporal_size": 32, "temporal_overlap": 4}},
            "11": {"class_type": "CreateVideo", "inputs": {"images": ["10", 0], "fps": args.fps, "bit_depth": 8}},
            "12": {"class_type": "SaveVideo", "inputs": {"video": ["11", 0], "filename_prefix": prefix, "format": "mp4", "codec": "h264"}},
        })
    return graph


def run_status(args: argparse.Namespace) -> None:
    stats = request_json(args.base_url, "/system_stats")
    queue = request_json(args.base_url, "/queue")
    result = {
        "base_url": args.base_url,
        "system": stats.get("system", {}),
        "devices": stats.get("devices", []),
        "queue_running": len(queue.get("queue_running", [])),
        "queue_pending": len(queue.get("queue_pending", [])),
    }
    if args.json:
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return
    system = result["system"]
    print(f"ComfyUI {system.get('comfyui_version')} at {args.base_url}")
    print(f"Python: {system.get('python_version')} | OS: {system.get('os')}")
    for device in result["devices"]:
        total = int(device.get("vram_total", 0)) / 1024**3
        free = int(device.get("vram_free", 0)) / 1024**3
        print(f"GPU: {device.get('name')} | VRAM {free:.1f}/{total:.1f} GiB free")
    print(f"Queue: {result['queue_running']} running, {result['queue_pending']} pending")


def combo_options(object_info: dict[str, Any], node: str, input_name: str) -> list[str]:
    spec = object_info.get(node, {}).get("input", {}).get("required", {}).get(input_name, [])
    if spec and isinstance(spec[0], list):
        return [str(value) for value in spec[0]]
    if len(spec) > 1 and isinstance(spec[1], dict):
        return [str(value) for value in spec[1].get("options", [])]
    return []


def run_inventory(args: argparse.Namespace) -> None:
    info = request_json(args.base_url, "/object_info")
    result = {
        "capabilities": {
            "qwen_image": all(name in info for name in ["UNETLoader", "CLIPLoader", "ModelSamplingAuraFlow"]),
            "qwen_edit": "TextEncodeQwenImageEdit" in info,
            "ltx_video": all(name in info for name in ["EmptyLTXVLatentVideo", "LTXVConditioning", "SaveVideo"]),
            "image_to_video": "LTXVImgToVideo" in info,
            "workflow_runner": True,
        },
        "models": {
            "checkpoints": combo_options(info, "CheckpointLoaderSimple", "ckpt_name"),
            "diffusion_models": combo_options(info, "UNETLoader", "unet_name"),
            "text_encoders": combo_options(info, "CLIPLoader", "clip_name"),
            "vaes": combo_options(info, "VAELoader", "vae_name"),
            "loras": combo_options(info, "LoraLoaderModelOnly", "lora_name"),
            "latent_upscalers": combo_options(info, "LatentUpscaleModelLoader", "model_name"),
        },
        "node_count": len(info),
    }
    if args.json:
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return
    print(f"Nodes available: {result['node_count']}")
    print("Capabilities: " + ", ".join(name for name, ready in result["capabilities"].items() if ready))
    for category, models in result["models"].items():
        print(f"\n{category} ({len(models)}):")
        for model in models:
            print(f"  - {model}")


def run_upload(args: argparse.Namespace) -> None:
    result = upload_file(args.base_url, args.file, overwrite=args.overwrite)
    print(json.dumps({**result, "load_image_value": uploaded_name(result)}, ensure_ascii=False, indent=2))


def load_api_graph(path: Path) -> dict[str, Any]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    graph = payload.get("prompt", payload)
    if not isinstance(graph, dict) or not all(isinstance(node, dict) and "class_type" in node for node in graph.values()):
        raise ValueError("Workflow must be ComfyUI API format, either the prompt object or {'prompt': prompt}")
    return graph


def run_workflow(args: argparse.Namespace) -> None:
    graph = load_api_graph(args.workflow)
    apply_overrides(graph, args.overrides)
    for upload_override in args.upload_overrides:
        if "=" not in upload_override or "." not in upload_override.split("=", 1)[0]:
            raise ValueError(f"Invalid upload override '{upload_override}'. Expected NODE.INPUT=FILE")
        target, file_name = upload_override.split("=", 1)
        uploaded = upload_file(args.base_url, Path(file_name), overwrite=args.overwrite_uploads)
        apply_overrides(graph, [f"{target}={json.dumps(uploaded_name(uploaded))}"])
    validate_graph(args.base_url, graph)
    if args.dry_run:
        print(json.dumps({"valid": True, "nodes": len(graph)}, indent=2))
        return
    prompt_id = submit_graph(args.base_url, graph, args.client_id)
    print(f"Queued {prompt_id}", flush=True)
    if args.no_wait:
        return
    entry = wait_for_history(args.base_url, prompt_id, args.timeout)
    downloads = download_artifacts(args.base_url, entry, args.output_dir)
    report = {"prompt_id": prompt_id, "workflow": str(args.workflow), "downloads": downloads}
    (args.output_dir / "_comfyui-run.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False, indent=2))


def run_history(args: argparse.Namespace) -> None:
    history = request_json(args.base_url, f"/history/{args.prompt_id}")
    entry = history.get(args.prompt_id)
    if not entry:
        raise KeyError(f"No history found for prompt {args.prompt_id}")
    downloads = download_artifacts(args.base_url, entry, args.output_dir)
    print(json.dumps({"prompt_id": args.prompt_id, "downloads": downloads}, ensure_ascii=False, indent=2))


def run_manage(args: argparse.Namespace) -> None:
    if args.interrupt:
        request_json(args.base_url, "/interrupt", method="POST", payload={})
        print("Interrupted running prompt")
    if args.clear_pending:
        request_json(args.base_url, "/queue", method="POST", payload={"clear": True})
        print("Cleared pending queue")
    if args.unload_models or args.free_memory:
        request_json(args.base_url, "/free", method="POST", payload={"unload_models": args.unload_models, "free_memory": args.free_memory})
        print("Requested model unload/free memory")
    if not any([args.interrupt, args.clear_pending, args.unload_models, args.free_memory]):
        print(json.dumps(request_json(args.base_url, "/queue"), ensure_ascii=False, indent=2))


def run_image_batch(args: argparse.Namespace) -> None:
    stats = request_json(args.base_url, "/system_stats")
    manifest = json.loads(args.manifest.read_text(encoding="utf-8"))
    jobs = manifest["jobs"][: args.limit or None]
    report: dict[str, Any] = {"generated_at": time.strftime("%Y-%m-%dT%H:%M:%S%z"), "comfyui": stats.get("system", {}).get("comfyui_version"), "prompt_prefix": manifest.get("prompt_prefix", ""), "jobs": []}
    for index, job in enumerate(jobs, start=1):
        destination = args.output_dir / job["output"]
        if destination.exists() and not args.force:
            print(f"[{index}/{len(jobs)}] skip {job['id']} -> {destination}", flush=True)
            report["jobs"].append({**job, "status": "existing", "path": str(destination)})
            continue
        prompt = " ".join(part.strip() for part in (manifest.get("prompt_prefix", ""), job["prompt"]) if part.strip())
        negative = job.get("negative", manifest.get("negative", args.negative))
        width = int(job.get("width", args.width))
        height = int(job.get("height", args.height))
        if width <= 0 or height <= 0 or width % 16 or height % 16:
            raise ValueError(f"Job '{job['id']}' dimensions must be positive multiples of 16, got {width}x{height}")
        seed = int(job["seed"])
        preset = job.get("preset", args.preset)
        prefix = f"codex/{job['id']}-{uuid.uuid4().hex[:8]}"
        if preset == "qwen-2512":
            graph = qwen_graph(prompt, negative, width, height, seed, prefix, unet=args.qwen_unet, clip=args.qwen_clip, vae=args.qwen_vae, lora=args.qwen_lora)
        else:
            graph = z_image_graph(prompt, negative, width, height, seed, prefix, unet=args.z_unet, clip=args.z_clip, vae=args.z_vae)
        prompt_id = submit_graph(args.base_url, graph)
        print(f"[{index}/{len(jobs)}] queued {job['id']} ({prompt_id})", flush=True)
        entry = wait_for_history(args.base_url, prompt_id, args.timeout)
        artifact = first_artifact(entry)
        save_webp(fetch_artifact(args.base_url, artifact), destination, args.quality)
        report["jobs"].append({**job, "resolved_prompt": prompt, "preset": preset, "status": "generated", "path": str(destination), "prompt_id": prompt_id})
        print(f"[{index}/{len(jobs)}] saved {destination}", flush=True)
    args.output_dir.mkdir(parents=True, exist_ok=True)
    report_path = args.output_dir / "_generation-report.json"
    report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Report: {report_path}")


def run_image_edit(args: argparse.Namespace) -> None:
    with Image.open(args.image) as source:
        source_width, source_height = source.size
    width = args.width or max(16, round(source_width / 16) * 16)
    height = args.height or max(16, round(source_height / 16) * 16)
    if width <= 0 or height <= 0 or width % 16 or height % 16:
        raise ValueError(f"Image-edit dimensions must be positive multiples of 16, got {width}x{height}")
    upload = upload_file(args.base_url, args.image, overwrite=args.overwrite_upload)
    prefix = f"codex/edit-{args.output.stem}-{uuid.uuid4().hex[:8]}"
    graph = qwen_edit_graph(args, uploaded_name(upload), width, height, prefix)
    validate_graph(args.base_url, graph)
    prompt_id = submit_graph(args.base_url, graph)
    print(f"Queued {prompt_id}", flush=True)
    entry = wait_for_history(args.base_url, prompt_id, args.timeout)
    save_webp(fetch_artifact(args.base_url, first_artifact(entry)), args.output, args.quality)
    print(json.dumps({"prompt_id": prompt_id, "output": str(args.output), "width": width, "height": height}, indent=2))


def run_video(args: argparse.Namespace) -> None:
    if args.width <= 0 or args.height <= 0 or args.width % 32 or args.height % 32:
        raise ValueError(f"LTX dimensions must be positive multiples of 32, got {args.width}x{args.height}")
    if args.length < 1 or (args.length - 1) % 8:
        raise ValueError(f"LTX frame count must use 1+8n, got {args.length}")
    if args.image and args.length < 9:
        raise ValueError("LTX image-to-video requires at least 9 frames")
    if not 0.0 <= args.strength <= 1.0:
        raise ValueError(f"Image-to-video strength must be between 0 and 1, got {args.strength}")
    if args.output.suffix.lower() != ".mp4":
        raise ValueError("The built-in LTX video preset writes H.264 MP4; use an .mp4 output path")
    server_image = None
    if args.image:
        server_image = uploaded_name(upload_file(args.base_url, args.image, overwrite=args.overwrite_upload))
    prefix = f"codex/video-{args.output.stem}-{uuid.uuid4().hex[:8]}"
    graph = ltx_video_graph(args, prefix, server_image)
    validate_graph(args.base_url, graph)
    prompt_id = submit_graph(args.base_url, graph)
    print(f"Queued {prompt_id}", flush=True)
    entry = wait_for_history(args.base_url, prompt_id, args.timeout)
    artifact = first_artifact(entry)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_bytes(fetch_artifact(args.base_url, artifact))
    print(json.dumps({"prompt_id": prompt_id, "output": str(args.output), "frames": args.length, "fps": args.fps}, indent=2))


def common_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(add_help=False)
    parser.add_argument("--base-url", default=DEFAULT_BASE_URL, help=f"ComfyUI URL (default: COMFYUI_URL or {DEFAULT_BASE_URL})")
    return parser


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    subparsers = parser.add_subparsers(dest="command", required=True)
    common = common_parser()

    status = subparsers.add_parser("status", parents=[common], help="Show health, GPU VRAM, and queue")
    status.add_argument("--json", action="store_true")
    status.set_defaults(handler=run_status)

    inventory = subparsers.add_parser("inventory", parents=[common], help="Discover installed capabilities and model choices")
    inventory.add_argument("--json", action="store_true")
    inventory.set_defaults(handler=run_inventory)

    upload = subparsers.add_parser("upload", parents=[common], help="Upload an input image")
    upload.add_argument("--file", type=Path, required=True)
    upload.add_argument("--overwrite", action="store_true")
    upload.set_defaults(handler=run_upload)

    workflow = subparsers.add_parser("run", parents=[common], help="Run any API-format ComfyUI workflow")
    workflow.add_argument("--workflow", type=Path, required=True)
    workflow.add_argument("--output-dir", type=Path, required=True)
    workflow.add_argument("--set", dest="overrides", action="append", default=[], metavar="NODE.INPUT=VALUE")
    workflow.add_argument("--upload-set", dest="upload_overrides", action="append", default=[], metavar="NODE.INPUT=FILE")
    workflow.add_argument("--overwrite-uploads", action="store_true")
    workflow.add_argument("--client-id")
    workflow.add_argument("--timeout", type=int, default=1800)
    workflow.add_argument("--dry-run", action="store_true")
    workflow.add_argument("--no-wait", action="store_true")
    workflow.set_defaults(handler=run_workflow)

    history = subparsers.add_parser("history", parents=[common], help="Download outputs for a completed prompt")
    history.add_argument("--prompt-id", required=True)
    history.add_argument("--output-dir", type=Path, required=True)
    history.set_defaults(handler=run_history)

    manage = subparsers.add_parser("manage", parents=[common], help="Inspect or explicitly manage queue and memory")
    manage.add_argument("--interrupt", action="store_true")
    manage.add_argument("--clear-pending", action="store_true")
    manage.add_argument("--unload-models", action="store_true")
    manage.add_argument("--free-memory", action="store_true")
    manage.set_defaults(handler=run_manage)

    batch = subparsers.add_parser("image-batch", parents=[common], help="Generate a manifest-defined web image batch")
    batch.add_argument("--manifest", type=Path, required=True)
    batch.add_argument("--output-dir", type=Path, required=True)
    batch.add_argument("--preset", choices=["qwen-2512", "z-image"], default="qwen-2512")
    batch.add_argument("--width", type=int, default=960)
    batch.add_argument("--height", type=int, default=544)
    batch.add_argument("--quality", type=int, default=72)
    batch.add_argument("--negative", default=DEFAULT_NEGATIVE)
    batch.add_argument("--timeout", type=int, default=900)
    batch.add_argument("--limit", type=int)
    batch.add_argument("--force", action="store_true")
    batch.add_argument("--qwen-unet", default="qwen_image_2512_fp8_e4m3fn.safetensors")
    batch.add_argument("--qwen-clip", default="qwen_2.5_vl_7b_fp8_scaled.safetensors")
    batch.add_argument("--qwen-vae", default="qwen_image_vae.safetensors")
    batch.add_argument("--qwen-lora", default="Qwen-Image-2512-Lightning-4steps-V1.0-fp32.safetensors")
    batch.add_argument("--z-unet", default="z_image_bf16.safetensors")
    batch.add_argument("--z-clip", default="qwen_3_4b.safetensors")
    batch.add_argument("--z-vae", default="ae.safetensors")
    batch.set_defaults(handler=run_image_batch)

    edit = subparsers.add_parser("image-edit", parents=[common], help="Edit an image with Qwen Image Edit 2509 Lightning")
    edit.add_argument("--image", type=Path, required=True)
    edit.add_argument("--prompt", required=True)
    edit.add_argument("--output", type=Path, required=True)
    edit.add_argument("--negative", default=DEFAULT_NEGATIVE)
    edit.add_argument("--width", type=int)
    edit.add_argument("--height", type=int)
    edit.add_argument("--seed", type=int, default=42)
    edit.add_argument("--quality", type=int, default=80)
    edit.add_argument("--timeout", type=int, default=1200)
    edit.add_argument("--overwrite-upload", action="store_true")
    edit.add_argument("--unet", default="qwen_image_edit_2509_fp8_e4m3fn.safetensors")
    edit.add_argument("--clip", default="qwen_2.5_vl_7b_fp8_scaled.safetensors")
    edit.add_argument("--vae", default="qwen_image_vae.safetensors")
    edit.add_argument("--lora", default="Qwen-Image-Edit-2509-Lightning-4steps-V1.0-bf16.safetensors")
    edit.set_defaults(handler=run_image_edit)

    video = subparsers.add_parser("video", parents=[common], help="Generate silent MP4 with LTX 2.3 text-to-video or image-to-video")
    video.add_argument("--prompt", required=True)
    video.add_argument("--output", type=Path, required=True)
    video.add_argument("--image", type=Path)
    video.add_argument("--negative", default="cartoon, childish, blurry, low quality, flicker, warped anatomy")
    video.add_argument("--width", type=int, default=768)
    video.add_argument("--height", type=int, default=512)
    video.add_argument("--length", type=int, default=97, help="Frame count; use 1+8n")
    video.add_argument("--fps", type=float, default=24)
    video.add_argument("--steps", type=int, default=9)
    video.add_argument("--seed", type=int, default=42)
    video.add_argument("--strength", type=float, default=1.0)
    video.add_argument("--timeout", type=int, default=3600)
    video.add_argument("--overwrite-upload", action="store_true")
    video.add_argument("--checkpoint", default="ltx-2.3-22b-dev-fp8.safetensors")
    video.add_argument("--lora", default="ltx-2.3-22b-distilled-lora-384.safetensors")
    video.add_argument("--lora-strength", type=float, default=0.5)
    video.add_argument("--text-encoder", default="gemma_3_12B_it_fp4_mixed.safetensors")
    video.set_defaults(handler=run_video)
    return parser


def main() -> None:
    args = build_parser().parse_args()
    args.handler(args)


if __name__ == "__main__":
    main()
