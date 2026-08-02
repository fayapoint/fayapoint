# -*- coding: utf-8 -*-
"""Card de compartilhamento do site (Open Graph / Twitter).

## Por que existir

A capa anterior (`public/rwx6.jpg`) era uma foto do Web Summit com marca d'agua
de **outro dominio** (`fayacuts.com.br`), anunciava o Ultimate Social Suite em
vez dos cursos, e vinha em 2000x934 (proporcao 2,14) quando o card pede 1,91.
No tamanho real em que a miniatura aparece — uns 500 px de largura no feed — as
pessoas viravam pontinhos e nao havia uma palavra legivel.

## Metodo

O fundo vem do ComfyUI (modelo de difusao) e o TEXTO e composto aqui com PIL.
Difusao escreve letra torta; texto tem que ser vetorial/rasterizado por fonte.
Essa separacao e a unica forma de ter cena bonita E texto legivel.

Paleta e tom seguem `IDENTIDADE_VISUAL.md`: fundo `#0c0e1d`, ouro `#f5c04e`
reservado para a assinatura, e a ponte "foto real + mascote fofo".

    python og_card.py <fundo.png> <saida.jpg>
"""
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

LARGURA, ALTURA = 1200, 630  # 1,905 — a proporcao que Facebook/LinkedIn/X pedem

NAVY = (12, 14, 29)
OURO = (245, 192, 78)
TEXTO = (243, 241, 255)

FONTES = Path("C:/Windows/Fonts")
BOLD = FONTES / "segoeuib.ttf"
REG = FONTES / "segoeui.ttf"
SEMI = FONTES / "seguisb.ttf"


def cobrir(im: Image.Image, w: int, h: int) -> Image.Image:
    """Preenche w x h sem distorcer: escala pelo lado que falta e corta o resto."""
    escala = max(w / im.width, h / im.height)
    novo = im.resize((round(im.width * escala), round(im.height * escala)), Image.LANCZOS)
    esq = (novo.width - w) // 2
    topo = (novo.height - h) // 2
    return novo.crop((esq, topo, esq + w, topo + h))


def scrim(im: Image.Image) -> Image.Image:
    """Veu escuro da esquerda para a direita, para o texto ter contraste.

    Sem isto o texto branco disputa com a cena e perde em qualquer miniatura.
    """
    veu = Image.new("RGBA", (LARGURA, ALTURA), (0, 0, 0, 0))
    d = ImageDraw.Draw(veu)
    for x in range(LARGURA):
        t = x / (LARGURA * 0.86)
        # Expoente < 1 mantem o veu forte por mais tempo antes de cair. Com 1.25
        # a segunda linha do subtitulo caia em cima do brilho do laptop.
        alfa = int(246 * max(0.0, 1.0 - t) ** 0.92)
        d.line([(x, 0), (x, ALTURA)], fill=(*NAVY, alfa))
    # Base inteira levemente escurecida: segura o dominio no rodape.
    for y in range(ALTURA):
        t = max(0.0, (y - ALTURA * 0.68) / (ALTURA * 0.32))
        if t > 0:
            d.line([(0, y), (LARGURA, y)], fill=(*NAVY, int(150 * t)))
    return Image.alpha_composite(im.convert("RGBA"), veu)


def main():
    fundo = Path(sys.argv[1])
    saida = Path(sys.argv[2])

    im = scrim(cobrir(Image.open(fundo), LARGURA, ALTURA))
    d = ImageDraw.Draw(im)

    f_marca = ImageFont.truetype(str(BOLD), 30)
    f_titulo = ImageFont.truetype(str(BOLD), 66)
    f_sub = ImageFont.truetype(str(REG), 27)
    f_dom = ImageFont.truetype(str(SEMI if SEMI.exists() else REG), 25)

    x = 68

    # Assinatura: FAY branco + AI ouro, como manda a identidade.
    d.text((x, 58), "FAY", font=f_marca, fill=TEXTO)
    largura_fay = d.textlength("FAY", font=f_marca)
    d.text((x + largura_fay, 58), "AI", font=f_marca, fill=OURO)

    # Titulo em duas linhas: cabe na coluna e sobrevive a miniatura.
    d.text((x, 214), "Cursos de IA", font=f_titulo, fill=TEXTO)
    d.text((x, 292), "em português", font=f_titulo, fill=TEXTO)

    # Regra de ouro curta separando titulo e promessa.
    d.rounded_rectangle([x, 392, x + 78, 397], radius=3, fill=OURO)

    d.text((x, 424), "Do zero ao uso real — e você lê um", font=f_sub, fill=(*TEXTO, 205))
    d.text((x, 460), "capítulo inteiro antes de pagar.", font=f_sub, fill=(*TEXTO, 205))

    d.text((x, 534), "fayai.com.br", font=f_dom, fill=OURO)

    im.convert("RGB").save(saida, "JPEG", quality=90, optimize=True, progressive=True)
    print(f"{saida} — {im.width}x{im.height} — {saida.stat().st_size // 1024} KB")


if __name__ == "__main__":
    main()
