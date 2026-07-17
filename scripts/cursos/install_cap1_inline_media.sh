#!/bin/bash
# Instala a midia inline do piloto cap.1 (Leitura 2.0, 17/07/2026):
# imagens PNG -> WebP <=80KB, videos mp4 -> WebM mudos <=400KB + poster.
# Destino: public/cursos/media/chatgpt-zero/inline/
set -e
SRC="/c/WORKS/ComfyUI/output/course_media/chatgpt-zero/inline"
DST="$(dirname "$0")/../../public/cursos/media/chatgpt-zero/inline"
mkdir -p "$DST"

for name in cap01-sistema cap01-intencao cap01-fluxo cap01-planos cap01-validacao cap01-checklist; do
  png=$(ls -t "$SRC/${name}"_*.png 2>/dev/null | head -1)
  if [ -z "$png" ]; then echo "FALTA $name"; continue; fi
  out="$DST/${name}.webp"
  ffmpeg -y -loglevel error -i "$png" -vf scale=960:-1 -quality 82 "$out"
  size=$(stat -c%s "$out")
  if [ "$size" -gt 81920 ]; then
    ffmpeg -y -loglevel error -i "$png" -vf scale=768:-1 -quality 75 "$out"
    size=$(stat -c%s "$out")
  fi
  echo "${name}.webp: $((size/1024))KB"
done

for name in cap01-fluxo cap01-checklist; do
  mp4=$(ls -t "$SRC/${name}-video"_*.mp4 2>/dev/null | head -1)
  if [ -z "$mp4" ]; then echo "FALTA ${name}-video"; continue; fi
  out="$DST/${name}.webm"
  ffmpeg -y -loglevel error -i "$mp4" -an -vf "scale=960:-2" -c:v libvpx-vp9 -b:v 0 -crf 44 "$out"
  size=$(stat -c%s "$out")
  if [ "$size" -gt 409600 ]; then
    ffmpeg -y -loglevel error -i "$mp4" -an -vf "scale=832:-2" -c:v libvpx-vp9 -b:v 0 -crf 47 "$out"
    size=$(stat -c%s "$out")
  fi
  echo "${name}.webm: $((size/1024))KB"
done
echo INSTALACAO_OK
