# -*- coding: utf-8 -*-
"""Leitura 2.0 — replicacao (18/07/2026): midia inline para os 30 caps do
primeiras-automacoes. Curso gerado do MESMO boilerplate do chatgpt-zero
(ancoras estruturais identicas), so os temas visuais mudam para refletir
automacao/no-code em vez de ChatGPT.
Saida: C:/WORKS/ComfyUI/output/course_media/primeiras-automacoes/inline/capNN-*"""
import json, sys, time, uuid, urllib.request
from pathlib import Path

API = "http://localhost:8000"
SLUG = "primeiras-automacoes"
OUT_DIR = Path(f"C:/WORKS/ComfyUI/output/course_media/{SLUG}/inline")
NEGATIVE = "blurry, low quality, still frame, watermark, text, deformed, glitch, jitter"
BASE_SEED = 8000
VIDEO_SEED_BASE = 9600

FUSION = (", an adorable glossy flat-vector robot mascot with big cute eyes naturally interacting inside a "
          "breathtaking cinematic photorealistic scene, seamless style fusion, dramatic film lighting, shallow "
          "depth of field, bokeh, deep dark navy blue atmosphere, rich cinematic color grading, professional "
          "photography, high detail, no text, no letters, no logos, no watermark")

# 6 temas do curso (1 por modulo, refletindo automacao/no-code) -> cenario + glow
THEMES = [
    ("real cozy home workshop table with rolled blueprints, a pocket notebook and a small set of gears waiting to be sorted", "lime"),
    ("real desk with a large unrolled paper flowchart and small trays labeled entrada and saida holding glowing tokens", "violet"),
    ("real tidy desk with a tablet showing simple connected building blocks, a tangle of cables becoming neatly organized", "cyan"),
    ("real small shop counter with a receipt printer and order slips, a home office corner just behind it", "rose"),
    ("real workbench with a magnifying glass over small gears and a testing checklist pinned on the wall above", "gold"),
    ("real control corner with a small wall of soft screens showing growing bar charts beside a well-oiled machine", "violet"),
]

# Acao por slot (secao do texto) x tipo de aula (0..4) — identico ao chatgpt-zero
# (ancoras estruturais confirmadas identicas: mesmo boilerplate gerador).
SLOT_ACTIONS = {
    "sistema": [
        "the mascot carefully stacking translucent glowing glass layers into a delicate tower next to an unrolled glowing blueprint, one dim foggy layer making the tower lean",
        "the mascot carefully stacking translucent glowing glass layers into a delicate tower beside neatly arranged real tools, one dim foggy layer making the tower lean",
        "the mascot carefully stacking translucent glowing glass layers into a delicate tower while a real person watches closely, one dim foggy layer making the tower lean",
        "the mascot gently lifting one cracked dim layer out of a delicate tower of translucent glowing glass layers to repair it",
        "the mascot placing the final translucent glowing layer on a steady completed tower beside a small wrapped deliverable",
    ],
    "intencao": [
        "on one side the mascot calmly writing on a small glowing planning card, on the other side a friendly robotic arm assembling a miniature blueprint model, a clear gap of soft light between thinking and doing",
        "on one side the mascot calmly writing on a small glowing planning card, on the other side a friendly robotic arm arranging real instruments in perfect order, a clear gap of soft light between thinking and doing",
        "on one side the mascot calmly writing on a small glowing planning card, on the other side a friendly robotic arm building together with a real person's hands, a clear gap of soft light between thinking and doing",
        "the mascot double-checking a small glowing planning card while a friendly robotic arm waits paused mid-motion, a clear gap of soft light between thinking and doing",
        "on one side the mascot calmly writing on a small glowing planning card, on the other side a friendly robotic arm gift-wrapping a small finished result, a clear gap of soft light between thinking and doing",
    ],
    "fluxo": [
        "a winding path of five glowing stepping stones crossing the table from an unrolled blueprint to a finished wrapped deliverable, the tiny mascot walking on the stones mid-journey",
        "a winding path of five glowing stepping stones crossing the table from an open toolbox to a finished wrapped deliverable, the tiny mascot walking on the stones mid-journey",
        "a winding path of five glowing stepping stones crossing the table from two coffee mugs side by side to a finished wrapped deliverable, the tiny mascot walking on the stones mid-journey",
        "a winding path of five glowing stepping stones crossing the table, one wobbly stone glowing amber being steadied by the tiny mascot mid-journey toward a finished wrapped deliverable",
        "a winding path of five glowing stepping stones crossing the table toward a beautifully wrapped glowing deliverable, the tiny mascot stepping onto the final stone",
    ],
    "cenario": [
        "a swirl of misty crumpled paper scraps rising above the table and condensing into one crisp glowing organized plan board that the mascot proudly holds up",
        "a swirl of misty crumpled paper scraps rising above the table and condensing into one crisp glowing labeled setup checklist that the mascot proudly holds up",
        "a swirl of misty crumpled paper scraps rising above the table and condensing into crisp glowing finished draft pages that the mascot proudly holds up",
        "a swirl of misty crumpled paper scraps rising above the table and condensing into one crisp glowing corrected page with luminous margin notes that the mascot proudly holds up",
        "a swirl of misty crumpled paper scraps rising above the table and condensing into one crisp glowing final deliverable that the mascot proudly presents",
    ],
    "validacao": [
        "the mascot examining a glowing paper scroll through a large magnifying glass against an unrolled glowing reference map, a kind amber warning light above, a small round blank wax stamp resting unused",
        "the mascot checking each real tool on the table against a glowing list through a large magnifying glass, a kind amber warning light above, a small round blank wax stamp resting unused",
        "the mascot and a real person reviewing a glowing paper scroll together through a large magnifying glass, a kind amber warning light above, a small round blank wax stamp resting unused",
        "the mascot gently catching a wobbling glowing piece before it falls while a glowing paper scroll waits under a large magnifying glass, kind amber warning light",
        "the mascot giving a final inspection to a wrapped glowing deliverable through a large magnifying glass, a small round blank wax stamp resting unused beside it",
    ],
    "dica": [
        "the mascot writing a glowing checklist card with soft check marks, behind it a large friendly launch button waiting dimmed until the list is complete",
        "the mascot writing a glowing checklist card while real tools wait neatly lined up, a large friendly launch button dimmed in the background",
        "the mascot and a real person's hand writing a glowing checklist card together, a large friendly launch button dimmed in the background",
        "the mascot re-reading a glowing checklist card with one mark glowing amber, a large friendly launch button dimmed in the background",
        "the mascot completing the last check mark on a glowing checklist card beside a wrapped deliverable, a large friendly launch button starting to brighten",
    ],
}

