#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Extrai os contornos reais das letras do logo e gera TODA a familia da marca.

## Por que isto existe

O logo tem que ter a tipografia EXATA da marca. Uma malha gerada por IA a
partir de uma imagem erra letra — e logo com letra errada nao e logo. Aqui os
contornos saem da propria fonte (Inter Bold, a mesma que o site desenha), entao
a forma e sempre a mesma em 2D, em 3D, no favicon e na fatura.

## O que mudou em 20/08/2026

O logo oficial passou a ser o LETREIRO "FayAi" com o "Ai" em AZUL — antes o
acento era ouro (`#f5c04e`). Junto veio a exigencia de um simbolo que carregue
progresso: o azul esvazia para branco e volta a subir enquanto a pagina carrega
(ver `src/components/marca/`). Isso obrigou a ter os contornos disponiveis em
DOIS mundos: SVG (arquivos de marca) e JavaScript (React desenha o mesmo
letreiro inline, e o canvas do favicon usa `Path2D` com o mesmo `d`).

Por isso este script deixou de escrever um SVG e passou a escrever a familia
inteira a partir de UMA extracao de glifos. Se um dia a fonte mudar, muda aqui
e o site inteiro acompanha.

## Saidas

    public/3d/logo-fayai.svg          contornos chapados p/ o SVGLoader (3D)
    public/brand/fayai-logo.svg       o letreiro oficial (fundo transparente)
    public/brand/fayai-logo-branco.svg   uma cor so, para fundo colorido
    public/brand/fayai-logo-tinta.svg    uma cor so, para fundo claro/impresso
    public/brand/fayai-marca.svg      o simbolo quadrado ("FA" no quadrado navy)
    public/brand/fayai-loader.svg     o letreiro que enche — animado, em laco
    src/app/icon.svg                  favicon animado (enche uma vez e congela)
    src/components/marca/glifos.ts    os mesmos contornos para React e canvas

Os PNG/ICO saem de `scripts/marca-rasterizar.mjs`, que le estes SVG.

