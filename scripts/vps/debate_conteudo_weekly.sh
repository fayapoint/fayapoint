#!/usr/bin/env bash
# Debate semanal de conteúdo — cinco papéis com incentivos opostos discutem o
# que fazer com o catálogo, e o resultado sai como ações com número conferido.
#
# Semanal e não diário de propósito: a demanda do Radar se move em escala de
# semanas (o score mede posição no autocomplete), e um debate diário produziria
# a mesma lista sete vezes, treinando você a ignorar o canal.
#
# Custo medido em 02/08 com o deepseek v4 flash: US$ 0,0068 por rodada.
# Onze rodadas por dólar — não é o custo que limita a frequência, é a utilidade.
#
# Nunca derruba nada: sai 0 mesmo em falha, e loga.
set -uo pipefail

DIR=/root/kirmes/cursos
HOJE=$(date +%Y-%m-%d)
LOG=/root/kirmes/logs/debate_conteudo_$(date +%Y%m%d).log
mkdir -p /root/kirmes/logs "$DIR/relatorios" "$DIR/estado"

echo "[$(date '+%F %T')] Debate de conteudo — inicio" >> "$LOG"

(cd "$DIR" && node --env-file=/root/kirmes/.env.fayai debate.mjs --seo >> "$LOG" 2>&1)
CODIGO=$?

REL="$DIR/relatorios/debate_${HOJE}.md"
if [ $CODIGO -ne 0 ] || [ ! -s "$REL" ]; then
  echo "[$(date '+%F %T')] falhou (exit $CODIGO)" >> "$LOG"
  printf '%s' "**Debate de conteudo — FALHOU**
Exit $CODIGO, sem relatorio em \`$REL\`. Log: \`$LOG\`" | /root/kirmes/buzz_post.sh conteudo -
  exit 0
fi

# Só a parte de decisão vai para o canal; a discussão inteira (que é longa e
# fica dentro de um <details>) permanece no arquivo.
sed '/^<details>/,$d' "$REL" | head -c 12000 | /root/kirmes/buzz_post.sh conteudo -

echo "[$(date '+%F %T')] Fim — publicado no #conteudo" >> "$LOG"
exit 0
