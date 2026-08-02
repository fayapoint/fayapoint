# -*- coding: utf-8 -*-
"""Rosto do aluno dentro do capitulo — ComfyUI local (02/08/2026).

Qwen Image Edit 2511 aceita ate 3 imagens de referencia no MESMO encoder
(`TextEncodeQwenImageEditPlus`). E isso que torna a personalizacao visual
possivel sem treinar LoRA por aluno: a foto do aluno entra como referencia
viva, nao como peso treinado. Treinar LoRA por aluno custaria 31-47s por
passagem (ver reference_lora_local) — inviavel. Aqui e uma inferencia.

Dois modos:
  cena   — so o rosto: gera uma cena nova ja com a pessoa dentro
  editar — rosto + imagem base: coloca a pessoa numa cena que ja existe

Uso:
  python rosto_aluno.py cena   Ricardo_selfie.png "sitting at a kitchen table with a laptop" saida
  python rosto_aluno.py editar Ricardo_selfie.png cap01-sistema.png "put this person at the desk" saida
"""
import json, sys, time, urllib.request, urllib.error
from pathlib import Path

API = "http://127.0.0.1:8000"

# 2509 em fp8, nao 2511 em bf16. O 2511 e melhor de qualidade, mas em bf16 ele
# encena 39 GB para uma placa de 16 GB e 12 GB de RAM livre — o ComfyUI passa a
# paginar em disco e um unico quadro leva mais de 15 min (medido em 02/08). O
# fp8 cabe e roda em minutos. Se um dia existir 2511 em fp8, trocar aqui.
MODELO = "qwen_image_edit_2509_fp8_e4m3fn.safetensors"
LORA = "Qwen-Image-Edit-2509-Lightning-4steps-V1.0-bf16.safetensors"
CLIP = "qwen_2.5_vl_7b_fp8_scaled.safetensors"
VAE = "qwen_image_vae.safetensors"

# O visual do curso: a cena e fotorrealista e cinematografica; o aluno entra
# como pessoa real, nao como mascote.
ESTILO = (
    ", breathtaking cinematic photorealistic scene, dramatic film lighting, shallow depth of field, "
    "bokeh, deep dark navy blue atmosphere, rich cinematic color grading, professional photography, "
    "high detail, natural skin texture, no text, no letters, no logos, no watermark"
)
NEGATIVO = (
    "blurry, low quality, distorted face, deformed, extra fingers, watermark, text, "
    "plastic skin, uncanny, different person, cartoon face"
)


def _post(payload):
    req = urllib.request.Request(
        f"{API}/prompt",
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json"},
    )
    try:
        return json.loads(urllib.request.urlopen(req, timeout=120).read())
    except urllib.error.HTTPError as e:
        raise SystemExit(f"ComfyUI recusou o grafo:\n{e.read().decode()[:3000]}")


def _base(prompt, largura, altura, seed, prefixo, refs):
    """Grafo comum. `refs` = lista de nomes de imagem ja no input/ do ComfyUI.

    A primeira referencia manda na identidade; por isso o rosto vem sempre em
    image1. O encoder positivo e o negativo recebem as MESMAS referencias — se
    o negativo nao as ver, ele empurra o resultado para longe da pessoa.
    """
    g = {
        "1": {"class_type": "UNETLoader", "inputs": {"unet_name": MODELO, "weight_dtype": "default"}},
        "2": {"class_type": "LoraLoaderModelOnly", "inputs": {"model": ["1", 0], "lora_name": LORA, "strength_model": 1.0}},
        "3": {"class_type": "CLIPLoader", "inputs": {"clip_name": CLIP, "type": "qwen_image", "device": "default"}},
        "4": {"class_type": "VAELoader", "inputs": {"vae_name": VAE}},
    }
    for i, nome in enumerate(refs):
        g[f"10{i}"] = {"class_type": "LoadImage", "inputs": {"image": nome}}

    pos = {"clip": ["3", 0], "prompt": prompt + ESTILO, "vae": ["4", 0]}
    neg = {"clip": ["3", 0], "prompt": NEGATIVO, "vae": ["4", 0]}
    for i in range(len(refs)):
        pos[f"image{i+1}"] = [f"10{i}", 0]
        neg[f"image{i+1}"] = [f"10{i}", 0]

    g["20"] = {"class_type": "TextEncodeQwenImageEditPlus", "inputs": pos}
    g["21"] = {"class_type": "TextEncodeQwenImageEditPlus", "inputs": neg}
    g["30"] = {"class_type": "EmptySD3LatentImage", "inputs": {"width": largura, "height": altura, "batch_size": 1}}
    g["40"] = {"class_type": "KSampler", "inputs": {
        "seed": seed, "steps": 4, "cfg": 1.0, "sampler_name": "euler", "scheduler": "simple",
        "denoise": 1.0, "model": ["2", 0], "positive": ["20", 0], "negative": ["21", 0], "latent_image": ["30", 0]}}
    g["50"] = {"class_type": "VAEDecode", "inputs": {"samples": ["40", 0], "vae": ["4", 0]}}
    g["60"] = {"class_type": "SaveImage", "inputs": {"filename_prefix": prefixo, "images": ["50", 0]}}
    return g


def gerar(modo, rosto, prompt, prefixo, base=None, largura=1152, altura=640, seed=7777):
    refs = [rosto] if modo == "cena" else [rosto, base]
    grafo = _base(prompt, largura, altura, seed, prefixo, refs)
    r = _post({"prompt": grafo})
    return r.get("prompt_id")


def esperar(pid, timeout=600):
    t0 = time.time()
    while time.time() - t0 < timeout:
        try:
            h = json.loads(urllib.request.urlopen(f"{API}/history/{pid}", timeout=30).read())
        except Exception:
            time.sleep(3); continue
        if pid in h:
            st = h[pid].get("status", {})
            if st.get("status_str") == "error" or st.get("completed") is False and st.get("status_str"):
                msgs = st.get("messages", [])
                return None, msgs
            outs = h[pid].get("outputs", {})
            arqs = []
            for node in outs.values():
                for im in node.get("images", []):
                    arqs.append(im["filename"])
            if arqs:
                return arqs, None
        time.sleep(3)
    return None, "timeout"


if __name__ == "__main__":
    modo = sys.argv[1]
    rosto = sys.argv[2]
    if modo == "cena":
        prompt, prefixo = sys.argv[3], sys.argv[4]
        base = None
    else:
        base, prompt, prefixo = sys.argv[3], sys.argv[4], sys.argv[5]
    pid = gerar(modo, rosto, prompt, prefixo, base=base)
    print("prompt_id:", pid, flush=True)
    arqs, err = esperar(pid)
    if err:
        print("ERRO:", json.dumps(err, ensure_ascii=False)[:2000])
        sys.exit(1)
    print("OK:", arqs)
