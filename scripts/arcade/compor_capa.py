# -*- coding: utf-8 -*-
"""Composicao das capas do blog: cena gerada + elementos REAIS por cima.

## A virada

Ate 29/07/2026 a capa era uma imagem so, inteira pedida ao modelo. Isso
significa que tudo que precisa ser EXATO — a logo da TikTok, o print do nosso
site, o rosto do Ricardo — saia inventado, e inventado errado. Nenhum modelo de
difusao desenha uma marca registrada corretamente, e o texto em tela sempre sai
rabiscado (neste workflow nem da para tentar impedir: `ConditioningZeroOut` com
CFG 1.0, exigido pela LoRA Lightning, faz o prompt negativo ser ignorado).

Pedido do Ricardo: *"sempre que falarmos de uma marca, quero a logomarca da
empresa em questao"*, *"se for uma tela de laptop, devemos utilizar um print do
nosso site, o que daria identidade e recall"*.

Entao a divisao de trabalho mudou:

    o modelo faz    a CENA — luz, profundidade, materia, atmosfera
    a composicao faz o que precisa estar CERTO — logo, tela, mascote, pessoa

## As pecas

    telas/       prints reais de fayai.com.br (capturar_telas_site.mjs)
    mascote/     o mascote 3D recortado, 5 poses (gerar_mascote_3d.py)
    logos/       SVG oficiais que o Ricardo largar aqui — tem PRECEDENCIA
                 sobre o simple-icons, que nao tem OpenAI, Adobe nem Synthesia
    pessoa/      recortes do Ricardo
"""
import json
import math
import os
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

RAIZ = Path(__file__).parent.parent.parent
CAPAS = RAIZ / "_capas_novas"
TELAS = CAPAS / "telas"
MASCOTE = CAPAS / "mascote"
PESSOA = CAPAS / "pessoa"
LOGOS_PROPRIOS = CAPAS / "logos"
SIMPLE_ICONS = RAIZ / "node_modules" / "simple-icons" / "icons"


# ---------------------------------------------------------------------------
# Logos
# ---------------------------------------------------------------------------

def _node() -> str:
    """Caminho absoluto do node.

    O node deste computador vem do fnm, que injeta o PATH por sessao de shell —
    e `subprocess` nao herda isso: chamar "node" direto devolvia
    `WinError 2: cannot find the file specified`. Procura no diretorio do fnm e
    cai em "node" se nao achar (em maquina com instalacao normal, funciona).
    """
    from shutil import which
    achado = which("node")
    if achado:
        return achado
    base = Path(os.environ.get("LOCALAPPDATA", "")) / "fnm_multishells"
    if base.is_dir():
        candidatos = sorted(base.glob("*/node.exe"), key=lambda p: p.stat().st_mtime, reverse=True)
        if candidatos:
            return str(candidatos[0])
    return "node"


def _rasterizar_svg(svg_path: Path, destino: Path, largura: int, cor: str | None):
    """SVG -> PNG com alfa, via sharp (node).

    O `cairosvg` esta instalado mas nao carrega: falta a DLL do cairo no
    Windows. O `sharp` ja e dependencia do projeto e rasteriza SVG nativamente.

    O simple-icons entrega um glifo monocromatico com `fill` implicito; para
    pintar na cor da marca, injetamos o `fill` na raiz do SVG antes de rasterizar.
    """
    svg = svg_path.read_text(encoding="utf-8")
    if cor:
        svg = svg.replace("<svg ", f'<svg fill="{cor}" ', 1)
    tmp = destino.with_suffix(".tmp.svg")
    tmp.write_text(svg, encoding="utf-8")
    script = (
        "const sharp=require('sharp');"
        f"sharp({json.dumps(str(tmp))})"
        f".resize({largura})"
        f".png().toFile({json.dumps(str(destino))})"
        ".then(()=>process.exit(0)).catch(e=>{console.error(e.message);process.exit(1)});"
    )
    r = subprocess.run([_node(), "-e", script], capture_output=True, text=True, cwd=str(RAIZ))
    tmp.unlink(missing_ok=True)
    if r.returncode != 0:
        raise RuntimeError(f"sharp falhou: {r.stderr[:200]}")


