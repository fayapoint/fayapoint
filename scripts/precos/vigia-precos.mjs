/**
 * O vigia de preço dos modelos.
 *
 * ── Por que ele existe ────────────────────────────────────────────────────────
 *
 * O DeepSeek anunciou aumento no V4 Flash, que é o modelo que roda por trás de
 * quase tudo aqui: a tradução, o Ateliê, o curso personalizado, o quiz. A
 * pergunta do Ricardo não é "quanto vai subir" — é **"quando subir, eu quero
 * saber, para escolher outro modelo com a conta na mão"**.
 *
 * Então este script não avisa só que mudou. Quando o preço sobe, ele já traz a
 * PRATELEIRA: os modelos comparáveis mais baratos do momento, com o preço de
 * cada um e quanto custaria a mesma carga. Alerta que não vem com alternativa é
 * só susto.
 *
 * ── O detalhe que faz diferença ──────────────────────────────────────────────
 *
 * ⚠️ `~deepseek/deepseek-v4-flash-latest` é um ALIAS. Ele segue o build novo e
 * o preço novo sozinho. `deepseek/deepseek-v4-flash-0731` é build fixado. Os
 * dois estão no tier budget do `src/lib/ai/provider.ts`, o alias na FRENTE — e a
 * cadeia de fallback só desce para o segundo quando o primeiro FALHA. Ficar caro
 * não é falhar. É por isso que o vigia acompanha os dois separadamente: o dia em
 * que os preços divergirem é o dia da decisão.
 *
 * Uso:
 *   node scripts/precos/vigia-precos.mjs            # compara com a referência
 *   node scripts/precos/vigia-precos.mjs --gravar   # grava a referência de hoje
 *   node scripts/precos/vigia-precos.mjs --prateleira  # só lista as opções
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, appendFileSync } from "fs";
import { dirname, join } from "path";

const AQUI = dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const REFERENCIA = join(AQUI, "base-precos.json");
const DIARIO = join(AQUI, "alertas.log");

/**
 * Os modelos que o produto REALMENTE usa. Cada um com onde ele é chamado —
 * quem receber o alerta precisa saber o que quebra se trocar.
 */
const EM_USO = [
  {
    id: "~deepseek/deepseek-v4-flash-latest",
    onde: "provider.ts (budget, 1º) · traduzir.mjs (volume) · quiz-config.ts",
    papel: "volume",
  },
  {
    id: "deepseek/deepseek-v4-flash-0731",
    onde: "provider.ts (budget, 2º — build fixado, reserva)",
    papel: "volume",
  },
  {
    id: "deepseek/deepseek-v4-pro",
    onde: "provider.ts (premium) · traduzir.mjs (vitrine)",
    papel: "qualidade",
  },
];

/** Quanto a casa consome por mês, para o alerta falar em dinheiro e não em zeros. */
const CARGA_MENSAL = { entradaM: 40, saidaM: 25 }; // milhões de tokens, estimativa

/**
 * Preço por milhão de tokens. O `toFixed(4)` não é cosmético: a OpenRouter
 * devolve `0.000000019`, e multiplicar por 1e6 em ponto flutuante produz
 * `0.019000000000000003` — número que ninguém lê e que polui a comparação.
 */
const porMilhao = (p) => Number((Number(p) * 1e6).toFixed(4));
const brl = (usd) => `US$ ${usd.toFixed(2)}`;

async function catalogo() {
  const res = await fetch("https://openrouter.ai/api/v1/models", {
    headers: { "User-Agent": "fayai-vigia-precos" },
  });
  if (!res.ok) throw new Error(`OpenRouter respondeu ${res.status}`);
  const { data } = await res.json();
  return new Map(data.map((m) => [m.id, m]));
}

