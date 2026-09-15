#!/usr/bin/env python3
"""
SUAVIZAR SALTOS — os trancos do vídeo viram movimento, sem apagar o que está sendo montado.

  C:/WORKS/ComfyUI/.venv/Scripts/python.exe scripts/fabrica-suavizar.py \
    --quadros-dir D:/fayai/images/fabrica-quadros/abertura_seedance20_1080p \
    --saida D:/fayai/images/fabrica-quadros/abertura_seedance20_1080p_suave \
    --salto 76:81:64:96 --luz 129:135:116:142

O Ricardo viu (15/09/2026): "perto do fim tem um shift de posição muito grande", e mandou a
tela com monitores translúcidos e a mesa em dobro. Medido no vídeo da abertura, antes de
qualquer retoque nosso:

  - 77→80: NÃO é movimento. O fluxo óptico entre quadros vizinhos é 0,1–0,3 px, mas entre o 75
    e o 83 a metade direita da cena está 21 px para a esquerda e a luz subiu de 65 para 79. O
    modelo DISSOLVE um arranjo no outro em 4 quadros — daí o fantasma em dobro e o tranco;
  - 131→134: nada se move, mas a luz cai de 84 para 61 — um apagão.

## ⛔ Duas correções que pareciam certas e pioraram

1. Trocar a janela inteira (70→92) por uma mistura entre as pontas: a montagem continua durante
   o tranco (o braço do microfone entra voando no 82 e pousa no 90) e a mistura faz o braço
   APARECER em vez de voar — apaga a construção, que é o efeito da página.
2. Só empurrar a geometria de cada quadro até uma curva suave: como os quadros do meio são uma
   dissolvência, e não um deslizamento, a projeção do fluxo pulava de 0,03 para 0,51 num quadro
   e a correção criou um tranco de 7 px AO CONTRÁRIO (medido entre vizinhos, 77→78).

## Como é agora

- `--salto a:b:w0:w1` — os quadros entre `a` e `b` (a dissolvência) são refeitos como movimento
  de verdade de `a` para `b`, guiado por fluxo óptico nos dois sentidos. Depois, cada quadro de
  `w0` a `w1` recebe só a diferença entre o quanto ele já andou e uma curva suave: deslocamento
  (campo S de `a` para `b`) e luz (mapa de ganho suave de `a` para `b`) juntos. Fora da
  dissolvência, cada quadro fica com o próprio conteúdo — o braço continua voando.
- `--luz a:b:w0:w1` — só a luz, pela mesma curva, para quando nada se move.

Números de quadro são os do arquivo (base 1). Depois deste passo, as telas da foto só podem
entrar quando a janela acabou: `fabrica-telas.mjs --telas-desde <w1 + 1>`.

Roda com o Python do ComfyUI, que tem OpenCV (o Node deste repositório não tem).
"""
import argparse
import shutil
import sys
from pathlib import Path

import cv2
import numpy as np

# O console do Windows abre em cp1252 e derruba o script no primeiro "→" impresso.
sys.stdout.reconfigure(encoding="utf-8")

p = argparse.ArgumentParser()
p.add_argument("--quadros-dir", required=True)
p.add_argument("--saida", required=True)
p.add_argument("--salto", action="append", default=[], help="a:b:w0:w1")
p.add_argument("--luz", action="append", default=[], help="a:b:w0:w1")
args = p.parse_args()

origem = Path(args.quadros_dir)
saida = Path(args.saida)
quadros = sorted(f for f in origem.iterdir() if f.suffix == ".png" and f.stem.isdigit() and len(f.stem) == 3)
N = len(quadros)


def quatro(texto):
    a, b, w0, w1 = (int(x) for x in texto.split(":"))
    if not (1 <= w0 <= a < b <= w1 <= N):
        raise SystemExit(f"janela inválida: {texto} (precisa w0 ≤ a < b ≤ w1, há {N} quadros)")
    return a, b, w0, w1


saltos_ = [quatro(t) for t in args.salto]
luzes = [quatro(t) for t in args.luz]
if not saltos_ and not luzes:
    raise SystemExit("nada a fazer: passe --salto e/ou --luz")
janelas = sorted([(w0, w1) for *_, w0, w1 in saltos_ + luzes])
for (_, fim), (ini, _) in zip(janelas, janelas[1:]):
    if ini <= fim:
        raise SystemExit("as janelas não podem se sobrepor: cada quadro recebe uma correção só")

if saida.exists():
    shutil.rmtree(saida)
saida.mkdir(parents=True)
for f in quadros:
    shutil.copyfile(f, saida / f.name)

H, W = cv2.imread(str(quadros[0])).shape[:2]
gx, gy = np.meshgrid(np.arange(W, dtype=np.float32), np.arange(H, dtype=np.float32))
dis = cv2.DISOpticalFlow_create(cv2.DISOPTICAL_FLOW_PRESET_MEDIUM)
# O deslocamento da cena não passa de ~35 px; acima disso é objeto voando.
LIMITE_FLUXO = 60.0


