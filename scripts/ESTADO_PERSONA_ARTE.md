# Arte dos presets da persona — estado da produção

**Pedido (Ricardo, 11/08/2026):** *"não quero emojis pequenos, quero letras mais
visíveis, uma imagem photorealista descrevendo o que perguntamos... em todas as
perguntas devemos ter imagens"* + *"devemos fazer pelo browser para ser
ilimitado, e crie vídeos também com o modelo ilimitado"*.

## Onde as coisas estão

| | |
|---|---|
| catálogo de opções | `src/lib/persona-presets.ts` (23 campos, **232 opções**) |
| fila de prompts | `scripts/fila_persona.json` — gerada por `node scripts/persona_prompts.mjs --json` |
| destino da arte | `public/portal/persona/opts/<campo-slug>-<valor-slug>.webp` |
| manifesto do que existe | `src/lib/persona-arte.ts` — gerado por `node scripts/persona_arte_manifesto.mjs` |
| quem desenha o ladrilho | `src/components/portal/PersonaDossie.tsx` → `Ladrilho` |

## A receita do grátis (confirmada em 11/08)

Aba de imagem: `higgsfield.ai/ai/image?model=nano-banana-pro` ·
**Nano Banana Pro · 4:3 · 1K · lote 1/4 · Unlimited ligado**.
O sinal confiável é o botão dizer **`Unlimited ✦`** — qualquer número cobra.

⚠️ **A proporção é 4:3, não 16:9** como nos cursos: o ladrilho é `aspect-[4/3]`
com `object-cover`, e 16:9 perde as laterais do enquadramento.

⚠️ **O editor de prompt não aceita injeção por JS.** `execCommand('insertText')`
e `ClipboardEvent` sintético foram testados: os dois retornam sem erro e **não
mudam nada**. Só teclado de verdade entra. O laço que funciona é um
`browser_batch` por imagem:

```
[click no prompt] → [ctrl+a] → [type <prompt>] → [click em Unlimited ✦]
```

## Andamento

- [x] Ladrilho maior (2/3 colunas), legenda 12.5px, emoji de queda 44px, véu de contraste
- [x] Manifesto gerado do disco no lugar da lista `CAMPOS_COM_ARTE` escrita à mão
- [x] 232 prompts montados
- [ ] Geração das 232 imagens  ← **em curso, ver contador abaixo**
- [ ] Download (`show_generations` → `rawUrl` → `cursos/baixar_midia.mjs`)
- [ ] `node scripts/persona_arte_manifesto.mjs` depois de cada lote
- [ ] Vídeos (Seedance Pro Fast, imagem→vídeo, `Generate Unlimited`)
- [ ] Deploy

## O laço de produção (siga exatamente esta ordem)

O teto da conta é **4 gerações simultâneas**, e **vídeo é 1 por vez**.
Vídeo demora muito mais que imagem, então **o slot de vídeo é o gargalo e nunca
pode ficar vazio** — Ricardo, 11/08: *"sempre priorizar o vídeo quando já
tivermos alguma imagem"*.

Cada volta:

1. **Vídeo primeiro.** Se `Processing` == 0 na aba de vídeo, submeta um vídeo
   ANTES de qualquer imagem. Clicar em Generate com outro vídeo rodando é
   **recusado em silêncio** — nada acontece, nenhum erro. Se o `Processing`
   continuar 0 depois do clique, foi isso.
2. **Encha as 3 vagas restantes com imagem** (3 submissões por `browser_batch`,
   sem screenshot — screenshot é o que mais custa contexto).
3. **Colha só no FIM, não a cada lote.** A geração fica guardada na conta do
   Higgsfield indefinidamente — nada se perde por não baixar agora. E cada
   `show_generations` devolve os prompts inteiros, então colher de dez em dez
   gasta a janela de contexto que deveria estar gerando. Gere tudo, colha uma
   vez. A ordem da galeria é do mais novo para o mais velho e casa com a ordem
   de submissão, que é o que amarra arquivo ↔ opção.
   Colheita barata alternativa (sem `show_generations`), lendo o DOM da galeria:

   ```js
   const s=new Set();
   document.querySelectorAll('img').forEach(i=>{
     const m=(i.currentSrc||i.src||'').match(/hf_\d{8}_\d{6}_[0-9a-f-]{36}/);
     if(m)s.add(m[0]);});
   [...s]
   ```

   O `rawUrl` se reconstrói: `https://d8j0ntlcm91z4.cloudfront.net/user_37ULog99RS6VlchaVmXKGoThnQH/<stem>.png`.
   ⚠️ A galeria é virtualizada: só aparece o que está renderizado — role antes.

4. Quando colher: montar
   `mapa_persona.json`, `node cursos/baixar_midia.mjs mapa_persona.json --gravar`,
   `node scripts/persona_arte_manifesto.mjs`.

Coordenadas (recalcule com JS se a janela mudar de tamanho — a escala do
screenshot **não** é a da página):

| | aba imagem (`191033136`) | aba vídeo (`191033139`) |
|---|---|---|
| prompt | `[677, 794]` | `[139, 410]` |
| Generate | `[1060, 836]` | `[140, 657]` |

