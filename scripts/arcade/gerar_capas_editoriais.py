# -*- coding: utf-8 -*-
"""Capas editoriais para o Blog IA Hoje — sem mascote.

## Por que existe

O `backfill_news_covers.py` cola em TODA capa o mesmo `FUSION_SUFFIX`:
"an adorable glossy flat-vector robot mascot with big cute eyes". A cena muda
por materia, o mascote nao. Resultado, olhando a listagem em 29/07/2026: nove
cards seguidos com o mesmo robozinho fofo em cores diferentes. O Ricardo:
"imagens tao genericas que colocam em questao a veracidade de todo o blog".

Ele tem razao, e o problema nao e a qualidade das imagens — e o registro. Um
mascote de desenho sobre uma noticia diz "isto e conteudo de marca". Uma
materia sobre vazamento de conversas privadas ou sobre deteccao de rosto em
video precisa parecer jornalismo, ou o leitor desconta a credibilidade do texto
tambem.

## O que muda

Fora o mascote. A identidade visual passa a vir da LUZ e da COR — a mesma
gradacao azul-marinho profunda, a mesma fotografia de foco raso — e nao de um
personagem repetido. Cada cena encena literalmente o que a materia afirma
(regra do espelho, herdada do script antigo, que era a parte boa dele).

O negativo e explicito contra desenho: sem isso o Qwen escorrega de volta para
ilustracao, porque "AI" no prompt puxa esse imaginario.

## Uso

    node --env-file=.env.local ...   # nao: este e python
    python scripts/arcade/gerar_capas_editoriais.py            # gera e sobe
    python scripts/arcade/gerar_capas_editoriais.py --so-gerar # so gera local

Precisa do ComfyUI no ar em localhost:8000 e das variaveis MONGODB_URI e
CLOUDINARY_* no ambiente.
"""
import hashlib
import json
import urllib.parse
import os
import sys
import time
import urllib.request

COMFY = "http://localhost:8000"

# A assinatura visual da casa, agora carregada por luz e nao por personagem.
ESTILO = (
    ", editorial photojournalism, real photograph, cinematic film lighting, "
    "shallow depth of field, natural bokeh, deep dark navy blue atmosphere, "
    "rich cinematic color grading, shot on 35mm, high detail, "
    "no text, no letters, no logos, no watermark, no cartoon, no illustration, "
    "no mascot, no 3d render, no anthropomorphic robot"
)

