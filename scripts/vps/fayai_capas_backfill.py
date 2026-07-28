#!/usr/bin/env python3
"""Preenche as capas que o blog diario nao conseguiu gerar na hora (28/07/2026).

## O problema

A capa de cada materia sai do ComfyUI, que roda no PC do Ricardo e e alcancado
pelo comfy-bridge via Tailscale. O cron das noticias roda 10h UTC (7h BRT) — e
se naquele minuto o PC estiver desligado, ou o ComfyUI fechado, a materia sai
com a imagem generica do pool por editoria. O cron termina em exit 0 e nada
alerta. Medido em 28/07/2026: **as 29 materias do acervo estavam com capa
generica** — o blog inteiro, nao so os ultimos dias.

## A saida

Desacoplar a capa da publicacao. A materia continua saindo as 7h com o que
tiver; este script roda de tempos em tempos e preenche o que faltou assim que a
maquina do Ricardo estiver disponivel. Deixa de exigir que o PC esteja de pe num
minuto especifico e passa a exigir que esteja de pe em ALGUM momento — que e o
que acontece quando ele trabalha.

Bridge fora do ar sai em silencio e tenta de novo depois. Nao e erro: e a
maquina dele estar desligada.

## Por que escreve no Mongo direto

A rota /api/ainews/publish faz upsert com $set do item inteiro, incluindo
publishedAt=agora. Usar ela so para corrigir a imagem jogaria a materia velha
para o topo do feed como se fosse nova.
"""
import hashlib
import json
import os
import sys
import time
import urllib.request
from datetime import datetime, timedelta, timezone

from pymongo import MongoClient

DIAS = int(os.environ.get("CAPAS_DIAS", "30"))
# Teto por execucao: a GPU e a maquina de trabalho dele, nao um servidor de
# render. 6 capas ~= 90s de uso.
MAX = int(os.environ.get("CAPAS_MAX", "6"))
GLOWS = ["cyan", "violet", "rose", "lime", "gold"]
FUSION_SUFFIX = (
    ", an adorable glossy flat-vector robot mascot with big cute eyes naturally interacting inside a "
    "breathtaking cinematic photorealistic scene, seamless style fusion, dramatic film lighting, "
    "shallow depth of field, bokeh, deep dark navy blue atmosphere, rich cinematic color grading, "
    "professional photography, high detail, no text, no letters, no logos, no watermark"
)


def env(path):
    v = {}
    with open(path) as f:
        for line in f:
            if "=" in line and not line.startswith("#"):
                k, _, val = line.partition("=")
                v[k.strip()] = val.strip()
    return v


E = env("/root/kirmes/.env.fayai")
MONGO = env("/root/openclaw/task-executor/.env")["MONGODB_URI"]
BRIDGE, SECRET = E["COMFY_BRIDGE_URL"], E["COMFY_BRIDGE_SECRET"]
CLOUD, CKEY, CSEC = E["CLOUDINARY_CLOUD_NAME"], E["CLOUDINARY_API_KEY"], E["CLOUDINARY_API_SECRET"]


def log(m):
    print(f"[{datetime.now():%Y-%m-%d %H:%M}] {m}", flush=True)


def bridge(path, data=None, method="GET", timeout=30):
    req = urllib.request.Request(
        f"{BRIDGE}{path}",
        data=data,
        method=method,
        headers={"Content-Type": "application/json", "x-comfy-secret": SECRET},
    )
    return urllib.request.urlopen(req, timeout=timeout)


def workflow(text, prefix, seed):
    # Mesmo workflow do fayai_news.py: Qwen 2512 fp8 + Lightning 4 passos,
    # 1152x768, ~14s por imagem. Manter identico mantem o estilo do acervo.
    return {
        "1": {"class_type": "UNETLoader", "inputs": {"unet_name": "qwen_image_2512_fp8_e4m3fn.safetensors", "weight_dtype": "default"}},
        "1b": {"class_type": "LoraLoaderModelOnly", "inputs": {"lora_name": "Qwen-Image-2512-Lightning-4steps-V1.0-fp32.safetensors", "strength_model": 1.0, "model": ["1", 0]}},
        "2": {"class_type": "CLIPLoader", "inputs": {"clip_name": "qwen_2.5_vl_7b_fp8_scaled.safetensors", "type": "qwen_image", "device": "default"}},
        "3": {"class_type": "VAELoader", "inputs": {"vae_name": "qwen_image_vae.safetensors"}},
        "4": {"class_type": "CLIPTextEncode", "inputs": {"text": text, "clip": ["2", 0]}},
        "5": {"class_type": "ConditioningZeroOut", "inputs": {"conditioning": ["4", 0]}},
        "6": {"class_type": "EmptySD3LatentImage", "inputs": {"width": 1152, "height": 768, "batch_size": 1}},
        "7": {"class_type": "KSampler", "inputs": {"seed": seed, "control_after_generate": "fixed", "steps": 4, "cfg": 1.0, "sampler_name": "euler", "scheduler": "simple", "denoise": 1, "model": ["1b", 0], "positive": ["4", 0], "negative": ["5", 0], "latent_image": ["6", 0]}},
        "8": {"class_type": "VAEDecode", "inputs": {"samples": ["7", 0], "vae": ["3", 0]}},
        "9": {"class_type": "SaveImage", "inputs": {"filename_prefix": prefix, "images": ["8", 0]}},
    }


