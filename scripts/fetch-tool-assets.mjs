/**
 * Baixa logo e imagem de capa de cada ferramenta do catálogo.
 *
 * De onde vêm as imagens: da própria empresa. O `og:image` é a arte que cada
 * fabricante publica para ser exibida quando alguém compartilha o site dele —
 * é material promocional feito para circular. O logo vem do favicon de alta
 * resolução. Uso editorial em diretório, com crédito e link para o original.
 *
 * Por que baixar em vez de apontar para o servidor deles: link para imagem de
 * terceiro quebra sem aviso, some quando a empresa muda de site, e entrega o
 * carregamento da nossa página para a disponibilidade da infra alheia.
 *
 *   node scripts/fetch-tool-assets.mjs
 *   node scripts/fetch-tool-assets.mjs --only=chatgpt,claude   (subconjunto)
 */

import { writeFile, mkdir, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const RAIZ = path.join(process.cwd(), "public", "ferramentaria");
const DIR_LOGO = path.join(RAIZ, "logos");
const DIR_CAPA = path.join(RAIZ, "capas");

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

/**
 * Domínio oficial de cada ferramenta.
 *
 * Escrito à mão de propósito: derivar do nome do fabricante erra em quase um
 * terço dos casos (Grok é x.ai, Kling é klingai.com, Windsurf é da Codeium,
 * Stable Diffusion é stability.ai). Domínio errado baixa a imagem da empresa
 * errada, e isso é pior que não ter imagem.
 */
const DOMINIOS = {
  chatgpt: "https://chatgpt.com",
  claude: "https://claude.ai",
  gemini: "https://gemini.google.com",
  perplexity: "https://www.perplexity.ai",
  midjourney: "https://www.midjourney.com",
  "stable-diffusion": "https://stability.ai",
  leonardo: "https://leonardo.ai",
  n8n: "https://n8n.io",
  make: "https://www.make.com",
  zapier: "https://zapier.com",
  flowise: "https://flowiseai.com",
  "dall-e": "https://openai.com/dall-e-3",
  runwayml: "https://runwayml.com",
  elevenlabs: "https://elevenlabs.io",
  suno: "https://suno.com",
  "github-copilot": "https://github.com/features/copilot",
  cursor: "https://cursor.com",
  notebooklm: "https://notebooklm.google.com",
  "pika-labs": "https://pika.art",
  "meta-ai": "https://www.meta.ai",
  mistral: "https://mistral.ai",
  grok: "https://x.ai",
  deepseek: "https://www.deepseek.com",
  cohere: "https://cohere.com",
  jasper: "https://www.jasper.ai",
  "copy-ai": "https://www.copy.ai",
  grammarly: "https://www.grammarly.com",
  gamma: "https://gamma.app",
  // tome.app respondia 404 em 02/08/2026 — a empresa mudou de produto. Mantido
  // apontando para o domínio raiz; se continuar sem imagem, a ficha entra com
  // o cartão tipográfico de reserva.
  tome: "https://tome.com",
  "beautiful-ai": "https://www.beautiful.ai",
  synthesia: "https://www.synthesia.io",
  heygen: "https://www.heygen.com",
  descript: "https://www.descript.com",
  kling: "https://klingai.com",
  luma: "https://lumalabs.ai",
  replit: "https://replit.com",
  v0: "https://v0.app",
  lovable: "https://lovable.dev",
  bolt: "https://bolt.new",
  windsurf: "https://windsurf.com",
  "notion-ai": "https://www.notion.com",
  "microsoft-copilot": "https://copilot.microsoft.com",
  "google-workspace-ai": "https://workspace.google.com",
  canva: "https://www.canva.com",
  figma: "https://www.figma.com",
  "adobe-firefly": "https://www.adobe.com/products/firefly.html",
  ideogram: "https://ideogram.ai",
  "hugging-face": "https://huggingface.co",
  langchain: "https://www.langchain.com",
  "vercel-ai": "https://vercel.com",
  supabase: "https://supabase.com",
  pinecone: "https://www.pinecone.io",
  "slack-ai": "https://slack.com",
  discord: "https://discord.com",
  "napkin-ai": "https://www.napkin.ai",
  "claude-code": "https://claude.com/product/claude-code",
};

const EXT_POR_TIPO = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg",
  "image/gif": "gif",
  "image/x-icon": "png",
  "image/vnd.microsoft.icon": "png",
};

/**
 * Cabeçalhos de navegador de verdade.
 *
 * Só `User-Agent` não basta: nove dos cinquenta e seis domínios (Perplexity,
 * Midjourney, Canva, Meta, entre outros) devolviam **403** para requisição que
 * mandava apenas o UA. O que eles checam é a ausência do resto do conjunto que
 * todo navegador manda junto — `Accept` com tipos de documento, `Accept-Language`,
 * e os `Sec-Fetch-*`. Com o conjunto completo, respondem normalmente.
 */
const CABECALHOS_NAVEGADOR = {
  "User-Agent": UA,
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Sec-Fetch-User": "?1",
  "Upgrade-Insecure-Requests": "1",
};

