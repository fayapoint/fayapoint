# -*- coding: utf-8 -*-
"""Backfill de capas especificas pras materias do Blog IA Hoje que ja
estavam publicadas antes do pipeline de imagem por artigo existir (20/07/2026).
Gera 1 imagem por materia via ComfyUI local (mesmo pipeline do
generate_blog_pool.py), sobe pra Cloudinary e atualiza o campo `image` do
doc em fayapoint.ainews diretamente."""
import hashlib
import json
import time
import urllib.request

from pymongo import MongoClient

COMFY = "http://localhost:8000"
FUSION_SUFFIX = (", an adorable glossy flat-vector robot mascot with big cute eyes naturally interacting inside a "
                  "breathtaking cinematic photorealistic scene, seamless style fusion, dramatic film lighting, "
                  "shallow depth of field, bokeh, deep dark navy blue atmosphere, rich cinematic color grading, "
                  "professional photography, high detail, no text, no letters, no logos, no watermark")

# (slug, glow, cena -- regra do espelho: encena exatamente o que a materia diz)
# NOTA 20/07/2026: a queda de energia interrompeu a primeira passada depois de
# 5/13 -- restam so os 8 que ainda nao tem `image` no banco.
ITEMS = [
    ("musica-feita-com-suno", "rose",
     "real laptop screen showing a music waveform editor with an AI-generated song playing, headphones resting on a real desk, warm studio light"),
    ("tiktok-deteccao-de-imagem-ia", "rose",
     "real smartphone screen showing a short-video feed with a glowing 'conteudo gerado por IA' warning badge appearing over a face in the video"),
    ("thinking-machines-inkling", "violet",
     "real open toolbox on a workbench with a glowing customizable AI module inside, gears and sliders being adjusted by hand"),
    ("huggingface-open-source-ia", "cyan",
     "real laptop screen showing an open-source code repository page with a friendly glowing download icon, a small Brazilian flag pin on a real backpack beside it"),
    ("waze-novas-funcionalidades-ia", "cyan",
     "real smartphone mounted on a car dashboard showing a navigation map, a glowing voice waveform icon speaking a short route instruction"),
    ("openai-familias-chatgpt", "lime",
     "real kitchen table with a real family calendar and homework notebook, a tablet screen glowing with a friendly study planner and chore checklist"),
    ("claude-code-x-goose-gratis", "gold",
     "real two price tags side by side on a desk, one expensive gold tag and one glowing green free tag, a laptop behind them generating code"),
    ("railway-cloud-ia-nativa", "cyan",
     "real data center server racks with glowing blue cables, a small rocket icon launching upward from a cloud symbol on a monitor"),
]


def build(prompt_text, prefix, seed):
    return {
        "1": {"class_type": "UNETLoader", "inputs": {"unet_name": "qwen_image_2512_fp8_e4m3fn.safetensors", "weight_dtype": "default"}},
        "1b": {"class_type": "LoraLoaderModelOnly", "inputs": {"lora_name": "Qwen-Image-2512-Lightning-4steps-V1.0-fp32.safetensors", "strength_model": 1.0, "model": ["1", 0]}},
        "2": {"class_type": "CLIPLoader", "inputs": {"clip_name": "qwen_2.5_vl_7b_fp8_scaled.safetensors", "type": "qwen_image", "device": "default"}},
        "3": {"class_type": "VAELoader", "inputs": {"vae_name": "qwen_image_vae.safetensors"}},
        "4": {"class_type": "CLIPTextEncode", "inputs": {"text": prompt_text, "clip": ["2", 0]}},
        "5": {"class_type": "ConditioningZeroOut", "inputs": {"conditioning": ["4", 0]}},
        "6": {"class_type": "EmptySD3LatentImage", "inputs": {"width": 1152, "height": 768, "batch_size": 1}},
        "7": {"class_type": "KSampler", "inputs": {"seed": seed, "control_after_generate": "fixed", "steps": 4, "cfg": 1.0, "sampler_name": "euler", "scheduler": "simple", "denoise": 1, "model": ["1b", 0], "positive": ["4", 0], "negative": ["5", 0], "latent_image": ["6", 0]}},
        "8": {"class_type": "VAEDecode", "inputs": {"samples": ["7", 0], "vae": ["3", 0]}},
        "9": {"class_type": "SaveImage", "inputs": {"filename_prefix": prefix, "images": ["8", 0]}},
    }


