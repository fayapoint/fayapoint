# -*- coding: utf-8 -*-
"""Leitura 2.0 — piloto cap.1 do chatgpt-zero (17/07/2026).
Passe editorial do capitulo 1: 4 imagens inline + 2 videos LTX em pontos
de dificil compreensao/cinematicos, prompts espelhando O TRECHO (nao o tema).
Receitas comprovadas: Qwen 2512+Lightning (generate_course_media.py) e
LTX 2.3 I2V two-pass (generate_arcade_loops.py). Porta 8000.
Saida: C:/WORKS/ComfyUI/output/course_media/chatgpt-zero/inline/"""
import json, time, uuid, urllib.request
from pathlib import Path

API = "http://localhost:8000"
OUT_DIR = Path("C:/WORKS/ComfyUI/output/course_media/chatgpt-zero/inline")
NEGATIVE = "blurry, low quality, still frame, watermark, text, deformed, glitch, jitter"

FUSION = (", an adorable glossy flat-vector robot mascot with big cute eyes naturally interacting inside a "
          "breathtaking cinematic photorealistic scene, seamless style fusion, dramatic film lighting, shallow "
          "depth of field, bokeh, deep dark navy blue atmosphere, rich cinematic color grading, professional "
          "photography, high detail, no text, no letters, no logos, no watermark")

# Cenario do modulo "Primeiros passos" (lime) + acao espelhando o trecho
IMAGES = [
    ("cap01-sistema", 7200,
     "real cozy kitchen table with a laptop and fresh coffee, morning light through a window, "
     "the mascot carefully stacking translucent glowing glass layers into a delicate tower, "
     "one dim foggy layer making the whole tower lean and flicker, lime glow"),
    ("cap01-intencao", 7201,
     "real cozy kitchen table bathed in warm morning light, on one side the mascot calmly writing "
     "on a small glowing planning card, on the other side a friendly robotic arm assembling wooden pieces, "
     "a clear gap of soft light separating thinking from doing, lime glow"),
    ("cap01-fluxo", 7202,
     "real cozy kitchen table with fresh coffee, a winding path of five glowing stepping stones "
     "crossing the table from a coffee mug to a finished wrapped deliverable, "
     "the tiny mascot walking on the stones mid-journey, lime glow"),
    ("cap01-planos", 7203,
     "real cozy kitchen table with a laptop, a swirl of misty crumpled paper scraps rising above the table "
     "and condensing into one crisp glowing organized plan board that the mascot proudly holds up, "
     "morning light, lime glow"),
    ("cap01-validacao", 7204,
     "real cozy kitchen table with a laptop and fresh coffee, the mascot examining a glowing answer scroll "
     "through a large magnifying glass, a kind amber warning light above, "
     "an approval seal floating nearby still waiting, lime glow"),
    ("cap01-checklist", 7205,
     "real cozy kitchen table at golden morning, the mascot writing a glowing checklist card with soft "
     "check marks, behind it a large friendly launch button waiting dimmed until the list is complete, "
     "lime glow"),
]

VIDEOS = [
    ("cap01-fluxo", 9200,
     "The five glowing stepping stones pulse softly in sequence one after another, steam drifts from the "
     "coffee mug, the tiny mascot walks gently forward across the stones, warm dust motes float in the "
     "morning light, slow cinematic push-in, seamless loop"),
    ("cap01-checklist", 9210,
     "Soft glowing check marks light up one by one on the card, the mascot's pen moves gently, the big "
     "button in the background slowly brightens as the list completes, steam drifts from the coffee, "
     "slow cinematic push-in, seamless loop"),
]

def post(path, payload):
    req = urllib.request.Request(API + path, json.dumps(payload).encode(),
                                 {"Content-Type": "application/json"})
    return json.loads(urllib.request.urlopen(req).read())

def free_vram():
    try:
        post("/free", {"unload_models": True, "free_memory": True})
        time.sleep(2)
    except Exception:
        pass

