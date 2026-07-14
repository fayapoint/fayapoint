# Relatório de Entrega — P2 Desafios Renascidos

**Data:** 14/07/2026  
**Escopo:** explicar, conduzir à ação e celebrar

## 1. Resultado executivo

A área de Desafios deixou de ser um painel de texto sem direção. Cada tipo de desafio diário agora recebe título em português, arte contextual, explicação curta, três passos executáveis e um CTA que leva à área correta do portal.

## 2. Entregas

- Biblioteca editorial para oito tipos de desafio.
- Tradução de `study_1h` e demais descrições por ID canônico, sem depender do texto inglês da API.
- Arte contextual por família de ação: cursos, Studio, ferramentas e compartilhamento.
- “Como fazer” em três passos para cada desafio.
- CTA funcional para Cursos, Studio AI ou Recursos.
- Dashboard compacto também usa a descrição traduzida.
- Celebração com confete no estado concluído.
- Calendário de atividade com chamas nos dias ativos.
- Streak freeze renomeado como “proteção de sequência” e explicado em linguagem simples.
- Missão semanal usa a barra de progresso real da meta semanal em vez de ficar sempre em zero.
- O conteúdo volta ao topo automaticamente ao trocar de seção, inclusive no celular.

## 3. Integridade comercial adicional

O teste do CTA encontrou microcopy antiga de US$1 ainda presente na biblioteca, home, cards e página de preços. Todos os rótulos da promoção mensal foram alinhados para “curso grátis do mês”, “GRÁTIS” ou “R$0”. A infraestrutura antiga de câmbio permanece isolada, mas não é mais usada para apresentar ou cobrar a promoção.

## 4. QA

- TypeScript: aprovado.
- ESLint do escopo: zero erros; avisos preexistentes no shell do portal.
- Desktop: card diário, calendário, proteção e CTA aprovados.
- Mobile 390×844: layout e retorno ao topo aprovados.
- CTA “Abrir curso em andamento”: abriu `Meus Cursos`.
- Biblioteca: ChatGPT do Zero exibido como grátis em todos os pontos verificados.
- Console dos fluxos: zero erros.
- Conta técnica: removida; nenhum progresso, assinatura, pagamento, pedido, recibo ou certificado relacionado.

## 5. Próximo passo

O P3 deve transformar Certificados em um ativo de orgulho e compartilhamento: moldura por curso, página pública de verificação com hero e CTA do LinkedIn, e estado vazio inspirador no portal.
