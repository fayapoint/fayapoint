# -*- coding: utf-8 -*-
"""O mascote da FayAI em 3D, pela mesma tecnica dos icones do dashboard.

## Por que

Pedido do Ricardo em 29/07/2026: *"ainda acho que podemos utilizar nosso
robozinho interagindo comigo, entretanto o robozinho deveria ser uma versao 3d
utilizando a tecnica que utilizamos para os icones"*.

A tecnica dos icones (`scripts/icones3d/`) e de dois passos: o Qwen 2512 gera
uma FOTO do objeto em fundo chapado, e o Hunyuan3D reconstroi a malha a partir
dela. O que muda aqui e o objeto — em vez de um trofeu ou um carrinho, o
mascote — e o destino: alem do `.glb`, precisamos de um PNG com alfa para
compor dentro da capa.

## Os tres arquivos que saem

    mascote/fonte_<pose>.png    a foto que o Qwen gerou (fundo cinza chapado)
    mascote/<pose>.png          a mesma, com o fundo recortado (alfa)
    mascote/mascote.glb         a malha, para o site e para reuso

## Por que o recorte e feito aqui, no PIL, e nao no ComfyUI

Nao ha no servidor nenhum no de remocao de fundo instalado (procurei por
birefnet, rembg, matting: nenhum). E o `Load3D`, que renderizaria o `.glb` num
angulo qualquer, exige uma entrada do tipo `LOAD_3D` — um widget de interface,
que nao se preenche por API. Entao o alfa sai por chave de luminancia sobre o
fundo cinza que o proprio prompt dos icones ja pede ("plain flat light grey
background, no cast shadow, no ground plane"), o que torna a chave trivial e
confiavel.

## Poses

Varias, porque o Ricardo pediu o mascote "em varias situacoes nem sempre no
foreground, mas as vezes como elementos de background". Uma pose so, repetida,
seria o mesmo erro do mascote antigo — com mais poligonos.

    python scripts/arcade/gerar_mascote_3d.py           # imagens + recorte
    python scripts/arcade/gerar_mascote_3d.py --malha   # tambem gera o .glb
"""
import json
import os
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

from PIL import Image

COMFY = "http://localhost:8000"
SAIDA = Path(__file__).parent.parent.parent / "_capas_novas" / "mascote"

# A linguagem de forma da familia "solido" — a escolhida pelo Ricardo em 27/07
# para os icones do dashboard. O mascote precisa pertencer aquela familia, ou
# vira um segundo sistema visual concorrendo com o primeiro.
FAMILIA_SOLIDO = (
    "chunky solid toy object, thick rounded edges, soft inflated volume, "
    "smooth continuous surface, vinyl designer toy sculpture"
)

# O que o Hunyuan3D precisa ver para reconstruir. Copiado de icones.py de
# proposito: mudar isto aqui sem mudar la faria o mascote sair de uma familia
# diferente da dos icones.
COMUM = (
    "single centered object, isolated on a plain flat light grey background, "
    "even soft studio lighting, no cast shadow, no ground plane, "
    "no text, no letters, no logo, no watermark, "
    "the entire object fully visible with margin around it, product render"
)

BASE = (
    "a friendly rounded robot mascot character with a smooth dome head, two large "
    "glossy dark eyes, a short antenna, a compact body and two simple arms"
)

POSES = [
    ("observando", "standing and looking slightly up to its right, one hand raised near the chin as if watching something", "three-quarter view from slightly above"),
    ("apontando",  "standing and pointing forward with one arm extended, the other arm at its side", "three-quarter view at eye level"),
    ("sentado",    "sitting down with legs forward and hands resting on its knees, relaxed", "three-quarter view from slightly above"),
    ("costas",     "seen from behind over its shoulder, head turned slightly to the side", "rear three-quarter view at eye level"),
    ("pequeno",    "standing still with arms down, neutral and compact, seen straight on", "front view at eye level"),
]


def workflow_imagem(prompt: str, seed: int, prefixo: str) -> dict:
    return {
        "1": {"class_type": "UNETLoader", "inputs": {"unet_name": "qwen_image_2512_fp8_e4m3fn.safetensors", "weight_dtype": "default"}},
        "1b": {"class_type": "LoraLoaderModelOnly", "inputs": {"lora_name": "Qwen-Image-2512-Lightning-4steps-V1.0-fp32.safetensors", "strength_model": 1.0, "model": ["1", 0]}},
        "2": {"class_type": "CLIPLoader", "inputs": {"clip_name": "qwen_2.5_vl_7b_fp8_scaled.safetensors", "type": "qwen_image", "device": "default"}},
        "3": {"class_type": "VAELoader", "inputs": {"vae_name": "qwen_image_vae.safetensors"}},
        "4": {"class_type": "CLIPTextEncode", "inputs": {"text": prompt, "clip": ["2", 0]}},
        "5": {"class_type": "ConditioningZeroOut", "inputs": {"conditioning": ["4", 0]}},
        # Quadrado: o Hunyuan3D gosta do objeto centrado, e o recorte fica limpo.
        "6": {"class_type": "EmptySD3LatentImage", "inputs": {"width": 1024, "height": 1024, "batch_size": 1}},
        "7": {"class_type": "KSampler", "inputs": {
            "seed": seed, "control_after_generate": "fixed", "steps": 4, "cfg": 1.0,
            "sampler_name": "euler", "scheduler": "simple", "denoise": 1,
            "model": ["1b", 0], "positive": ["4", 0], "negative": ["5", 0], "latent_image": ["6", 0]}},
        "8": {"class_type": "VAEDecode", "inputs": {"samples": ["7", 0], "vae": ["3", 0]}},
        "9": {"class_type": "SaveImage", "inputs": {"filename_prefix": prefixo, "images": ["8", 0]}},
    }


