#!/bin/bash
# Converte as ilustrações do curso (ComfyUI PNG → WebP ≤40KB) e instala em
# public/cursos/media/<slug>/cap-NN.webp (16/07/2026).
set -e
SLUG="${1:-chatgpt-zero}"
SRC="/c/WORKS/ComfyUI/output/course_media/$SLUG"
DST="$(dirname "$0")/../../public/cursos/media/$SLUG"
mkdir -p "$DST"
for n in $(seq -w 1 31); do
  png=$(ls -t "$SRC/cap-$n"_*.png 2>/dev/null | head -1)
  if [ -z "$png" ]; then echo "FALTA cap-$n"; continue; fi
  out="$DST/cap-$n.webp"
  ffmpeg -y -loglevel error -i "$png" -vf scale=768:-1 -quality 80 "$out"
  size=$(stat -c%s "$out")
  if [ "$size" -gt 40960 ]; then
    ffmpeg -y -loglevel error -i "$png" -vf scale=640:-1 -quality 72 "$out"
    size=$(stat -c%s "$out")
  fi
  echo "cap-$n.webp: $((size/1024))KB"
done
echo INSTALACAO_OK