def logo_da_marca(marca: str, largura: int = 220, cor: str | None = None) -> Image.Image | None:
    """Devolve o logo com alfa, ou None se a marca nao existir em lugar nenhum.

    Ordem de busca deliberada:

    1. `_capas_novas/logos/<marca>.svg` — o que o Ricardo colocar la manda. E
       por aqui que entram OpenAI, Adobe e Synthesia, que o simple-icons
       removeu por questao de marca registrada.
    2. `node_modules/simple-icons/icons/<marca>.svg` — 3.450 marcas, com a cor
       oficial de cada uma no `simple-icons/index.js`.

    Devolver None e melhor que inventar: capa sem logo continua sendo uma capa;
    capa com a logo errada da TikTok e um erro que o leitor percebe.
    """
    cache = CAPAS / "_logo_cache"
    cache.mkdir(parents=True, exist_ok=True)
    destino = cache / f"{marca}_{largura}.png"
    if destino.exists():
        return Image.open(destino).convert("RGBA")

    proprio = LOGOS_PROPRIOS / f"{marca}.svg"
    fonte = proprio if proprio.exists() else SIMPLE_ICONS / f"{marca}.svg"
    if not fonte.exists():
        return None

    try:
        _rasterizar_svg(fonte, destino, largura, cor)
    except Exception as e:
        print(f"  [logo] {marca}: {e}")
        return None
    return Image.open(destino).convert("RGBA")


# ---------------------------------------------------------------------------
# Tela: achar o retangulo claro e encaixar o print
# ---------------------------------------------------------------------------

def achar_tela(base: Image.Image, limiar: int = 170) -> list[tuple[int, int]] | None:
    """Os 4 cantos da tela acesa na cena, em ordem: TL, TR, BR, BL.

    A cena e prompted com a tela ACESA E VAZIA — um retangulo claro e uniforme
    no meio de um ambiente escuro. Isso faz a deteccao ser simples e estavel:
    a regiao clara conectada de maior area e a tela.

    Os cantos saem pelos extremos de (x+y) e (x-y), que e o jeito classico de
    tirar os quatro vertices de um quadrilatero convexo sem precisar de OpenCV
    (nao esta instalado; so numpy e PIL).

    Devolve None quando nao encontra nada convincente — a composicao entao
    apenas pula a tela em vez de colar o print num lugar errado.
    """
    cinza = np.asarray(base.convert("L"), dtype=np.uint8)
    mascara = cinza > limiar
    if mascara.sum() < 2000:
        return None

    # Limpa respingos antes de medir os cantos.
    #
    # A primeira versao tentava isolar a mancha conectada com
    # `ImageDraw.floodfill` sobre a mascara. Nao funciona: medido em
    # 29/07/2026, com 140.511 pixels claros na imagem a inundacao devolveu
    # **zero** pixels preenchidos — o floodfill do PIL nao se comporta como
    # esperado numa imagem "L" binaria, e a deteccao caia fora sempre.
    #
    # A abertura morfologica resolve o mesmo problema sem depender disso: come
    # reflexo, respingo especular e qualquer ilha menor que a janela, e deixa
    # so as manchas grandes. Como a cena e prompted escura com UMA tela acesa,
    # o que sobra e a tela.
    mimg = Image.fromarray((mascara * 255).astype(np.uint8))
    mimg = mimg.filter(ImageFilter.MinFilter(9)).filter(ImageFilter.MaxFilter(9))
    regiao = np.asarray(mimg) > 127
    if regiao.sum() < 2000:
        return None

    ys, xs = np.nonzero(regiao)
    soma, dif = xs + ys, xs - ys
    tl = (int(xs[soma.argmin()]), int(ys[soma.argmin()]))
    br = (int(xs[soma.argmax()]), int(ys[soma.argmax()]))
    tr = (int(xs[dif.argmax()]), int(ys[dif.argmax()]))
    bl = (int(xs[dif.argmin()]), int(ys[dif.argmin()]))

    largura = max(abs(tr[0] - tl[0]), abs(br[0] - bl[0]))
    altura = max(abs(bl[1] - tl[1]), abs(br[1] - tr[1]))
    if largura < 120 or altura < 80:
        return None
    return [tl, tr, br, bl]