Trocar o quadro do vídeo: **hover na miniatura → `×` em `[195,192]` → `Ctrl+V`**
(com a imagem no clipboard via PowerShell). **Nunca clicar na área vazia** — ver
o skill: abre caixa nativa e trava a sessão.

### Livro-caixa da submissão (ordem exata — é o que amarra arquivo ↔ opção)

A galeria devolve do mais novo para o mais velho. Esta lista é do mais VELHO
para o mais novo, já sem as 10 baixadas.

`identidade.papel`: criador de conteúdo · profissional de tecnologia ·
estudante · quem ajuda outros negócios *(estas 4 não apareceram na 1ª colheita
— confira se voltaram ou refaça)*
`identidade.marca`: uso o meu próprio nome *(refeita: a 1ª caiu no filtro NSFW;
a boa é a das mãos amarrando fita numa embalagem de papel kraft)*
`identidade.cidade` (12, nesta ordem): São Paulo · Rio de Janeiro · Curitiba ·
Belo Horizonte · Florianópolis · Recife · Fortaleza · Salvador · Brasília ·
Goiânia · Porto Alegre · Interior do meu estado
`identidade.missao` (8/8, nesta ordem): ferramentas das grandes empresas ·
cansei de ver gente perdendo tempo · passei pela mesma dificuldade ·
sustentar a família com liberdade · odeio trabalho mal feito ·
meu ofício sobreviver à mudança · explicar sem enrolar ·
abrir a porta que ninguém abriu
`identidade.valores`: **7 de 14**, nesta ordem — Honestidade no preço ·
Cumprir prazo · Falar simples · Não prometer o que não entrego ·
Atender bem quem paga pouco · Mostrar o processo, não só o resultado ·
Estudar antes de opinar
…e mais 3: Tratar cliente como gente, não como número · Transparência total nos
números · Nunca falar mal de concorrente — **10 de 14**.
**RETOMAR EM:** `identidade.valores` a partir de **"Testar antes de
recomendar"**, e daí em diante na ordem de `fila_persona.json`.

### Vídeos (Seedance Pro Fast, ilimitado)
1. oficina — mulher ensinando o rapaz  ✅
2. embalando encomendas em casa  ✅
3. apresentação no escritório  ✅
4. consultório recebendo paciente  ⏳
Destino pretendido: cabeçalho das 6 seções da persona. Ainda **não baixados
nem ligados no código**.

### Contador
**10 de 232 no disco** (`identidade.papel` inteiro menos 3, `identidade.marca` 2 de 3).
Enfileiradas e ainda não colhidas: criador de conteúdo, profissional de
tecnologia, estudante, quem ajuda outros negócios, São Paulo.

## Vídeo — a receita, e o que ela NÃO é (11/08)

Aba: `higgsfield.ai/ai/video` · **Seedance Pro Fast · 5s · 720p**.
`Unlimited mode` ligado → o botão diz **`Generate Unlimited`**, sem contador.
O quadro inicial é obrigatório.

⚠️⚠️ **O modelo é `Seedance Pro Fast`, e ele NÃO está na lista em destaque** —
só aparece digitando "Pro Fast" na busca do seletor. Eu caí em
`Seedance 2.0 Fast`, que tem nome quase igual e é outra coisa: nele o
`Unlimited mode` **não liga, abre um paywall** de US$ 65 a US$ 293, e o único
grátis é um toggle `Use free gens` com contador de 13. Ricardo corrigiu na
hora. **Confirme sempre no rótulo do botão: `Generate Unlimited` é o certo;
`Generate free … Free` significa que você está no modelo errado, gastando
franquia.**

⚠️ Trocar de modelo **limpa a imagem de referência** — reanexe o quadro depois
de escolher o modelo, nunca antes.

⚠️ **Não precisa de upload nem de caixa de diálogo.** O seletor de mídia tem
uma aba **`Image Generations`** com tudo que já foi gerado na conta — o quadro
inicial sai dali. `Ctrl+V` com a imagem no clipboard também funciona (entra
como upload e passa por verificação), mas a aba é mais direta e não espera.

⚠️ **O painel esquerdo inteiro fica com `pointer-events: none` enquanto
qualquer modal está aberto.** Clique que "não faz nada" quase sempre é isso, e
não coordenada errada — confira com
`getComputedStyle(el).pointerEvents` antes de recalcular coordenada.

## O que já custou caro (não repita)

1. **`show_generations` com `size: 20` devolve os prompts inteiros** — dezenas de
   milhares de tokens numa chamada. Colha com `size` pequeno, e só no fim do
   lote.
2. **O filtro NSFW barra sem motivo aparente** e devolve o crédito: a foto de
   mãos assinando o próprio nome numa embalagem foi recusada. Refazer com outra
   redação, não insistir na mesma.
3. **O teto de concorrência é 4** (Ricardo, 11/08). O certo é **2 imagens + 2
   vídeos** em voo; submeter mais só engorda a fila e atrapalha o revezamento.
