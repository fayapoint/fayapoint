"""Transforma cada imagem-fonte numa malha .glb (Hunyuan3D-2mv).

Roda depois de `gerar_imagens.py`. O Hunyuan3D reconstrói GEOMETRIA a partir de
uma foto — textura não é suportada nativamente, e não faz falta: a cor dos
ícones é material no código, na paleta da marca, e não uma pintura que a IA
inventou.

O .glb cru sai com ~200 mil triângulos, o que é inviável na web. A decimação
para ~3 mil (gltf-transform, sem Draco para não depender de decoder externo)
foi o que levou o pino do Radar de 8,5 MB para 30,7 KB sem diferença visível
no tamanho em que o ícone aparece.

    python gerar_malhas.py             # tudo que ainda não tem .glb
    python gerar_malhas.py dashboard   # só um ícone
"""

import json
import os
import shutil
import subprocess
import sys
import time
import urllib.parse
import urllib.request
import uuid
from pathlib import Path

COMFY = "http://localhost:8000"
AQUI = Path(__file__).parent
FONTE = AQUI / "fonte"
MALHAS = AQUI / "malhas"

# Alvo de triângulos: o pino do Radar ficou bom com 2.840 e 30 KB.
ALVO_TRIANGULOS = 3000


def enviar_imagem(caminho: Path) -> str:
    """Sobe a imagem para o diretório de input do ComfyUI e devolve o nome."""
    limite = uuid.uuid4().hex
    nome = f"icone3d_{caminho.stem}.png"
    corpo = bytearray()
    for campo, valor in (("overwrite", "true"), ("type", "input")):
        corpo += f"--{limite}\r\nContent-Disposition: form-data; name=\"{campo}\"\r\n\r\n{valor}\r\n".encode()
    corpo += (
        f"--{limite}\r\n"
        f"Content-Disposition: form-data; name=\"image\"; filename=\"{nome}\"\r\n"
        f"Content-Type: image/png\r\n\r\n"
    ).encode()
    corpo += caminho.read_bytes()
    corpo += f"\r\n--{limite}--\r\n".encode()

    req = urllib.request.Request(
        f"{COMFY}/upload/image",
        data=bytes(corpo),
        headers={"Content-Type": f"multipart/form-data; boundary={limite}"},
    )
    return json.loads(urllib.request.urlopen(req).read())["name"]


def workflow(imagem: str, prefixo: str, seed: int) -> dict:
    return {
        # ImageOnlyCheckpointLoader e não CheckpointLoaderSimple: é ele que
        # devolve o CLIP_VISION, e o Hunyuan3D condiciona pela visão da imagem.
        "1": {"class_type": "ImageOnlyCheckpointLoader", "inputs": {"ckpt_name": "hunyuan3d\\hunyuan3d-dit-v2-mv-fp16.safetensors"}},
        "2": {"class_type": "ModelSamplingAuraFlow", "inputs": {"shift": 1.0, "model": ["1", 0]}},
        "3": {"class_type": "LoadImage", "inputs": {"image": imagem, "upload": "image"}},
        # crop "none": o objeto já vem centrado e com margem; recortar no centro
        # cortaria as extremidades altas (a coroa, a antena do robô).
        "4": {"class_type": "CLIPVisionEncode", "inputs": {"crop": "none", "clip_vision": ["1", 1], "image": ["3", 0]}},
        "5": {"class_type": "Hunyuan3Dv2ConditioningMultiView", "inputs": {"front": ["4", 0]}},
        "6": {"class_type": "EmptyLatentHunyuan3Dv2", "inputs": {"resolution": 3072, "batch_size": 1}},
        "7": {"class_type": "KSampler", "inputs": {
            "seed": seed, "control_after_generate": "fixed", "steps": 20, "cfg": 7.5,
            "sampler_name": "euler", "scheduler": "normal", "denoise": 1,
            "model": ["2", 0], "positive": ["5", 0], "negative": ["5", 1], "latent_image": ["6", 0]}},
        "8": {"class_type": "VAEDecodeHunyuan3D", "inputs": {"samples": ["7", 0], "vae": ["1", 2], "num_chunks": 8000, "octree_resolution": 256}},
        "9": {"class_type": "VoxelToMesh", "inputs": {"voxel": ["8", 0], "algorithm": "surface net", "threshold": 0.6}},
        "10": {"class_type": "SaveGLB", "inputs": {"mesh": ["9", 0], "filename_prefix": prefixo}},
    }


def rodar(wf: dict) -> dict:
    req = urllib.request.Request(
        f"{COMFY}/prompt",
        data=json.dumps({"prompt": wf}).encode("utf-8"),
        headers={"Content-Type": "application/json"},
    )
    pid = json.loads(urllib.request.urlopen(req).read())["prompt_id"]
    while True:
        h = json.loads(urllib.request.urlopen(f"{COMFY}/history/{pid}").read())
        if pid in h:
            return h[pid]
        time.sleep(2)


