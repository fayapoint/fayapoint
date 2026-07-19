#!/bin/bash
# Instala midia inline (Leitura 2.0) de QUALQUER curso — imagens PNG -> WebP
# <=80KB, videos mp4 -> WebM mudos <=400KB. Idempotente (pula o que ja existe).
# Uso: ./install_course_inline_media.sh <slug>
set -e
SLUG="$1"
if [ -z "$SLUG" ]; then echo "Uso: $0 <slug>"; exit 1; fi
SRC="/c/WORKS/ComfyUI/output/course_media/${SLUG}/inline"
DST="$(dirname "$0")/../../public/cursos/media/${SLUG}/inline"
mkdir -p "$DST"
faltas=0

for cap in $(seq -w 1 30); do
  for slot in sistema intencao fluxo cenario validacao dica; do
    name="cap${cap}-${slot}"
    out="$DST/${name}.webp"
    if [ -f "$out" ]; then continue; fi
    png=$(ls -t "$SRC/${name}"_*.png 2>/dev/null | head -1)
    if [ -z "$png" ]; then echo "FALTA $name.png"; faltas=$((faltas+1)); continue; fi
    ffmpeg -y -loglevel error -i "$png" -vf scale=960:-1 -quality 82 "$out"
    size=$(stat -c%s "$out")
    if [ "$size" -gt 81920 ]; then
      ffmpeg -y -loglevel error -i "$png" -vf scale=768:-1 -quality 75 "$out"
    fi
  done
  for slot in fluxo dica; do
    name="cap${cap}-${slot}"
    out="$DST/${name}.webm"
    if [ -f "$out" ]; then continue; fi
    mp4=$(ls -t "$SRC/${name}-video"_*.mp4 2>/dev/null | head -1)
    if [ -z "$mp4" ]; then echo "FALTA $name-video.mp4"; faltas=$((faltas+1)); continue; fi
    ffmpeg -y -loglevel error -i "$mp4" -an -vf "scale=960:-2" -c:v libvpx-vp9 -b:v 0 -crf 44 "$out"
    size=$(stat -c%s "$out")
    if [ "$size" -gt 409600 ]; then
      ffmpeg -y -loglevel error -i "$mp4" -an -vf "scale=832:-2" -c:v libvpx-vp9 -b:v 0 -crf 47 "$out"
    fi
  done
done

total=$(ls "$DST" | wc -l)
echo "INSTALACAO_OK ${SLUG} — $total arquivos em public/ — faltas: $faltas"
