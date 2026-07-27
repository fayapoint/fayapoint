"""Leva as malhas aprovadas para `public/` e escreve o catálogo que a bancada lê.

Separado da geração de propósito: gerar é caro e demorado, publicar é instantâneo
e pode ser repetido à vontade enquanto o Ricardo escolhe.
"""

import json
import shutil
import sys
from pathlib import Path

from icones import FAMILIAS, ICONES

AQUI = Path(__file__).parent
MALHAS = AQUI / "malhas"
RAIZ = AQUI.parent.parent
DESTINO = RAIZ / "public" / "3d" / "icones"
CATALOGO = RAIZ / "src" / "data" / "icones3d.ts"


def main() -> None:
    # Depois da escolha do Ricardo o catálogo publica UMA família. Sem o filtro
    # ele publica as três, que é o modo de avaliação.
    escolhida = sys.argv[1] if len(sys.argv) > 1 else None
    if escolhida and escolhida not in FAMILIAS:
        raise SystemExit(f"família desconhecida: {escolhida} (use {', '.join(FAMILIAS)})")

    if DESTINO.exists():
        for antigo in DESTINO.glob("*.glb"):
            antigo.unlink()
    DESTINO.mkdir(parents=True, exist_ok=True)

    entradas = []
    total_kb = 0
    for slug, objeto in ICONES:
        opcoes = []
        for familia in ([escolhida] if escolhida else list(FAMILIAS)):
            arq = MALHAS / f"{slug}_{familia}.glb"
            if not arq.exists():
                continue
            shutil.copy2(arq, DESTINO / arq.name)
            kb = arq.stat().st_size // 1024
            total_kb += kb
            opcoes.append({"familia": familia, "arquivo": f"/3d/icones/{arq.name}", "kb": kb})
        if opcoes:
            entradas.append({"slug": slug, "objeto": objeto, "opcoes": opcoes})

    corpo = json.dumps(entradas, indent=2, ensure_ascii=False)
    CATALOGO.write_text(
        "/**\n"
        " * Catálogo dos ícones 3D do dashboard — GERADO por `scripts/icones3d/publicar.py`.\n"
        " * Não editar à mão: rode o script de novo.\n"
        " *\n"
        " * Cada ícone tem três opções de LINGUAGEM DE FORMA (sólido, facetado,\n"
        " * emblema). A cor não está aqui: a malha do Hunyuan3D sai sem textura e a\n"
        " * cor é material no código, na paleta da marca — que é o certo, porque\n"
        " * assim ela acompanha o tema em vez de ficar pintada no arquivo.\n"
        " */\n\n"
        "export interface OpcaoIcone {\n"
        "  familia: string;\n"
        "  arquivo: string;\n"
        "  kb: number;\n"
        "}\n\n"
        "export interface IconeTresD {\n"
        "  /** id do item na DashboardSidebar */\n"
        "  slug: string;\n"
        "  /** o objeto que a malha representa */\n"
        "  objeto: string;\n"
        "  opcoes: OpcaoIcone[];\n"
        "}\n\n"
        f"export const ICONES_3D: IconeTresD[] = {corpo};\n",
        encoding="utf-8",
    )

    print(f"{len(entradas)} ícones · {sum(len(e['opcoes']) for e in entradas)} malhas · {total_kb} KB")
    print(f"-> {DESTINO}")
    print(f"-> {CATALOGO}")


if __name__ == "__main__":
    main()
