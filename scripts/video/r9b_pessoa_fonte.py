"""R9b passo 1 — quadro-fonte SO da pessoa, sobre fundo chapado.

Mudanca de estrategia depois do veredito do Ricardo ("nao gosto da imagem
estatica"). Medido no clipe anterior: 0,65 de diferenca media entre quadros
(escala 0-255) — 0,25%. Era uma foto com ruido.

A causa nao foi falta de prompt: foi eu ter pedido ao LTX que inventasse o
movimento do globo. Ele leu a varredura como rastro de luz (v1, caotico) e,
quando travei tudo para conter isso (v2), o plano congelou junto.

Agora as duas animacoes sao separadas, cada uma na ferramenta certa:
  - a PESSOA vai para o LTX, que e bom em movimento humano;
  - o FUNDO eu desenho quadro a quadro, com controle exato de rotacao,
    varredura e pulso.
Fundo chapado aqui porque a pessoa precisa ser recortada de volta depois.
"""
from PIL import Image, ImageDraw, ImageFilter
import glob

L, A = 1280, 720
# Cinza-azulado escuro e uniforme: contrasta com pele e cabelo o bastante para
# o BiRefNet separar bem, sem virar halo claro na borda como um verde faria.
FUNDO = (26, 29, 44)

q = Image.new("RGB", (L, A), FUNDO)

rec = Image.open(sorted(glob.glob(r"C:\WORKS\ComfyUI\output\r9_ricardo_recorte_*.png"))[-1])
alvo = int(A * 0.92)
rec = rec.resize((alvo, alvo), Image.LANCZOS)
# Centralizado: o enquadramento final quem decide e a composicao, nao este passo.
px, py = (L - alvo) // 2, A - alvo + int(A * 0.08)

q = q.convert("RGBA")
q.alpha_composite(rec, (px, py))
q = q.convert("RGB")

q.save("r9b_pessoa_fonte.png")
q.save(r"C:\WORKS\ComfyUI\input\r9b_pessoa_fonte.png")
print("fonte da pessoa", q.size, "sujeito em", (px, py, alvo))
