#!/bin/bash
# Converte os mp4 LTX do lote arcade_loops em WebM mudos ≤400KB (Liga B §10)
# e instala em public/portal/arcade/loops/<game>-0N.webm (16/07/2026).
set -e
SRC="/c/WORKS/ComfyUI/output/arcade_loops"
DST="$(dirname "$0")/../../public/portal/arcade/loops"
mkdir -p "$DST"
for game in monte-o-prompt verdade-ou-mito qual-prompt palpite-30s batalha-prompts caca-prompt; do
  for v in 01 02 03 04; do
    # ComfyUI numera _00001_; pega o mais recente do prefixo
    mp4=$(ls -t "$SRC/${game}-${v}"_*.mp4 2>/dev/null | head -1)
    if [ -z "$mp4" ]; then echo "FALTA ${game}-${v}"; continue; fi
    out="$DST/${game}-${v}.webm"
    ffmpeg -y -loglevel error -i "$mp4" -an -vf "scale=960:-2" -c:v libvpx-vp9 -b:v 0 -crf 44 "$out"
    size=$(stat -c%s "$out")
    if [ "$size" -gt 409600 ]; then
      ffmpeg -y -loglevel error -i "$mp4" -an -vf "scale=832:-2" -c:v libvpx-vp9 -b:v 0 -crf 47 "$out"
      size=$(stat -c%s "$out")
    fi
    echo "${game}-${v}.webm: $((size/1024))KB"
  done
done
echo CONVERSAO_OK