# (slug, cena) — a cena encena o que a materia AFIRMA, nao o tema dela.
ITENS = [
    (
        "tiktok-detector-rosto-ia",
        "close-up of a real smartphone held in a hand, screen showing a paused "
        "short video of a person's face with a thin scanning frame drawn around "
        "it, a small alert dot glowing at the corner of the frame, dim room, "
        "screen light on the fingers",
    ),
    (
        "perplexity-personal-computer",
        "a real Windows laptop open on a wooden desk seen slightly from above, "
        "several application windows arranged mid-task as if something moved "
        "them, a faint light trail between two of the windows, cold morning "
        "light from a window at the left",
    ),
    (
        "claude-conversas-publicas-google",
        "a real laptop screen in a dark room showing a chat conversation, and "
        "reflected faintly on the black glass of the screen a search results "
        "page, as if the private text were visible from outside, tight framing, "
        "cold blue light",
    ),
    (
        "claude-opus-5",
        "a real desk at night with a long printed document beside a laptop, the "
        "screen showing a dense wall of structured text and code side by side, "
        "warm desk lamp against deep navy shadow, hands resting near the "
        "keyboard",
    ),
    (
        "meta-ai-assistente-whatsapp",
        "a real smartphone on a kitchen counter showing a messaging thread, a "
        "grocery list and a calendar note visible in the conversation, morning "
        "domestic light, a coffee cup slightly out of focus in the foreground",
    ),
    (
        "google-nova-caixa-busca",
        "a real desktop monitor showing an empty search field that is much "
        "larger than usual, a blinking cursor inside it, the rest of the page "
        "dark and sparse, office at dusk, reflection of the screen on the desk "
        "surface",
    ),
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


def gerar(prompt_text, prefix, seed, timeout=180):
    payload = json.dumps({"prompt": build(prompt_text, prefix, seed)}).encode()
    req = urllib.request.Request(COMFY + "/prompt", data=payload, headers={"Content-Type": "application/json"})
    prompt_id = json.loads(urllib.request.urlopen(req).read())["prompt_id"]

    limite = time.time() + timeout
    while time.time() < limite:
        h = json.loads(urllib.request.urlopen(f"{COMFY}/history/{prompt_id}").read())
        entry = h.get(prompt_id)
        if entry and entry.get("outputs"):
            img = entry["outputs"]["9"]["images"][0]
            url = f"{COMFY}/view?filename={urllib.parse.quote(img['filename'])}&subfolder={urllib.parse.quote(img.get('subfolder',''))}&type={img.get('type','output')}"
            return urllib.request.urlopen(url).read(), img["filename"]
        time.sleep(1.5)
    raise TimeoutError(f"ComfyUI nao devolveu em {timeout}s")


def subir_cloudinary(png_bytes, public_id, cloud_name, api_key, api_secret):
    timestamp = str(int(time.time()))
    folder = "fayapoint/ainews"
    to_sign = f"folder={folder}&public_id={public_id}&timestamp={timestamp}{api_secret}"
    signature = hashlib.sha1(to_sign.encode()).hexdigest()
    boundary = "----fayaEditorialBoundary"
    fields = {"api_key": api_key, "timestamp": timestamp, "signature": signature,
              "folder": folder, "public_id": public_id}
    parts = [f"--{boundary}\r\nContent-Disposition: form-data; name=\"{k}\"\r\n\r\n{v}\r\n" for k, v in fields.items()]
    body = "".join(parts).encode()
    body += (f"--{boundary}\r\nContent-Disposition: form-data; name=\"file\"; filename=\"{public_id}.png\"\r\n"
             "Content-Type: image/png\r\n\r\n").encode() + png_bytes + f"\r\n--{boundary}--\r\n".encode()
    req = urllib.request.Request(
        f"https://api.cloudinary.com/v1_1/{cloud_name}/image/upload",
        data=body, method="POST",
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
    )
    result = json.loads(urllib.request.urlopen(req, timeout=90).read())
    return f"https://res.cloudinary.com/{cloud_name}/image/upload/w_768,q_80,f_webp/{result['public_id']}"


if __name__ == "__main__":
    so_gerar = "--so-gerar" in sys.argv
    destino = os.path.join(os.path.dirname(__file__), "..", "..", "_capas_novas")
    os.makedirs(destino, exist_ok=True)

    col = None
    if not so_gerar:
        from pymongo import MongoClient
        col = MongoClient(os.environ["MONGODB_URI"])["fayapoint"]["ainews"]
        cloud_name = os.environ["CLOUDINARY_CLOUD_NAME"]
        cloud_key = os.environ["CLOUDINARY_API_KEY"]
        cloud_secret = os.environ["CLOUDINARY_API_SECRET"]

    ok, falhou = [], []
    for i, (slug, cena) in enumerate(ITENS):
        try:
            caminho = os.path.join(destino, f"{slug}.png")
            # Reaproveita o PNG se ja foi gerado nesta passagem: assim o upload
            # sobe EXATAMENTE a imagem que foi conferida a olho, e nao uma nova
            # tiragem com a mesma semente que ninguem viu.
            if os.path.exists(caminho) and so_gerar is False:
                with open(caminho, "rb") as f:
                    png = f.read()
                print(f"     {slug}: reaproveitando PNG ja gerado")
            else:
                prompt_text = cena + ESTILO
                prefix = f"ainews_editorial/{time.strftime('%Y%m%d')}_{slug}"
                png, _ = gerar(prompt_text, prefix, 4200 + i)
                with open(caminho, "wb") as f:
                    f.write(png)

            if so_gerar:
                print(f"OK   {slug}  ->  {caminho}  ({len(png)//1024} KB)")
            else:
                public_id = f"{time.strftime('%Y%m%d')}_{slug}_editorial"
                url = subir_cloudinary(png, public_id, cloud_name, cloud_key, cloud_secret)
                res = col.update_one({"slug": slug}, {"$set": {"image": url}})
                print(f"OK   {slug}  ->  {url}  (banco: {res.matched_count})")
            ok.append(slug)
        except Exception as e:
            falhou.append(slug)
            print(f"FALHA {slug}: {e}")

    print(f"\nok: {len(ok)} | falharam: {len(falhou)}")
    if falhou:
        print("falharam:", ", ".join(falhou))