def _coef_perspectiva(destino, origem):
    """Coeficientes para Image.transform(PERSPECTIVE), que mapeia SAIDA->ENTRADA."""
    matriz = []
    for (xd, yd), (xo, yo) in zip(destino, origem):
        matriz.append([xd, yd, 1, 0, 0, 0, -xo * xd, -xo * yd])
        matriz.append([0, 0, 0, xd, yd, 1, -yo * xd, -yo * yd])
    A = np.matrix(matriz, dtype=float)
    B = np.array(origem).reshape(8)
    return np.array(np.dot(np.linalg.inv(A.T * A) * A.T, B)).reshape(8)


def colar_tela(base: Image.Image, print_site: Image.Image, cantos, brilho: float = 0.92):
    """Encaixa o print do site no quadrilatero da tela, com perspectiva."""
    l, a = base.size
    origem = [(0, 0), (print_site.width, 0), (print_site.width, print_site.height), (0, print_site.height)]
    coef = _coef_perspectiva(cantos, origem)
    aviao = print_site.convert("RGBA").transform((l, a), Image.PERSPECTIVE, coef, Image.BICUBIC)

    # Mascara do quadrilatero, com borda suave: a tela tem cantos arredondados
    # e um pouco de brilho de vidro; recorte duro entrega a montagem.
    masc = Image.new("L", (l, a), 0)
    ImageDraw.Draw(masc).polygon(cantos, fill=255)
    masc = masc.filter(ImageFilter.GaussianBlur(1.2))

    # O print e claro demais para um ambiente escuro; escurece um tico para a
    # tela pertencer a cena em vez de flutuar sobre ela.
    if brilho != 1.0:
        aviao = Image.eval(aviao, lambda v: int(v * brilho))

    base.paste(aviao, (0, 0), masc)
    return base


# ---------------------------------------------------------------------------
# Composicao
# ---------------------------------------------------------------------------

def _casar_luz(elemento: Image.Image, cena: Image.Image, forca: float = 0.55) -> Image.Image:
    """Puxa a cor e o brilho do recorte na direcao da cena.

    O mascote nasce sob luz de estudio em fundo cinza neutro. Colado cru numa
    cena azul-escura de fotojornalismo, ele fica claro demais e neutro demais —
    o olho le "adesivo", nao "objeto que estava ali". Nenhum ajuste de posicao
    conserta isso, porque o problema e de LUZ, nao de enquadramento.

    A correcao e simples e barata: aproxima a media de cada canal do recorte da
    media da cena, com forca parcial. Nao e casamento de histograma completo —
    isso achataria o contraste do objeto e mataria o brilho especular que da o
    volume dele. `forca` 0,55 foi o ponto em que o mascote pertence a cena e
    ainda le como objeto solido.
    """
    el = np.asarray(elemento.convert("RGBA"), dtype=np.float32)
    alfa = el[:, :, 3:4] / 255.0
    if alfa.sum() < 1:
        return elemento

    fundo = np.asarray(cena.convert("RGB"), dtype=np.float32)
    media_cena = fundo.reshape(-1, 3).mean(axis=0)
    # Media do objeto pesada pelo alfa: o fundo transparente nao pode entrar.
    media_obj = (el[:, :, :3] * alfa).sum(axis=(0, 1)) / max(alfa.sum(), 1)

    ajuste = (media_cena - media_obj) * forca
    el[:, :, :3] = np.clip(el[:, :, :3] + ajuste, 0, 255)
    return Image.fromarray(el.astype(np.uint8), "RGBA")


