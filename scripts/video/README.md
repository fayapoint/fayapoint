# Vídeo de abertura da `/radar` — pipeline local, custo zero

Como o plano em `public/radar/abertura.webm` foi feito, e como refazer.

## Por que assim

O rosto é uma **fotografia real animada**, não uma pessoa gerada. Em 25/07/2026
ficou medido que a geração local acerta o tipo físico do Ricardo e erra a
pessoa, e que treinar um LoRA nesta máquina é inviável (31 s/passagem, 4h+ por
treino, a 384 px — resolução que já perde pele e barba). Partindo de foto, o
rosto é ele **por construção**: verificado que se manteve idêntico do frame 0 ao
120.

Isso vale para **animar**. Se a tarefa exigir pose ou cenário novos, aí sim
volta a depender do LoRA que ele tem no Higgsfield.

O fundo é **desenhado em PIL, não gerado**. A paleta tem que ser exatamente a da
página (`#0c0e1d`, ouro `#f5c04e`, ciano `#38bdf8`, violeta `#a78bfa`) e geração
nunca acerta cor de marca na mosca — além de custar GPU e não ser reproduzível.

## Rodar

Com o ComfyUI de pé em `http://localhost:8000`:

```bash
python scripts/video/r9_recorte.py    # foto -> PNG com alpha (BiRefNet)
python scripts/video/r9_cena.py       # recorte + cena da marca -> quadro-fonte
python scripts/video/r9_video.py      # LTX 2.3 i2v -> 121 frames (~9 min)
python scripts/video/r9_encode.py "C:\WORKS\ComfyUI\output\r9_frames_v2"
```

O encode busca o maior CRF que ainda cabe em 400 KB (teto do
`IDENTIDADE_VISUAL.md`). O resultado atual: **101 KB** já no melhor CRF da
escala, 960×528, 4,84 s.

## Armadilhas que custaram tempo

1. **A MASK do BiRefNet marca o FUNDO, não o sujeito.** Sem `InvertMask` o
   recorte sai ao contrário — silhueta transparente sobre fundo opaco.
2. **Não peça movimento à varredura do radar.** A primeira versão do prompt
   trazia `radar sweep line turning` e `camera push in`; o LTX leu a linha fina
   como rastro de luz e, do frame 60 em diante, o fundo virou um emaranhado de
   fitas douradas que dominava o quadro. Câmera travada, globo parado, e
   `light trails, streaks, swirling ribbons` no prompt negativo.
3. **`LTXVSeparateAVLatent` recebe `av_latent`**, não `latent`; e
   `LTXVEmptyLatentAudio` recebe `frames_number` + `audio_vae`. O 400 do ComfyUI
   traz o motivo no corpo da resposta — imprima-o antes de adivinhar.
4. **`nohup ... &` no Git Bash do Windows** falha ao criar o log mas **lança o
   processo assim mesmo**. Isso rodou o job duas vezes na mesma pasta de saída;
   se a contagem de frames vier o dobro do pedido, foi isso.
5. **O padrão de arquivo do ffmpeg**: o ComfyUI grava `<prefixo>_00001_.png` —
   são 10 caracteres no fim (`00001_.png`), não 9. Errar isso gera um padrão com
   um zero a mais e o ffmpeg sai com 4294967294 sem explicar.
