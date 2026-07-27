"""Pipeline completo dos ícones 3D do PERFIL SOCIAL: imagem -> malha -> publicação.

Um comando só, porque aqui não há escolha de família para o Ricardo fazer no
meio (a sólida já foi escolhida em 27/07). Reaproveita as funções dos scripts
dos ícones do menu — mesma receita, mesmas armadilhas já resolvidas:

  * Qwen 2512 + Lightning (4 passos) desenha o objeto isolado, ~14 s cada
  * Hunyuan3D-2mv reconstrói a malha a partir da imagem
  * gltf-transform decima subindo o erro até caber em 120 KB

    python gerar_persona.py            # tudo que ainda não existe
    python gerar_persona.py area-tech  # uma peça só

Publica em `public/3d/persona/` e escreve `src/data/icones3d-persona.ts`.
"""

import json
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

import gerar_imagens as img
import gerar_malhas as malha
from icones_persona import todos

AQUI = Path(__file__).parent
FONTE = AQUI / "fonte_persona"
MALHAS = AQUI / "malhas_persona"
RAIZ = AQUI.parent.parent
PUBLICO = RAIZ / "public" / "3d" / "persona"
DADOS = RAIZ / "src" / "data" / "icones3d-persona.ts"


def gerar_imagem(slug: str, familia: str, prompt: str, seed: int) -> Path | None:
    destino = FONTE / f"{slug}_{familia}.png"
    if destino.exists():
        return destino

    prefixo = f"persona3d/{slug}_{familia}"
    pid = img.submeter(img.workflow(prompt, seed, prefixo))
    while True:
        h = json.loads(urllib.request.urlopen(f"{img.COMFY}/history/{pid}").read())
        if pid in h:
            break
        time.sleep(2)

    saidas = h[pid].get("outputs", {}).get("9", {}).get("images", [])
    if not saidas:
        return None
    nome = saidas[0]["filename"]
    url = f"{img.COMFY}/view?filename={urllib.parse.quote(nome)}&subfolder=persona3d&type=output"
    destino.write_bytes(urllib.request.urlopen(url).read())
    return destino


def gerar_malha(fonte: Path, seed: int) -> Path | None:
    destino = MALHAS / f"{fonte.stem}.glb"
    if destino.exists():
        return destino

    nome = malha.enviar_imagem(fonte)
    hist = malha.rodar(malha.workflow(nome, f"persona3d/{fonte.stem}", seed))
    saidas = hist.get("outputs", {}).get("10", {})
    arquivos = saidas.get("3d") or saidas.get("result") or saidas.get("gltf") or []
    if not arquivos:
        return None

    info = arquivos[0]
    nome_saida = info["filename"] if isinstance(info, dict) else info
    sub = info.get("subfolder", "") if isinstance(info, dict) else ""
    url = f"{malha.COMFY}/view?filename={urllib.parse.quote(nome_saida)}&subfolder={urllib.parse.quote(sub)}&type=output"

    cru = MALHAS / f"_cru_{fonte.stem}.glb"
    cru.write_bytes(urllib.request.urlopen(url).read())
    malha.decimar(cru, destino)
    cru.unlink(missing_ok=True)
    return destino


def publicar() -> None:
    PUBLICO.mkdir(parents=True, exist_ok=True)
    catalogo = []
    for arq in sorted(MALHAS.glob("*.glb")):
        alvo = PUBLICO / arq.name
        alvo.write_bytes(arq.read_bytes())
        slug = arq.stem.rsplit("_", 1)[0]
        catalogo.append({"slug": slug, "arquivo": f"/3d/persona/{arq.name}", "kb": arq.stat().st_size // 1024})

    corpo = json.dumps(catalogo, indent=2, ensure_ascii=False)
    DADOS.write_text(
        "/**\n"
        " * Catálogo dos ícones 3D do perfil social — GERADO por\n"
        " * `scripts/icones3d/gerar_persona.py`. Não editar à mão.\n"
        " *\n"
        " * Família sólida, a escolhida pelo Ricardo em 27/07. A cor não está\n"
        " * aqui: a malha sai do Hunyuan3D sem textura e a cor é material no\n"
        " * código, então acompanha o tema em vez de vir pintada no arquivo.\n"
        " */\n\n"
        "export interface PecaPersona3D {\n"
        "  /** id da opção no construtor de persona, prefixado por grupo: `area-tech`, `meta-sales` */\n"
        "  slug: string;\n"
        "  arquivo: string;\n"
        "  kb: number;\n"
        "}\n\n"
        f"export const ICONES_PERSONA_3D: PecaPersona3D[] = {corpo};\n",
        encoding="utf-8",
    )
    total = sum(c["kb"] for c in catalogo)
    print(f"publicadas {len(catalogo)} peças ({total} KB) -> {PUBLICO}", flush=True)


def main() -> None:
    filtro = sys.argv[1] if len(sys.argv) > 1 else None
    FONTE.mkdir(parents=True, exist_ok=True)
    MALHAS.mkdir(parents=True, exist_ok=True)

    pecas = [p for p in todos() if not filtro or p[0] == filtro]
    print(f"{len(pecas)} peças", flush=True)

    inicio = time.time()
    for i, (slug, familia, prompt, seed) in enumerate(pecas, 1):
        t0 = time.time()
        try:
            fonte = gerar_imagem(slug, familia, prompt, seed)
            if not fonte:
                print(f"  [{i}/{len(pecas)}] {slug}: imagem FALHOU", flush=True)
                continue
            glb = gerar_malha(fonte, seed)
            if not glb:
                print(f"  [{i}/{len(pecas)}] {slug}: malha SEM SAÍDA", flush=True)
                continue
            print(f"  [{i}/{len(pecas)}] {glb.name}: {glb.stat().st_size // 1024} KB ({time.time() - t0:.0f}s)", flush=True)
        except Exception as e:  # noqa: BLE001 — uma peça com problema não pode parar as outras
            print(f"  [{i}/{len(pecas)}] {slug}: ERRO {e}", flush=True)

    publicar()
    print(f"pronto em {time.time() - inicio:.0f}s", flush=True)


if __name__ == "__main__":
    main()
