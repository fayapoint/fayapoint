# Vídeo de abertura da `/radar` — pipeline local, custo zero

Como o plano em `public/radar/abertura.webm` foi feito, e como refazer.

## A ideia central: duas animações separadas

A primeira tentativa mandou o LTX animar a cena inteira — pessoa e globo juntos.
Falhou nas duas pontas:

- pedindo movimento ao globo, o modelo leu a linha de varredura como rastro de
  luz e o fundo virou um emaranhado de fitas douradas a partir do frame 60;
- travando tudo para conter isso, o plano **congelou junto**. Medido: 0,65 de
  diferença média entre quadros vizinhos numa escala de 0 a 255 — **0,25%**. Era
  uma foto com ruído, e foi reprovado como tal.

A saída foi parar de pedir uma coisa só e dar cada movimento à ferramenta certa:

| camada | ferramenta | por quê |
|---|---|---|
| pessoa | LTX 2.3 i2v | movimento humano é o que ele faz bem — vira o rosto, sorri, pisca, respira |
| fundo | desenho em PIL, quadro a quadro | rotação e varredura viram conta: velocidade exata, sem artefato, sem sorteio |

Medido depois da mudança: **2,44** quadro a quadro e **10,99** do primeiro ao
último — contra 0,65 e 3,73 da versão reprovada.

## Por que o rosto é foto e não geração

Em 25/07/2026 ficou medido que a geração local acerta o tipo físico do Ricardo e
erra a pessoa, e que treinar LoRA nesta máquina é inviável (31 s/passagem).
Partindo de fotografia, o rosto é ele **por construção** — verificado que a
identidade se manteve do frame 0 ao 120 mesmo com o sorriso e o giro de cabeça.

Isso vale para **animar**. Pose ou cenário novos ainda dependem do LoRA que ele
tem no Higgsfield.

## Por que o fundo é desenhado e não gerado

A paleta tem que ser exatamente a da página (`#0c0e1d`, ouro `#f5c04e`, ciano
`#38bdf8`, violeta `#a78bfa`) e geração nunca acerta cor de marca na mosca. E as
costas dos continentes vêm do **mesmo GeoJSON que o globo da página desenha** —
o vídeo mostra o produto, não uma abstração parecida com ele.

## Rodar

Com o ComfyUI de pé em `http://localhost:8000`:

```bash
python scripts/video/r9_recorte.py        # foto -> PNG com alpha (BiRefNet)
python scripts/video/r9b_pessoa_fonte.py  # recorte sobre fundo chapado
python scripts/video/r9b_video.py         # LTX -> 121 quadros da pessoa (~9 min)
python scripts/video/r9b_fundo.py         # 121 quadros do globo girando
python scripts/video/r9b_recorta_lote.py  # BiRefNet nos 121 quadros, num job só
python scripts/video/r9b_compoe.py        # junta as duas camadas
python scripts/video/r9_encode.py "C:\WORKS\ComfyUI\output\r9b_final"
```

Resultado atual: **269 KB**, 960×540, 4,84 s, contra um teto de 400 KB
(`IDENTIDADE_VISUAL.md`).

## Armadilhas que custaram tempo

1. **Uma malha lat/lng uniforme NÃO consegue mostrar rotação.** Não é bug de
   código: com meridianos igualmente espaçados a cada 20°, o desenho cai sobre
   si mesmo a cada 20° de giro. Medi o quadro 0 contra o 60 e deu a mesma
   diferença de quadros vizinhos — o globo "girava" para um quadro idêntico. Só
   forma assimétrica na superfície resolve, e por isso entram os continentes.
2. **Elipse por meridiano é pior ainda**: a elipse do ângulo A e a do ângulo A+π
   são a mesma elipse, então o período cai para metade disso. Projete ponto a
   ponto.
3. **A MASK do BiRefNet marca o FUNDO, não o sujeito.** Sem `InvertMask` o
   recorte sai ao contrário — silhueta transparente sobre fundo opaco.
4. **`strength` do `LTXVImgToVideoInplace` é o freio do movimento.** 0,82 trava o
   quadro; 0,62 deixa a pessoa se mexer sem perder a identidade.
5. **`LTXVSeparateAVLatent` recebe `av_latent`**, não `latent`; e
   `LTXVEmptyLatentAudio` recebe `frames_number` + `audio_vae`. O 400 do ComfyUI
   traz o motivo no corpo da resposta — imprima antes de adivinhar.
6. **`nohup ... &` no Git Bash do Windows** falha ao criar o log mas **lança o
   processo assim mesmo**. Isso rodou um job duas vezes na mesma pasta; se a
   contagem de quadros vier o dobro do pedido, foi isso.
7. **O padrão de arquivo do ffmpeg**: o ComfyUI grava `<prefixo>_00001_.png` —
   são 10 caracteres no fim, não 9. Errar gera um padrão com um zero a mais e o
   ffmpeg sai com 4294967294 sem explicar.
8. **Não gaste bytes com CRF baixo.** Comparados os quadros de crf 34/36/38/40 no
   tamanho real de exibição (480 px), são indistinguíveis; 34 custa 40% mais.
