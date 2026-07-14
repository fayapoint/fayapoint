# Relatório de Entrega — P1 Minigames 2.0

**Data:** 14/07/2026  
**Escopo desta entrega:** núcleo funcional, conteúdo, aprendizagem e primeira camada visual

## 1. Resultado executivo

O Arcade da IA passou de três experiências curtas para cinco minigames funcionais, com conteúdo rotativo, feedback pedagógico, vocabulário contextual e comportamento responsivo. Nenhum jogo exibe XP fictício: quando há crédito, ele passa pelo sistema real do portal.

## 2. Minigames entregues

### Monte o Prompt

- Conteúdo extraído para banco próprio.
- Cinco ingredientes, cada um com seis alternativas.
- Botão “Surpreenda-me” para montar uma combinação completa.
- Vocabulário contextual por ingrediente.

### Verdade ou Mito?

- Banco com 30 afirmações.
- Dez cartas únicas por sessão.
- Histórico local evita repetição até o banco ser percorrido.
- Explicação e termo de IA após cada resposta.

### Qual Prompt Gerou Isto?

- Banco com 15 desafios visuais.
- Dez desafios únicos por sessão.
- Pista, explicação da receita e vocabulário após a escolha.

### Batalha de Prompts

- Novo minigame, com dez duelos editoriais.
- Cinco batalhas por sessão.
- O aluno escolhe o melhor prompt e aprende o critério objetivo da vitória.

### Caça ao Prompt Perdido

- Novo minigame, com dez caçadas.
- Cinco desafios por sessão.
- Seleção de peças e reordenação por arrastar.
- Correção, possibilidade de nova tentativa e explicação pedagógica.

## 3. Sistema compartilhado

- Embaralhamento sem repetição com memória em `localStorage`.
- Reciclagem automática somente depois de esgotar os itens inéditos.
- Componente comum de vocabulário com definição expansível.
- Link direto para o termo correspondente no Glossário FayAi.
- Celebração comum com confetes, sem prometer recompensa inexistente.
- Glossário ampliado com termos usados pelos jogos em português e cobertura principal em inglês.

## 4. Camada visual

- Hero do Arcade mistura fotografia real e ilustração vetorial no mesmo quadro.
- Regra de composição registrada na seção 12 de `IDENTIDADE_VISUAL.md`.
- Cards mantêm identidade visual própria e arte contextual.
- Layout aprovado em 1440×1000 e 390×844.

### Pendente visual conhecido

A coleção exclusiva de uma arte inédita para cada uma das 30 cartas de Verdade ou Mito e o vídeo hero leve ainda não foram produzidos. Nesta entrega, as cartas reutilizam ativos contextuais já aprovados. Isso não bloqueia o jogo, mas permanece como acabamento visual do P1.

## 5. Correção comercial encontrada durante o P1

- A API apontava ChatGPT do Zero como curso grátis de julho, mas o portal estático não conhecia o slug e mostrava Perplexity.
- Superfícies antigas ainda falavam em US$1 apesar de a matrícula promocional ser gratuita.
- Portal, home, catálogo e página do curso foram alinhados para **GRÁTIS / R$ 0**.
- CTA gratuito agora chama a matrícula diretamente, sem carrinho e sem gateway.

## 6. QA executado

- TypeScript: aprovado.
- ESLint do escopo: zero erros; apenas avisos antigos de diretivas redundantes.
- Build Next.js de produção: aprovado, 397 páginas estáticas geradas.
- Navegador: Arcade desktop e mobile aprovados.
- Batalha de Prompts: resposta, critério e vocabulário aprovados.
- Caça ao Prompt: seleção, ordenação, correção e vocabulário aprovados.
- Curso grátis: R$0, matrícula promocional e abertura do conteúdo aprovados.
- Console dos fluxos principais: zero erros.
- Conta técnica: removida.
- Assinaturas, pagamentos, pedidos, recibos e certificados técnicos: zero.

## 7. Continuação recomendada

1. Finalizar o acabamento visual do P1 com 30 artes exclusivas e vídeo hero otimizado.
2. Corrigir o desafio diário ainda exibido em inglês no portal.
3. Iniciar P2 do handoff mestre com auditoria de localização, microcopy e navegação do portal.
4. Manter P4.2 para um novo teste de pagamento real de baixo valor quando houver saldo e decisão explícita sobre estorno.