def rodar(wf: dict, no_saida: str = "9", timeout: int = 240):
    req = urllib.request.Request(
        COMFY + "/prompt",
        data=json.dumps({"prompt": wf}).encode(),
        headers={"Content-Type": "application/json"},
    )
    pid = json.loads(urllib.request.urlopen(req).read())["prompt_id"]
    limite = time.time() + timeout
    while time.time() < limite:
        h = json.loads(urllib.request.urlopen(f"{COMFY}/history/{pid}").read())
        entrada = h.get(pid)
        if entrada and entrada.get("outputs"):
            return entrada["outputs"]
        time.sleep(1.5)
    raise TimeoutError(f"ComfyUI nao devolveu em {timeout}s")


def baixar(item: dict) -> bytes:
    qs = urllib.parse.urlencode({
        "filename": item["filename"],
        "subfolder": item.get("subfolder", ""),
        "type": item.get("type", "output"),
    })
    return urllib.request.urlopen(f"{COMFY}/view?{qs}").read()


def recortar_fundo(caminho_entrada: Path, caminho_saida: Path, limiar: int = 42):
    """Tira o fundo e devolve PNG com alfa.

    ## Por que inundacao a partir da borda, e nao chave de cor

    A primeira versao comparava cada pixel com a media dos quatro cantos. Falhou
    em duas frentes ao mesmo tempo, medido em 29/07/2026:

    1. **O fundo do Qwen e degrade, nao chapado.** Os cantos vieram 195, 198,
       225 e 219 — uma variacao de 30 niveis. Tolerancia que pega o canto claro
       come o escuro, e vice-versa; a moldura sobrevivia inteira (a caixa
       delimitadora continuava 1024x1024 em todas as cinco poses).
    2. **O mascote e cinza tambem.** Corpo cinza-azulado sobre fundo cinza: nao
       ha teste de COR que separe os dois. Qualquer limiar de brilho ou de
       saturacao que apague o fundo apaga metade do robo junto.

    A inundacao resolve as duas de uma vez porque usa CONECTIVIDADE, nao cor:
    fundo e o que se alcanca a partir da borda sem atravessar o objeto. O
    `thresh` do PIL acomoda o degrade ao caminhar, comparando cada pixel com o
    vizinho e nao com uma referencia fixa.

    A borda ganha um leve desfoque de alfa: recorte duro denuncia a montagem
    quando colado sobre foto.
    """
    from PIL import ImageDraw, ImageFilter

    im = Image.open(caminho_entrada).convert("RGB")
    l, a = im.size

    # Trabalha numa copia onde o fundo vira magenta puro — cor que nao existe
    # neste mascote cinza, entao serve de marcador sem ambiguidade.
    marcado = im.copy()
    MARCA = (255, 0, 255)
    # Semeia a BORDA INTEIRA, de 16 em 16 pixels — nao so os cantos. Com quatro
    # sementes o degrade lateral barrava a inundacao antes de dar a volta, e as
    # cinco poses saiam com a largura intacta (1024) apesar de o topo e a base
    # terem sido recortados: sobrava uma faixa opaca dos dois lados.
    sementes = []
    for x in range(0, l, 16):
        sementes += [(x, 0), (x, a - 1)]
    for y in range(0, a, 16):
        sementes += [(0, y), (l - 1, y)]
    for semente in sementes:
        if marcado.getpixel(semente) == MARCA:
            continue  # ja alcancado por outra semente
        try:
            ImageDraw.floodfill(marcado, semente, MARCA, thresh=limiar)
        except Exception:
            pass

    # Alfa = 0 onde ficou marcado.
    px = marcado.load()
    alfa = Image.new("L", (l, a), 255)
    pa = alfa.load()
    for y in range(a):
        for x in range(l):
            if px[x, y] == MARCA:
                pa[x, y] = 0

    # Abertura morfologica: erode e depois dilata com a mesma janela.
    #
    # Sobravam ilhas de 1-3 pixels espalhadas pelo fundo — pontos onde o degrade
    # deu um salto maior que o limiar e a inundacao nao atravessou. Poucos e
    # invisiveis a olho, mas suficientes para a caixa delimitadora continuar
    # 1024 de largura (medido: 24 a 61 pixels teimosos por coluna de borda), o
    # que estragava o corte e o posicionamento. A erosao come qualquer coisa
    # menor que a janela; a dilatacao devolve o mascote ao tamanho original.
    alfa = alfa.filter(ImageFilter.MinFilter(5)).filter(ImageFilter.MaxFilter(5))
    alfa = alfa.filter(ImageFilter.GaussianBlur(0.8))
    saida = im.convert("RGBA")
    saida.putalpha(alfa)

    caixa = saida.getbbox()
    if caixa:
        saida = saida.crop(caixa)
    saida.save(caminho_saida)
    return saida.size


