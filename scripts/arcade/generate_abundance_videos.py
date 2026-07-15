# -*- coding: utf-8 -*-
"""3 vídeos-loop LTX 2.3 I2V a partir das artes do batch abundância (14/07/2026).
Pipeline comprovado do cover-gen/generate_i2v_shots.py, porta 8000."""
import json, os, time, uuid, urllib.request
from pathlib import Path

COMFY = "http://localhost:8000"
SRC = Path("C:/WORKS/ComfyUI/output/abundance")
OUT = Path("C:/WORKS/ComfyUI/output/abundance/video")
NEGATIVE = "blurry, low quality, still frame, watermark, text, deformed, glitch, jitter"

VIDEOS = [
    ("20260714_blog_hero_00001_.png", "blog-hero",
     "Gentle slow push-in on the cute robot news anchor, holographic headlines flickering and drifting softly, warm newsroom lights pulsing subtly, cinematic loop"),
    ("20260714_persona_vidente-hero_00001_.png", "vidente-loop",
     "The crystal ball glows and pulses with magical light, sparkling dust drifts slowly upward, velvet curtains sway very gently, the fortune teller robot blinks, slow cinematic push-in"),
    ("20260714_dash_boas-vindas_00001_.png", "boas-vindas-loop",
     "Warm light rays shifting through the open door, confetti falling slowly, the mascot waves gently, soft cinematic loop"),
]

def upload(path):
    data = path.read_bytes()
    boundary = uuid.uuid4().hex
    body = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="image"; filename="{path.name}"\r\n'
        f"Content-Type: image/png\r\n\r\n"
    ).encode() + data + f"\r\n--{boundary}--\r\n".encode()
    req = urllib.request.Request(f"{COMFY}/upload/image", data=body,
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"})
    return json.loads(urllib.request.urlopen(req).read()).get("name", path.name)

def build(input_image, motion, prefix, seed):
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
        "45": {"class_type": "SaveVideo", "inputs": {"video": ["44", 0], "filename_prefix": f"abundance/video/{prefix}", "format": "mp4", "codec": "h264"}},
    }

def submit(wf):
    return json.loads(urllib.request.urlopen(urllib.request.Request(
        f"{COMFY}/prompt", json.dumps({"prompt": wf}).encode(),
        {"Content-Type": "application/json"})).read())["prompt_id"]

def wait(pid, timeout=1200):
    t0 = time.time()
    while time.time() - t0 < timeout:
        try:
            h = json.loads(urllib.request.urlopen(f"{COMFY}/history/{pid}").read())
            if pid in h:
                s = h[pid].get("status", {})
                if s.get("completed"):
                    return True, int(time.time() - t0)
                if s.get("status_str") == "error":
                    print(json.dumps(h[pid].get("status", {}))[:400])
                    return False, int(time.time() - t0)
        except Exception:
            pass
        time.sleep(6)
    return False, timeout

# libera VRAM das imagens antes do LTX
try:
    urllib.request.urlopen(urllib.request.Request(f"{COMFY}/free",
        json.dumps({"unload_models": True, "free_memory": True}).encode(),
        {"Content-Type": "application/json"}))
    time.sleep(2)
except Exception:
    pass

for i, (src_name, slug, motion) in enumerate(VIDEOS):
    src = SRC / src_name
    if not src.exists():
        print(f"MISSING {src_name}")
        continue
    uploaded = upload(src)
    pid = submit(build(uploaded, motion, slug, 7000 + i * 10))
    print(f"[{slug}] submitted {pid}")
    ok, secs = wait(pid)
    print(f"[{slug}] {'OK' if ok else 'FAIL'} in {secs}s")

print("VIDEOS DONE")