def ler(k):
    return cv2.imread(str(quadros[k - 1]))


def gravar(k, img):
    cv2.imwrite(str(saida / quadros[k - 1].name), np.clip(img + 0.5, 0, 255).astype(np.uint8))


def curva(k, w0, w1):
    s = (k - w0) / max(1, w1 - w0)
    return s * s * (3 - 2 * s)


def normalizado(img):
    """Cinza com média e contraste iguais: a luz que muda não pode virar movimento falso."""
    g = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY).astype(np.float32)
    return np.clip((g - g.mean()) / max(1.0, g.std()) * 50 + 128, 0, 255).astype(np.uint8)


def puxar(img, f):
    return cv2.remap(img, gx + f[..., 0], gy + f[..., 1], cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)


def mapa_de_ganho(A, B):
    return np.log(np.clip((cv2.GaussianBlur(B, (0, 0), 25) + 4) / (cv2.GaussianBlur(A, (0, 0), 25) + 4), 0.25, 4.0))


for a, b, w0, w1 in saltos_:
    A = ler(a).astype(np.float32)
    B = ler(b).astype(np.float32)
    gA = normalizado(ler(a))
    gB = normalizado(ler(b))
    # Fluxo fino para refazer a dissolvência como movimento; fluxo de região para a curva.
    f01 = cv2.GaussianBlur(dis.calc(gA, gB, None), (0, 0), 3)
    f10 = cv2.GaussianBlur(dis.calc(gB, gA, None), (0, 0), 3)
    S = dis.calc(gA, gB, None)
    magS = np.hypot(S[..., 0], S[..., 1])
    S *= np.minimum(1.0, LIMITE_FLUXO / np.maximum(magS, 1e-6))[..., None]
    S = cv2.GaussianBlur(S, (0, 0), 20)
    ganho = mapa_de_ganho(A, B)
    print(f"salto {a}→{b}: deslocamento p90 {np.percentile(np.hypot(S[..., 0], S[..., 1]), 90):.1f} px · luz {gA.mean():.0f} (normalizada)")
    linha = []
    for k in range(w0, w1 + 1):
        if a < k < b:
            t = (k - a) / (b - a)
            # Fluxo do instante t para cada ponta (aproximação do Super SloMo).
            ft0 = -(1 - t) * t * f01 + t * t * f10
            ft1 = (1 - t) * (1 - t) * f01 - t * (1 - t) * f10
            img = (1 - t) * puxar(A, ft0) + t * puxar(B, ft1)
            r = t
        else:
            img = ler(k).astype(np.float32)
            r = 0.0 if k <= a else 1.0
        e = curva(k, w0, w1) - r
        # Empurrar o conteúdo por e·S: cada ponto de saída busca o de entrada em p − e·S(p).
        img = cv2.remap(img, gx - e * S[..., 0], gy - e * S[..., 1], cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
        gravar(k, img * np.exp(e * ganho))
        linha.append(f"{k}:{r:.2f}→{curva(k, w0, w1):.2f}")
    print("  andado → desejado: " + " ".join(linha))

for a, b, w0, w1 in luzes:
    A = ler(a).astype(np.float32)
    B = ler(b).astype(np.float32)
    ganho = mapa_de_ganho(A, B)
    La = float(cv2.cvtColor(ler(a), cv2.COLOR_BGR2GRAY).mean())
    Lb = float(cv2.cvtColor(ler(b), cv2.COLOR_BGR2GRAY).mean())
    print(f"luz {a}→{b}: média {La:.1f} → {Lb:.1f}")
    linha = []
    for k in range(w0, w1 + 1):
        img = ler(k)
        Lk = float(cv2.cvtColor(img, cv2.COLOR_BGR2GRAY).mean())
        r = min(1.2, max(-0.2, (La - Lk) / (La - Lb))) if abs(La - Lb) > 1 else 0.0
        e = curva(k, w0, w1) - r
        gravar(k, img.astype(np.float32) * np.exp(e * ganho))
        linha.append(f"{k}:{r:+.2f}→{curva(k, w0, w1):.2f}")
    print("  já mudou → desejado: " + " ".join(linha))


def diferencas(pasta):
    """Diferença média entre quadros vizinhos, em miniatura."""
    antes = None
    medidas = []
    for i, f in enumerate(sorted(pasta.glob("[0-9][0-9][0-9].png"))):
        g = cv2.resize(cv2.imread(str(f), cv2.IMREAD_GRAYSCALE), (480, 270), interpolation=cv2.INTER_AREA).astype(np.float32)
        if antes is not None:
            medidas.append((i + 1, float(np.abs(g - antes).mean())))
        antes = g
    return medidas


for nome, pasta in (("antes", origem), ("depois", saida)):
    maiores = sorted(diferencas(pasta), key=lambda x: -x[1])[:8]
    print(f"maiores diferenças entre vizinhos, {nome}: " + " ".join(f"{q}:{d:.2f}" for q, d in maiores))
print(f"✅ {N} quadros em {saida}")
