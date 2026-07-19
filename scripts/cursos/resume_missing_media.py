# -*- coding: utf-8 -*-
"""Resume-and-complete: fills in exactly the media assets that were missing
when the 6 background generation agents got interrupted (ComfyUI stopped
responding). Reuses the ALREADY-WRITTEN grounded prompts (no re-writing),
just resumes submission for the gap: caps16-30 videos (fluxo+dica) in all
3 courses, plus 3 legacy gaps in chatgpt-zero cap01 (older pilot naming
scheme never had cenario/dica slots)."""
import json, time, uuid, urllib.request
from pathlib import Path

API = "http://localhost:8000"
NEGATIVE = "blurry, low quality, still frame, watermark, text, deformed, glitch, jitter"
FUSION = (", an adorable glossy flat-vector robot mascot with big cute eyes naturally interacting inside a "
          "breathtaking cinematic photorealistic scene, seamless style fusion, dramatic film lighting, shallow "
          "depth of field, bokeh, deep dark navy blue atmosphere, rich cinematic color grading, professional "
          "photography, high detail, no text, no letters, no logos, no watermark")

def post(path, payload):
    req = urllib.request.Request(API + path, json.dumps(payload).encode(), {"Content-Type": "application/json"})
    return json.loads(urllib.request.urlopen(req, timeout=30).read())

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
        "9": {"class_type": "SaveImage", "inputs": {"filename_prefix": prefix, "images": ["8", 0]}},
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

def submit_video(out_dir, cap, slot, motion, seed):
    name = f"cap{cap:02d}-{slot}"
    pngs = sorted(out_dir.glob(f"{name}_*.png"), key=lambda p: p.stat().st_mtime)
    if not pngs:
        print(f"[{out_dir.parent.name}] cap{cap:02d}-{slot}: SEM IMAGEM BASE, pulando", flush=True)
        return False
    img_name = upload(pngs[-1])
    prefix = f"course_media/{out_dir.parent.name}/inline/{name}-video"
    pid = post("/prompt", {"prompt": build_video(img_name, motion, prefix, seed)})["prompt_id"]
    ok, secs = wait(pid)
    print(f"[{out_dir.parent.name}] cap{cap:02d}-{slot} video: {'OK' if ok else 'FAIL'} in {secs}s", flush=True)
    return ok

def already_has_video(out_dir, cap, slot):
    name = f"cap{cap:02d}-{slot}"
    return bool(list(out_dir.glob(f"{name}-video_*.mp4")))

# ---------- extractors per course prompt-file schema ----------
def motions_chatgpt_zero(cap):
    data = json.loads(Path(DRAFTS / "chatgpt-zero_prompts_16-30.json").read_text(encoding="utf-8"))
    entry = data[str(cap)]
    return {s: entry["slots"][s]["motion"] for s in ("fluxo", "dica") if "motion" in entry["slots"][s]}

def motions_primeiras(cap):
    data = json.loads(Path(DRAFTS / "primeiras-automacoes_prompts_16-30.json").read_text(encoding="utf-8"))
    chap = next(c for c in data["chapters"] if c["n"] == cap)
    return chap["video_motion"]

def motions_ia_dia(cap):
    data = json.loads(Path(DRAFTS / "ia-dia-a-dia_prompts_16-30.json").read_text(encoding="utf-8"))
    return data["chapters"][str(cap)]["video"]

DRAFTS = Path(__file__).parent / "content_drafts"
BASE_MEDIA = Path("C:/WORKS/ComfyUI/output/course_media")

COURSES = [
    ("chatgpt-zero", motions_chatgpt_zero, 9300),
    ("primeiras-automacoes", motions_primeiras, 9600),
    ("aprenda-a-usar-inteligencia-artificial-no-seu-dia-a-dia", motions_ia_dia, 10100),
]

# ---------- Phase 0: chatgpt-zero cap01 legacy gaps (cenario image, dica image+video) ----------
free_vram()
CZ_DIR = BASE_MEDIA / "chatgpt-zero" / "inline"
if not list(CZ_DIR.glob("cap01-cenario_*.png")):
    prompt = ("real cozy kitchen table with a laptop and fresh coffee, morning light through a window, "
              "a swirl of misty crumpled email draft scraps rising above the table and condensing into one "
              "crisp glowing structured reply card that the mascot proudly holds up, lime glow") + FUSION
    pid = post("/prompt", {"prompt": build_image(prompt, "course_media/chatgpt-zero/inline/cap01-cenario", 7401)})["prompt_id"]
    wait(pid)
    print("cap01-cenario image done", flush=True)
if not list(CZ_DIR.glob("cap01-dica_*.png")):
    prompt = ("real cozy kitchen table with a laptop and fresh coffee, morning light through a window, "
              "the mascot writing a glowing confidence-checklist card with soft marks for parts that need "
              "verification, behind it a large friendly launch button waiting dimmed until the list is complete, "
              "lime glow") + FUSION
    pid = post("/prompt", {"prompt": build_image(prompt, "course_media/chatgpt-zero/inline/cap01-dica", 7402)})["prompt_id"]
    wait(pid)
    print("cap01-dica image done", flush=True)
if not already_has_video(CZ_DIR, 1, "dica"):
    motion = ("Soft glowing check marks light up one by one on the confidence card, the mascot's pen pauses over "
              "one mark glowing amber for verification, the big button in the background slowly brightens as the "
              "list completes, warm ambient drift, slow cinematic push-in, seamless loop")
    submit_video(CZ_DIR, 1, "dica", motion, 9301)

# ---------- Phase 1: caps 16-30 missing videos, all 3 courses ----------
for slug, motion_fn, video_seed_base in COURSES:
    out_dir = BASE_MEDIA / slug / "inline"
    print(f"\n=== {slug}: resuming caps16-30 videos ===", flush=True)
    for cap in range(16, 31):
        try:
            motions = motion_fn(cap)
        except Exception as e:
            print(f"[{slug}] cap{cap:02d}: erro lendo prompts salvos: {e}", flush=True)
            continue
        for slot in ("fluxo", "dica"):
            if already_has_video(out_dir, cap, slot):
                continue
            if slot not in motions:
                print(f"[{slug}] cap{cap:02d}-{slot}: sem motion salvo, pulando", flush=True)
                continue
            seed = video_seed_base + cap * 10 + (0 if slot == "fluxo" else 5)
            submit_video(out_dir, cap, slot, motions[slot], seed)

print("\nRESUME COMPLETE", flush=True)