Rodar:  python scripts/logo-svg.py
"""
import json
import os

from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont

FONTE = "scripts/_fontes/inter-bold.ttf"
TEXTO = "FayAi"

# Onde o azul da marca comeca. "Fay" claro, "Ai" azul — a divisao e a mesma em
# todas as pecas, e e ela que da o "recipiente" do carregamento: o que enche e
# exatamente o acento.
CORTE_ACENTO = 3

# ⚠️ Estes cinco valores existem DUAS vezes: aqui e em
# `src/components/marca/cores.ts`. Mexeu num, mexa no outro — o 3D compara o
# `fill` do SVG com a constante do TypeScript para saber qual metade e o acento.
BRANCO = "#f3f1ff"
AZUL = "#1e9bff"
AZUL_CLARO = "#5cc8ff"
AZUL_FUNDO = "#0a74e6"
NAVY = "#0c0e1d"


def extrair():
    """Devolve os glifos ja no sistema de tela: Y para baixo, origem no canto.

    O SVG da fonte nasce com Y para cima e cada glifo na propria origem. Aqui
    cada um recebe o avanco acumulado e a inversao vertical de uma vez, entao o
    `d` que sai daqui pode ser colado em qualquer lugar sem `transform` — que e
    o que permite o mesmo caminho servir ao React e ao `Path2D` do canvas.
    """
    fonte = TTFont(FONTE)
    glifos = fonte.getGlyphSet()
    cmap = fonte.getBestCmap()
    hmtx = fonte["hmtx"]

    # Primeira passada: caixa de tinta real (com curvas, nao pontos de
    # controle). O em-box da fonte tem folga em cima e embaixo; usar ele faria
    # o logo parecer pequeno dentro do proprio arquivo.
    caixa = [1e9, 1e9, -1e9, -1e9]
    avancos, nomes = [], []
    x = 0
    for ch in TEXTO:
        nome = cmap.get(ord(ch))
        nomes.append(nome)
        caneta = BoundsPen(glifos)
        glifos[nome].draw(caneta)
        if caneta.bounds:
            x0, y0, x1, y1 = caneta.bounds
            caixa = [min(caixa[0], x + x0), min(caixa[1], y0),
                     max(caixa[2], x + x1), max(caixa[3], y1)]
        avancos.append(x)
        x += hmtx[nome][0]

    minX, minY, maxX, maxY = caixa
    largura = maxX - minX
    altura = maxY - minY

    partes = []
    for i, (ch, nome, ax) in enumerate(zip(TEXTO, nomes, avancos)):
        caneta = SVGPathPen(glifos)
        # (1,0,0,-1, dx, dy): inverte o Y e assenta o glifo na caixa de tinta.
        glifos[nome].draw(TransformPen(caneta, (1, 0, 0, -1, ax - minX, maxY)))
        d = caneta.getCommands()
        if not d:
            continue
        limites = BoundsPen(glifos)
        glifos[nome].draw(limites)
        gx0, gy0, gx1, gy1 = limites.bounds
        partes.append({
            "ch": ch,
            "d": d,
            "acento": i >= CORTE_ACENTO,
            # Caixa de tinta do glifo isolado, ja no sistema de tela.
            "caixa": [round(ax - minX + gx0, 1), round(maxY - gy1, 1),
                      round(ax - minX + gx1, 1), round(maxY - gy0, 1)],
        })

    return partes, round(largura, 1), round(altura, 1)


def caixa_do_acento(partes):
    """A caixa de tinta so do 'Ai' — o recipiente que enche."""
    c = [1e9, 1e9, -1e9, -1e9]
    for p in partes:
        if p["acento"]:
            c = [min(c[0], p["caixa"][0]), min(c[1], p["caixa"][1]),
                 max(c[2], p["caixa"][2]), max(c[3], p["caixa"][3])]
    return [round(v, 1) for v in c]


def gradiente(ident, x1, y1, x2, y2):
    return (
        f'<linearGradient id="{ident}" x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" '
        f'gradientUnits="userSpaceOnUse">'
        f'<stop offset="0" stop-color="{AZUL_CLARO}"/>'
        f'<stop offset=".55" stop-color="{AZUL}"/>'
        f'<stop offset="1" stop-color="{AZUL_FUNDO}"/>'
        f'</linearGradient>'
    )


def escrever(caminho, conteudo):
    os.makedirs(os.path.dirname(caminho), exist_ok=True)
    with open(caminho, "w", encoding="utf-8") as f:
        f.write(conteudo)
    print(f"-> {caminho}  ({os.path.getsize(caminho)} bytes)")


# ── as pecas ────────────────────────────────────────────────────────────────

def svg_3d(partes, largura, altura):
    """O arquivo que o `SVGLoader` do three.js extruda.

    Formato preso ao consumidor: uma cor por `path`, sem gradiente e sem grupo —
    `LogoFayai3D` le `fill` para saber qual metade e o acento.
    """
    linhas = [
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {largura} {altura}" '
        f'width="{largura}" height="{altura}">'
    ]
    for p in partes:
        linhas.append(f'<path fill="{AZUL if p["acento"] else BRANCO}" d="{p["d"]}"/>')
    linhas.append("</svg>")
    return "\n".join(linhas)


def svg_letreiro(partes, largura, altura, cor_clara=None, cor_acento=None):
    """O letreiro oficial. Sem cor definida, o acento vem do gradiente."""
    folga = round(altura * 0.08, 1)
    vb_w = round(largura + folga * 2, 1)
    vb_h = round(altura + folga * 2, 1)
    ca = caixa_do_acento(partes)
    linhas = [
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {vb_w} {vb_h}" '
        f'width="{vb_w}" height="{vb_h}" role="img" aria-label="FayAi">',
        "<title>FayAi</title>",
    ]
    if cor_acento is None:
        # ⚠️ `userSpaceOnUse` resolve no espaco de QUEM REFERENCIA. Os paths
        # estao dentro do `translate(folga,folga)`, entao somar a folga aqui
        # deslocaria o gradiente duas vezes.
        linhas.append(f"<defs>{gradiente('a', ca[0], ca[1], ca[2], ca[3])}</defs>")
    linhas.append(f'<g transform="translate({folga},{folga})">')
    for p in partes:
        if p["acento"]:
            cor = cor_acento or "url(#a)"
        else:
            cor = cor_clara or BRANCO
        linhas.append(f'<path fill="{cor}" d="{p["d"]}"/>')
    linhas.append("</g></svg>")
    return "\n".join(linhas)


# Quais glifos formam o SIMBOLO quadrado, por indice no letreiro.
#
# ⚠️ NAO use "Ai" aqui. Foi a primeira tentativa e ela colide de frente com o
# icone do Adobe Illustrator — "Ai" claro sobre quadrado escuro, a 16 px, e a
# silhueta dele. As INICIAIS resolvem os dois problemas de uma vez: "F" vem da
# metade clara e "A" da metade azul, entao o simbolo carrega a mesma divisao de
# cor do letreiro (e, com ela, o recipiente que enche no carregamento).
SIMBOLO = [0, 3]  # F, A


def composicao_do_simbolo(partes):
    """Junta os glifos do simbolo lado a lado, com espacamento proprio.

    No letreiro o "F" esta no comeco e o "A" 3.500 unidades adiante; colados
    assim ficaria um vao do tamanho de "ay". Aqui cada um e reposicionado pela
    propria caixa de tinta, com um espaco de 10% da altura entre eles — que e o
    que faz o par ler como um monograma, e nao como duas letras soltas.
    """
    escolhidos = [partes[i] for i in SIMBOLO]
    topo = min(p["caixa"][1] for p in escolhidos)
    base = max(p["caixa"][3] for p in escolhidos)
    altura = base - topo
    espaco = altura * 0.10

    itens, x = [], 0.0
    for p in escolhidos:
        x0, _, x1, _ = p["caixa"]
        itens.append({"d": p["d"], "acento": p["acento"], "dx": round(x - x0, 1)})
        x += (x1 - x0) + espaco
    largura = x - espaco
    return itens, round(largura, 1), round(altura, 1), round(topo, 1)


def geometria_do_quadrado(partes, lado=512, folga_rel=0.19):
    """Enquadra o simbolo num quadrado: escala, deslocamento e a caixa escalada."""
    itens, largura, altura, topo = composicao_do_simbolo(partes)
    util = lado * (1 - folga_rel * 2)
    k = min(util / largura, util / altura)
    dx = (lado - largura * k) / 2
    dy = (lado - altura * k) / 2 - topo * k
    caixa = [dx, dy + topo * k, dx + largura * k, dy + (topo + altura) * k]
    return itens, k, dx, dy, caixa


def caixa_do_acento_no_quadrado(partes, lado=512, folga_rel=0.19):
    """So o glifo do acento, ja no espaco do quadrado.

    O enchimento e o gradiente do simbolo precisam da caixa do "A", nao a do
    par: medindo o par, o gradiente comecaria no "F" e o azul chegaria ao "A"
    ja escuro.
    """
    itens, k, dx, dy, _ = geometria_do_quadrado(partes, lado, folga_rel)
    escolhidos = [partes[i] for i in SIMBOLO]
    c = [1e9, 1e9, -1e9, -1e9]
    for p, it in zip(escolhidos, itens):
        if not it["acento"]:
            continue
        x0, y0, x1, y1 = p["caixa"]
        c = [min(c[0], (x0 + it["dx"]) * k + dx), min(c[1], y0 * k + dy),
             max(c[2], (x1 + it["dx"]) * k + dx), max(c[3], y1 * k + dy)]
    return [round(v, 2) for v in c]


def svg_marca(partes, lado=512, raio=112, fundo=NAVY):
    itens, k, dx, dy, caixa = geometria_do_quadrado(partes)
    corpo = "".join(
        f'<g transform="translate({it["dx"]},0)"><path fill="{"url(#a)" if it["acento"] else BRANCO}" d="{it["d"]}"/></g>'
        for it in itens
    )
    # O gradiente vive no espaco do GLIFO — o grupo de fora ja aplica
    # translate+scale, e o gradiente anda junto com ele. Medido so no acento:
    # o "F" nao entra na conta, senao o azul chega ao "A" ja escuro.
    ga = caixa_do_acento(partes)
    dxa = next(it["dx"] for it in itens if it["acento"])
    ga = [ga[0] + dxa, ga[1], ga[2] + dxa, ga[3]]
    linhas = [
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {lado} {lado}" '
        f'width="{lado}" height="{lado}" role="img" aria-label="FayAi">',
        "<title>FayAi</title>",
        f'<defs>{gradiente("a", ga[0], ga[1], ga[2], ga[3])}</defs>',
    ]
    if fundo:
        linhas.append(f'<rect width="{lado}" height="{lado}" rx="{raio}" fill="{fundo}"/>')
    linhas.append(f'<g transform="translate({dx:.1f},{dy:.1f}) scale({k:.5f})">{corpo}</g>')
    linhas.append("</svg>")
    return "\n".join(linhas)


def svg_fatura(partes, largura, altura, w=900, h=300):
    """O bloco da fatura: letreiro centrado num retangulo navy arredondado.

    Existe porque fatura, recibo e o `logo` do schema.org precisam de um ativo
    com FUNDO — sobre o branco do PDF, um letreiro branco desapareceria.
    """
    util_w, util_h = w * 0.80, h * 0.52
    k = min(util_w / largura, util_h / altura)
    dx, dy = (w - largura * k) / 2, (h - altura * k) / 2
    ca = caixa_do_acento(partes)
    corpo = "".join(
        f'<path fill="{"url(#a)" if p["acento"] else BRANCO}" d="{p["d"]}"/>'
        for p in partes
    )
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" '
        f'width="{w}" height="{h}" role="img" aria-label="FayAi">'
        f"<title>FayAi</title>"
        f"<desc>Logotipo FayAi para faturas e cobrancas</desc>"
        f'<defs>{gradiente("a", ca[0], ca[1], ca[2], ca[3])}</defs>'
        f'<rect width="{w}" height="{h}" rx="{round(h * 0.107)}" fill="{NAVY}"/>'
        f'<g transform="translate({dx:.1f},{dy:.1f}) scale({k:.5f})">{corpo}</g>'
        f"</svg>"
    )


def _enchimento(ident, alto, baixo, dur, laco):
    """As tres camadas do enchimento, dentro de um recorte com a forma da letra.

    A ordem importa: o branco e o recipiente VAZIO (o acento "vira branco"), o
    azul e o liquido que sobe por cima, e o menisco e a linha clara na
    superficie — sem ela o azul lê como retangulo, nao como nivel.
    """
    altura = baixo - alto
    corrida = altura * 1.12          # sobra para o menisco sair de cena embaixo
    y0 = round(baixo + altura * 0.06, 1)
    y1 = round(alto - altura * 0.02, 1)
    if laco:
        # Sobe, respira no cheio, e ESVAZIA de volta. Um corte seco de volta ao
        # zero pisca; descer faz o laco parecer liquido.
        valores = f"{y0};{y1};{y1};{y0}"
        tempos = "0;0.55;0.75;1"
        extra = 'repeatCount="indefinite"'
    else:
        # Uma vez so: o quadro parado (t=0) e o logo CHEIO, porque o Chrome
        # desenha o favicon SVG sem animar e o que ele mostrar tem de ser a
        # marca de verdade. Dai esvazia depressa e enche.
        valores = f"{y1};{y0};{y1}"
        tempos = "0;0.22;1"
        extra = 'repeatCount="1" fill="freeze"'
    return (
        f'<g clip-path="url(#{ident})">'
        f'<rect x="-9999" y="-9999" width="19999" height="19999" fill="{BRANCO}"/>'
        f'<rect x="-9999" width="19999" height="{corrida * 4:.1f}" fill="url(#g{ident})">'
        f'<animate attributeName="y" values="{valores}" keyTimes="{tempos}" '
        f'dur="{dur}s" calcMode="spline" '
        f'keySplines="{".4 0 .2 1;.4 0 .2 1;.4 0 .2 1" if laco else ".4 0 .2 1;.4 0 .2 1"}" '
        f'{extra}/></rect>'
        f'<rect x="-9999" width="19999" height="{max(2.0, altura * 0.035):.1f}" '
        f'fill="{AZUL_CLARO}" opacity=".9">'
        f'<animate attributeName="y" values="{valores}" keyTimes="{tempos}" '
        f'dur="{dur}s" calcMode="spline" '
        f'keySplines="{".4 0 .2 1;.4 0 .2 1;.4 0 .2 1" if laco else ".4 0 .2 1;.4 0 .2 1"}" '
        f'{extra}/></rect>'
        f"</g>"
    )


def svg_loader(partes, largura, altura):
    """O letreiro que enche, em laco — a peca de carregamento em arquivo."""
    folga = round(altura * 0.08, 1)
    vb_w, vb_h = round(largura + folga * 2, 1), round(altura + folga * 2, 1)
    ca = caixa_do_acento(partes)
    alto, baixo = ca[1] + folga, ca[3] + folga
    # ⚠️ `<g>` dentro de `<clipPath>` e IGNORADO pela especificacao: os filhos
    # tem de ser formas. Um grupo ali faz a regiao de recorte sair VAZIA, e o
    # que se ve e a peca inteira sumir — sem erro nenhum no console. O
    # deslocamento vai no proprio `path`, que aceita `transform`.
    recorte = "".join(
        f'<path transform="translate({folga},{folga})" d="{p["d"]}"/>'
        for p in partes if p["acento"]
    )
    claras = "".join(f'<path d="{p["d"]}"/>' for p in partes if not p["acento"])
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {vb_w} {vb_h}" '
        f'width="{vb_w}" height="{vb_h}" role="img" aria-label="FayAi">'
        f"<title>FayAi carregando</title>"
        f"<defs>"
        # As camadas do enchimento nao estao dentro do translate — elas cobrem
        # a tela inteira e quem as recorta e o clip. Por isso aqui a folga
        # ENTRA nas coordenadas.
        f'{gradiente("gcorte", ca[0] + folga, alto, ca[2] + folga, baixo)}'
        f'<clipPath id="corte">{recorte}</clipPath>'
        f"</defs>"
        f'<g transform="translate({folga},{folga})" fill="{BRANCO}">{claras}</g>'
        + _enchimento("corte", alto, baixo, 2.2, laco=True)
        + "</svg>"
    )


def svg_favicon(partes, lado=64, raio=14):
    """O favicon: o simbolo que enche UMA vez e congela cheio.

    64 px de viewBox (nao 512): favicon vive em 16-32 px, e numeros pequenos
    mantem o arquivo curto — ele viaja em toda navegacao.

    ⚠️ O quadro parado (t=0) tem de ser a MARCA CHEIA. O Chrome desenha favicon
    SVG sem rodar a animacao; se o primeiro quadro fosse o estado vazio, a aba
    dele mostraria para sempre um "A" branco. Por isso a animacao comeca cheia,
    esvazia depressa e volta.
    """
    # Folga menor que a do icone de aplicativo: aqui o desenho vive a 16 px,
    # e cada por cento de margem tira legibilidade que nao volta.
    itens, k, dx, dy, caixa = geometria_do_quadrado(partes, lado=lado, folga_rel=0.12)
    grupo = f'translate({dx:.2f},{dy:.2f}) scale({k:.5f})'
    claros = "".join(
        f'<g transform="translate({it["dx"]},0)"><path d="{it["d"]}"/></g>'
        for it in itens if not it["acento"]
    )
    # Mesma regra do loader: forma direta no `clipPath`, com a matriz inteira
    # no `transform` do proprio `path`.
    recorte = "".join(
        f'<path transform="{grupo} translate({it["dx"]},0)" d="{it["d"]}"/>'
        for it in itens if it["acento"]
    )
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {lado} {lado}" '
        f'width="{lado}" height="{lado}">'
        f"<title>FayAi</title>"
        f"<defs>"
        f'{gradiente("gc", caixa[0], caixa[1], caixa[2], caixa[3])}'
        f'<clipPath id="c">{recorte}</clipPath>'
        f"</defs>"
        f'<rect width="{lado}" height="{lado}" rx="{raio}" fill="{NAVY}"/>'
        f'<g transform="{grupo}" fill="{BRANCO}">{claros}</g>'
        + _enchimento("c", caixa[1], caixa[3], 1.6, laco=False)
        + "</svg>"
    )


def modulo_ts(partes, largura, altura):
    """Os mesmos contornos em TypeScript.

    Sem isto o React teria de BUSCAR o SVG por rede para desenhar o logo do
    cabecalho — uma requisicao a mais em toda pagina, e um piscar antes de
    chegar. Aqui a marca ja nasce dentro do pacote.
    """
    ca = caixa_do_acento(partes)
    itens, k, dx, dy, cx = geometria_do_quadrado(partes)
    dados = {
        "largura": largura,
        "altura": altura,
        "caixaDoAcento": ca,
        "simbolo": {
            "lado": 512,
            "escala": round(k, 5),
            "dx": round(dx, 2),
            "dy": round(dy, 2),
            "caixa": [round(v, 2) for v in cx],
            "caixaDoAcento": caixa_do_acento_no_quadrado(partes),
            "glifos": itens,
        },
        "glifos": [{"ch": p["ch"], "acento": p["acento"], "d": p["d"]} for p in partes],
    }
    corpo = json.dumps(dados, ensure_ascii=False, indent=2)
    return f"""// GERADO POR scripts/logo-svg.py — NAO EDITAR A MAO.
