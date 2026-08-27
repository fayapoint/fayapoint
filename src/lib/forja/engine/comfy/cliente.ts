/* ⚠️ ARQUIVO GERADO — NÃO EDITE AQUI.
 * Fonte: worldforge-fayai/engine/comfy/cliente.ts
 * Edite lá e rode: node scripts/forja/sincronizar-engine.mjs
 * Conferir se a cópia está em dia: node scripts/forja/sincronizar-engine.mjs --conferir
 */
/**
 * O CLIENTE do ComfyUI — a única porta por onde o motor fala com a GPU.
 *
 * ## O que este arquivo assume, e por quê
 *
 * O ComfyUI **não é chamado pelo site**. O site roda na Netlify, em função
 * serverless, e a GPU está na máquina do Ricardo atrás de um roteador
 * doméstico: não há rota de entrada, e abrir uma seria abrir a máquina dele
 * para a internet. Então quem chama daqui é o **trabalhador local**, que puxa
 * serviço do site (`fila.ts`) e devolve o resultado. Este cliente roda no
 * Node do trabalhador, nunca no navegador e nunca na função.
 *
 * ## Três coisas que o ComfyUI faz e surpreendem
 *
 * 1. **`/prompt` valida a FORMA e devolve 200 mesmo para grafo que vai
 *    quebrar.** O erro real chega em `/history/{id}` com `status_str: "error"`,
 *    depois de a GPU já ter rodado. Por isso `esperar()` lê `messages` e as
 *    devolve inteiras — sem elas o trabalhador só sabe dizer "falhou".
 * 2. **O histórico só aparece quando o trabalho SAI da fila.** Enquanto ele
 *    está em `queue_pending`, `/history/{id}` devolve `{}` — que é
 *    indistinguível de "esse id não existe". `estado()` consulta a fila também,
 *    para separar "ainda não começou" de "sumiu".
 * 3. **Um `/free` entre trabalhos pesados vale o segundo que custa.** São 16 GB
 *    de VRAM e o LTX 2.5 come 20 GB de pesos: encadear um vídeo depois de um
 *    Qwen sem liberar produz OOM no meio da segunda passada — cinco minutos
 *    perdidos por causa de memória que ninguém usava mais.
 */

export interface Saude {
  ok: boolean;
  versao?: string;
  vramLivre?: number;
  vramTotal?: number;
  /** quantos trabalhos esperando na fila do PRÓPRIO ComfyUI */
  naFila?: number;
  erro?: string;
}

export interface ArquivoDeSaida {
  filename: string;
  subfolder: string;
  type: string;
  /** "images" | "video" | "audio" — a chave sob a qual o nó publicou */
  categoria: string;
  no: string;
}

export interface Cliente {
  servidor: string;
  segredo?: string;
}

function cabecalhos(c: Cliente, extra: Record<string, string> = {}): Record<string, string> {
  // O `x-comfy-secret` existe para quando o acesso passa pelo `comfy_bridge.py`
  // (a ponte na rede Tailscale). Falando com o 127.0.0.1 ele é ignorado.
  return c.segredo ? { ...extra, "x-comfy-secret": c.segredo } : extra;
}

export async function saude(c: Cliente, timeoutMs = 5000): Promise<Saude> {
  try {
    const ctrl = AbortSignal.timeout(timeoutMs);
    const r = await fetch(`${c.servidor}/system_stats`, { headers: cabecalhos(c), signal: ctrl });
    if (!r.ok) return { ok: false, erro: `HTTP ${r.status}` };
    const d = (await r.json()) as {
      system?: { comfyui_version?: string };
      devices?: Array<{ vram_free?: number; vram_total?: number }>;
    };
    const dev = d.devices?.[0];

    let naFila: number | undefined;
    try {
      const q = (await (await fetch(`${c.servidor}/queue`, { headers: cabecalhos(c), signal: AbortSignal.timeout(timeoutMs) })).json()) as {
        queue_running?: unknown[];
        queue_pending?: unknown[];
      };
      naFila = (q.queue_running?.length || 0) + (q.queue_pending?.length || 0);
    } catch {
      /* a fila é informação extra; a saúde não depende dela */
    }

    return {
      ok: true,
      versao: d.system?.comfyui_version,
      vramLivre: dev?.vram_free,
      vramTotal: dev?.vram_total,
      naFila,
    };
  } catch (e) {
    return { ok: false, erro: e instanceof Error ? e.message : String(e) };
  }
}

