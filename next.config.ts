import createNextIntlPlugin from "next-intl/plugin";
import { NextConfig } from "next";

const withNextIntl = createNextIntlPlugin();

/**
 * A chave do cache da BORDA para `/api/products*`, e por que ela precisa ser
 * escrita à mão.
 *
 * ## O defeito, medido em produção em 18/08/2026
 *
 * A Netlify responde a estas rotas com
 *
 *     Netlify-Vary: query=__nextDataReq|_rsc, header=…, cookie=…
 *
 * e `query=<lista>` quer dizer **"a chave do cache usa SÓ estes parâmetros"**.
 * Todos os outros são ignorados. Com `s-maxage=600` ligado logo abaixo, o
 * resultado era este, conferido ao vivo:
 *
 *     GET /api/products?action=categories  → a lista de produtos
 *     GET /api/products?action=stats       → a lista de produtos
 *     GET /api/products?search=chatgpt     → a lista de produtos
 *
 * Todas com `Cache-Status: hit`. Uma rota com sete parâmetros estava servindo
 * a resposta do primeiro visitante a todos os outros por dez minutos.
 *
 * ⚠️ É o que faria o `?locale=en` (18/08) não sair do lugar, e pior: o idioma
 * viraria loteria — o primeiro leitor inglês fixaria inglês para os leitores
 * portugueses dos dez minutos seguintes.
 *
 * ## O que está escrito aqui
 *
 * Os parâmetros que as rotas de produto de fato leem, mais os dois que o
 * adaptador do Next já pedia. `header` e `cookie` vêm repetidos do valor que a
 * Netlify mandava sozinha: este cabeçalho SUBSTITUI aquele, e omitir as duas
 * cláusulas tiraria do jogo a variação por prévia e por dado de roteador.
 */
const CHAVE_DE_CACHE_DE_PRODUTOS =
  "query=__nextDataReq|_rsc|locale|type|category|tag|search|limit|sortBy|action," +
  "header=x-nextjs-data|x-next-debug-logging|next-router-prefetch|" +
  "next-router-segment-prefetch|next-router-state-tree|next-url|rsc," +
  "cookie=__prerender_bypass|__next_preview_data";

const config: NextConfig = {
  // Prevent 308 redirects on trailing slashes — critical for Asaas webhooks
  // Asaas sends POST to /api/payments/webhook/ (with trailing slash) and
  // Next.js default behavior returns 308, breaking webhook delivery.
  skipTrailingSlashRedirect: true,

  // Enable experimental features for better performance
  experimental: {
    // Optimize package imports
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },

  // Fix turbopack root detection for monorepo-like workspace
  turbopack: {
    root: '.',
  },
  
  async headers() {
    return [
      // =========================================================================
      // SECURITY HEADERS (all routes)
      // =========================================================================
      {
        source: '/:path*',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
      
      // =========================================================================
      // API ROUTES - No caching, no indexing
      // =========================================================================
      {
        source: '/api/:path*',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate' },
        ],
      },
      
      // =========================================================================
      // PUBLIC APIs - Cache at edge
      // =========================================================================
      {
        source: '/api/public/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=3600, stale-while-revalidate=86400' },
        ],
      },
      {
        source: '/api/gallery',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=300, stale-while-revalidate=600' },
        ],
      },
      {
        source: '/api/service-prices',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=1800, stale-while-revalidate=3600' },
        ],
      },
      {
        // ⚠️ O `Netlify-Vary` não é decoração: sem ele o `s-maxage` desta linha
        // faz TODA query desta rota compartilhar uma resposta só. Ver
        // `CHAVE_DE_CACHE_DE_PRODUTOS` no topo do arquivo.
        source: '/api/products/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=600, stale-while-revalidate=1800' },
          { key: 'Netlify-Vary', value: CHAVE_DE_CACHE_DE_PRODUTOS },
        ],
      },
      {
        source: '/api/calendar/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=300, stale-while-revalidate=600' },
        ],
      },
      
      // =========================================================================
      // STATIC PAGES - Aggressive caching
      // =========================================================================
      {
        source: '/:locale/ajuda',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=3600, stale-while-revalidate=86400' },
        ],
      },
      {
        source: '/:locale/faq',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=3600, stale-while-revalidate=86400' },
        ],
      },
      {
        source: '/:locale/recursos/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=3600, stale-while-revalidate=86400' },
        ],
      },
      {
        source: '/:locale/instrutores',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=3600, stale-while-revalidate=86400' },
        ],
      },
      {
        source: '/:locale/carreiras',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=3600, stale-while-revalidate=86400' },
        ],
      },
      {
        source: '/:locale/parcerias',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=3600, stale-while-revalidate=86400' },
        ],
      },
      {
        source: '/:locale/o-que-fazemos',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=3600, stale-while-revalidate=86400' },
        ],
      },
      {
        source: '/:locale/cursos/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=1800, stale-while-revalidate=3600' },
        ],
      },
      {
        source: '/:locale/ferramentas/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=3600, stale-while-revalidate=86400' },
        ],
      },
      
      // =========================================================================
      // STATIC ASSETS - Immutable caching
      // =========================================================================
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/images/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' },
        ],
      },
      {
        source: '/:path*.woff2',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },

  /**
   * Matérias aposentadas por fusão.
   *
   * Quando duas matérias cobrem o mesmo fato, a saída não é apagar a mais
   * fraca: a URL dela já foi rastreada, pode estar indexada e pode ter link
   * apontando para si. Apagar joga esse sinal fora e ainda devolve 404 a quem
   * tiver o link. O 301 consolida os dois no endereço que fica.
   *
   * `permanent: true` de propósito — 301, não 307. Redirecionamento temporário
   * manda o Google GUARDAR a URL antiga, que é o oposto de consolidar (mesma
   * armadilha corrigida em `/cursos/<slug>` e `/nova` em 28/07/2026).
   *
   * 29/07/2026 — "Anthropic lança Opus 5: o novo titã da inteligência
   * artificial" (TechCrunch, 25/07) e "Anthropic lança Claude Opus 5, seu
   * modelo de IA mais avançado" (The Verge, 27/07) eram o mesmo lançamento,
   * publicados a dois dias de distância, e apareciam lado a lado na listagem
   * com capas quase idênticas. O conteúdo dos dois foi fundido no segundo.
   */
  async redirects() {
    return [
      {
        source: '/:locale(pt-BR|en)/noticias/anthropic-lanca-opus-5',
        destination: '/:locale/noticias/claude-opus-5',
        permanent: true,
      },
      {
        source: '/noticias/anthropic-lanca-opus-5',
        destination: '/pt-BR/noticias/claude-opus-5',
        permanent: true,
      },
    ];
  },
};

export default withNextIntl(config);
