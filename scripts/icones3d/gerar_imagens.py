"""Gera as imagens-fonte dos ícones 3D do dashboard (17 ícones x 3 famílias).

Só a imagem — a malha vem depois, em gerar_malhas.py, porque o Hunyuan3D
precisa de uma foto do objeto para reconstruir. Receita Qwen 2512 + Lightning
(4 passos), a mesma das 70 fotos do site: ~14 s por imagem.

    python gerar_imagens.py            # todos
    python gerar_imagens.py dashboard  # só um ícone (para conferir o prompt)
"""

import json
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

from icones import todos

COMFY = "http://localhost:8000"
DATA = "20260727"
SAIDA = Path(__file__).parent / "fonte"


def workflow(prompt: str, seed: int, prefixo: str) -> dict:
    return {
        "1": {"class_type": "UNETLoader", "inputs": {"unet_name": "qwen_image_2512_fp8_e4m3fn.safetensors", "weight_dtype": "default"}},
        "1b": {"class_type": "LoraLoaderModelOnly", "inputs": {"lora_name": "Qwen-Image-2512-Lightning-4steps-V1.0-fp32.safetensors", "strength_model": 1.0, "model": ["1", 0]}},
        "2": {"class_type": "CLIPLoader", "inputs": {"clip_name": "qwen_2.5_vl_7b_fp8_scaled.safetensors", "type": "qwen_image", "device": "default"}},
        "3": {"class_type": "VAELoader", "inputs": {"vae_name": "qwen_image_vae.safetensors"}},
        "4": {"class_type": "CLIPTextEncode", "inputs": {"text": prompt, "clip": ["2", 0]}},
        "5": {"class_type": "ConditioningZeroOut", "inputs": {"conditioning": ["4", 0]}},
        # quadrado: o ícone é quadrado no dashboard e o Hunyuan3D gosta do objeto centrado
        "6": {"class_type": "EmptySD3LatentImage", "inputs": {"width": 1024, "height": 1024, "batch_size": 1}},
        "7": {"class_type": "KSampler", "inputs": {
            "seed": seed, "control_after_generate": "fixed", "steps": 4, "cfg": 1.0,
            "sampler_name": "euler", "scheduler": "simple", "denoise": 1,
            "model": ["1b", 0], "positive": ["4", 0], "negative": ["5", 0], "latent_image": ["6", 0]}},
        "8": {"class_type": "VAEDecode", "inputs": {"samples": ["7", 0], "vae": ["3", 0]}},
        "9": {"class_type": "SaveImage", "inputs": {"filename_prefix": prefixo, "images": ["8", 0]}},
    }


def submeter(wf: dict) -> str:
    req = urllib.request.Request(
        f"{COMFY}/prompt",
        data=json.dumps({"prompt": wf}).encode("utf-8"),
        headers={"Content-Type": "application/json"},
    )
    return json.loads(urllib.request.urlopen(req).read())["prompt_id"]


def main() -> None:
    filtro = sys.argv[1] if len(sys.argv) > 1 else None
    SAIDA.mkdir(parents=True, exist_ok=True)

    jobs = []
    for slug, familia, prompt, seed in todos():
        if filtro and slug != filtro:
            continue
        prefixo = f"icones3d/{DATA}_{slug}_{familia}"
        jobs.append((submeter(workflow(prompt, seed, prefixo)), slug, familia))

    print(f"{len(jobs)} imagens na fila", flush=True)

    manifesto = {}
    prontos = set()
    inicio = time.time()
    while len(prontos) < len(jobs):
        for pid, slug, familia in jobs:
            if pid in prontos:
                continue
            h = json.loads(urllib.request.urlopen(f"{COMFY}/history/{pid}").read())
            if pid not in h:
                continue
            prontos.add(pid)
            saidas = h[pid].get("outputs", {}).get("9", {}).get("images", [])
            if not saidas:
                print(f"  FALHOU {slug}/{familia}", flush=True)
                continue
            nome = saidas[0]["filename"]
            dado = urllib.request.urlopen(f"{COMFY}/view?filename={urllib.parse.quote(nome)}&subfolder=icones3d&type=output").read()
            destino = SAIDA / f"{slug}_{familia}.png"
            destino.write_bytes(dado)
            manifesto[f"{slug}_{familia}"] = {"slug": slug, "familia": familia, "arquivo": destino.name}
            print(f"  [{len(prontos)}/{len(jobs)}] {destino.name} ({len(dado)//1024} KB)", flush=True)
        if len(prontos) < len(jobs):
            time.sleep(3)

    (SAIDA / "manifesto.json").write_text(json.dumps(manifesto, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"pronto em {time.time() - inicio:.0f}s -> {SAIDA}", flush=True)


if __name__ == "__main__":
    main()
