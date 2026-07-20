#!/bin/bash
# Auditoria de qualidade de curso FayAI — hermes via container kirmes.
# v1 14/07/2026 — espelha o padrão comprovado do tch_worldbuilding_loop.sh:
# hermes com caminho completo, -z one-shot, SEM --yolo, saída via /opt/data.
# Uso: course_quality_audit.sh [slug]   (sem slug = rotação: menos auditado)
LOG="/root/kirmes/logs/course_audit_$(date +%Y%m%d).log"
TODAY=$(date +%Y-%m-%d)

echo "[$(date '+%Y-%m-%d %H:%M')] Iniciando auditoria de curso..." >> "$LOG"

if ! docker ps | grep -q kirmes; then
  echo "[$(date)] ERRO: kirmes não rodando" >> "$LOG"
  exit 1
fi

SLUG=$(node /root/kirmes/course_audit_prepare.js "$1" 2>>"$LOG")
if [ -z "$SLUG" ]; then
  echo "[$(date)] ERRO: prepare falhou" >> "$LOG"
  exit 1
fi
echo "[$(date)] Curso escolhido: $SLUG" >> "$LOG"

TASK="Você é o auditor de qualidade de conteúdo da FayAI (escola brasileira de IA). Hoje é ${TODAY}.

O curso a auditar está em /opt/data/course-audit/${SLUG}/ :
- meta.json (título, ferramenta, nível, nº de aulas)
- outline.md (todos os módulos e aulas, com o arquivo de cada aula)
- lessons/*.md (o conteúdo integral de cada aula)

Sua missão: encontrar DESATUALIZAÇÃO e erros. Muitos cursos foram escritos em 2024/2025 e o mundo de IA mudou. Procure:
1. Modelos, versões, planos e preços antigos (ex.: GPT-4 quando já existe geração mais nova; limites/preços que mudaram)
2. Interfaces e passos de UI que não existem mais
3. Ferramentas/serviços descontinuados
4. Afirmações que eram verdade e deixaram de ser
5. Erros factuais ou didáticos graves

Método: leia meta.json e outline.md inteiros; depois leia as aulas — priorize as que mencionam versões, preços, planos, nomes de modelos e passos de interface (use grep para achá-las), mas cubra uma amostra representativa de TODOS os módulos.

REGRAS ANTI-RUÍDO (obrigatórias):
- Seu conhecimento tem data de corte anterior a ${TODAY}. Se uma aula cita um modelo/versão que você NÃO conhece (ex.: uma geração mais nova), isso NÃO é erro — modelos novos são lançados o tempo todo. Marque no máximo como 'VERIFICAR' em uma seção separada, nunca como problema.
- Os 10 problemas devem ser DISTINTOS entre si. Se o mesmo defeito se repete em muitas aulas, reporte UMA vez e liste as aulas afetadas nesse item único.
- Priorize problemas que você tem CERTEZA: serviços comprovadamente descontinuados, instruções contraditórias, erros conceituais, texto de processo interno vazado para o aluno, promessas falsas.

Escreva o relatório em /opt/data/course-audit/${SLUG}/${TODAY}_report.md com EXATAMENTE esta estrutura:
# Auditoria: [título do curso]
NOTA: X/10 (atualidade do conteúdo)
## Resumo executivo (3 frases honestas)
## Problemas encontrados (os 10 mais graves)
Para cada um: **Aula** (arquivo) · **Trecho problemático** (citação curta) · **Por que está errado/desatualizado em ${TODAY}** · **Correção proposta** (texto pronto para substituir)
## Aulas que precisam de reescrita completa (lista de arquivos + motivo em 1 linha)
## O que está BOM e deve ser preservado (3-5 pontos)

Seja específico e honesto — nota alta sem mérito é proibida. NUNCA invente trecho que não está nas aulas: cite apenas o que você leu."

HERMES_OUT="/root/kirmes/logs/hermes_stdout_${SLUG}_${TODAY}.txt"
docker exec kirmes /opt/hermes/.venv/bin/hermes -z "$TASK" 2>&1 | tee "$HERMES_OUT" >> "$LOG"
STATUS=${PIPESTATUS[0]}

# FIX 19/07/2026: hermes -z frequentemente IMPRIME o relatório completo em
# stdout mas não grava o arquivo em /opt/data/... como a instrução pede
# (bug pre-existente do hermes, não é falha de curso grande especificamente
# — reproduzido em make-integracao-total E chatgpt-masterclass, isolado).
# Fallback: se o arquivo esperado não existir, extrai do stdout capturado
# a partir da primeira linha que menciona "auditoria" e grava no lugar
# esperado antes do publish.
# FIX 19/07/2026 (lote de 14): o awk original só pegava "^# Auditoria:"
# (H1, no início da linha) — hermes às vezes usa "## Auditoria:" (H2),
# "AUDITORIA:" (caixa alta sem markdown) ou até gruda texto antes do "#"
# na mesma linha ("Now produce# Auditoria:"). Achados 3 casos reais no
# lote de 14 (claude-cowork-colaboracao, n8n-automacao-avancada,
# chatgpt-allowlisting) que geraram relatório completo e válido mas
# passaram batido pelo fallback antigo. grep -i sem âncora cobre os 3.
# NOTA: isso NÃO cobre os casos em que o hermes não produz relatório
# algum (responde só a saudação padrão, trava em loop repetindo a mesma
# frase, ou corta o raciocínio pela metade — bugs de confiabilidade do
# próprio hermes, sem "auditoria" no stdout p/ recuperar; esses exigem
# re-rodar o curso, não têm fallback de texto possível).
REPORT_PATH="/root/.hermes/course-audit/${SLUG}/${TODAY}_report.md"
if [ ! -f "$REPORT_PATH" ]; then
  FIRST_LINE=$(grep -in -m1 'auditoria' "$HERMES_OUT" | cut -d: -f1)
  if [ -n "$FIRST_LINE" ]; then
    tail -n "+${FIRST_LINE}" "$HERMES_OUT" > "$REPORT_PATH.tmp"
  fi
  if [ -s "$REPORT_PATH.tmp" ]; then
    mv "$REPORT_PATH.tmp" "$REPORT_PATH"
    echo "[$(date '+%Y-%m-%d %H:%M')] Fallback: relatório recuperado do stdout do hermes p/ $SLUG." >> "$LOG"
  else
    rm -f "$REPORT_PATH.tmp"
  fi
fi

if node /root/kirmes/course_audit_publish.js "$SLUG" "$TODAY" >> "$LOG" 2>&1; then
  MCSTATUS="success"
  MSG="Auditoria de $SLUG publicada no MC"
else
  MCSTATUS="failure"
  MSG="Falha: hermes exit=$STATUS, sem relatório ${TODAY}_*.md para $SLUG"
fi

curl -s -X POST "https://mc-faya-dashboard.netlify.app/api/activity/log" \
  -H "Content-Type: application/json" \
  -d "{\"agentId\":\"kirmes\",\"agentName\":\"Kirmes ⚡\",\"action\":\"Auditoria de qualidade de curso\",\"status\":\"$MCSTATUS\",\"notes\":\"$MSG — $TODAY\"}" > /dev/null 2>&1

echo "[$(date '+%Y-%m-%d %H:%M')] Fim ($MSG)." >> "$LOG"
[ "$MCSTATUS" = "success" ]
