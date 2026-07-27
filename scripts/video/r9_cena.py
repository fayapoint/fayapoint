"""R9 passo 2 — montar o quadro-fonte: Ricardo recortado + cena da marca.

O fundo e desenhado, nao gerado. Motivo: a paleta tem que ser EXATAMENTE a da
pagina (#0c0e1d, ouro #f5c04e, ciano #38bdf8, violeta #a78bfa) para o video nao
parecer colado de outro site — e geracao nunca acerta cor de marca na mosca.
Desenhar tambem custa zero GPU e e reproduzivel.
"""
from PIL import Image, ImageDraw, ImageFilter
import math, glob

L, A = 1280, 720
FUNDO = (12, 14, 29)
OURO = (245, 192, 78)
CIANO = (56, 189, 248)
VIOLETA = (167, 139, 250)

quadro = Image.new("RGB", (L, A), FUNDO)

# --- brilho radial atras do globo, como o da pagina -------------------------
glow = Image.new("RGB", (L, A), FUNDO)
gd = ImageDraw.Draw(glow)
cx, cy, raio = int(L * 0.68), int(A * 0.46), 300
for i in range(raio, 0, -3):
    t = 1 - i / raio
    c = tuple(int(FUNDO[k] + (OURO[k] - FUNDO[k]) * (t ** 3) * 0.34) for k in range(3))
    gd.ellipse([cx - i, cy - i, cx + i, cy + i], fill=c)
quadro = Image.blend(quadro, glow, 1.0).filter(ImageFilter.GaussianBlur(28))

d = ImageDraw.Draw(quadro, "RGBA")

# --- malha de meridianos/paralelos: a metafora de camada de dados sobre a Terra
R = 232
for k in range(-4, 5):                                   # paralelos
    ry = R * math.cos(k * math.pi / 11)
    off = R * math.sin(k * math.pi / 11)
    if ry < 4:
        continue
    d.ellipse([cx - ry, cy + off - ry * 0.30, cx + ry, cy + off + ry * 0.30],
              outline=(56, 189, 248, 44), width=1)
for k in range(9):                                       # meridianos
    rx = abs(R * math.cos(k * math.pi / 9))
    if rx < 4:
        continue
    d.ellipse([cx - rx, cy - R, cx + rx, cy + R], outline=(56, 189, 248, 40), width=1)
d.ellipse([cx - R, cy - R, cx + R, cy + R], outline=(245, 192, 78, 92), width=2)

# --- varredura do radar: uma LINHA com rastro, nao uma cunha solida --------
# (a primeira versao empilhava 46 raios e virava um triangulo chapado)
for i in range(30):
    ang = math.radians(-40 - i * 1.6)
    a = int(70 * (1 - i / 30) ** 2)
    if a < 4:
        continue
    d.line([cx, cy, cx + R * math.cos(ang), cy + R * math.sin(ang)],
           fill=(245, 192, 78, a), width=1)
d.line([cx, cy, cx + R * math.cos(math.radians(-40)), cy + R * math.sin(math.radians(-40))],
       fill=(245, 192, 78, 150), width=2)

# --- alfinetes onde ha sinal (mesma leitura do globo do site) ---------------
# espalhados pela face visivel, nao amontoados no centro
for fx, fy, cor in [(-0.42, -0.30, OURO), (0.30, -0.46, CIANO), (0.52, 0.10, VIOLETA),
                    (-0.18, 0.44, CIANO), (0.06, -0.06, OURO), (-0.58, 0.16, OURO)]:
    px, py = cx + R * fx, cy + R * fy
    d.line([px, py, px, py - 22], fill=cor + (170,), width=2)
    d.ellipse([px - 3.5, py - 26, px + 3.5, py - 19], fill=cor + (230,))
    d.ellipse([px - 10, py - 32, px + 10, py - 13], outline=cor + (60,), width=1)

quadro = quadro.filter(ImageFilter.GaussianBlur(0.6))

# --- Ricardo, recortado da foto real, no terco esquerdo ---------------------
rec = Image.open(sorted(glob.glob(r"C:\WORKS\ComfyUI\output\r9_ricardo_recorte_*.png"))[-1])
# 0,86 do quadro, nao 1,14: a versao anterior cortava os ombros e o rosto
# ocupava o quadro inteiro — parecia foto de documento, não alguém apresentando.
alvo = int(A * 0.86)
rec = rec.resize((alvo, alvo), Image.LANCZOS)
px, py = int(L * 0.045), A - alvo + int(A * 0.06)

# sombra de contato: sem ela o recorte parece adesivo colado no fundo
sombra = Image.new("RGBA", quadro.size, (0, 0, 0, 0))
sombra.paste((0, 0, 0, 150), (px, py), rec.split()[-1])
sombra = sombra.filter(ImageFilter.GaussianBlur(26))
quadro = Image.alpha_composite(quadro.convert("RGBA"), sombra)
quadro.alpha_composite(rec, (px, py))
quadro = quadro.convert("RGB")

# --- vinheta: puxa o olho para o centro do quadro --------------------------
vin = Image.new("L", (L, A), 0)
ImageDraw.Draw(vin).ellipse([-int(L * 0.22), -int(A * 0.30),
                             int(L * 1.22), int(A * 1.30)], fill=255)
vin = vin.filter(ImageFilter.GaussianBlur(140))
quadro = Image.composite(quadro, Image.new("RGB", (L, A), (5, 6, 14)), vin)

quadro.save("r9_cena.png")
quadro.save(r"C:\WORKS\ComfyUI\input\r9_cena.png")
print("cena", quadro.size)
