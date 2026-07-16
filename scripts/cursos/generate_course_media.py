# -*- coding: utf-8 -*-
"""Ilustrações por capítulo — piloto chatgpt-zero (16/07/2026).
31 imagens no estilo §12 (fusão vetor+foto, Qwen 2512 + Lightning, ~14s/img).
Regra do espelho: cenário = TEMA do módulo; ação do mascote = TIPO da aula.
Saída: ComfyUI output/course_media/chatgpt-zero/cap-NN + manifest."""
import json, time, urllib.request
from pathlib import Path

API = "http://localhost:8000"
SLUG = "chatgpt-zero"
BASE_SEED = 7100

FUSION = (", an adorable glossy flat-vector robot mascot with big cute eyes naturally interacting inside a "
          "breathtaking cinematic photorealistic scene, seamless style fusion, dramatic film lighting, shallow "
          "depth of field, bokeh, deep dark navy blue atmosphere, rich cinematic color grading, professional "
          "photography, high detail, no text, no letters, no logos, no watermark")

# 6 temas do curso → cenário real + cor de contexto (§12)
THEMES = [
    ("real cozy kitchen table with a laptop and fresh coffee, morning light through a window", "lime"),          # Primeiros passos
    ("real writer's desk with beautiful recipe cards and wooden word blocks being assembled", "violet"),          # Prompting essencial
    ("real tidy home office with a paper agenda, sticky notes becoming neat floating lists", "cyan"),             # Produtividade e organização
    ("real content creator desk with camera, microphone and notebook, drafts coming alive", "rose"),              # Criação de conteúdo
    ("real library study desk with open books, warm lamp and floating flashcards", "violet"),                     # Estudo, pesquisa e análise
    ("real artisan workbench where a crafted piece is being polished under a focused lamp", "gold"),              # Revisão crítica e evolução
]

# 5 tipos de aula → ação do mascote
TYPES = [
    "the mascot unrolling a clear glowing blueprint map of the journey ahead",                                    # Fundamentos e visão estratégica
    "the mascot carefully arranging the real tools and a glowing setup checklist before starting",                # Configuração, contexto e preparação
    "the mascot and a real person working side by side, a glowing result emerging between them",                  # Aplicação guiada em cenário real
    "the mascot gently catching a wobbling glowing piece before it falls, kind warning light",                    # Erros comuns, validação e qualidade
    "the mascot proudly presenting a finished glowing deliverable on the desk, small celebration",                # Projeto orientado a entrega
]

INTRO = ("real welcoming front porch of a cozy study room, door open to warm light, a laptop waiting on a desk, "
         "the mascot inviting the viewer in with open arms, gold glow")

def build(prompt_text, prefix, seed):
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

def submit(wf):
    payload = json.dumps({"prompt": wf}).encode("utf-8")
    req = urllib.request.Request(API + "/prompt", data=payload, headers={"Content-Type": "application/json"})
    return json.loads(urllib.request.urlopen(req).read())["prompt_id"]

# cap-01 = intro; cap-02..cap-31 = 6 temas × 5 tipos (na ordem do curso)
prompts = [("cap-01", INTRO)]
n = 2
for setting, accent in THEMES:
    for action in TYPES:
        prompts.append((f"cap-{n:02d}", f"{setting}, {action}, {accent} glow"))
        n += 1

jobs, manifest = [], []
for i, (cap, core) in enumerate(prompts):
    prompt_text = core + FUSION
    prefix = f"course_media/{SLUG}/{cap}"
    pid = submit(build(prompt_text, prefix, BASE_SEED + i))
    jobs.append((pid, cap))
    manifest.append({"cap": cap, "seed": BASE_SEED + i, "prompt": prompt_text})
    print(f"[{cap}] submitted", flush=True)

Path(__file__).with_name(f"{SLUG}-media-manifest.json").write_text(
    json.dumps(manifest, ensure_ascii=False, indent=1), encoding="utf-8")

done = set()
t0 = time.time()
while len(done) < len(jobs):
    for pid, cap in jobs:
        if pid in done:
            continue
        try:
            h = json.loads(urllib.request.urlopen(f"{API}/history/{pid}").read())
            if pid in h and h[pid].get("status", {}).get("completed"):
                done.add(pid)
                print(f"{len(done)}/{len(jobs)} done — {int(time.time()-t0)}s", flush=True)
        except Exception:
            pass
    time.sleep(4)

print(f"COURSE MEDIA DONE {len(done)} in {int(time.time()-t0)}s", flush=True)