VIDEO_MOTION = {
    "fluxo": ("The five glowing stepping stones pulse softly in sequence one after another, the tiny mascot walks "
              "gently forward across the stones, warm dust motes float in the light, ambient elements drift subtly, "
              "slow cinematic push-in, seamless loop"),
    "dica": ("Soft glowing check marks light up one by one on the card, the mascot's pen moves gently, the big "
             "button in the background slowly brightens as the list completes, warm ambient drift, "
             "slow cinematic push-in, seamless loop"),
}

SLOTS_IMG = ["sistema", "intencao", "fluxo", "cenario", "validacao", "dica"]
SLOTS_VIDEO = ["fluxo", "dica"]

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
        "9": {"class_type": "SaveImage", "inputs": {"filename_prefix": f"course_media/{SLUG}/inline/{prefix}", "images": ["8", 0]}},
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
        "45": {"class_type": "SaveVideo", "inputs": {"video": ["44", 0], "filename_prefix": f"course_media/{SLUG}/inline/{prefix}-video", "format": "mp4", "codec": "h264"}},
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
                    print(json.dumps(s)[:300], flush=True)
                    return False, int(time.time() - t0)
        except Exception:
            pass
        time.sleep(5)
    return False, timeout

OUT_DIR.mkdir(parents=True, exist_ok=True)
CAPS = range(1, 31)
manifest = []

# ── Fase A: imagens (fila toda de uma vez, poll no fim) ──
free_vram()
jobs = []
for cap in CAPS:
    module = (cap - 1) // 5
    tipo = (cap - 1) % 5
    setting, accent = THEMES[module]
    for si, slot in enumerate(SLOTS_IMG):
        name = f"cap{cap:02d}-{slot}"
        if list(OUT_DIR.glob(f"{name}_*.png")):
            continue  # retomavel
        prompt_text = f"{setting}, {SLOT_ACTIONS[slot][tipo]}, {accent} glow" + FUSION
        seed = BASE_SEED + cap * 10 + si
        pid = post("/prompt", {"prompt": build_image(prompt_text, name, seed)})["prompt_id"]
        jobs.append((pid, name))
        manifest.append({"kind": "img", "name": name, "seed": seed, "prompt": prompt_text})
print(f"IMAGENS: {len(jobs)} na fila", flush=True)

done = set()
t0 = time.time()
while len(done) < len(jobs) and time.time() - t0 < 7200:
    for pid, name in jobs:
        if pid in done:
            continue
        try:
            h = json.loads(urllib.request.urlopen(f"{API}/history/{pid}").read())
            if pid in h and h[pid].get("status", {}).get("completed"):
                done.add(pid)
                if len(done) % 12 == 0 or len(done) == len(jobs):
                    print(f"img {len(done)}/{len(jobs)} — {int(time.time()-t0)}s", flush=True)
        except Exception:
            pass
    time.sleep(6)
print(f"IMAGENS OK {len(done)}/{len(jobs)}", flush=True)

# ── Fase B: videos (sequencial) ──
free_vram()
n_ok = 0
for cap in CAPS:
    tipo = (cap - 1) % 5
    for slot in SLOTS_VIDEO:
        name = f"cap{cap:02d}-{slot}"
        if list(OUT_DIR.glob(f"{name}-video_*.mp4")):
            n_ok += 1
            continue  # retomavel
        pngs = sorted(OUT_DIR.glob(f"{name}_*.png"), key=lambda p: p.stat().st_mtime)
        if not pngs:
            print(f"[vid {name}] SEM base", flush=True)
            continue
        seed = VIDEO_SEED_BASE + cap * 10 + (0 if slot == "fluxo" else 5)
        pid = post("/prompt", {"prompt": build_video(upload(pngs[-1]), VIDEO_MOTION[slot], name, seed)})["prompt_id"]
        ok, secs = wait(pid)
        n_ok += 1 if ok else 0
        print(f"[vid {name}] {'OK' if ok else 'FAIL'} in {secs}s ({n_ok} videos prontos)", flush=True)
        manifest.append({"kind": "video", "name": name, "seed": seed, "ok": ok})

Path(__file__).with_name(f"{SLUG}-inline-manifest.json").write_text(
    json.dumps(manifest, ensure_ascii=False, indent=1), encoding="utf-8")
print(f"{SLUG.upper()} INLINE MEDIA DONE", flush=True)
