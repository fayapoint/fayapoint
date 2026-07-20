#!/bin/bash
# Roda o auditor (ja corrigido 19/07) em lote pelos cursos que nunca foram
# auditados com a fonte certa, ou cuja ultima auditoria usou o
# fayapoint.courses (dado morto, contagem de "lessons" errada -- ver
# MASTERPLAN SESSAO 19/07). Pula os 4 recem-reescritos (ja sei que estao
# bons) e o sagrado ia-sem-filtro-por-claude.
SLUGS=(
  autoresearch-singularity
  chatgpt-allowlisting
  claude-cowork-colaboracao
  claude-ia-segura
  crie-agentes-de-ia-autonomos
  gemini-ia-google
  ia-producao
  leonardo-ai-criacao-visual
  make-integracao-total
  midjourney-arte-profissional
  n8n-automacao-avancada
  openclaw-ia-open-source
  perplexity-pesquisa-inteligente
  prompt-engineering
)
LOG="/root/kirmes/logs/batch_audit_$(date +%Y%m%d_%H%M).log"
echo "[$(date)] Lote de auditoria iniciado — ${#SLUGS[@]} cursos" >> "$LOG"
for slug in "${SLUGS[@]}"; do
  echo "[$(date)] === $slug ===" >> "$LOG"
  bash /root/kirmes/course_quality_audit.sh "$slug" >> "$LOG" 2>&1
done
echo "[$(date)] Lote concluido" >> "$LOG"
