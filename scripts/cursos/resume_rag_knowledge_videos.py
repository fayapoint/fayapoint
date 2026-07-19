# -*- coding: utf-8 -*-
"""Resume rag-knowledge's missing videos (all images done, ~50 videos were
interrupted when ComfyUI restarted overnight). Reuses already-written
prompts from both prompt files (they have slightly different schemas)."""
import json, time, uuid, urllib.request
from pathlib import Path

API = "http://localhost:8000"
NEGATIVE = "blurry, low quality, still frame, watermark, text, deformed, glitch, jitter"
SLUG = "rag-knowledge"
OUT_DIR = Path(f"C:/WORKS/ComfyUI/output/course_media/{SLUG}/inline")
VIDEO_SEED_BASE = 12000

def post(path, payload):
    req = urllib.request.Request(API + path, json.dumps(payload).encode(), {"Content-Type": "application/json"})
    return json.loads(urllib.request.urlopen(req, timeout=30).read())

def free_vram():
    try:
        post("/free", {"unload_models": True, "free_memory": True})
        time.sleep(2)
    except Exception:
        pass

def build_video(input_image, motion, prefix, seed):
    return {
        "1": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": "ltx-2.3-22b-dev-fp8.safetensors"}},
        "2": {"class_type": "LoraLoaderModelOnly", "inputs": {"model": ["1", 0], "lora_name": "ltx-2.3-22b-distilled-lora-384.safetensors", "strength_model": 0.5}},
        "3": {"class_type": "LTXAVTextEncoderLoader", "inputs": {"text_encoder": "gemma_3_12B_it_fp4_mixed.safetensors", "ckpt_name": "ltx-2.3-22b-dev-fp8.safetensors", "device": "default"}},
        "4": {"class_type": "LatentUpscaleModelLoader", "inputs": {"model_name": "ltx-2.3-spatial-upscaler-x2-1.1.safetensors"}},
        "5": {"class_type": "CLIPTextEncode", "inputs": {"text": motion, "clip": ["3", 0]}},
        "6": {"class_type": "CLIPTextEncode", "inputs": {"text": NEGATIVE, "clip": ["3", 0]}},
        "15": {"class_type": "LTXVConditioning", "inputs": {"positive": ["5", 0], "negative": ["6", 0], "frame_rate": 25}},
        "10": {"class_type": "LoadImage", "inputs": {"image": input_image}},
        "11": {"class_type": "ResizeImageMaskNode", "inputs": {"input": ["10", 0], "resize_type": "scale dimensions", "resize_type.width": 1280, "resize_type.height": 720, "resize_type.crop": "center", "scale_method": "lanczos"}},
        "12": {"class_type": "LTXVPreprocess", "inputs": {"image": ["11", 0], "img_compression": 18}},
        "20": {"class_type": "EmptyLTXVLatentVideo", "inputs": {"width": 640, "height": 360, "length": 97, "batch_size": 1}},
        "21": {"class_type": "LTXVImgToVideoInplace", "inputs": {"vae": ["1", 2], "image": ["12", 0], "latent": ["20", 0], "strength": 0.7, "bypass": False}},
        "22": {"class_type": "RandomNoise", "inputs": {"noise_seed": seed}},
        "23": {"class_type": "CFGGuider", "inputs": {"model": ["2", 0], "positive": ["15", 0], "negative": ["15", 1], "cfg": 1.0}},
        "24": {"class_type": "KSamplerSelect", "inputs": {"sampler_name": "euler_ancestral_cfg_pp"}},
        "25": {"class_type": "ManualSigmas", "inputs": {"sigmas": "1.0, 0.99375, 0.9875, 0.98125, 0.975, 0.909375, 0.725, 0.421875, 0.0"}},
        "26": {"class_type": "SamplerCustomAdvanced", "inputs": {"noise": ["22", 0], "guider": ["23", 0], "sampler": ["24", 0], "sigmas": ["25", 0], "latent_image": ["21", 0]}},
        "30": {"class_type": "LTXVLatentUpsampler", "inputs": {"samples": ["26", 0], "upscale_model": ["4", 0], "vae": ["1", 2]}},
        "31": {"class_type": "LTXVImgToVideoInplace", "inputs": {"vae": ["1", 2], "image": ["12", 0], "latent": ["30", 0], "strength": 1.0, "bypass": False}},
        "32": {"class_type": "LTXVCropGuides", "inputs": {"positive": ["15", 0], "negative": ["15", 1], "latent": ["31", 0]}},
        "33": {"class_type": "RandomNoise", "inputs": {"noise_seed": seed + 1}},
        "34": {"class_type": "CFGGuider", "inputs": {"model": ["2", 0], "positive": ["32", 0], "negative": ["32", 1], "cfg": 1.0}},
        "35": {"class_type": "KSamplerSelect", "inputs": {"sampler_name": "euler_cfg_pp"}},
        "36": {"class_type": "ManualSigmas", "inputs": {"sigmas": "0.85, 0.7250, 0.4219, 0.0"}},
        "37": {"class_type": "SamplerCustomAdvanced", "inputs": {"noise": ["33", 0], "guider": ["34", 0], "sampler": ["35", 0], "sigmas": ["36", 0], "latent_image": ["32", 2]}},
        "40": {"class_type": "VAEDecodeTiled", "inputs": {"samples": ["37", 0], "vae": ["1", 2], "tile_size": 768, "overlap": 64, "temporal_size": 4096, "temporal_overlap": 4}},
        "44": {"class_type": "CreateVideo", "inputs": {"images": ["40", 0], "fps": 25}},
        "45": {"class_type": "SaveVideo", "inputs": {"video": ["44", 0], "filename_prefix": prefix, "format": "mp4", "codec": "h264"}},
    }

