"""R9b passo 2 — o fundo animado, quadro a quadro.

Desenhado e nao gerado, pelo mesmo motivo de antes (a paleta tem que ser a da
pagina) e agora por um motivo mais forte: quando o LTX inventa esse movimento,
ele vira fita de luz. Aqui a rotacao, a varredura e o pulso sao contas — giram
na velocidade que eu mandar, sem artefato e sem sorteio.

O ciclo FECHA: tudo que se move volta a fase inicial no ultimo quadro, entao o
loop do <video> nao tem salto.
"""
from PIL import Image, ImageDraw, ImageFilter
import math, os

L, A = 1280, 720
N = 121                       # mesmo comprimento do clipe da pessoa
FUNDO = (12, 14, 29)
OURO = (245, 192, 78)
CIANO = (56, 189, 248)
VIOLETA = (167, 139, 250)

SAIDA = r"C:\WORKS\ComfyUI\output\r9b_fundo"
os.makedirs(SAIDA, exist_ok=True)

# Costas do mundo, do MESMO GeoJSON que o globo da pagina desenha.
GEO = r"C:\Users\ricar\WORKSMAIN\autoresearch\fayapoint-ai\src\data\geo\mundo.json"


def carrega_costas():
    import json
    with open(GEO, encoding="utf-8") as fh:
        col = json.load(fh)
    aneis = []
    for f in col["features"]:
        g = f["geometry"]
        partes = [g["coordinates"]] if g["type"] == "Polygon" else g["coordinates"]
        for poli in partes:
            if not poli:
                continue
            ext = poli[0]                        # so o anel externo; ilhas internas viram sujeira nesta escala
            if len(ext) < 8:
                continue                         # ilhota: some no tamanho do globo e so custa tracado
            aneis.append([(p[1], p[0]) for p in ext])   # GeoJSON e (lng, lat)
    return aneis


COSTAS = carrega_costas()
print(f"{len(COSTAS)} contornos de costa")

cx, cy, R = int(L * 0.70), int(A * 0.47), 236

# Alfinetes em (lat, lng) fixos: giram JUNTO com o globo, entao parecem presos
# a superficie em vez de flutuar na frente dela. As coordenadas sao as regioes
# que o Radar mede — Brasil, Europa, Asia, America do Norte.
PINOS = [(-12.0, -52.0, OURO), (-9.0, -41.0, CIANO), (40.0, -3.0, VIOLETA),
         (39.0, 116.0, CIANO), (39.0, -98.0, OURO), (-27.0, 133.0, OURO)]


