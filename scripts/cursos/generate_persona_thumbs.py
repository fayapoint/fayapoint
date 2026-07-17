# -*- coding: utf-8 -*-
"""Fase 3.1 (17/07/2026): thumbnails das opcoes visuais da persona.
30 tiles (5 dimensoes) no estilo §12, mascote em cena que representa a opcao.
Saida: ComfyUI output/persona_opts/<dim>-<key> -> instalar em
public/portal/persona/opts/ (webp 480px). Rodar DEPOIS do batch do curso."""
import json, time, urllib.request
from pathlib import Path

API = "http://localhost:8000"
BASE_SEED = 7700

FUSION = (", an adorable glossy flat-vector robot mascot with big cute eyes naturally interacting inside a "
          "breathtaking cinematic photorealistic scene, seamless style fusion, dramatic film lighting, shallow "
          "depth of field, bokeh, deep dark navy blue atmosphere, rich cinematic color grading, professional "
          "photography, high detail, no text, no letters, no logos, no watermark")

OPTS = {
    # industry
    "industry-tech": "the mascot typing happily at a sleek laptop surrounded by soft floating holographic code panels, cool blue glow",
    "industry-marketing": "the mascot shaking hands with a real person over a small table with a glowing rising chart between them, emerald glow",
    "industry-education": "the mascot as a tiny teacher pointing at a warm glowing chalkboard in a cozy classroom, violet glow",
    "industry-art": "the mascot painting on a real canvas with glowing paint splashes floating around, fuchsia glow",
    "industry-consulting": "the mascot with a small compass guiding a real person across a table map of glowing paths, amber glow",
    "industry-finance": "the mascot stacking glowing coins into neat towers beside a real calculator, lime glow",
    "industry-retail": "the mascot arranging a tiny beautiful shop window with glowing products, rose glow",
    "industry-entertainment": "the mascot under a small spotlight on a mini stage with glowing film reels floating, indigo glow",
    # toneOfVoice
    "toneOfVoice-profissional": "the mascot in a tiny elegant tie presenting a clean glowing document, calm neutral light",
    "toneOfVoice-descontraido": "the mascot lounging in a tiny hammock with a cold drink, relaxed warm light, gentle smile",
    "toneOfVoice-inspirador": "the mascot on a small hilltop at sunrise with arms open to a glowing horizon, golden glow",
    "toneOfVoice-direto": "the mascot hitting a glowing bullseye target with a dart, focused red glow",
    "toneOfVoice-educativo": "the mascot patiently explaining with a small glowing diagram to a curious real person, violet glow",
    "toneOfVoice-provocador": "the mascot with a playful smirk lighting a tiny glowing spark over a dark table, fiery glow",
    # marketingGoals
    "marketingGoals-automate": "the mascot relaxing with feet up while tiny glowing gears work alone on the desk, cyan glow",
    "marketingGoals-sales": "the mascot catching a gentle rain of glowing coins with a small basket, emerald glow",
    "marketingGoals-education": "the mascot climbing a small staircase of glowing books toward a bright graduation cap, violet glow",
    "marketingGoals-authority": "the mascot standing on a small podium with a soft glowing star above its head, amber glow",
    "marketingGoals-personal-brand": "the mascot polishing a glowing gem shaped like a heart on a velvet cushion, fuchsia glow",
    "marketingGoals-content-scale": "the mascot juggling several small glowing content cards effortlessly, rose glow",
    "marketingGoals-community": "the mascot in a warm circle of tiny glowing figures holding hands around a campfire, teal glow",
    # contentTypes
    "contentTypes-posts": "the mascot pinning a beautiful glowing note card to a cozy corkboard, sky blue glow",
    "contentTypes-reels": "the mascot filming with a tiny phone on a mini tripod, soft ring light glowing, rose glow",
    "contentTypes-artigos": "the mascot writing a long elegant glowing scroll with a fountain pen, violet glow",
    "contentTypes-stories": "the mascot taking a playful selfie with floating glowing circle frames, amber glow",
    "contentTypes-newsletter": "the mascot sending a glowing paper plane letter out of a cozy window, emerald glow",
    "contentTypes-anuncios": "the mascot with a tiny glowing megaphone announcing to floating attention sparks, red glow",
    # experienceLevel
    "experienceLevel-beginner": "the mascot watering a tiny glowing sprout in a small pot with care, fresh green glow",
    "experienceLevel-intermediate": "the mascot tending a healthy glowing young plant with several leaves, teal glow",
    "experienceLevel-advanced": "the mascot resting under a big beautiful glowing tree full of light fruits, deep emerald glow",
}

def build(prompt_text, prefix, seed):
    return {
        "1": {"class_type": "UNETLoader", "inputs": {"unet_name": "qwen_image_2512_fp8_e4m3fn.safetensors", "weight_dtype": "default"}},
        "1b": {"class_type": "LoraLoaderModelOnly", "inputs": {"lora_name": "Qwen-Image-2512-Lightning-4steps-V1.0-fp32.safetensors", "strength_model": 1.0, "model": ["1", 0]}},
        "2": {"class_type": "CLIPLoader", "inputs": {"clip_name": "qwen_2.5_vl_7b_fp8_scaled.safetensors", "type": "qwen_image", "device": "default"}},
        "3": {"class_type": "VAELoader", "inputs": {"vae_name": "qwen_image_vae.safetensors"}},
        "4": {"class_type": "CLIPTextEncode", "inputs": {"text": prompt_text, "clip": ["2", 0]}},
        "5": {"class_type": "ConditioningZeroOut", "inputs": {"conditioning": ["4", 0]}},
        "6": {"class_type": "EmptySD3LatentImage", "inputs": {"width": 832, "height": 624, "batch_size": 1}},
        "7": {"class_type": "KSampler", "inputs": {"seed": seed, "control_after_generate": "fixed", "steps": 4, "cfg": 1.0, "sampler_name": "euler", "scheduler": "simple", "denoise": 1, "model": ["1b", 0], "positive": ["4", 0], "negative": ["5", 0], "latent_image": ["6", 0]}},
        "8": {"class_type": "VAEDecode", "inputs": {"samples": ["7", 0], "vae": ["3", 0]}},
        "9": {"class_type": "SaveImage", "inputs": {"filename_prefix": f"persona_opts/{prefix}", "images": ["8", 0]}},
    }

def post(path, payload):
    req = urllib.request.Request(API + path, json.dumps(payload).encode(),
                                 {"Content-Type": "application/json"})
    return json.loads(urllib.request.urlopen(req).read())

jobs = []
for i, (name, core) in enumerate(OPTS.items()):
    pid = post("/prompt", {"prompt": build(core + FUSION, name, BASE_SEED + i)})["prompt_id"]
    jobs.append((pid, name))
print(f"PERSONA THUMBS: {len(jobs)} na fila", flush=True)

done = set()
t0 = time.time()
while len(done) < len(jobs) and time.time() - t0 < 3600:
    for pid, name in jobs:
        if pid in done:
            continue
        try:
            h = json.loads(urllib.request.urlopen(f"{API}/history/{pid}").read())
            if pid in h and h[pid].get("status", {}).get("completed"):
                done.add(pid)
        except Exception:
            pass
    time.sleep(5)
print(f"PERSONA THUMBS DONE {len(done)}/{len(jobs)} em {int(time.time()-t0)}s", flush=True)