def generate_png(prompt_text, prefix, seed, timeout=60):
    payload = json.dumps({"prompt": build(prompt_text, prefix, seed)}).encode()
    req = urllib.request.Request(COMFY + "/prompt", data=payload, headers={"Content-Type": "application/json"})
    prompt_id = json.loads(urllib.request.urlopen(req).read())["prompt_id"]
    t0 = time.time()
    while time.time() - t0 < timeout:
        h = json.loads(urllib.request.urlopen(f"{COMFY}/history/{prompt_id}").read())
        entry = h.get(prompt_id)
        if entry and entry.get("status", {}).get("completed"):
            outputs = entry.get("outputs", {}).get("9", {}).get("images", [])
            if outputs:
                out = outputs[0]
                qs = f"filename={out['filename']}&subfolder={out.get('subfolder', '')}&type={out.get('type', 'output')}"
                return urllib.request.urlopen(f"{COMFY}/view?{qs}").read()
            break
        time.sleep(2)
    raise TimeoutError(f"timeout gerando {prefix}")


def upload_to_cloudinary(png_bytes, public_id, cloud_name, api_key, api_secret):
    timestamp = str(int(time.time()))
    folder = "fayapoint/ainews"
    to_sign = f"folder={folder}&public_id={public_id}&timestamp={timestamp}{api_secret}"
    signature = hashlib.sha1(to_sign.encode()).hexdigest()
    boundary = "----fayabackfillBoundary"
    fields = {"api_key": api_key, "timestamp": timestamp, "signature": signature,
              "folder": folder, "public_id": public_id}
    parts = []
    for k, v in fields.items():
        parts.append(f"--{boundary}\r\nContent-Disposition: form-data; name=\"{k}\"\r\n\r\n{v}\r\n")
    body = "".join(parts).encode()
    body += (f"--{boundary}\r\nContent-Disposition: form-data; name=\"file\"; filename=\"{public_id}.png\"\r\n"
              "Content-Type: image/png\r\n\r\n").encode() + png_bytes + f"\r\n--{boundary}--\r\n".encode()
    req = urllib.request.Request(
        f"https://api.cloudinary.com/v1_1/{cloud_name}/image/upload",
        data=body, method="POST",
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
    )
    result = json.loads(urllib.request.urlopen(req, timeout=60).read())
    return f"https://res.cloudinary.com/{cloud_name}/image/upload/w_768,q_80,f_webp/{result['public_id']}"


if __name__ == "__main__":
    import os
    import sys

    mongo_uri = os.environ["MONGODB_URI"]
    cloud_name = os.environ["CLOUDINARY_CLOUD_NAME"]
    cloud_key = os.environ["CLOUDINARY_API_KEY"]
    cloud_secret = os.environ["CLOUDINARY_API_SECRET"]

    client = MongoClient(mongo_uri)
    col = client["fayapoint"]["ainews"]

    ok, failed = [], []
    for i, (slug, glow, cena) in enumerate(ITEMS):
        try:
            prompt_text = cena + f", {glow} glow" + FUSION_SUFFIX
            prefix = f"ainews_backfill/{time.strftime('%Y%m%d')}_{slug}"
            png = generate_png(prompt_text, prefix, 9000 + i)
            url = upload_to_cloudinary(png, slug, cloud_name, cloud_key, cloud_secret)
            res = col.update_one({"slug": slug}, {"$set": {"image": url}})
            ok.append(slug)
            print(f"OK {slug} -> {url} (matched={res.matched_count})")
        except Exception as e:
            failed.append(slug)
            print(f"FAIL {slug}: {e}")

    print(f"\n{len(ok)}/{len(ITEMS)} done. Failed: {failed}")
