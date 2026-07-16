# -*- coding: utf-8 -*-
"""Loops LTX 2.3 I2V REAIS para os 6 minigames do Arcade — 4 variantes por jogo
(16/07/2026). Substitui os webm-colagem de 14/07. Pipeline comprovado do
generate_abundance_videos.py (two-pass, porta 8000). Fontes: as próprias
variants do site (public/portal/arcade/variants/<game>/variant-01..04.webp).
Saída: C:/WORKS/ComfyUI/output/arcade_loops/<game>-0N_*.mp4 + manifest."""
import json, time, uuid, urllib.request
from pathlib import Path

COMFY = "http://localhost:8000"
SRC = Path(__file__).resolve().parents[2] / "public" / "portal" / "arcade" / "variants"
NEGATIVE = "blurry, low quality, still frame, watermark, text, deformed, glitch, jitter"
VARIANTS_PER_GAME = 4

MOTION = {
    "monte-o-prompt": "Construction cranes sway very gently, warm sparks drift upward, the cute robots move slightly while assembling the glowing golden frame, soft volumetric light shifting, slow cinematic push-in, seamless loop",
    "verdade-ou-mito": "Clouds drift slowly across the chasm, the glowing bridge lights pulse softly, the robot and the person walk subtly forward, cool mist floating, slow cinematic push-in, seamless loop",
    "qual-prompt": "Giant book pages breathe softly with magical glow, gallery lamp flickers warmly, dust motes drift in the light beams, the cute robots blink and tilt heads slightly, slow cinematic push-in, seamless loop",
    "palpite-30s": "The golden ring of lights pulses like a countdown, warm sparks rise slowly, people lean in with subtle excited movement, bokeh shimmer, slow cinematic push-in, seamless loop",
    "batalha-prompts": "Energy sparks crackle gently between the two robot duelists, arena spotlights pulse, floating embers drift upward, dramatic rim light shifting, slow cinematic push-in, seamless loop",
    "caca-prompt": "Fireflies drift slowly through the scene, the magnifying glass glints, foliage and fabric sway very gently, treasure glow pulses warmly, slow cinematic push-in, seamless loop",
}

def upload(path):
    data = path.read_bytes()
    boundary = uuid.uuid4().hex
    body = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="image"; filename="{path.name}"\r\n'
        f"Content-Type: image/webp\r\n\r\n"
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
        "45": {"class_type": "SaveVideo", "inputs": {"video": ["44", 0], "filename_prefix": f"arcade_loops/{prefix}", "format": "mp4", "codec": "h264"}},
    }

def submit(wf):
    return json.loads(urllib.request.urlopen(urllib.request.Request(
        f"{COMFY}/prompt", json.dumps({"prompt": wf}).encode(),
        {"Content-Type": "application/json"})).read())["prompt_id"]

def wait(pid, timeout=1500):
    t0 = time.time()
    while time.time() - t0 < timeout:
        try:
            h = json.loads(urllib.request.urlopen(f"{COMFY}/history/{pid}").read())
            if pid in h:
                s = h[pid].get("status", {})
                if s.get("completed"):
                    return True, int(time.time() - t0)
                if s.get("status_str") == "error":
                    print(json.dumps(h[pid].get("status", {}))[:400], flush=True)
                    return False, int(time.time() - t0)
        except Exception:
            pass
        time.sleep(6)
    return False, timeout

try:
    urllib.request.urlopen(urllib.request.Request(f"{COMFY}/free",
        json.dumps({"unload_models": True, "free_memory": True}).encode(),
        {"Content-Type": "application/json"}))
    time.sleep(2)
except Exception:
    pass

manifest = []
job = 0
for game, motion in MOTION.items():
    for v in range(1, VARIANTS_PER_GAME + 1):
        src = SRC / game / f"variant-{v:02d}.webp"
        if not src.exists():
            print(f"MISSING {src}", flush=True)
            continue
        prefix = f"{game}-{v:02d}"
        seed = 9000 + job * 10
        uploaded = upload(src)
        pid = submit(build(uploaded, motion, prefix, seed))
        print(f"[{prefix}] submitted {pid}", flush=True)
        ok, secs = wait(pid)
        print(f"[{prefix}] {'OK' if ok else 'FAIL'} in {secs}s", flush=True)
        manifest.append({"game": game, "variant": v, "prefix": prefix, "seed": seed,
                         "source": str(src.name), "motion": motion, "ok": ok})
        job += 1

Path(__file__).with_name("arcade-loops-manifest.json").write_text(
    json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")
print("ARCADE LOOPS DONE", flush=True)