def colar_elemento(base, elemento, pos, altura_alvo, opacidade=1.0, desfoque=0.0, casar_luz=True):
    """Cola um recorte (mascote, pessoa, logo) proporcionalmente.

    `pos` e relativo (0..1) e aponta o CENTRO do elemento — assim a mesma
    receita serve para 1152x768 e para qualquer outro tamanho.

    `desfoque` existe porque o Ricardo pediu o mascote e ele proprio "nem sempre
    no foreground, mas as vezes como elementos de background": quem esta ao
    fundo tem que estar FORA DE FOCO, senao a imagem fica com duas profundidades
    disputando a atencao e parece colagem.
    """
    l, a = base.size
    alvo = int(a * altura_alvo)
    escala = alvo / elemento.height
    el = elemento.resize((max(1, int(elemento.width * escala)), alvo), Image.LANCZOS)
    if casar_luz:
        el = _casar_luz(el, base)
    if desfoque > 0:
        el = el.filter(ImageFilter.GaussianBlur(desfoque))
    if opacidade < 1.0:
        alfa = el.split()[3].point(lambda v: int(v * opacidade))
        el.putalpha(alfa)
    x = int(l * pos[0] - el.width / 2)
    y = int(a * pos[1] - el.height / 2)
    base.alpha_composite(el, (x, y))
    return base


def compor(base_png: Path, receita: dict, destino: Path) -> dict:
    """Aplica a receita sobre a cena e grava. Devolve o que foi aplicado."""
    base = Image.open(base_png).convert("RGBA")
    aplicado = {"tela": False, "logo": False, "mascote": False, "pessoa": False}

    # 1. Tela — antes de tudo, porque logo e mascote podem ficar por cima dela.
    if receita.get("tela"):
        cantos = achar_tela(base, receita.get("tela_limiar", 170))
        if cantos:
            arq = TELAS / f"{receita['tela']}.png"
            if arq.exists():
                colar_tela(base, Image.open(arq), cantos, receita.get("tela_brilho", 0.92))
                aplicado["tela"] = True

    # 2. Mascote e pessoa ao fundo (desfocados) entram ANTES dos elementos de frente.
    for chave, pasta in (("mascote_fundo", MASCOTE), ("pessoa_fundo", PESSOA)):
        cfg = receita.get(chave)
        if cfg:
            arq = pasta / f"{cfg['arquivo']}.png"
            if arq.exists():
                colar_elemento(base, Image.open(arq).convert("RGBA"), cfg["pos"],
                               cfg.get("altura", 0.30), cfg.get("opacidade", 0.55),
                               cfg.get("desfoque", 3.5))
                aplicado["mascote" if "mascote" in chave else "pessoa"] = True

    # 3. Mascote e pessoa em primeiro plano.
    for chave, pasta in (("mascote", MASCOTE), ("pessoa", PESSOA)):
        cfg = receita.get(chave)
        if cfg:
            arq = pasta / f"{cfg['arquivo']}.png"
            if arq.exists():
                colar_elemento(base, Image.open(arq).convert("RGBA"), cfg["pos"],
                               cfg.get("altura", 0.42), cfg.get("opacidade", 1.0),
                               cfg.get("desfoque", 0.0))
                aplicado[chave] = True

    # 4. Logo por ultimo: e o elemento que precisa ficar legivel acima de tudo.
    cfg = receita.get("logo")
    if cfg:
        img = logo_da_marca(cfg["marca"], 400, cfg.get("cor"))
        if img:
            # `casar_luz=False` de proposito: a marca tem cor definida pelo dono
            # dela. Puxar o branco da TikTok para o azul da cena — que foi o que
            # aconteceu na primeira montagem — descaracteriza a logo e ainda
            # deixa a capa parecendo desbotada justamente no ponto que precisa
            # ser reconhecido de relance.
            colar_elemento(base, img, cfg["pos"], cfg.get("altura", 0.13),
                           cfg.get("opacidade", 0.95), 0.0, casar_luz=False)
            aplicado["logo"] = True
        else:
            print(f"  [logo] '{cfg['marca']}' nao encontrada — capa segue sem ela")

    destino.parent.mkdir(parents=True, exist_ok=True)
    base.convert("RGB").save(destino, quality=94)
    return aplicado
