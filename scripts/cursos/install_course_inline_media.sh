#!/bin/bash
# Instala TODA a midia inline do chatgpt-zero (Leitura 2.0, 17/07/2026):
# caps 02-30 — imagens PNG -> WebP <=80KB, videos mp4 -> WebM mudos <=400KB.
# (cap-01 = piloto, ja instalado). Destino: public/cursos/media/chatgpt-zero/inline/
set -e
SRC="/c/WORKS/ComfyUI/output/course_media/chatgpt-zero/inline"
DST="$(dirname "$0")/../../public/cursos/media/chatgpt-zero/inline"
mkdir -p "$DST"
faltas=0

for cap in $(seq -w 2 30); do
  for slot in sistema intencao fluxo cenario validacao dica; do
    name="cap${cap}-${slot}"
    png=$(ls -t "$SRC/${name}"_*.png 2>/dev/null | head -1)
    if [ -z "$png" ]; then echo "FALTA $name.png"; faltas=$((faltas+1)); continue; fi
    out="$DST/${name}.webp"
    if [ ! -f "$out" ]; then
      ffmpeg -y -loglevel error -i "$png" -vf scale=960:-1 -quality 82 "$out"
      size=$(stat -c%s "$out")
      if [ "$size" -gt 81920 ]; then
        ffmpeg -y -loglevel error -i "$png" -vf scale=768:-1 -quality 75 "$out"
      fi
    fi
  done
  for slot in fluxo dica; do
    name="cap${cap}-${slot}"
    mp4=$(ls -t "$SRC/${name}-video"_*.mp4 2>/dev/null | head -1)
    if [ -z "$mp4" ]; then echo "FALTA $name-video.mp4"; faltas=$((faltas+1)); continue; fi
    out="$DST/${name}.webm"
    if [ ! -f "$out" ]; then
      ffmpeg -y -loglevel error -i "$mp4" -an -vf "scale=960:-2" -c:v libvpx-vp9 -b:v 0 -crf 44 "$out"
      size=$(stat -c%s "$out")
      if [ "$size" -gt 409600 ]; then
        ffmpeg -y -loglevel error -i "$mp4" -an -vf "scale=832:-2" -c:v libvpx-vp9 -b:v 0 -crf 47 "$out"
      fi
    fi
  done
done

total=$(ls "$DST" | wc -l)
echo "INSTALACAO_OK — $total arquivos em public/ — faltas: $faltas"