/**
 * QUEM está servindo o modelo, e por quanto.
 *
 * ⚠️ Isto é o coração do vigia, e demorei a entender por quê. O DeepSeek V4
 * Flash é servido por 22 provedores na OpenRouter — DeepInfra, Fireworks,
 * Together, Cloudflare, Baseten, CoreWeave… — e o **próprio DeepSeek é só um
 * deles**. Em 06/08/2026: DeepSeek cobra US$ 0,14/0,28 e a DeepInfra cobra
 * 0,09/0,18. Nós pagamos 0,09: estamos na DeepInfra, não no DeepSeek.
 *
 * Ou seja: o aumento anunciado pelo DeepSeek atinge o endpoint DELE. Quem
 * hospeda os pesos por conta própria não é obrigado a acompanhar. A nossa
 * exposição real não é "o preço do DeepSeek" — é "o preço do provedor mais
 * barato que a OpenRouter escolher", e a gente não fixa provedor nenhum.
 *
 * O risco de verdade, então, não é o anúncio: é a DeepInfra subir ou sair de
 * fininho e a rota cair no segundo colocado sem ninguém notar. É isso que esta
 * função vigia.
 */
/**
 * O alias `~...-latest` não tem página de endpoints própria: ele APONTA para um
 * build. Para ver quem serve, é preciso perguntar pelo build concreto. Quando o
 * DeepSeek publicar um build novo, é esta linha que precisa mudar — e o fato de
 * ela precisar mudar é, ele mesmo, a razão de o alias ser arriscado.
 */
const BUILD_DO_ALIAS = {
  "~deepseek/deepseek-v4-flash-latest": "deepseek/deepseek-v4-flash-0731",
};

async function provedores(modeloId) {
  const concreto = BUILD_DO_ALIAS[modeloId] ?? modeloId.replace(/^~/, "");
  const url = `https://openrouter.ai/api/v1/models/${concreto}/endpoints`;
  const res = await fetch(url, { headers: { "User-Agent": "fayai-vigia-precos" } });
  if (!res.ok) return null;
  const m = (await res.json()).data;
  return (m?.endpoints ?? [])
    .map((e) => ({
      nome: e.provider_name,
      entrada: porMilhao(e.pricing.prompt),
      saida: porMilhao(e.pricing.completion),
      cache: e.pricing.input_cache_read ? porMilhao(e.pricing.input_cache_read) : null,
    }))
    .sort((a, b) => a.saida - b.saida || a.entrada - b.entrada);
}

/** O custo mensal estimado de um modelo, na carga da casa. */
function custoMensal(m) {
  return (
    porMilhao(m.pricing.prompt) * CARGA_MENSAL.entradaM +
    porMilhao(m.pricing.completion) * CARGA_MENSAL.saidaM
  );
}

/**
 * A prateleira: modelos que podem substituir o de volume.
 *
 * O corte é por CONTEXTO e por preço, não por marca. Um modelo de volume aqui
 * precisa aguentar o corpo de um capítulo (o motor corta em ~9.500 caracteres,
 * mas o currículo detalhado vai inteiro) e devolver resposta longa — por isso
 * 64k de contexto é o piso, e não 8k.
 */
function prateleira(mapa, tetoUsdPorM = 1.0) {
  return [...mapa.values()]
    .filter((m) => {
      const entrada = porMilhao(m.pricing.prompt);
      const saida = porMilhao(m.pricing.completion);
      if (!(entrada > 0) || !(saida > 0)) return false; // grátis entra em outra lista
      if (saida > tetoUsdPorM) return false;
      if ((m.context_length ?? 0) < 64000) return false;
      return true;
    })
    .sort((a, b) => custoMensal(a) - custoMensal(b));
}

/** Uma linha da prateleira, alinhada para dar para ler em coluna. */
function linhaDaPrateleira(m) {
  const ent = String(porMilhao(m.pricing.prompt)).padStart(7);
  const sai = String(porMilhao(m.pricing.completion)).padEnd(7);
  const ctx = `${Math.round((m.context_length ?? 0) / 1000)}k`.padStart(6);
  return `  ${brl(custoMensal(m)).padStart(10)}/mês  ${ent} / ${sai} ${ctx}  ${m.id}`;
}