def upload(path):
    data = path.read_bytes()
    boundary = uuid.uuid4().hex
    body = (f"--{boundary}\r\nContent-Disposition: form-data; name=\"image\"; filename=\"{path.name}\"\r\n"
            f"Content-Type: image/png\r\n\r\n").encode() + data + f"\r\n--{boundary}--\r\n".encode()
    req = urllib.request.Request(f"{API}/upload/image", data=body,
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"})
    return json.loads(urllib.request.urlopen(req, timeout=60).read()).get("name", path.name)

def wait(pid, timeout=1200):
    t0 = time.time()
    while time.time() - t0 < timeout:
        try:
            h = json.loads(urllib.request.urlopen(f"{API}/history/{pid}", timeout=15).read())
            if pid in h:
                s = h[pid].get("status", {})
                if s.get("completed"):
                    return True, int(time.time() - t0)
                if s.get("status_str") == "error":
                    print(json.dumps(s)[:300], flush=True)
                    return False, int(time.time() - t0)
        except Exception as e:
            print("poll err:", e, flush=True)
        time.sleep(5)
    return False, timeout

def already_has_video(cap, slot):
    return bool(list(OUT_DIR.glob(f"cap{cap:02d}-{slot}-video_*.mp4")))

def get_motion(cap):
    """Returns {'fluxo': text, 'dica': text} handling both prompt-file schemas."""
    if cap <= 15:
        data = json.loads(Path(DRAFTS / "rag-knowledge_prompts_1-15.json").read_text(encoding="utf-8"))
        entry = next(c for c in data["chapters"] if c["n"] == cap)
        return entry["motion"]
    else:
        data = json.loads(Path(DRAFTS / "rag-knowledge_prompts_16-30.json").read_text(encoding="utf-8"))
        entry = data[str(cap)]
        return {"fluxo": entry["fluxo_motion"], "dica": entry["dica_motion"]}

DRAFTS = Path(__file__).parent / "content_drafts"

free_vram()
n_ok = 0
n_fail = 0
for cap in range(1, 31):
    try:
        motions = get_motion(cap)
    except Exception as e:
        print(f"cap{cap:02d}: erro lendo prompts salvos: {e}", flush=True)
        continue
    for slot in ("fluxo", "dica"):
        if already_has_video(cap, slot):
            continue
        name = f"cap{cap:02d}-{slot}"
        pngs = sorted(OUT_DIR.glob(f"{name}_*.png"), key=lambda p: p.stat().st_mtime)
        if not pngs:
            print(f"cap{cap:02d}-{slot}: SEM IMAGEM BASE, pulando", flush=True)
            continue
        img_name = upload(pngs[-1])
        prefix = f"course_media/{SLUG}/inline/{name}-video"
        seed = VIDEO_SEED_BASE + cap * 10 + (0 if slot == "fluxo" else 5)
        pid = post("/prompt", {"prompt": build_video(img_name, motions[slot], prefix, seed)})["prompt_id"]
        ok, secs = wait(pid)
        n_ok += 1 if ok else 0
        n_fail += 0 if ok else 1
        print(f"cap{cap:02d}-{slot} video: {'OK' if ok else 'FAIL'} in {secs}s ({n_ok} ok, {n_fail} fail)", flush=True)

print(f"\nRAG-KNOWLEDGE VIDEO RESUME COMPLETE — {n_ok} ok, {n_fail} fail", flush=True)