async function buscar(url, opcoes = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 20000);
  try {
    return await fetch(url, {
      ...opcoes,
      signal: ctrl.signal,
      headers: { ...CABECALHOS_NAVEGADOR, ...(opcoes.headers || {}) },
      redirect: "follow",
    });
  } finally {
    clearTimeout(t);
  }
}

/** Extrai a og:image do HTML e resolve para URL absoluta. */
function extrairOgImage(html, base) {
  const padroes = [
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
    /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
  ];
  for (const re of padroes) {
    const m = html.match(re);
    if (m?.[1]) {
      try {
        return new URL(m[1], base).href;
      } catch {
        /* URL malformada no site de origem — tenta o próximo padrão */
      }
    }
  }
  return null;
}

async function baixarImagem(url, destinoSemExt, minimoBytes = 2048) {
  const r = await buscar(url, { headers: { Accept: "image/*,*/*;q=0.8" } });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);

  const tipo = (r.headers.get("content-type") || "").split(";")[0].trim();
  const ext = EXT_POR_TIPO[tipo];
  if (!ext) throw new Error(`tipo não suportado: ${tipo || "desconhecido"}`);

  const buf = Buffer.from(await r.arrayBuffer());
  /**
   * O piso é diferente para logo e para capa, e a primeira versão errou nisso.
   *
   * Um favicon de 128px com forma simples — o "n8n", o triângulo da Vercel —
   * comprime para 400–900 bytes com folga. Com piso único de 1 KB, catorze
   * logos perfeitamente bons foram descartados como "muito pequeno". Capa de
   * 1200×630 abaixo de 2 KB, essa sim, é placeholder.
   */
  if (buf.length < minimoBytes)
    throw new Error(`muito pequeno (${buf.length} B, mínimo ${minimoBytes})`);

  const destino = `${destinoSemExt}.${ext}`;
  await writeFile(destino, buf);
  return { destino, bytes: buf.length, ext };
}

async function processar(slug, home) {
  const resultado = { slug, logo: null, capa: null, erros: [] };

  // 1. Logo — o serviço de favicon do Google devolve PNG normalizado em alta
  //    resolução e não depende do site de origem servir apple-touch-icon.
  try {
    const dominio = new URL(home).hostname;
    const r = await baixarImagem(
      `https://www.google.com/s2/favicons?domain=${dominio}&sz=128`,
      path.join(DIR_LOGO, slug),
      200, // piso baixo: logo simples comprime muito
    );
    resultado.logo = path.basename(r.destino);
  } catch (e) {
    resultado.erros.push(`logo: ${e.message}`);
  }

  // 2. Capa — a og:image que a própria empresa publica.
  try {
    const r = await buscar(home);
    if (!r.ok) throw new Error(`home HTTP ${r.status}`);
    const html = await r.text();
    const og = extrairOgImage(html, home);
    if (!og) throw new Error("sem og:image no HTML");
    const img = await baixarImagem(og, path.join(DIR_CAPA, slug));
    resultado.capa = path.basename(img.destino);
  } catch (e) {
    resultado.erros.push(`capa: ${e.message}`);
  }

  return resultado;
}

async function main() {
  const arg = process.argv.find((a) => a.startsWith("--only="));
  const filtro = arg ? arg.slice(7).split(",").map((s) => s.trim()) : null;

  await mkdir(DIR_LOGO, { recursive: true });
  await mkdir(DIR_CAPA, { recursive: true });

  const alvos = Object.entries(DOMINIOS).filter(([slug]) => !filtro || filtro.includes(slug));
  console.log(`Buscando assets de ${alvos.length} ferramentas...\n`);

  const resultados = [];
  // Lotes de 6: rápido o bastante e educado com os servidores de origem.
  for (let i = 0; i < alvos.length; i += 6) {
    const lote = alvos.slice(i, i + 6);
    const rs = await Promise.all(lote.map(([slug, home]) => processar(slug, home)));
    for (const r of rs) {
      const marca = r.logo && r.capa ? "OK  " : r.logo || r.capa ? "meio" : "FALHA";
      console.log(
        `${marca} ${r.slug.padEnd(22)} logo:${(r.logo || "-").padEnd(18)} capa:${(r.capa || "-").padEnd(18)} ${r.erros.join(" | ")}`,
      );
      resultados.push(r);
    }
  }

  const comLogo = resultados.filter((r) => r.logo).length;
  const comCapa = resultados.filter((r) => r.capa).length;
  console.log(
    `\n${comLogo}/${resultados.length} logos · ${comCapa}/${resultados.length} capas`,
  );

  const semNada = resultados.filter((r) => !r.logo && !r.capa).map((r) => r.slug);
  if (semNada.length) console.log(`Sem imagem nenhuma: ${semNada.join(", ")}`);

  // Manifesto: a página lê daqui em vez de adivinhar extensão de arquivo.
  const manifesto = Object.fromEntries(
    resultados.map((r) => [r.slug, { logo: r.logo, capa: r.capa }]),
  );
  await writeFile(
    path.join(RAIZ, "manifesto.json"),
    JSON.stringify(manifesto, null, 2),
  );
  console.log(`\nManifesto: public/inventando/manifesto.json`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