def ambiente_node() -> tuple[str, dict]:
    """
    O node aqui é gerenciado por fnm, e o PATH de um subprocesso do Python não
    tem o shim — chamar "npx" direto devolve "not recognized" com código 1, que
    lê como erro do gltf-transform e manda depurar no lugar errado. Achar o
    npx.cmd também não basta: ele chama "node", que precisa estar no PATH.
    """
    env = dict(os.environ)
    achado = shutil.which("npx") or shutil.which("npx.cmd")
    if achado:
        return achado, env
    raiz = Path(env.get("APPDATA", "")) / "fnm" / "node-versions"
    for versao in sorted(raiz.glob("v*"), reverse=True):
        inst = versao / "installation"
        if (inst / "npx.cmd").exists():
            env["PATH"] = f"{inst}{os.pathsep}{env.get('PATH', '')}"
            return str(inst / "npx.cmd"), env
    raise RuntimeError("npx não encontrado — instale o node ou ajuste o PATH")


# Teto por peça. O pino do Radar ficou bom com 30 KB; 120 KB dá folga para as
# formas mais recortadas sem que a barra lateral vire um download.
TETO_KB = 120
# `--simplify-error` é orçamento de ERRO, não alvo de tamanho: quando a malha
# é ruidosa o simplificador para antes da meta e devolve o arquivo quase
# inteiro. Medido: o robô facetado saiu com 4.436 KB a 0,002. Por isso a
# decimação sobe o erro até caber — num ícone de 40px, 8% de erro de forma não
# é perceptível, e 4 MB é.
ERROS = [0.002, 0.01, 0.03, 0.08, 0.2]


def decimar(entrada: Path, saida: Path) -> None:
    """Reduz até caber no teto, afrouxando o erro a cada tentativa."""
    npx, env = ambiente_node()
    ultimo = ""
    for erro in ERROS:
        r = subprocess.run(
            [npx, "--yes", "@gltf-transform/cli", "optimize", str(entrada), str(saida),
             # sem Draco: economiza mais alguns KB, mas exige um decoder externo
             # em runtime — não vale a dependência para uma peça de 30 KB.
             "--compress", "false", "--texture-compress", "false",
             "--simplify-error", str(erro)],
            shell=True, capture_output=True, text=True, env=env, encoding="utf-8", errors="replace",
        )
        if r.returncode != 0:
            ultimo = (r.stderr or r.stdout or "").strip()[-300:]
            continue
        if saida.stat().st_size <= TETO_KB * 1024:
            return
        ultimo = f"{saida.stat().st_size // 1024} KB acima do teto com erro {erro}"
    if not saida.exists():
        raise RuntimeError(ultimo or "decimação falhou")
    print(f"      (não coube no teto: {ultimo})", flush=True)


def main() -> None:
    filtro = sys.argv[1] if len(sys.argv) > 1 else None
    MALHAS.mkdir(parents=True, exist_ok=True)

    fontes = sorted(FONTE.glob("*.png"))
    if filtro:
        fontes = [f for f in fontes if f.stem.startswith(filtro)]
    if not fontes:
        print("nenhuma imagem-fonte encontrada — rode gerar_imagens.py antes")
        return

    manifesto_arq = MALHAS / "manifesto.json"
    manifesto = json.loads(manifesto_arq.read_text(encoding="utf-8")) if manifesto_arq.exists() else {}

    inicio = time.time()
    for i, arq in enumerate(fontes, 1):
        destino = MALHAS / f"{arq.stem}.glb"
        if destino.exists():
            print(f"  [{i}/{len(fontes)}] {destino.name} já existe", flush=True)
            continue

        t0 = time.time()
        try:
            nome = enviar_imagem(arq)
            hist = rodar(workflow(nome, f"icones3d/{arq.stem}", 5000 + i))
            saidas = hist.get("outputs", {}).get("10", {})
            arquivos = saidas.get("3d") or saidas.get("result") or saidas.get("gltf") or []
            if not arquivos:
                print(f"  [{i}/{len(fontes)}] {arq.stem}: SEM SAÍDA — {list(saidas)}", flush=True)
                continue
            info = arquivos[0]
            nome_saida = info["filename"] if isinstance(info, dict) else info
            sub = info.get("subfolder", "") if isinstance(info, dict) else ""
            url = f"{COMFY}/view?filename={urllib.parse.quote(nome_saida)}&subfolder={urllib.parse.quote(sub)}&type=output"
            cru = MALHAS / f"_cru_{arq.stem}.glb"
            cru.write_bytes(urllib.request.urlopen(url).read())

            decimar(cru, destino)
            kb_cru, kb = cru.stat().st_size // 1024, destino.stat().st_size // 1024
            cru.unlink()

            slug, familia = arq.stem.rsplit("_", 1)
            manifesto[arq.stem] = {"slug": slug, "familia": familia, "arquivo": destino.name, "kb": kb}
            manifesto_arq.write_text(json.dumps(manifesto, indent=2, ensure_ascii=False), encoding="utf-8")
            print(f"  [{i}/{len(fontes)}] {destino.name}: {kb_cru} KB -> {kb} KB ({time.time()-t0:.0f}s)", flush=True)
        except Exception as e:  # noqa: BLE001 — um ícone com problema não pode parar os outros
            print(f"  [{i}/{len(fontes)}] {arq.stem}: ERRO {e}", flush=True)

    print(f"pronto em {time.time()-inicio:.0f}s -> {MALHAS}", flush=True)


if __name__ == "__main__":
    main()