//
// Os contornos do letreiro "FayAi" tirados da Inter Bold, ja no sistema de
// tela (Y para baixo, origem na caixa de tinta). Um `d` daqui pode ir direto
// para um `<path>` do React ou para `new Path2D(d)` no canvas do favicon —
// e por isso que o desenho do cabecalho, o do loader e o do favicon nunca
// divergem: e o mesmo contorno.
//
// Regerar:  python scripts/logo-svg.py

export interface GlifoDaMarca {{
  /** A letra, para depuracao — o desenho nao depende dela. */
  ch: string;
  /** `true` no "Ai": a metade colorida, e a que enche no carregamento. */
  acento: boolean;
  d: string;
}}

export const MARCA = {corpo} as const;

/** Caixa de tinta do letreiro inteiro, em unidades do viewBox. */
export const LARGURA = MARCA.largura;
export const ALTURA = MARCA.altura;

/** So o "Ai" — [x0, y0, x1, y1]. O recipiente do enchimento. */
export const CAIXA_DO_ACENTO = MARCA.caixaDoAcento;

export const GLIFOS: readonly GlifoDaMarca[] = MARCA.glifos;
"""


def main():
    partes, largura, altura = extrair()
    escrever("public/3d/logo-fayai.svg", svg_3d(partes, largura, altura))
    escrever("public/brand/fayai-logo.svg", svg_letreiro(partes, largura, altura))
    escrever("public/brand/fayai-logo-branco.svg",
             svg_letreiro(partes, largura, altura, cor_clara="#ffffff", cor_acento="#ffffff"))
    escrever("public/brand/fayai-logo-tinta.svg",
             svg_letreiro(partes, largura, altura, cor_clara=NAVY, cor_acento=AZUL_FUNDO))
    escrever("public/brand/fayai-marca.svg", svg_marca(partes))
    escrever("public/brand/fayai-loader.svg", svg_loader(partes, largura, altura))
    escrever("public/brand/fayai-invoice-logo.svg", svg_fatura(partes, largura, altura))
    escrever("src/app/icon.svg", svg_favicon(partes))
    escrever("src/components/marca/glifos.ts", modulo_ts(partes, largura, altura))
    print(f"   letreiro {largura} x {altura} · acento {caixa_do_acento(partes)}")


if __name__ == "__main__":
    main()