def build_image(prompt_text, prefix, seed):
    return {
        "1": {"class_type": "UNETLoader", "inputs": {"unet_name": "qwen_image_2512_fp8_e4m3fn.safetensors", "weight_dtype": "default"}},
        "1b": {"class_type": "LoraLoaderModelOnly", "inputs": {"lora_name": "Qwen-Image-2512-Lightning-4steps-V1.0-fp32.safetensors", "strength_model": 1.0, "model": ["1", 0]}},
        "2": {"class_type": "CLIPLoader", "inputs": {"clip_name": "qwen_2.5_vl_7b_fp8_scaled.safetensors", "type": "qwen_image", "device": "default"}},
        "3": {"class_type": "VAELoader", "inputs": {"vae_name": "qwen_image_vae.safetensors"}},
        "4": {"class_type": "CLIPTextEncode", "inputs": {"text": prompt_text, "clip": ["2", 0]}},
        "5": {"class_type": "ConditioningZeroOut", "inputs": {"conditioning": ["4", 0]}},
        "6": {"class_type": "EmptySD3LatentImage", "inputs": {"width": 1152, "height": 640, "batch_size": 1}},
        "7": {"class_type": "KSampler", "inputs": {"seed": seed, "control_after_generate": "fixed", "steps": 4, "cfg": 1.0, "sampler_name": "euler", "scheduler": "simple", "denoise": 1, "model": ["1b", 0], "positive": ["4", 0], "negative": ["5", 0], "latent_image": ["6", 0]}},
        "8": {"class_type": "VAEDecode", "inputs": {"samples": ["7", 0], "vae": ["3", 0]}},
        "9": {"class_type": "SaveImage", "inputs": {"filename_prefix": f"course_media/chatgpt-zero/inline/{prefix}", "images": ["8", 0]}},
    }

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
        "45": {"class_type": "SaveVideo", "inputs": {"video": ["44", 0], "filename_prefix": f"course_media/chatgpt-zero/inline/{prefix}-video", "format": "mp4", "codec": "h264"}},
    }

def upload(path):
    data = path.read_bytes()
    boundary = uuid.uuid4().hex
    body = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="image"; filename="{path.name}"\r\n'
        f"Content-Type: image/png\r\n\r\n"
    ).encode() + data + f"\r\n--{boundary}--\r\n".encode()
    req = urllib.request.Request(f"{API}/upload/image", data=body,
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"})
    return json.loads(urllib.request.urlopen(req).read()).get("name", path.name)

def wait(pid, timeout=1800):
    t0 = time.time()
    while time.time() - t0 < timeout:
        try:
            h = json.loads(urllib.request.urlopen(f"{API}/history/{pid}").read())
            if pid in h:
                s = h[pid].get("status", {})
                if s.get("completed"):
                    return True, int(time.time() - t0)
                if s.get("status_str") == "error":
                    print(json.dumps(s)[:400], flush=True)
                    return False, int(time.time() - t0)
        except Exception:
            pass
        time.sleep(5)
    return False, timeout

manifest = []

# ── Fase A: 6 imagens Qwen (~14s cada) ──
free_vram()
for name, seed, core in IMAGES:
    pid = post("/prompt", {"prompt": build_image(core + FUSION, name, seed)})["prompt_id"]
    ok, secs = wait(pid, timeout=600)
    print(f"[img {name}] {'OK' if ok else 'FAIL'} in {secs}s", flush=True)
    manifest.append({"kind": "img", "name": name, "seed": seed, "prompt": core + FUSION, "ok": ok})

# ── Fase B: 2 videos LTX I2V a partir das imagens geradas ──
free_vram()
for name, seed, motion in VIDEOS:
    png = sorted(OUT_DIR.glob(f"{name}_*.png"), key=lambda p: p.stat().st_mtime)
    if not png:
        print(f"[vid {name}] MISSING base image", flush=True)
        manifest.append({"kind": "video", "name": name, "ok": False, "error": "missing base"})
        continue
    uploaded = upload(png[-1])
    pid = post("/prompt", {"prompt": build_video(uploaded, motion, name, seed)})["prompt_id"]
    print(f"[vid {name}] submitted {pid}", flush=True)
    ok, secs = wait(pid)
    print(f"[vid {name}] {'OK' if ok else 'FAIL'} in {secs}s", flush=True)
    manifest.append({"kind": "video", "name": name, "seed": seed, "motion": motion, "ok": ok})

Path(__file__).with_name("cap1-inline-manifest.json").write_text(
    json.dumps(manifest, ensure_ascii=False, indent=1), encoding="utf-8")
print("CAP1 INLINE MEDIA DONE", flush=True)
