# Relatório de Entrega — P0, Reprecificação e Asaas

**Data:** 14/07/2026  
**Produção:** [fayai.com.br](https://fayai.com.br)  
**Commits principais:** `cef055d`, `02cb126`, `7a7f6b7`, `c39195d`, `650bb59`

## 1. Resultado executivo

A FayAi passou a respeitar o progresso do aluno logado, eliminou preços inválidos do catálogo e ganhou um fluxo de cobrança recorrente funcional e testado em produção. O checkout agora resolve todos os valores no servidor, o Asaas está personalizado com a identidade FayAi e nenhum artefato financeiro de teste ficou ativo.

## 2. P0 — XP do aluno logado

- A home autenticada mostra o XP real e o nível da conta.
- Cada exemplo jogado credita XP imediatamente por API autenticada e idempotente.
- Repetições entram em modo treino e não permitem cultivo artificial de XP.
- Progresso pendente da jornada anônima é resgatado ao abrir a home autenticada.
- A faixa “Continuar minha trilha” exibe o avanço real do aluno.
- O fluxo anônimo original foi preservado.

### Aceite comprovado

- Conta de teste: `18.710 → +75 → 18.785 XP`.
- Portal refletiu o novo valor sem atualização manual.
- Nova tentativa no mesmo exemplo retornou `already-credited`.

## 3. Catálogo e reprecificação

### Estado final

| Faixa | Quantidade | Exemplos |
|---:|---:|---|
| R$ 29 | 3 | ChatGPT do Zero, IA no Dia a Dia, Primeiras Automações |
| R$ 49 | 2 | IA Sem Filtro, Prompt Engineering |
| R$ 79 | 9 | Gemini, Claude, Leonardo, Make, Midjourney, Perplexity e outros |
| R$ 99 | 2 | Automação n8n, Claude Cowork |
| R$ 149 | 4 | Masterclass, RAG, Agentes, IA em Produção |
| R$ 199 | 1 | n8n Sem Limites |

**Total:** 21 cursos ativos; nenhum com preço zero ou negativo.

### Produtos retirados

- Banana Dev — plataforma encerrada e risco de credibilidade.
- Mastering AI with ChatGPT — produto órfão em inglês.
- Perplexity fino — duplicata do curso principal.
- Midjourney Masterclass — duplicata de Arte Profissional.

Os quatro produtos foram retirados da loja e os respectivos cursos, antes ainda marcados como publicados, foram reconciliados para `archived` em `fayapoint.courses`.

### Curso grátis do mês

- Override de julho: **ChatGPT do Zero**.
- API e página de cursos foram blindadas para não quebrar quando o curso sorteado não for um produto ativo.
- Portal, vitrine e página do curso agora mostram **GRÁTIS / R$ 0**, sem a oferta antiga de US$1.
- O catálogo estático do portal foi alinhado ao produto ativo, eliminando o fallback incorreto para Perplexity.
- O CTA do curso gratuito matricula diretamente pela API e nunca cria item de carrinho, pagamento ou cobrança no Asaas.

## 4. Integridade de preços

- Valores de cursos são carregados de `fayapointProdutos.products.pricing.price` no servidor.
- Valores de serviços são carregados de `products_prices` no servidor.
- Valores de planos têm fonte única em `TIER_CONFIGS`.
- Campos de preço enviados pelo navegador servem apenas para detectar carrinho desatualizado.
- O desconto de assinante de 10%, 20% ou 50% agora é realmente aplicado no servidor.
- O mesmo cálculo vale para Asaas, Mercado Pago e pedidos locais.
- A promessa incorreta de 5% de desconto em boleto foi removida.
- A tabela antiga R$57/R$97/R$167 por nível de curso, conflitante com o catálogo individual, foi eliminada.

## 5. Asaas e assinaturas

### Configuração

- Nova chave de produção validada e instalada na Netlify.
- Webhook de produção: `https://fayai.com.br/api/payments/webhook`.
- Token do webhook obrigatório e comparação segura.
- Identidade habilitada: fundo `#0c0e1d`, destaque `#f5c04e` e logotipo FayAi.
- Ativo do logotipo versionado em `public/brand/fayai-invoice-logo.*`.

### Correções do fluxo

- Planos mensal/anual calculados exclusivamente pelo catálogo do servidor.
- PIX, boleto e cartão validados como formas aceitas.
- Primeira cobrança de assinatura consultada com retentativa curta, pois o Asaas a gera de forma assíncrona.
- Linha digitável e código de barras obtidos pelo endpoint oficial de identificação do boleto.
- Checkout acompanha uma assinatura pelo endpoint correto, não pelo modelo de pagamento avulso.
- Webhook reconhece a assinatura pelo ID do Asaas e mantém compatibilidade com referências antigas.
- Confirmação idempotente: o mesmo pagamento não duplica total pago, recibo ou ativação.
- Criação de uma segunda assinatura ativa ou pendente foi bloqueada.
- Registro local obsoleto só é reconciliado após resposta inequívoca do Asaas; erro temporário não autoriza nova cobrança.
- Cancelar uma assinatura antiga não remove um plano mais novo do usuário.
- O schema do usuário passou a armazenar corretamente `pending`, `expired` e `pendingPlan`.

## 6. Testes executados

### Gateway direto

1. Cliente temporário criado.
2. Assinatura mensal de boleto por R$57 criada.
3. Primeira cobrança encontrada.
4. URL do boleto obtida.
5. Linha digitável obtida.
6. Cobrança, assinatura e cliente apagados.

### E2E pelo fayai.com.br

1. Usuário técnico temporário criado pelo endpoint real de cadastro.
2. `POST /api/subscriptions` executado com plano Explorador mensal.
3. Valor canônico retornado: R$57.
4. Boleto e linha digitável retornados pelo site.
5. `GET /api/subscriptions/{id}` respondeu HTTP 200.
6. Cobrança, assinatura, cliente e os dois documentos Mongo de teste foram removidos.

### Verificações finais

- Cobranças pendentes no Asaas: **0**.
- Cobranças vencidas: **0**.
- Assinaturas de teste ativas: **0**.
- Clientes técnicos restantes: **0**.
- Catálogo público: 21 cursos, 0 preços inválidos e 0 cursos arquivados visíveis.
- Checkout e página de preços: HTTP 200.
- Endpoint de assinatura sem autenticação: HTTP 401.
- TypeScript: aprovado.
- Build Next.js de produção: aprovado.
- Deploy Netlify do commit `650bb59`: `ready`.
- Teste adicional do curso grátis: matrícula promocional criada e curso aberto sem carrinho, pedido, assinatura, pagamento ou recibo.
- Conta e progresso técnicos desse teste: removidos; verificação final com contagem zero em todas as coleções relacionadas.

## 7. Movimentação histórica preservada

O Pix de R$5,75 já recebido de Nancy não é uma cobrança aberta e não foi estornado. Estorno é uma nova movimentação financeira e a conta apresentava saldo negativo; deve ser tratado separadamente e com saldo disponível.

## 8. Próxima fase

O próximo item do handoff mestre é **P1 — Minigames 2.0**:

1. bancos de conteúdo e rotação sem repetição;
2. vocabulário de IA ensinado em cada rodada;
3. Batalha de Prompts e Caça ao Prompt Perdido;
4. ilustrações contextuais e mix vetor + fotografia;
5. celebração comum e hero leve do Arcade.