def quadro(i):
    t = i / N                                  # 0..1, fecha o ciclo
    giro = t * 2 * math.pi                     # uma volta inteira do globo
    varre = t * 2 * math.pi                    # uma volta da varredura

    q = Image.new("RGB", (L, A), FUNDO)

    # brilho radial que respira de leve
    pulso = 0.38 + 0.07 * math.sin(t * 2 * math.pi)
    glow = Image.new("RGB", (L, A), FUNDO)
    gd = ImageDraw.Draw(glow)
    for r in range(300, 0, -4):
        k = 1 - r / 300
        gd.ellipse([cx - r, cy - r, cx + r, cy + r],
                   fill=tuple(int(FUNDO[j] + (OURO[j] - FUNDO[j]) * (k ** 3) * pulso) for j in range(3)))
    q = Image.blend(q, glow, 1.0).filter(ImageFilter.GaussianBlur(30))

    d = ImageDraw.Draw(q, "RGBA")

    # A malha e PROJETADA ponto a ponto, nao desenhada com elipses.
    #
    # A primeira versao usava uma elipse por meridiano. Nao funcionava: uma
    # elipse no angulo A e no angulo A+pi e a MESMA elipse, entao com 10
    # meridianos igualmente espacados o desenho inteiro se repetia a cada 1/20
    # de volta. Medido: 0,55 de diferenca entre o quadro 0 e o 60 — o globo
    # "girava" para um quadro identico. Projetando cada ponto, cada um percorre
    # a esfera de verdade e a rotacao se ve.
    def projeta(lat, lng):
        la, lo = math.radians(lat), math.radians(lng) + giro
        x = math.cos(la) * math.sin(lo)
        y = math.sin(la)
        z = math.cos(la) * math.cos(lo)          # z > 0 = virado para nos
        return cx + R * x, cy - R * y, z

    def linha(pontos, cor, base):
        ant = None
        for lat, lng in pontos:
            X, Y, Z = projeta(lat, lng)
            if ant and (ant[2] > 0 or Z > 0):
                # profundidade vira opacidade: o lado de tras some sozinho
                op = int(base * max(0.0, (max(ant[2], Z) + 0.15) / 1.15))
                if op > 3:
                    d.line([ant[0], ant[1], X, Y], fill=cor + (op,), width=1)
            ant = (X, Y, Z)

    for lat in range(-60, 61, 20):               # paralelos
        linha([(lat, lng) for lng in range(0, 361, 6)], CIANO, 30)
    for lng in range(0, 360, 20):                # meridianos
        linha([(lat, lng) for lat in range(-90, 91, 5)], CIANO, 34)

    # OS CONTINENTES — sem eles a rotacao e invisivel, e nao por bug: uma malha
    # lat/lng uniforme e rotacionalmente simetrica, entao a cada 20 graus de giro
    # ela cai exatamente sobre si mesma (medido: quadro 0 e quadro 60 com 0,43 de
    # diferenca, o mesmo que quadros vizinhos). E preciso de forma assimetrica na
    # superficie para o olho ler que o planeta esta girando. Sao as costas reais,
    # do mesmo GeoJSON que o globo da pagina usa — o video passa a mostrar o
    # produto, nao uma abstracao parecida com ele.
    for anel in COSTAS:
        linha(anel, OURO, 168)

    d.ellipse([cx - R, cy - R, cx + R, cy + R], outline=(245, 192, 78, 88), width=2)

    # varredura: uma linha girando com rastro curto atras dela
    for j in range(26):
        a = varre - j * 0.055
        op = int(78 * (1 - j / 26) ** 2)
        if op < 4:
            continue
        d.line([cx, cy, cx + R * math.cos(a), cy + R * math.sin(a)],
               fill=(245, 192, 78, op), width=1)
    d.line([cx, cy, cx + R * math.cos(varre), cy + R * math.sin(varre)],
           fill=(245, 192, 78, 165), width=2)

    # alfinetes presos a superficie, projetados igual a malha
    for lat, lng, cor in PINOS:
        X, Y, Z = projeta(lat, lng)
        if Z <= 0.05:
            continue                            # do outro lado do planeta
        # acende quando a varredura passa por cima dele
        lo = (math.radians(lng) + giro) % (2 * math.pi)
        dif = abs(((lo - varre + math.pi) % (2 * math.pi)) - math.pi)
        aceso = max(0.0, 1 - dif / 0.85)
        op = int((80 + 160 * aceso) * min(1.0, Z * 2.2))
        alt = 16 + 11 * aceso
        d.line([X, Y, X, Y - alt], fill=cor + (op,), width=2)
        d.ellipse([X - 3.5, Y - alt - 4, X + 3.5, Y - alt + 3], fill=cor + (min(255, op + 55),))
        if aceso > 0.05:                        # anel de eco so no momento do ping
            rr = 8 + 24 * (1 - aceso)
            d.ellipse([X - rr, Y - alt - 4 - rr * 0.45, X + rr, Y - alt + 3 + rr * 0.45],
                      outline=cor + (int(130 * aceso), ), width=1)

    q = q.filter(ImageFilter.GaussianBlur(0.5))

    vin = Image.new("L", (L, A), 0)
    ImageDraw.Draw(vin).ellipse([-int(L * 0.22), -int(A * 0.30),
                                 int(L * 1.22), int(A * 1.30)], fill=255)
    vin = vin.filter(ImageFilter.GaussianBlur(140))
    return Image.composite(q, Image.new("RGB", (L, A), (5, 6, 14)), vin)


for i in range(N):
    quadro(i).save(os.path.join(SAIDA, f"f_{i + 1:05d}_.png"))
    if (i + 1) % 30 == 0:
        print(f"  {i + 1}/{N}", flush=True)
print("fundo pronto em", SAIDA)