async function main() {
  const argv = process.argv.slice(2);
  const mapa = await catalogo();
  const agora = new Date().toISOString();

  const hoje = {};
  for (const alvo of EM_USO) {
    const m = mapa.get(alvo.id);
    if (!m) {
      hoje[alvo.id] = { sumiu: true };
      continue;
    }
    const eps = await provedores(alvo.id);
    const barato = eps?.[0] ?? null;
    hoje[alvo.id] = {
      entrada: porMilhao(m.pricing.prompt),
      saida: porMilhao(m.pricing.completion),
      contexto: m.context_length ?? null,
      // quem serve mais barato hoje, e quantos servem: se o mais barato sumir,
      // a rota cai no segundo e a conta muda sem aviso nenhum
      provedorMaisBarato: barato?.nome ?? null,
      provedorPreco: barato ? `${barato.entrada}/${barato.saida}` : null,
      quantosProvedores: eps?.length ?? 0,
    };
  }

  if (argv.includes("--gravar")) {
    mkdirSync(AQUI, { recursive: true });
    writeFileSync(REFERENCIA, JSON.stringify({ em: agora, precos: hoje }, null, 2) + "\n");
    console.log(`Referência gravada em ${REFERENCIA}`);
    for (const [id, p] of Object.entries(hoje)) {
      console.log(`  ${id.padEnd(42)} US$ ${p.entrada} / ${p.saida} por M`);
    }
    return;
  }

  if (argv.includes("--provedores")) {
    for (const alvo of EM_USO) {
      const eps = await provedores(alvo.id);
      if (!eps?.length) {
        console.log(`\n${alvo.id}: sem endpoints listados.`);
        continue;
      }
      console.log(`\n${alvo.id} — ${eps.length} provedor(es)`);
      console.log(`  ${"provedor".padEnd(16)} ${"in".padStart(8)} ${"out".padStart(8)} ${"cache in".padStart(9)}`);
      for (const e of eps.slice(0, 8)) {
        console.log(
          `  ${String(e.nome).padEnd(16)} ${String(e.entrada).padStart(8)} ${String(e.saida).padStart(8)} ` +
            `${String(e.cache ?? "-").padStart(9)}`,
        );
      }
    }
    console.log(
      `\n⚠️ O DeepSeek é UM dos provedores, não o único. O aumento anunciado por\n` +
        `   ele atinge o endpoint dele; quem hospeda os pesos por conta própria não\n` +
        `   é obrigado a acompanhar. Nós não fixamos provedor — a OpenRouter escolhe.\n` +
        `   Fixar seria \`provider: { order: [...] }\` no corpo do pedido.\n` +
        `\n   Repare na coluna de cache: entrada repetida custa uma fração da nova.\n` +
        `   Prompt com prefixo longo e estável (a instrução do tradutor, o contexto\n` +
        `   do curso) é onde isso vira desconto de verdade.`,
    );
    return;
  }

  if (argv.includes("--prateleira")) {
    const hojeFlash = mapa.get("~deepseek/deepseek-v4-flash-latest");
    console.log(
      `Hoje o modelo de volume custa ${brl(custoMensal(hojeFlash))}/mês na carga da casa.\n` +
        `As 15 opções mais baratas com 64k+ de contexto:\n`,
    );
    for (const m of prateleira(mapa).slice(0, 15)) {
      console.log(linhaDaPrateleira(m));
    }
    console.log(
      `\n⚠️ Preço não é qualidade. Esta lista ordena por CUSTO — vários destes são\n` +
        `   modelos pequenos que não aguentam traduzir capítulo nem escrever aula.\n` +
        `   A lista serve para saber o que existe; a escolha ainda precisa de teste.`,
    );
    return;
  }

  if (!existsSync(REFERENCIA)) {
    console.error(`Sem referência. Rode uma vez com --gravar.`);
    process.exit(1);
  }

  const base = JSON.parse(readFileSync(REFERENCIA, "utf8"));
  const mudancas = [];

  for (const alvo of EM_USO) {
    const antes = base.precos[alvo.id];
    const depois = hoje[alvo.id];
    if (!antes) continue;

    if (depois.sumiu) {
      mudancas.push({ id: alvo.id, tipo: "SUMIU", onde: alvo.onde, antes, depois });
      continue;
    }
    if (antes.entrada !== depois.entrada || antes.saida !== depois.saida) {
      const subiu = depois.saida > antes.saida || depois.entrada > antes.entrada;
      mudancas.push({ id: alvo.id, tipo: subiu ? "SUBIU" : "BAIXOU", onde: alvo.onde, antes, depois });
    } else if (antes.provedorMaisBarato && antes.provedorMaisBarato !== depois.provedorMaisBarato) {
      /**
       * Preço igual, provedor outro. Parece bobagem e não é: o modelo é o
       * mesmo nome, mas o build, a quantização e o teto de contexto são de
       * quem hospeda. Trocar de provedor sem saber é receber outra qualidade
       * pelo mesmo preço.
       */
      mudancas.push({ id: alvo.id, tipo: "TROCOU DE PROVEDOR", onde: alvo.onde, antes, depois });
    }
  }

  if (!mudancas.length) {
    console.log(`${agora.slice(0, 16)}  sem mudança (referência de ${base.em.slice(0, 10)}).`);
    return;
  }

  // ── o alerta ───────────────────────────────────────────────────────────────
  const linhas = [];
  linhas.push(`\n${"=".repeat(70)}`);
  linhas.push(`PREÇO DE MODELO MUDOU — ${agora.slice(0, 16).replace("T", " ")}`);
  linhas.push("=".repeat(70));

  for (const c of mudancas) {
    linhas.push(`\n${c.tipo}  ${c.id}`);
    linhas.push(`  usado em: ${c.onde}`);
    if (c.tipo === "TROCOU DE PROVEDOR") {
      linhas.push(
        `  quem servia: ${c.antes.provedorMaisBarato} (${c.antes.provedorPreco})\n` +
          `  quem serve:  ${c.depois.provedorMaisBarato} (${c.depois.provedorPreco})\n` +
          `  ⚠ mesmo preço, outra casa. Build, quantização e teto de contexto são de quem hospeda.`,
      );
      continue;
    }
    if (c.tipo === "SUMIU") {
      linhas.push(`  ⚠ o modelo saiu do catálogo da OpenRouter. A cadeia de fallback vai cair para o próximo.`);
      continue;
    }
    linhas.push(`  entrada: US$ ${c.antes.entrada} → ${c.depois.entrada} por M`);
    linhas.push(`  saída:   US$ ${c.antes.saida} → ${c.depois.saida} por M`);
    const antesM =
      c.antes.entrada * CARGA_MENSAL.entradaM + c.antes.saida * CARGA_MENSAL.saidaM;
    const depoisM =
      c.depois.entrada * CARGA_MENSAL.entradaM + c.depois.saida * CARGA_MENSAL.saidaM;
    linhas.push(
      `  na carga da casa (${CARGA_MENSAL.entradaM}M entrada / ${CARGA_MENSAL.saidaM}M saída): ` +
        `${brl(antesM)} → ${brl(depoisM)} por mês  (${depoisM > antesM ? "+" : ""}${(((depoisM - antesM) / antesM) * 100).toFixed(0)}%)`,
    );
  }

  if (mudancas.some((c) => c.tipo === "SUBIU" || c.tipo === "SUMIU")) {
    linhas.push(`\n${"-".repeat(70)}`);
    linhas.push("A PRATELEIRA — as 10 opções mais baratas com 64k+ de contexto, hoje:");
    linhas.push("-".repeat(70));
    for (const m of prateleira(mapa).slice(0, 10)) linhas.push(linhaDaPrateleira(m));
    linhas.push(
      `\n⚠️ A lista ordena por CUSTO, não por qualidade — vários são modelos\n` +
        `   pequenos que não aguentam traduzir capítulo. Serve para saber o que\n` +
        `   existe; a escolha ainda precisa de teste.`,
    );
    linhas.push(
      `\n⚠️ Trocar o modelo de volume mexe em três lugares: src/lib/ai/provider.ts,\n` +
        `   scripts/i18n/traduzir.mjs (MODELOS.volume) e src/config/quiz-config.ts.\n` +
        `   E o tier premium TEM de continuar sendo um modelo diferente do budget —\n` +
        `   api/user/curso-personalizado escala de um para o outro quando o JSON volta\n` +
        `   vazio, e isso acontece em ~13% dos capítulos.`,
    );
  }

  const texto = linhas.join("\n");
  console.log(texto);
  appendFileSync(DIARIO, texto + "\n");
  console.log(`\n(registrado em ${DIARIO})`);

  // Código de saída 2 = "mudou": deixa a tarefa agendada distinguir sem ler o texto.
  process.exit(2);
}

main().catch((e) => {
  console.error("vigia-precos falhou:", e.message);
  process.exit(1);
});
