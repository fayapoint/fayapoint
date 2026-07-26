#!/usr/bin/env python3
"""Extrai os contornos reais das letras do logo para um SVG.

Por que isto existe: o logo em 3D tem que ter a tipografia EXATA da marca. Uma
malha gerada por IA a partir de uma imagem erra letra — e logo com letra errada
nao e logo. Aqui os contornos saem da propria fonte, entao a forma e a mesma
que o navegador desenha em 2D; o 3D so acrescenta profundidade.

Saida: fayapoint-ai/public/3d/logo-fayai.svg  (consumido pelo SVGLoader)

Rodar:  python scripts/logo-svg.py
"""
import os

from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.ttLib import TTFont

FONTE = "scripts/_fontes/inter-bold.ttf"
TEXTO = "FayAi"
SAIDA = "public/3d/logo-fayai.svg"

# Onde o dourado da marca comeca. "FAY" claro, "AI" ouro — a mesma divisao do
# logo em 2D, para a transicao nao trocar o significado.
CORTE_OURO = 3


def main():
    fonte = TTFont(FONTE)
    glifos = fonte.getGlyphSet()
    cmap = fonte.getBestCmap()
    upm = fonte["head"].unitsPerEm
    hmtx = fonte["hmtx"]

    partes = []
    x = 0
    for i, ch in enumerate(TEXTO):
        nome = cmap.get(ord(ch))
        if not nome:
            continue
        caneta = SVGPathPen(glifos)
        glifos[nome].draw(caneta)
        d = caneta.getCommands()
        avanco = hmtx[nome][0]
        if d:
            partes.append({"d": d, "x": x, "ouro": i >= CORTE_OURO})
        x += avanco

    largura = x
    altura = upm

    # O SVG nasce no sistema da fonte (Y para cima); invertemos para o sistema
    # de tela e deslocamos cada glifo pelo seu avanco.
    linhas = [
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {largura} {altura}" '
        f'width="{largura}" height="{altura}">'
    ]
    for p in partes:
        cor = "#f5c04e" if p["ouro"] else "#f3f1ff"
        linhas.append(
            f'<path fill="{cor}" transform="translate({p["x"]},{altura}) scale(1,-1)" d="{p["d"]}"/>'
        )
    linhas.append("</svg>")

    os.makedirs(os.path.dirname(SAIDA), exist_ok=True)
    with open(SAIDA, "w", encoding="utf-8") as f:
        f.write("\n".join(linhas))

    print(f"-> {SAIDA}  ({len(partes)} glifos, {os.path.getsize(SAIDA)} bytes)")


if __name__ == "__main__":
    main()