def gera_png(titulo, slug, glow, timeout=150):
    # O prompt de imagem original saia do LLM no dia da publicacao e nao foi
    # guardado no documento. O titulo e a melhor fonte que sobrou — e e
    # justamente do que a capa deveria falar.
    texto = f"{titulo}, {glow} glow" + FUSION_SUFFIX
    prefix = f"ainews/{datetime.now():%Y%m%d}_{slug}"
    corpo = json.dumps({"prompt": workflow(texto, prefix, int(time.time()) % 1_000_000)}).encode()
    pid = json.loads(bridge("/prompt", corpo, "POST").read())["prompt_id"]

    t0 = time.time()
    while time.time() - t0 < timeout:
        h = json.loads(bridge(f"/history/{pid}").read()).get(pid)
        if h and h.get("status", {}).get("completed"):
            imgs = h.get("outputs", {}).get("9", {}).get("images", [])
            if imgs:
                o = imgs[0]
                qs = f"filename={o['filename']}&subfolder={o.get('subfolder', '')}&type={o.get('type', 'output')}"
                return bridge(f"/view?{qs}", timeout=90).read()
            break
        time.sleep(2)
    raise TimeoutError(f"ComfyUI nao terminou a capa de '{slug}' em {timeout}s")


def cloudinary(png, public_id):
    ts = str(int(time.time()))
    fields = {"folder": "ainews", "public_id": public_id, "timestamp": ts}
    assinar = "&".join(f"{k}={fields[k]}" for k in sorted(fields))
    fields["signature"] = hashlib.sha1((assinar + CSEC).encode()).hexdigest()
    fields["api_key"] = CKEY

    b = "----fayai" + ts
    body = b""
    for k, v in fields.items():
        body += f'--{b}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n'.encode()
    body += (
        f'--{b}\r\nContent-Disposition: form-data; name="file"; filename="{public_id}.png"\r\n'
        "Content-Type: image/png\r\n\r\n"
    ).encode() + png + f"\r\n--{b}--\r\n".encode()

    req = urllib.request.Request(
        f"https://api.cloudinary.com/v1_1/{CLOUD}/image/upload",
        data=body,
        method="POST",
        headers={"Content-Type": f"multipart/form-data; boundary={b}"},
    )
    r = json.loads(urllib.request.urlopen(req, timeout=120).read())
    return f"https://res.cloudinary.com/{CLOUD}/image/upload/w_768,q_80,f_webp/{r['public_id']}"


def main():
    try:
        bridge("/system_stats", timeout=12).read()
    except Exception as e:
        log(f"bridge/ComfyUI indisponivel ({e}) — o PC deve estar desligado. Tento na proxima.")
        return 0

    col = MongoClient(MONGO)["fayapoint"]["ainews"]
    desde = datetime.now(timezone.utc) - timedelta(days=DIAS)
    pendentes = list(
        col.find(
            {
                "publishedAt": {"$gte": desde},
                "$or": [{"image": None}, {"image": {"$exists": False}}, {"image": ""}],
            },
            {"slug": 1, "title": 1},
        )
        .sort("publishedAt", -1)
        .limit(MAX)
    )

    if not pendentes:
        log("nenhuma materia sem capa nos ultimos %d dias." % DIAS)
        return 0

    log(f"{len(pendentes)} materia(s) sem capa — gerando (teto {MAX} por execucao)")
    ok = falhou = 0
    for i, d in enumerate(pendentes):
        slug = d["slug"]
        titulo = d.get("title", slug)
        try:
            png = gera_png(titulo, slug, GLOWS[i % len(GLOWS)])
            url = cloudinary(png, f"{datetime.now():%Y%m%d}_{slug}")
            col.update_one({"_id": d["_id"]}, {"$set": {"image": url}})
            log(f"  OK    {slug}")
            ok += 1
        except Exception as e:
            log(f"  FALHA {slug}: {e}")
            falhou += 1

    log(f"Fim ({ok} capas preenchidas, {falhou} falharam).")
    return 0 if falhou == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
