/**
 * O roteamento da OpenRouter: QUEM serve o modelo, e como pedir o desconto de
 * entrada repetida.
 *
 * ── Por que isto existe ───────────────────────────────────────────────────────
 *
 * Um modelo tem um nome; o preço tem um DONO. `deepseek-v4-flash` é servido por
 * 22 provedores, e o próprio DeepSeek é só um deles — o mais caro entre os
 * grandes, aliás. Sem `provider.order` a OpenRouter escolhe sozinha, e a
 * diferença entre a primeira e a segunda colocada é de 44%. Essa troca não dá
 * erro, não aparece em log e não muda uma linha de resposta: aparece na fatura,
 * um mês depois.
 *
 * A ordem e os motivos moram em `config/openrouter-roteamento.json`, num lugar
 * só, porque os scripts de tradução e de escrita de curso leem o MESMO arquivo.
 * Constante repetida em três lugares é a forma garantida de um deles ficar para
 * trás.
 */
import roteamento from "../../../config/openrouter-roteamento.json";

export const CACHE_LIGADO: boolean = roteamento.cache.ligado;

type OrdemPorModelo = Record<string, { ordem: string[]; cacheEntrada: number }>;

/**
 * O bloco `provider` do corpo do pedido, para o modelo pedido.
 *
 * ⚠️ **A ordem é POR MODELO, e essa é a parte que engana.** A prateleira de
 * provedores muda de modelo para modelo e muda de posição: a DeepInfra é a
 * mais barata do Flash (0,09 contra 0,13 da segunda) e a nona mais cara do Pro
 * (1,30 contra 0,42 da Baidu). Uma ordem única "fixa o provedor" com a mesma
 * linha de código e transforma economia em prejuízo de 3× no tier premium.
 *
 * O casamento é por PEDAÇO do id porque o id vem em três formas — com alias
 * (`~deepseek/deepseek-v4-flash-latest`), com build fixado
 * (`deepseek/deepseek-v4-flash-0731`) e limpo. Todas apontam para a mesma
 * prateleira.
 */
export function preferenciaDeProvedor(modelo: string) {
  const porModelo = roteamento.ordemPorModelo as OrdemPorModelo;
  const achado = Object.keys(porModelo).find((chave) => modelo.includes(chave));
  return {
    order: achado ? porModelo[achado].ordem : roteamento.ordemPadrao,
    allow_fallbacks: roteamento.permitirQueda,
  };
}

/**
 * Marca o prefixo estável do pedido para o provedor guardar em cache.
 *
 * ⚠️ **A ordem das mensagens é o que faz o cache existir.** O desconto vale
 * para o PREFIXO repetido, então o que não muda entre chamadas tem de vir
 * primeiro, byte a byte igual. Um carimbo de hora ou o nome do aluno no começo
 * da instrução zera o proveito sem quebrar nada — e ninguém percebe, porque a
 * resposta continua certa.
 *
 * O `cache_control` é ignorado em silêncio por quem faz cache automático (é o
 * caso do DeepSeek), e é obrigatório em quem não faz. Mandar sempre custa nada
 * e cobre os dois casos.
 */
export function comCache<T extends { role: string; content: string }>(
  mensagens: T[],
): Array<T | { role: string; content: unknown }> {
  if (!CACHE_LIGADO || !mensagens.length) return mensagens;
  const [primeira, ...resto] = mensagens;
  if (primeira.role !== "system") return mensagens;
  return [
    {
      role: primeira.role,
      content: [
        {
          type: "text",
          text: primeira.content,
          cache_control: { type: "ephemeral" },
        },
      ],
    },
    ...resto,
  ];
}

/**
 * Quantos tokens de entrada vieram do cache, a partir do `usage` da resposta.
 *
 * Existe para a economia ser MEDIDA e não presumida: enquanto ninguém olhar
 * este número, "ligamos o cache" é uma frase, não um fato. Zero em toda chamada
 * significa que o provedor da vez não está guardando nada — e aí o certo é
 * dizer isso, não repetir a promessa.
 */
export function tokensEmCache(usage: unknown): number {
  const u = usage as { prompt_tokens_details?: { cached_tokens?: number } } | undefined;
  return u?.prompt_tokens_details?.cached_tokens ?? 0;
}