/**
 * Manda uma imagem para o `input/` do ComfyUI e devolve o nome que o
 * `LoadImage` vai pedir.
 *
 * ⚠️ `overwrite: true` de propósito. Sem ele, o servidor renomeia para
 * `foto (1).png` e devolve o nome novo — que ninguém lê, porque o chamador
 * "sabe" o nome que mandou. O grafo então carrega a foto da geração anterior,
 * e o rosto errado aparece sem nenhum erro em lugar nenhum.
 */
export async function enviarImagem(c: Cliente, dados: Uint8Array | Blob, nome: string): Promise<string> {
  const form = new FormData();
  const blob = dados instanceof Blob ? dados : new Blob([dados as unknown as BlobPart]);
  form.append("image", blob, nome);
  form.append("overwrite", "true");
  const r = await fetch(`${c.servidor}/upload/image`, { method: "POST", headers: cabecalhos(c), body: form });
  if (!r.ok) throw new Error(`upload falhou: HTTP ${r.status} ${(await r.text()).slice(0, 300)}`);
  const d = (await r.json()) as { name: string; subfolder?: string };
  return d.subfolder ? `${d.subfolder}/${d.name}` : d.name;
}

/** Baixa uma URL e manda para o `input/` — o caminho normal, já que as fotos vivem no Cloudinary. */
export async function enviarImagemDaUrl(c: Cliente, url: string, nome: string): Promise<string> {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`não consegui baixar a referência: HTTP ${r.status}`);
  const buf = new Uint8Array(await r.arrayBuffer());
  return enviarImagem(c, buf, nome);
}

export interface Submissao {
  promptId: string;
  posicao: number;
}

export async function submeter(c: Cliente, grafo: unknown, clientId = "forja"): Promise<Submissao> {
  const r = await fetch(`${c.servidor}/prompt`, {
    method: "POST",
    headers: cabecalhos(c, { "Content-Type": "application/json" }),
    body: JSON.stringify({ prompt: grafo, client_id: clientId }),
  });
  const d = (await r.json()) as { prompt_id?: string; number?: number; error?: unknown; node_errors?: unknown };
  if (!r.ok || !d.prompt_id) {
    const detalhe = JSON.stringify({ error: d.error, node_errors: d.node_errors }).slice(0, 1500);
    throw new Error(`o ComfyUI recusou o grafo: ${detalhe}`);
  }
  return { promptId: d.prompt_id, posicao: d.number ?? 0 };
}

export type EstadoTrabalho =
  | { fase: "esperando"; posicao?: number }
  | { fase: "rodando" }
  | { fase: "pronto"; arquivos: ArquivoDeSaida[] }
  | { fase: "erro"; mensagem: string }
  | { fase: "sumiu" };

function extrairArquivos(saidas: unknown): ArquivoDeSaida[] {
  const out: ArquivoDeSaida[] = [];
  if (!saidas || typeof saidas !== "object") return out;
  for (const [no, porNo] of Object.entries(saidas as Record<string, Record<string, unknown>>)) {
    if (!porNo || typeof porNo !== "object") continue;
    for (const [categoria, lista] of Object.entries(porNo)) {
      if (!Array.isArray(lista)) continue;
      for (const f of lista as Array<{ filename?: string; subfolder?: string; type?: string }>) {
        if (f?.filename) {
          out.push({ filename: f.filename, subfolder: f.subfolder || "", type: f.type || "output", categoria, no });
        }
      }
    }
  }
  return out;
}

