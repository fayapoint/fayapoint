#!/usr/bin/env python3
"""Generate repeatable web-image batches through a local ComfyUI API."""

from __future__ import annotations

import argparse
import json
import time
import urllib.parse
import urllib.request
import uuid
from io import BytesIO
from pathlib import Path
from typing import Any

from PIL import Image


DEFAULT_NEGATIVE = (
    "text, letters, words, typography, logo, watermark, signature, UI screenshot, "
    "blurry, low quality, malformed hands, extra fingers, duplicated objects, cropped subject"
)


def request_json(url: str, *, data: dict[str, Any] | None = None) -> dict[str, Any]:
    body = None if data is None else json.dumps(data).encode("utf-8")
    request = urllib.request.Request(
        url,
        data=body,
        headers={"Content-Type": "application/json"} if body else {},
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.load(response)


def qwen_graph(args: argparse.Namespace, prompt: str, seed: int, prefix: str) -> dict[str, Any]:
    return {
        "1": {"class_type": "UNETLoader", "inputs": {"unet_name": args.unet, "weight_dtype": "default"}},
        "2": {"class_type": "CLIPLoader", "inputs": {"clip_name": args.clip, "type": "qwen_image", "device": "default"}},
        "3": {"class_type": "VAELoader", "inputs": {"vae_name": args.vae}},
        "4": {"class_type": "LoraLoaderModelOnly", "inputs": {"model": ["1", 0], "lora_name": args.lora, "strength_model": 1.0}},
        "5": {"class_type": "ModelSamplingAuraFlow", "inputs": {"model": ["4", 0], "shift": 3.1}},
        "6": {"class_type": "CLIPTextEncode", "inputs": {"clip": ["2", 0], "text": prompt}},
        "7": {"class_type": "CLIPTextEncode", "inputs": {"clip": ["2", 0], "text": DEFAULT_NEGATIVE}},
        "8": {"class_type": "EmptySD3LatentImage", "inputs": {"width": args.width, "height": args.height, "batch_size": 1}},
        "9": {
            "class_type": "KSampler",
            "inputs": {
                "model": ["5", 0], "positive": ["6", 0], "negative": ["7", 0], "latent_image": ["8", 0],
                "seed": seed, "steps": 4, "cfg": 1.0,
                "sampler_name": "euler", "scheduler": "simple", "denoise": 1.0,
            },
        },
        "10": {"class_type": "VAEDecode", "inputs": {"samples": ["9", 0], "vae": ["3", 0]}},
        "11": {"class_type": "SaveImage", "inputs": {"images": ["10", 0], "filename_prefix": prefix}},
    }


def wait_for_image(base_url: str, prompt_id: str, timeout: int) -> dict[str, str]:
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        history = request_json(f"{base_url}/history/{prompt_id}")
        entry = history.get(prompt_id)
        if entry:
            status = entry.get("status", {})
            if status.get("status_str") == "error":
                raise RuntimeError(f"ComfyUI failed prompt {prompt_id}: {status}")
            for node in entry.get("outputs", {}).values():
                images = node.get("images", [])
                if images:
                    return images[0]
        time.sleep(1)
    raise TimeoutError(f"Timed out waiting for ComfyUI prompt {prompt_id}")


def download_image(base_url: str, info: dict[str, str]) -> bytes:
    query = urllib.parse.urlencode(
        {"filename": info["filename"], "subfolder": info.get("subfolder", ""), "type": info.get("type", "output")}
    )
    with urllib.request.urlopen(f"{base_url}/view?{query}", timeout=60) as response:
        return response.read()


def save_webp(data: bytes, destination: Path, quality: int) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(BytesIO(data)) as image:
        image.convert("RGB").save(destination, "WEBP", quality=quality, method=6)


def run_image_batch(args: argparse.Namespace) -> None:
    base_url = args.base_url.rstrip("/")
    stats = request_json(f"{base_url}/system_stats")
    manifest = json.loads(args.manifest.read_text(encoding="utf-8"))
    jobs = manifest["jobs"][: args.limit or None]
    report: dict[str, Any] = {
        "generated_at": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
        "comfyui": stats.get("system", {}).get("comfyui_version"),
        "width": args.width,
        "height": args.height,
        "prompt_prefix": manifest.get("prompt_prefix", ""),
        "jobs": [],
    }

    for index, job in enumerate(jobs, start=1):
        destination = args.output_dir / job["output"]
        if destination.exists() and not args.force:
            print(f"[{index}/{len(jobs)}] skip {job['id']} -> {destination}", flush=True)
            report["jobs"].append({**job, "status": "skipped", "path": str(destination)})
            continue

        prefix = f"codex/{job['id']}-{uuid.uuid4().hex[:8]}"
        prompt = " ".join(part.strip() for part in (manifest.get("prompt_prefix", ""), job["prompt"]) if part.strip())
        graph = qwen_graph(args, prompt, int(job["seed"]), prefix)
        submitted = request_json(f"{base_url}/prompt", data={"prompt": graph})
        prompt_id = submitted["prompt_id"]
        print(f"[{index}/{len(jobs)}] queued {job['id']} ({prompt_id})", flush=True)
        info = wait_for_image(base_url, prompt_id, args.timeout)
        save_webp(download_image(base_url, info), destination, args.quality)
        report["jobs"].append({**job, "resolved_prompt": prompt, "status": "generated", "path": str(destination), "prompt_id": prompt_id})
        print(f"[{index}/{len(jobs)}] saved {destination}", flush=True)

    args.output_dir.mkdir(parents=True, exist_ok=True)
    report_path = args.output_dir / "_generation-report.json"
    report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Report: {report_path}", flush=True)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    subparsers = parser.add_subparsers(dest="command", required=True)
    batch = subparsers.add_parser("image-batch", help="Generate a manifest-defined image batch")
    batch.add_argument("--base-url", required=True)
    batch.add_argument("--manifest", type=Path, required=True)
    batch.add_argument("--output-dir", type=Path, required=True)
    batch.add_argument("--width", type=int, default=960)
    batch.add_argument("--height", type=int, default=544)
    batch.add_argument("--quality", type=int, default=72)
    batch.add_argument("--timeout", type=int, default=900)
    batch.add_argument("--limit", type=int)
    batch.add_argument("--force", action="store_true")
    batch.add_argument("--unet", default="qwen_image_2512_fp8_e4m3fn.safetensors")
    batch.add_argument("--clip", default="qwen_2.5_vl_7b_fp8_scaled.safetensors")
    batch.add_argument("--vae", default="qwen_image_vae.safetensors")
    batch.add_argument("--lora", default="Qwen-Image-2512-Lightning-4steps-V1.0-fp32.safetensors")
    batch.set_defaults(handler=run_image_batch)
    return parser


def main() -> None:
    args = build_parser().parse_args()
    args.handler(args)


if __name__ == "__main__":
    main()
