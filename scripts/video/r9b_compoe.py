"""R9b passo 4 — compor a pessoa animada sobre o fundo animado.

Duas animacoes independentes viram um plano so. A pessoa vem do LTX (movimento
humano, que e o que ele faz bem); o fundo vem do desenho (rotacao e varredura
exatas, que e o que o LTX faz mal).
"""
from PIL import Image, ImageFilter, ImageChops
import glob, os, math, statistics

PESSOA = sorted(glob.glob(r"C:\WORKS\ComfyUI\output\r9b_alpha\*.png"))
FUNDO = sorted(glob.glob(r"C:\WORKS\ComfyUI\output\r9b_fundo\*.png"))
SAIDA = r"C:\WORKS\ComfyUI\output\r9b_final"
os.makedirs(SAIDA, exist_ok=True)

N = min(len(PESSOA), len(FUNDO))
print(N, "quadros")

L, A = 1280, 720
OURO = (245, 192, 78)

for i in range(N):
    fundo = Image.open(FUNDO[i]).convert("RGBA")
    pes = Image.open(PESSOA[i]).convert("RGBA")

    # O LTX entrega 1280x704; o fundo e 1280x720. Alinho pela base para o
    # sujeito nao "flutuar" em relacao a vinheta inferior.
    if pes.size != (L, A):
        novo = Image.new("RGBA", (L, A), (0, 0, 0, 0))
        novo.paste(pes, (0, A - pes.size[1]), pes)
        pes = novo

    # Reenquadro: o LTX centralizou o sujeito, mas na pagina ele fica a
    # esquerda, com o globo respirando a direita. 0,82 de escala tambem devolve
    # o ombro que o push-in do modelo tinha cortado.
    esc = 0.82
    p2 = pes.resize((int(L * esc), int(A * esc)), Image.LANCZOS)
    dx = int(-L * 0.20)
    dy = A - p2.size[1]
    quadro = Image.new("RGBA", (L, A), (0, 0, 0, 0))
    quadro.paste(p2, (dx, dy), p2)

    # Sombra de contato: sem ela o recorte parece adesivo colado no fundo.
    sombra = Image.new("RGBA", (L, A), (0, 0, 0, 0))
    sombra.paste((0, 0, 0, 165), (dx + 6, dy + 8), quadro.split()[-1])
    sombra = sombra.filter(ImageFilter.GaussianBlur(30))

    comp = Image.alpha_composite(fundo, sombra)
    comp = Image.alpha_composite(comp, quadro)

    # Luz de recorte na cor da marca, do lado do globo — costura as duas
    # camadas: sem isso a pessoa parece iluminada por outra cena.
    alpha = quadro.split()[-1]
    borda = ImageChops.difference(alpha, alpha.filter(ImageFilter.MinFilter(5)))
    borda = borda.filter(ImageFilter.GaussianBlur(2.5))
    luz = Image.new("RGBA", (L, A), OURO + (0,))
    luz.putalpha(borda.point(lambda v: int(v * 0.42)))
    comp = Image.alpha_composite(comp, luz)

    comp.convert("RGB").save(os.path.join(SAIDA, f"c_{i + 1:05d}_.png"))
    if (i + 1) % 30 == 0:
        print(f"  {i + 1}/{N}", flush=True)


def dif(a, b):
    d = ImageChops.difference(Image.open(a).convert("L").resize((320, 180)),
                              Image.open(b).convert("L").resize((320, 180)))
    px = list(d.getdata())
    return sum(px) / len(px)


fs = sorted(glob.glob(os.path.join(SAIDA, "*.png")))
print("MOVIMENTO FINAL: quadro-a-quadro %.2f | 0 vs 60 %.2f | 0 vs 120 %.2f"
      % (statistics.mean([dif(a, b) for a, b in zip(fs[:-1:6], fs[6::6])]),
         dif(fs[0], fs[60]), dif(fs[0], fs[-1])))
print("(o clipe reprovado media 0.65 quadro-a-quadro)")
