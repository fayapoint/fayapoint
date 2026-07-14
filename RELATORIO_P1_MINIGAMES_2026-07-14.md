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

### Expansão visual ComfyUI — concluída em 14/07/2026

- 48 cenas exclusivas geradas localmente com Qwen Image 2512 + Lightning: **8 variações para cada um dos 6 minigames**.
- Resolução de origem web: 960×544 em WebP, com 2,17 MB no conjunto completo (média aproximada de 45 KB por imagem).
- Seis loops de movimento em VP9/WebM, um por minigame, 640×360 e oito segundos, com 1,87 MB no conjunto completo (média aproximada de 312 KB por vídeo).
- Cada visita escolhe uma cena diferente da última registrada para aquele jogo; passar o mouse avança novamente a imagem e revela o loop.
- Vídeos usam carregamento sob demanda. Usuários com “reduzir movimento” veem somente as imagens estáticas.
- Ao abrir um jogo, o loop correspondente vira o cabeçalho visual da experiência.
- Hero e banner do Arcade também sorteiam um dos seis universos visuais sem repetição imediata.
- Prompts, seeds e destinos estão registrados em `scripts/arcade/arcade-visual-manifest.json` e no relatório de geração junto aos ativos.
- Cliente ComfyUI reutilizável e validado em `pinokio_agent/skills/local/comfyui`, sem porta, caminho local ou segredo fixado no skill.

A meta aprovada nesta expansão foi de oito universos visuais rotativos por minigame. As 30 afirmações de Verdade ou Mito continuam pedagogicamente únicas e passam a compartilhar esse banco visual rotativo, evitando inflar o carregamento com 30 artes que não mudariam a mecânica.

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
- Inspeção em mosaico das 48 cenas: aprovada, com diferenciação clara entre jogos e entre variações.
- Contagem de ativos: 48/48 WebP e 6/6 WebM; fila final do ComfyUI vazia e sem erro.
- Cliente visual do Arcade: TypeScript e ESLint aprovados.
- Conta técnica: removida.
- Assinaturas, pagamentos, pedidos, recibos e certificados técnicos: zero.

## 7. Continuação recomendada

1. Monitorar em produção a taxa de abertura dos jogos e o custo de banda dos loops carregados sob demanda.
2. Corrigir o desafio diário ainda exibido em inglês no portal.
3. Continuar o plano integrado pelos próximos itens ainda abertos, sem reabrir P1, P2 e P3 já entregues.
4. Manter P4.2 para um novo teste de pagamento real de baixo valor quando houver saldo e decisão explícita sobre estorno.
