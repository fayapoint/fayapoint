# Arcade da IA — Backlog de Minigames

*13/07/2026. Pesquisa de mecânicas que ensinam habilidades REAIS de IA jogando (gamificação honesta: sem XP fake, recompensa = habilidade + prompt/resultado utilizável). Vivos: Monte o Prompt, Verdade ou Mito, Qual Prompt Gerou Isto. Cada jogo novo ganha arte própria no ComfyUI (receitas §9/§10 da IDENTIDADE_VISUAL).*

## Prontos para construir (mecânica validada, dados fáceis)

1. **Batalha de Prompts** *(card já no ar, CONSTRUINDO)* — duas versões de prompt para a mesma tarefa; o jogador vota na melhor e vê o PORQUÊ (specificidade, contexto, formato). Ensina: crítica de prompt. Assets: pares de prompt + resultado real gerado.
2. **Caça ao Prompt Perdido** *(card já no ar, CONSTRUINDO)* — imagem final + prompt com 3 lacunas; arraste as peças certas (estilo? luz? cor?) para os buracos. Ensina: anatomia do prompt. Mecânica drag-drop (Framer Motion Reorder).
3. **Detector de IA** — foto real vs. imagem gerada, lado a lado: qual é a IA? Com dica do detalhe que entrega (mãos, texturas, texto). Ensina: olhar crítico contra deepfake. Assets: pares foto real (Unsplash-like própria) + gerada.
4. **Conserte o Prompt** — um prompt ruim ("faz um logo bonito") e 4 melhorias candidatas; escolha as 2 que mais elevam o resultado; mostra antes/depois REAL gerado. Ensina: iteração.
5. **Tradutor de Robô** — a IA respondeu com jargão; escolha a pergunta de follow-up que destrava a resposta simples. Ensina: conversa iterativa.

## Segunda leva (precisam de conteúdo/infra leve)

6. **Corrida do Cardápio** — 60s: monte o pedido perfeito para a IA (ingredientes → restrições → formato) antes do tempo acabar. Ensina: estrutura rápida de pedido. Timer + confete.
7. **Bingo da Automação** — cartela de tarefas do dia a dia; marque as que a IA já faz hoje; cada acerto abre um mini-tutorial de 2 linhas. Ensina: repertório de usos.
8. **Alucinação ou Fato?** — resposta de IA com 1 erro plantado; encontre a frase alucinada. Ensina: verificação. (Conteúdo curado à mão, nunca gerado às cegas.)
9. **Escada de Níveis** — o mesmo pedido em 4 níveis de prompt (péssimo→ótimo) embaralhados; ordene do pior ao melhor. Ensina: percepção de qualidade.
10. **Memória das Ferramentas** — jogo da memória: carta da tarefa ↔ carta da ferramenta certa (transcrever↔gravador+IA, música↔gerador de áudio...). Ensina: mapa de ferramentas.

## Épicos (integração com Studio/backend — XP real)

11. **Arena de Criação** — desafio semanal: todos geram no Studio com o mesmo tema; galeria + votos da comunidade; vencedor destaque no ranking. (Usa /api/ai/generate-image + votos; XP real via backend.)
12. **Modo História: O Estagiário Robô** — narrativa em capítulos onde você "treina" um robô estagiário dando instruções (prompts) que mudam o rumo; capítulos desbloqueiam com a trilha. (Cenas em camadas Liga A §10, uma por capítulo.)

## Regras de produção
- 1 arte 3:2 por jogo (vetor mágico, cor própria) + cenas internas quando a mecânica pedir; tudo WebP ≤40KB.
- Animação: Framer Motion para feedback (flash acerto/erro, confete, float); vídeo-loop LTX só no hero do Arcade se um dia valer os ~400KB.
- Sem placar falso, sem "outros jogadores" simulados; XP só quando o backend registrar de verdade (épicos 11-12).
