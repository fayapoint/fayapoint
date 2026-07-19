# -*- coding: utf-8 -*-
"""Regeneration of chatgpt-zero inline media for caps 16-30 ONLY.
Reuses the ComfyUI workflow JSON (build_image/build_video), FUSION style
suffix, upload/wait/post helpers verbatim from generate_course_inline_media.py.
Unlike the original script (which used a 5-phrase lookup table reused across
all 30 chapters -> near-identical media + captions per module), every prompt
here is bespoke per chapter, loaded from chatgpt-zero_prompts_16-30.json,
grounded in that chapter's actual rewritten text (see
content_drafts/chatgpt-zero_caps_16-30.json). Same slot POSITIONS / composition
motif repeat as design language; concrete objects differ every chapter.

Does NOT touch cap01/cap06 (pilot, approved) or caps 2-15 (another agent's
range) -- only writes cap16..cap30 files, and writes its own manifest so it
never clobbers a concurrent agent's manifest file.
"""
import json, sys, time, uuid, urllib.request
from pathlib import Path

API = "http://localhost:8000"
OUT_DIR = Path("C:/WORKS/ComfyUI/output/course_media/chatgpt-zero/inline")
NEGATIVE = "blurry, low quality, still frame, watermark, text, deformed, glitch, jitter"
BASE_SEED = 7400
VIDEO_SEED_BASE = 9300

FUSION = (", an adorable glossy flat-vector robot mascot with big cute eyes naturally interacting inside a "
          "breathtaking cinematic photorealistic scene, seamless style fusion, dramatic film lighting, shallow "
          "depth of field, bokeh, deep dark navy blue atmosphere, rich cinematic color grading, professional "
          "photography, high detail, no text, no letters, no logos, no watermark")

SLOTS_IMG = ["sistema", "intencao", "fluxo", "cenario", "validacao", "dica"]
SLOTS_VIDEO = ["fluxo", "dica"]
CAPS = range(16, 31)  # our range only

PROMPTS_PATH = Path(__file__).with_name("content_drafts").joinpath("chatgpt-zero_prompts_16-30.json")
PROMPTS = json.loads(PROMPTS_PATH.read_text(encoding="utf-8"))


# ── ComfyUI workflow builders, copied verbatim from generate_course_inline_media.py ──

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
                    print(json.dumps(s)[:300], flush=True)
                    return False, int(time.time() - t0)
        except Exception:
            pass
        time.sleep(5)
    return False, timeout


manifest = []

# ── Fase A: imagens (fila toda de uma vez, poll no fim) ──
free_vram()
jobs = []
for cap in CAPS:
    cap_data = PROMPTS[str(cap)]
    setting, accent = cap_data["theme_setting"], cap_data["theme_accent"]
    for si, slot in enumerate(SLOTS_IMG):
        name = f"cap{cap:02d}-{slot}"
        if list(OUT_DIR.glob(f"{name}_*.png")):
            print(f"[img {name}] ja existe, pulando", flush=True)
            continue  # retomavel -- nunca sobrescreve cap01/cap06 nem reruns anteriores
        action = cap_data["slots"][slot]["image"]
        prompt_text = f"{setting}, {action}, {accent} glow" + FUSION
        seed = BASE_SEED + cap * 10 + si
        try:
            pid = post("/prompt", {"prompt": build_image(prompt_text, name, seed)})["prompt_id"]
        except Exception as e:
            print(f"[img {name}] SUBMIT FAILED: {e}", flush=True)
            manifest.append({"kind": "img", "name": name, "seed": seed, "prompt": prompt_text, "submit_error": str(e)})
            continue
        jobs.append((pid, name))
        manifest.append({"kind": "img", "name": name, "seed": seed, "prompt": prompt_text})
print(f"IMAGENS (caps 16-30): {len(jobs)} na fila", flush=True)

done = set()
failed = set()
t0 = time.time()
while len(done) + len(failed) < len(jobs) and time.time() - t0 < 7200:
    for pid, name in jobs:
        if pid in done or pid in failed:
            continue
        try:
            h = json.loads(urllib.request.urlopen(f"{API}/history/{pid}").read())
            if pid in h:
                st = h[pid].get("status", {})
                if st.get("completed"):
                    done.add(pid)
                    if len(done) % 6 == 0 or len(done) + len(failed) == len(jobs):
                        print(f"img {len(done)}/{len(jobs)} ok, {len(failed)} falhas — {int(time.time()-t0)}s", flush=True)
                elif st.get("status_str") == "error":
                    failed.add(pid)
                    print(f"[img {name}] FAILED: {json.dumps(st)[:300]}", flush=True)
        except Exception:
            pass
    time.sleep(6)
print(f"IMAGENS OK {len(done)}/{len(jobs)} ({len(failed)} falhas, {len(jobs)-len(done)-len(failed)} timeout)", flush=True)

# ── Fase B: videos (sequencial) ──
free_vram()
n_ok = 0
n_total_video = 0
for cap in CAPS:
    cap_data = PROMPTS[str(cap)]
    for slot in SLOTS_VIDEO:
        name = f"cap{cap:02d}-{slot}"
        n_total_video += 1
        if list(OUT_DIR.glob(f"{name}-video_*.mp4")):
            n_ok += 1
            print(f"[vid {name}] ja existe, pulando", flush=True)
            continue  # retomavel
        pngs = sorted(OUT_DIR.glob(f"{name}_*.png"), key=lambda p: p.stat().st_mtime)
        if not pngs:
            print(f"[vid {name}] SEM base (imagem nao gerada), pulando", flush=True)
            manifest.append({"kind": "video", "name": name, "ok": False, "reason": "no base image"})
            continue
        motion = cap_data["slots"][slot]["motion"]
        offset = 0 if slot == "fluxo" else 5
        seed = VIDEO_SEED_BASE + cap * 10 + offset
        try:
            uploaded_name = upload(pngs[-1])
            pid = post("/prompt", {"prompt": build_video(uploaded_name, motion, name, seed)})["prompt_id"]
        except Exception as e:
            print(f"[vid {name}] SUBMIT FAILED: {e}", flush=True)
            manifest.append({"kind": "video", "name": name, "seed": seed, "ok": False, "submit_error": str(e)})
            continue
        ok, secs = wait(pid)
        n_ok += 1 if ok else 0
        print(f"[vid {name}] {'OK' if ok else 'FAIL'} in {secs}s ({n_ok}/{n_total_video} videos prontos)", flush=True)
        manifest.append({"kind": "video", "name": name, "seed": seed, "motion": motion, "ok": ok})

Path(__file__).with_name("course-inline-manifest-16-30.json").write_text(
    json.dumps(manifest, ensure_ascii=False, indent=1), encoding="utf-8")
print("CAPS 16-30 INLINE MEDIA DONE", flush=True)