export async function estado(c: Cliente, promptId: string): Promise<EstadoTrabalho> {
  const h = (await (await fetch(`${c.servidor}/history/${promptId}`, { headers: cabecalhos(c) })).json()) as Record<
    string,
    { status?: { completed?: boolean; status_str?: string; messages?: unknown }; outputs?: unknown }
  >;
  const e = h[promptId];

  if (e) {
    if (e.status?.status_str === "error") {
      return { fase: "erro", mensagem: JSON.stringify(e.status.messages).slice(0, 2000) };
    }
    if (e.status?.completed) {
      const arquivos = extrairArquivos(e.outputs);
      if (!arquivos.length) {
        return { fase: "erro", mensagem: "o grafo terminou sem gravar arquivo nenhum" };
      }
      return { fase: "pronto", arquivos };
    }
  }

  // sem histórico: ou está na fila, ou o id não existe
  const q = (await (await fetch(`${c.servidor}/queue`, { headers: cabecalhos(c) })).json()) as {
    queue_running?: Array<[number, string]>;
    queue_pending?: Array<[number, string]>;
  };
  if ((q.queue_running || []).some((t) => t[1] === promptId)) return { fase: "rodando" };
  const i = (q.queue_pending || []).findIndex((t) => t[1] === promptId);
  if (i >= 0) return { fase: "esperando", posicao: i + 1 };

  return { fase: "sumiu" };
}

export interface OpcoesEspera {
  /** teto absoluto — passou disso, desiste e reporta */
  limiteSegundos?: number;
  intervaloMs?: number;
  aoAndar?: (e: EstadoTrabalho) => void;
}

/**
 * Espera um trabalho terminar.
 *
 * ⚠️ `sumiu` NÃO é erro na primeira vez que aparece. Entre o `/prompt` devolver
 * o id e o trabalho entrar na fila há uma janela de milissegundos em que ele não
 * está em lugar nenhum. Desistir ali descartaria trabalho que ia rodar — por
 * isso são três leituras seguidas antes de dar por perdido.
 */
export async function esperar(c: Cliente, promptId: string, o: OpcoesEspera = {}): Promise<EstadoTrabalho> {
  const limite = (o.limiteSegundos ?? 900) * 1000;
  const intervalo = o.intervaloMs ?? 2500;
  const ate = Date.now() + limite;
  let sumiuSeguidas = 0;

  while (Date.now() < ate) {
    const e = await estado(c, promptId);
    o.aoAndar?.(e);

    if (e.fase === "pronto" || e.fase === "erro") return e;
    if (e.fase === "sumiu") {
      if (++sumiuSeguidas >= 3) return e;
    } else {
      sumiuSeguidas = 0;
    }

    await new Promise((r) => setTimeout(r, intervalo));
  }
  return { fase: "erro", mensagem: `o trabalho passou de ${Math.round(limite / 1000)}s e foi abandonado` };
}

export async function baixar(c: Cliente, a: ArquivoDeSaida): Promise<Uint8Array> {
  const q = new URLSearchParams({ filename: a.filename, subfolder: a.subfolder, type: a.type });
  const r = await fetch(`${c.servidor}/view?${q}`, { headers: cabecalhos(c) });
  if (!r.ok) throw new Error(`não consegui baixar ${a.filename}: HTTP ${r.status}`);
  return new Uint8Array(await r.arrayBuffer());
}

/** Cancela o que está rodando e esvazia a fila do ComfyUI. */
export async function cancelarTudo(c: Cliente): Promise<void> {
  await fetch(`${c.servidor}/queue`, {
    method: "POST",
    headers: cabecalhos(c, { "Content-Type": "application/json" }),
    body: JSON.stringify({ clear: true }),
  }).catch(() => {});
  await fetch(`${c.servidor}/interrupt`, { method: "POST", headers: cabecalhos(c) }).catch(() => {});
}

/**
 * Solta os pesos da VRAM.
 *
 * Chamado pelo trabalhador entre um trabalho de vídeo e o próximo de imagem (ou
 * o contrário): são 16 GB de placa e o LTX 2.5 sozinho ocupa 20 GB de pesos em
 * disco. Sem isto, o segundo trabalho estoura no meio.
 */
export async function liberarMemoria(c: Cliente): Promise<void> {
  await fetch(`${c.servidor}/free`, {
    method: "POST",
    headers: cabecalhos(c, { "Content-Type": "application/json" }),
    body: JSON.stringify({ unload_models: true, free_memory: true }),
  }).catch(() => {});
}