if __name__ == "__main__":
    SAIDA.mkdir(parents=True, exist_ok=True)
    quer_malha = "--malha" in sys.argv

    gerados = []
    for i, (pose, acao, camera) in enumerate(POSES):
        prompt = f"{BASE}, {acao}, {camera}, {FAMILIA_SOLIDO}, {COMUM}"
        try:
            saidas = rodar(workflow_imagem(prompt, 5100 + i, f"mascote3d/{pose}"))
            png = baixar(saidas["9"]["images"][0])
            fonte = SAIDA / f"fonte_{pose}.png"
            fonte.write_bytes(png)
            tam = recortar_fundo(fonte, SAIDA / f"{pose}.png")
            print(f"OK   {pose:12} fonte + recorte {tam[0]}x{tam[1]}")
            gerados.append((pose, fonte))
        except Exception as e:
            print(f"FALHA {pose}: {e}")

    if quer_malha and gerados:
        # A malha vem da pose neutra: e a que o Hunyuan3D reconstroi melhor
        # (membro esticado ou mao perto do rosto viram buraco na superficie).
        pose, fonte = next((g for g in gerados if g[0] == "pequeno"), gerados[0])
        print(f"\nmalha a partir de '{pose}' — enviando ao ComfyUI…")
        envio = urllib.request.Request(
            COMFY + "/upload/image",
            data=None,
        )
        # multipart manual: a lib padrao nao monta, e trazer requests so para
        # isto nao vale.
        limite = "----fayaMascoteBoundary"
        corpo = (
            f"--{limite}\r\nContent-Disposition: form-data; name=\"image\"; "
            f"filename=\"{fonte.name}\"\r\nContent-Type: image/png\r\n\r\n"
        ).encode() + fonte.read_bytes() + f"\r\n--{limite}--\r\n".encode()
        envio = urllib.request.Request(
            COMFY + "/upload/image", data=corpo, method="POST",
            headers={"Content-Type": f"multipart/form-data; boundary={limite}"},
        )
        nome_remoto = json.loads(urllib.request.urlopen(envio).read())["name"]

        wf_malha = {
            "1": {"class_type": "ImageOnlyCheckpointLoader", "inputs": {"ckpt_name": "hunyuan3d\\hunyuan3d-dit-v2-mv-fp16.safetensors"}},
            "2": {"class_type": "ModelSamplingAuraFlow", "inputs": {"shift": 1.0, "model": ["1", 0]}},
            "3": {"class_type": "LoadImage", "inputs": {"image": nome_remoto, "upload": "image"}},
            "4": {"class_type": "CLIPVisionEncode", "inputs": {"crop": "none", "clip_vision": ["1", 1], "image": ["3", 0]}},
            "5": {"class_type": "Hunyuan3Dv2ConditioningMultiView", "inputs": {"front": ["4", 0]}},
            "6": {"class_type": "EmptyLatentHunyuan3Dv2", "inputs": {"resolution": 3072, "batch_size": 1}},
            "7": {"class_type": "KSampler", "inputs": {
                "seed": 5199, "control_after_generate": "fixed", "steps": 30, "cfg": 5.0,
                "sampler_name": "euler", "scheduler": "normal", "denoise": 1,
                "model": ["2", 0], "positive": ["5", 0], "negative": ["5", 1], "latent_image": ["6", 0]}},
            "8": {"class_type": "VAEDecodeHunyuan3D", "inputs": {"samples": ["7", 0], "vae": ["1", 2], "num_chunks": 8000, "octree_resolution": 256}},
            "9": {"class_type": "VoxelToMesh", "inputs": {"voxel": ["8", 0], "algorithm": "surface net", "threshold": 0.6}},
            "10": {"class_type": "SaveGLB", "inputs": {"mesh": ["9", 0], "filename_prefix": "mascote3d/mascote"}},
        }
        try:
            saidas = rodar(wf_malha, no_saida="10", timeout=900)
            item = (saidas.get("10", {}).get("3d") or saidas.get("10", {}).get("result") or [None])[0]
            print(f"OK   malha gerada: {item}")
        except Exception as e:
            print(f"FALHA malha: {e}")

    print(f"\nsaida em {SAIDA}")
