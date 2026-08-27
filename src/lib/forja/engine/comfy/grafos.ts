/* ⚠️ ARQUIVO GERADO — NÃO EDITE AQUI.
 * Fonte: worldforge-fayai/engine/comfy/grafos.ts
 * Edite lá e rode: node scripts/forja/sincronizar-engine.mjs
 * Conferir se a cópia está em dia: node scripts/forja/sincronizar-engine.mjs --conferir
 */
/**
 * OS GRAFOS — os workflows do ComfyUI, em formato de API.
 *
 * ## Por que montados à mão e não convertidos do template
 *
 * Os templates oficiais de 2026 embrulham o grafo real num **subgrafo cujo
 * `class_type` é um UUID**, e usam `COMFY_DYNAMICCOMBO_V3` (o realçador de
 * prompt, o redimensionador), que consome um número VARIÁVEL de
 * `widgets_values`. Não há como achatar isso de forma confiável: os
 * `widgets_values` do nó de fora seguem a ordem de `subgraph.inputs`, não a de
 * `node.inputs[]`, e contar pelo lado errado entrega o VAE de áudio para o
 * `CLIPLoader` — o grafo monta, o servidor aceita, e só o resultado denuncia.
 *
 * Então aqui está o miolo, com os MESMOS números dos templates, verificado nó a
 * nó contra `/object_info` do servidor em 27/08/2026. Os dois nós problemáticos
 * saem de cena: o realçador some porque nós escrevemos prompt melhor do que ele
 * (é o que `prompts/` inteiro faz), e o redimensionador some porque a imagem
 * entra já no tamanho.
 *
 * ## Três coisas que quebram em silêncio, e onde elas estão tratadas
 *
 * - **`SaveVideo` exige `codec`, e a falta só aparece no FIM.** O campo é
 *   `COMFY_DYNAMICCOMBO_V3`, não tem `default`, e o grafo passa na validação
 *   sem ele: 33 nós rodam, o vídeo é criado, e o `SaveVideo` estoura. Cinco
 *   minutos de GPU por um campo de texto. Está sempre preenchido aqui.
 * - **O comprimento do vídeo tem de ser 8n+1.** Fora da grade, o sampler
 *   devolve um clipe mais curto sem avisar. Quem faz a conta é
 *   `comprimentoDe()`, em `prompts/video.ts`.
 * - **O tipo do `CLIPLoader` do Qwen Edit é `qwen_image`, não `qwen_image_edit`.**
 *   O segundo não existe mais na lista de tipos do servidor. Passar um tipo
 *   inválido derruba o grafo com erro obscuro de tensor.
 */

export type No = { class_type: string; inputs: Record<string, unknown> };
export type Grafo = Record<string, No>;

export interface Saida {
  /** o id do nó que grava o arquivo */
  no: string;
  tipo: "imagem" | "video";
}

export interface GrafoMontado {
  grafo: Grafo;
  saidas: Saida[];
  /** o que este grafo custa em tempo, para a fila poder estimar */
  segundosEstimados: number;
}

const semente = () => Math.floor(Math.random() * 9e14);

// ─────────────────────────────────────────────────────────────────────
// IMAGEM — Z-Image Turbo (o rápido)
// ─────────────────────────────────────────────────────────────────────

export interface ParamsImagem {
  positivo: string;
  negativo?: string;
  largura: number;
  altura: number;
  seed?: number;
  prefixo: string;
  passos?: number;
}

/**
 * Z-Image Turbo — 8 passos, `res_multistep`, cfg 1.
 *
 * ⚠️ `ConditioningZeroOut` no lugar de um `CLIPTextEncode` negativo, e é assim
 * no template oficial: com cfg 1 o ramo negativo não é amostrado, e codificar
 * texto ali seria gastar VRAM à toa. O `negativo` que chega aqui é IGNORADO de
 * propósito — quem precisa de negativo de verdade usa o Qwen ou o ERNIE.
 */
export function grafoZImage(p: ParamsImagem): GrafoMontado {
  const seed = p.seed ?? semente();
  return {
    grafo: {
      "1": { class_type: "UNETLoader", inputs: { unet_name: "z_image_turbo_bf16.safetensors", weight_dtype: "default" } },
      "2": { class_type: "CLIPLoader", inputs: { clip_name: "qwen_3_4b.safetensors", type: "lumina2", device: "default" } },
      "3": { class_type: "VAELoader", inputs: { vae_name: "ae.safetensors" } },
      "4": { class_type: "ModelSamplingAuraFlow", inputs: { shift: 3, model: ["1", 0] } },
      "5": { class_type: "CLIPTextEncode", inputs: { text: p.positivo, clip: ["2", 0] } },
      "6": { class_type: "ConditioningZeroOut", inputs: { conditioning: ["5", 0] } },
      "7": { class_type: "EmptySD3LatentImage", inputs: { width: p.largura, height: p.altura, batch_size: 1 } },
      "8": {
        class_type: "KSampler",
        inputs: {
          seed,
          control_after_generate: "fixed",
          steps: p.passos ?? 8,
          cfg: 1,
          sampler_name: "res_multistep",
          scheduler: "simple",
          denoise: 1,
          model: ["4", 0],
          positive: ["5", 0],
          negative: ["6", 0],
          latent_image: ["7", 0],
        },
      },
      "9": { class_type: "VAEDecode", inputs: { samples: ["8", 0], vae: ["3", 0] } },
      "10": { class_type: "SaveImage", inputs: { filename_prefix: p.prefixo, images: ["9", 0] } },
    },
    saidas: [{ no: "10", tipo: "imagem" }],
    segundosEstimados: 12,
  };
}

// ─────────────────────────────────────────────────────────────────────
// IMAGEM — Qwen 2512 + Lightning (o caprichado)
// ─────────────────────────────────────────────────────────────────────

/**
 * Qwen Image 2512 com a LoRA Lightning de 4 passos.
 *
 * Fotorrealismo em ~25 s. Sem a LoRA seriam 30 passos e um minuto e meio — e
 * numa fila que atende gente esperando, um minuto e meio é o suficiente para a
 * pessoa fechar a aba.
 */
export function grafoQwen2512(p: ParamsImagem): GrafoMontado {
  const seed = p.seed ?? semente();
  return {
    grafo: {
      "1": { class_type: "UNETLoader", inputs: { unet_name: "qwen_image_2512_fp8_e4m3fn.safetensors", weight_dtype: "default" } },
      "2": {
        class_type: "LoraLoaderModelOnly",
        inputs: { lora_name: "Qwen-Image-2512-Lightning-4steps-V1.0-fp32.safetensors", strength_model: 1, model: ["1", 0] },
      },
      "3": { class_type: "CLIPLoader", inputs: { clip_name: "qwen_2.5_vl_7b_fp8_scaled.safetensors", type: "qwen_image", device: "default" } },
      "4": { class_type: "VAELoader", inputs: { vae_name: "qwen_image_vae.safetensors" } },
      "5": { class_type: "CLIPTextEncode", inputs: { text: p.positivo, clip: ["3", 0] } },
      "6": { class_type: "CLIPTextEncode", inputs: { text: p.negativo || "", clip: ["3", 0] } },
      "7": { class_type: "EmptySD3LatentImage", inputs: { width: p.largura, height: p.altura, batch_size: 1 } },
      "8": {
        class_type: "KSampler",
        inputs: {
          seed,
          control_after_generate: "fixed",
          steps: p.passos ?? 4,
          cfg: 1,
          sampler_name: "euler",
          scheduler: "simple",
          denoise: 1,
          model: ["2", 0],
          positive: ["5", 0],
          negative: ["6", 0],
          latent_image: ["7", 0],
        },
      },
      "9": { class_type: "VAEDecode", inputs: { samples: ["8", 0], vae: ["4", 0] } },
      "10": { class_type: "SaveImage", inputs: { filename_prefix: p.prefixo, images: ["9", 0] } },
    },
    saidas: [{ no: "10", tipo: "imagem" }],
    segundosEstimados: 25,
  };
}

// ─────────────────────────────────────────────────────────────────────
// IMAGEM — ERNIE (o que escreve português)
// ─────────────────────────────────────────────────────────────────────

/**
 * ERNIE Image — o único local que escreve português dentro da arte.
 *
 * ⚠️ Três coisas contraintuitivas, todas confirmadas no template oficial
 * `image_ernie_image`:
 * - o texto vai por `CLIPLoader` de tipo **`flux2`** com o `ministral-3-3b`;
 * - o latente é `EmptyFlux2LatentImage`, não `EmptySD3LatentImage`;
 * - o VAE é o do Flux 2 (`flux2-vae`), não um VAE próprio.
 *
 * O realçador de prompt do template (`TextGenerate` + `ernie-image-prompt-enhancer`)
 * fica de fora: ele reescreve o prompt em chinês-inglês genérico e desfaz a
 * composição que `prompts/imagem.ts` acabou de fazer.
 */
export function grafoErnie(p: ParamsImagem): GrafoMontado {
  const seed = p.seed ?? semente();
  return {
    grafo: {
      "1": { class_type: "UNETLoader", inputs: { unet_name: "ernie-image.safetensors", weight_dtype: "default" } },
      "2": { class_type: "CLIPLoader", inputs: { clip_name: "ministral-3-3b.safetensors", type: "flux2", device: "default" } },
      "3": { class_type: "VAELoader", inputs: { vae_name: "flux2-vae.safetensors" } },
      "4": { class_type: "CLIPTextEncode", inputs: { text: p.positivo, clip: ["2", 0] } },
      "5": { class_type: "CLIPTextEncode", inputs: { text: p.negativo || "", clip: ["2", 0] } },
      "6": { class_type: "EmptyFlux2LatentImage", inputs: { width: p.largura, height: p.altura, batch_size: 1 } },
      "7": {
        class_type: "KSampler",
        inputs: {
          seed,
          control_after_generate: "fixed",
          steps: p.passos ?? 20,
          cfg: 4,
          sampler_name: "euler",
          scheduler: "simple",
          denoise: 1,
          model: ["1", 0],
          positive: ["4", 0],
          negative: ["5", 0],
          latent_image: ["6", 0],
        },
      },
      "8": { class_type: "VAEDecode", inputs: { samples: ["7", 0], vae: ["3", 0] } },
      "9": { class_type: "SaveImage", inputs: { filename_prefix: p.prefixo, images: ["8", 0] } },
    },
    saidas: [{ no: "9", tipo: "imagem" }],
    segundosEstimados: 40,
  };
}

// ─────────────────────────────────────────────────────────────────────
// IMAGEM — Qwen Edit 2511 (o que mantém o rosto)
// ─────────────────────────────────────────────────────────────────────

export interface ParamsEdicao extends ParamsImagem {
  /** o nome do arquivo já enviado para o `input/` do ComfyUI */
  imagem: string;
  /** uma segunda referência, quando existe (outro ângulo do caderno) */
  imagem2?: string;
  /** usa a LoRA Lightning: 4 passos em vez de 40 */
  rapido?: boolean;
}

/**
 * Qwen Image Edit 2511 — o caminho de consistência de rosto.
 *
 * ## Por que edição por referência e não LoRA
 *
 * Treinar uma LoRA do rosto real exige dezenas de fotos, GPU por horas e ainda
 * erra. O caminho que funciona é mandar a foto real junto do prompt e pedir a
 * MESMA pessoa em outra cena. É o que o caderno de personagem do site já faz na
 * nuvem — aqui é o mesmo desenho, de graça, na GPU de casa.
 *
 * ## A cadeia que o template usa e é fácil de errar
 *
 * `FluxKontextImageScale` normaliza a entrada (é ele que impede a foto de 4000
 * px de estourar a VRAM), `TextEncodeQwenImageEditPlus` recebe clip + vae +
 * imagem, e `FluxKontextMultiReferenceLatentMethod` marca as duas
 * condicionantes. O latente vem de `VAEEncode` da imagem escalada — não de um
 * latente vazio: é isso que faz a saída PARTIR da foto.
 *
 * ⚠️ `rapido` troca 40 passos/cfg 3 por 4 passos/cfg 1 com a LoRA Lightning. Na
 * fila da casa isso é a diferença entre 30 s e 4 minutos por ângulo — e o
 * caderno tem quatro ângulos.
 */
export function grafoQwenEdit(p: ParamsEdicao): GrafoMontado {
  const seed = p.seed ?? semente();
  const rapido = p.rapido !== false;

  const grafo: Grafo = {
    "1": { class_type: "UNETLoader", inputs: { unet_name: "qwen_image_edit_2511_bf16.safetensors", weight_dtype: "default" } },
    "2": { class_type: "CLIPLoader", inputs: { clip_name: "qwen_2.5_vl_7b_fp8_scaled.safetensors", type: "qwen_image", device: "default" } },
    "3": { class_type: "VAELoader", inputs: { vae_name: "qwen_image_vae.safetensors" } },
    "4": { class_type: "ModelSamplingAuraFlow", inputs: { shift: 3.1, model: ["1", 0] } },
    "5": { class_type: "CFGNorm", inputs: { strength: 1, enabled: false, model: ["4", 0] } },

    "10": { class_type: "LoadImage", inputs: { image: p.imagem } },
    /**
     * ⚠️ ESTE NÓ DECIDE O FORMATO DA SAÍDA, e a falta dele já entregou arte
     * quadrada num Reel 9:16 (medido em 27/08/2026).
     *
     * O Qwen Edit não usa latente vazio: o latente vem do `VAEEncode` da imagem
     * de referência, e o resultado sai **do tamanho do latente**. Ou seja, a
     * geometria da FOTO manda, e `largura`/`altura` do pedido são ignoradas —
     * silenciosamente. Uma foto de rosto quadrada devolvia 1024×1024 para uma
     * peça vertical, e o defeito só aparecia na hora de montar o Reel.
     *
     * `crop: "center"` e não `disabled`: esticar um rosto de quadrado para
     * 9:16 deforma a pessoa, que é exatamente o que a foto de referência
     * estava lá para impedir. Cortar as laterais mantém a proporção do rosto.
     *
     * O `FluxKontextImageScale` continua antes porque ele normaliza a entrada
     * para a grade que o modelo espera — é ele que impede a foto de 4000 px de
     * estourar a VRAM.
     */
    "11": { class_type: "FluxKontextImageScale", inputs: { image: ["10", 0] } },
    "11b": {
      class_type: "ImageScale",
      inputs: { image: ["11", 0], upscale_method: "lanczos", width: p.largura, height: p.altura, crop: "center" },
    },
    "12": { class_type: "VAEEncode", inputs: { pixels: ["11b", 0], vae: ["3", 0] } },

    /**
     * Os encoders recebem a MESMA imagem que virou latente.
     *
     * Alimentar o condicionamento com uma geometria e o latente com outra faz o
     * Qwen Edit desalinhar a referência — o rosto aparece deslocado ou cortado
     * pela metade, e o sintoma parece defeito de prompt.
     */
    "20": {
      class_type: "TextEncodeQwenImageEditPlus",
      inputs: { clip: ["2", 0], vae: ["3", 0], image1: ["11b", 0], prompt: p.positivo },
    },
    "21": {
      class_type: "TextEncodeQwenImageEditPlus",
      inputs: { clip: ["2", 0], vae: ["3", 0], image1: ["11b", 0], prompt: p.negativo || "" },
    },
    "22": { class_type: "FluxKontextMultiReferenceLatentMethod", inputs: { reference_latents_method: "index_timestep_zero", conditioning: ["20", 0] } },
    "23": { class_type: "FluxKontextMultiReferenceLatentMethod", inputs: { reference_latents_method: "index_timestep_zero", conditioning: ["21", 0] } },

    "30": {
      class_type: "KSampler",
      inputs: {
        seed,
        control_after_generate: "fixed",
        steps: rapido ? 4 : 40,
        cfg: rapido ? 1 : 3,
        sampler_name: "euler",
        scheduler: "simple",
        denoise: 1,
        model: rapido ? ["6", 0] : ["5", 0],
        positive: ["22", 0],
        negative: ["23", 0],
        latent_image: ["12", 0],
      },
    },
    "31": { class_type: "VAEDecode", inputs: { samples: ["30", 0], vae: ["3", 0] } },
    "32": { class_type: "SaveImage", inputs: { filename_prefix: p.prefixo, images: ["31", 0] } },
  };

  if (rapido) {
    grafo["6"] = {
      class_type: "LoraLoaderModelOnly",
      inputs: { lora_name: "Qwen-Image-Edit-2511-Lightning-4steps-V1.0-bf16.safetensors", strength_model: 1, model: ["5", 0] },
    };
  }

  // uma segunda referência entra nos DOIS encoders — o negativo também precisa
  // enxergar as mesmas imagens, senão as condicionantes ficam de tamanhos
  // diferentes e o sampler recusa
  if (p.imagem2) {
    grafo["13"] = { class_type: "LoadImage", inputs: { image: p.imagem2 } };
    grafo["14"] = { class_type: "FluxKontextImageScale", inputs: { image: ["13", 0] } };
    grafo["14b"] = {
      class_type: "ImageScale",
      inputs: { image: ["14", 0], upscale_method: "lanczos", width: p.largura, height: p.altura, crop: "center" },
    };
    (grafo["20"].inputs as Record<string, unknown>).image2 = ["14b", 0];
    (grafo["21"].inputs as Record<string, unknown>).image2 = ["14b", 0];
  }

  return { grafo, saidas: [{ no: "32", tipo: "imagem" }], segundosEstimados: rapido ? 30 : 180 };
}

// ─────────────────────────────────────────────────────────────────────
// VÍDEO — LTX 2.5
// ─────────────────────────────────────────────────────────────────────

const SIGMAS_BAIXA = "1.0, 0.99375, 0.9875, 0.98125, 0.975, 0.909375, 0.725, 0.421875, 0.0";
const SIGMAS_ALTA = "0.85, 0.7250, 0.4219, 0.0";

const LTX = {
  transformer: "ltx-2.5-22b-distilled-transformer-comfy-int8-convrot.safetensors",
  /** ⚠️ o `-with-proj`. O `e2b` só serve ao realçador; trocar não dá erro, dá vídeo ruim. */
  texto: "gemma4-12b-with-proj-ltx-2.5-comfy-int8-convrot.safetensors",
  vaeVideo: "ltx-2.5-video-vae-bf16.safetensors",
  vaeAudio: "ltx-2.5-audio-vae-bf16.safetensors",
  upscaler: "ltx-2.5-latent-spatial-upscaler-x2-bf16-1.0.safetensors",
} as const;

export interface ParamsVideo {
  positivo: string;
  negativo: string;
  largura: number;
  altura: number;
  fps: number;
  /** já na grade 8n+1 */
  comprimento: number;
  seed?: number;
  prefixo: string;
  /** o arquivo no `input/` do ComfyUI. Sem ele, é texto→vídeo. */
  imagem?: string;
  /** o `strength` da primeira passada — ver `forcaPara` */
  forca?: number;
  /** quantos quadros cortar do começo (o flash da semente com força baixa) */
  cortarInicio?: number;
}

/**
 * LTX 2.5 — duas passadas, com áudio sincronizado.
 *
 * Baixa resolução (metade exata) → upscale latente 2× → refino em alta. Os
 * sigmas e o `LTXVDualCFGGuider(1, 1)` são os do template; mexer neles é mexer
 * na receita que a casa mediu.
 *
 * Serve i2v e t2v: com `imagem`, entram os dois `LTXVImgToVideoInplace`; sem
 * ela, os latentes vazios vão direto para a concatenação — que é exatamente a
 * diferença entre os templates `video_ltx2_5_i2v` e `video_ltx2_5_t2v`.
 */
export function grafoLTX25(p: ParamsVideo): GrafoMontado {
  const seed = p.seed ?? semente();
  const lw = Math.round(p.largura / 2 / 32) * 32;
  const lh = Math.round(p.altura / 2 / 32) * 32;
  const comI2V = !!p.imagem;

  const grafo: Grafo = {
    // modelos
    "1": { class_type: "UNETLoader", inputs: { unet_name: LTX.transformer, weight_dtype: "default" } },
    "2": { class_type: "CLIPLoader", inputs: { clip_name: LTX.texto, type: "ltxv", device: "default" } },
    "3": { class_type: "VAELoader", inputs: { vae_name: LTX.vaeVideo } },
    "4": { class_type: "VAELoader", inputs: { vae_name: LTX.vaeAudio } },
    "5": { class_type: "LatentUpscaleModelLoader", inputs: { model_name: LTX.upscaler } },

    // condicionamento
    "20": { class_type: "CLIPTextEncode", inputs: { text: p.positivo, clip: ["2", 0] } },
    "21": { class_type: "CLIPTextEncode", inputs: { text: p.negativo, clip: ["2", 0] } },
    "22": { class_type: "LTXVConditioning", inputs: { positive: ["20", 0], negative: ["21", 0], frame_rate: p.fps } },

    // 1ª passada — baixa
    "30": { class_type: "EmptyLTXVLatentVideo", inputs: { width: lw, height: lh, length: p.comprimento, batch_size: 1 } },
    "31": { class_type: "LTXVEmptyLatentAudio", inputs: { frames_number: p.comprimento, frame_rate: p.fps, batch_size: 1, audio_vae: ["4", 0] } },
    "33": { class_type: "LTXVConcatAVLatent", inputs: { video_latent: comI2V ? ["32", 0] : ["30", 0], audio_latent: ["31", 0] } },
    "34": { class_type: "RandomNoise", inputs: { noise_seed: seed } },
    "35": { class_type: "KSamplerSelect", inputs: { sampler_name: "euler_ancestral" } },
    "36": { class_type: "ManualSigmas", inputs: { sigmas: SIGMAS_BAIXA } },
    "37": { class_type: "LTXVDualCFGGuider", inputs: { model: ["1", 0], positive: ["22", 0], negative: ["22", 1], video_cfg: 1, audio_cfg: 1 } },
    "38": { class_type: "SamplerCustomAdvanced", inputs: { noise: ["34", 0], guider: ["37", 0], sampler: ["35", 0], sigmas: ["36", 0], latent_image: ["33", 0] } },
    "39": { class_type: "LTXVSeparateAVLatent", inputs: { av_latent: ["38", 0] } },

    // upscale latente
    "40": { class_type: "LTXVLatentUpsampler", inputs: { samples: ["39", 0], upscale_model: ["5", 0], vae: ["3", 0] } },

    // 2ª passada — alta
    "42": { class_type: "LTXVConcatAVLatent", inputs: { video_latent: comI2V ? ["41", 0] : ["40", 0], audio_latent: ["39", 1] } },
    "43": { class_type: "RandomNoise", inputs: { noise_seed: 42 } },
    "44": { class_type: "KSamplerSelect", inputs: { sampler_name: "euler_ancestral" } },
    "45": { class_type: "ManualSigmas", inputs: { sigmas: SIGMAS_ALTA } },
    "46": { class_type: "LTXVDualCFGGuider", inputs: { model: ["1", 0], positive: ["22", 0], negative: ["22", 1], video_cfg: 1, audio_cfg: 1 } },
    "47": { class_type: "SamplerCustomAdvanced", inputs: { noise: ["43", 0], guider: ["46", 0], sampler: ["44", 0], sigmas: ["45", 0], latent_image: ["42", 0] } },
    "48": { class_type: "LTXVSeparateAVLatent", inputs: { av_latent: ["47", 0] } },

    // saída
    "50": { class_type: "VAEDecodeTiled", inputs: { samples: ["48", 0], vae: ["3", 0], tile_size: 768, overlap: 64, temporal_size: 4096, temporal_overlap: 32 } },
    "51": { class_type: "LTXVAudioVAEDecode", inputs: { samples: ["48", 1], audio_vae: ["4", 0] } },
    "52": { class_type: "CreateVideo", inputs: { images: ["50", 0], fps: p.fps, audio: ["51", 0], bit_depth: 8 } },
    /**
     * ⚠️ `codec` é OBRIGATÓRIO e a falta dele só aparece no FIM — depois dos 33
     * nós e dos cinco minutos de GPU. Ver o cabeçalho do arquivo.
     */
    "53": { class_type: "SaveVideo", inputs: { video: ["52", 0], filename_prefix: p.prefixo, format: "auto", codec: "auto" } },
  };

  if (comI2V) {
    grafo["10"] = { class_type: "LoadImage", inputs: { image: p.imagem as string } };
    grafo["11"] = { class_type: "LTXVPreprocess", inputs: { image: ["10", 0], img_compression: 18 } };
    grafo["32"] = {
      class_type: "LTXVImgToVideoInplace",
      inputs: { vae: ["3", 0], image: ["11", 0], latent: ["30", 0], strength: p.forca ?? 0.7, bypass: false },
    };
    grafo["41"] = {
      class_type: "LTXVImgToVideoInplace",
      inputs: { vae: ["3", 0], image: ["11", 0], latent: ["40", 0], strength: 1, bypass: false },
    };
  }

  /**
   * O corte do começo, quando a força é baixa.
   *
   * Medido: com `forca` 0,6 o clipe abre na imagem de partida e só depois entra
   * a cena descrita. Em produção isso é um flash da imagem errada no início do
   * Reel. `Video Slice` opera sobre os QUADROS decodificados, então entra entre
   * o decode e o `CreateVideo`.
   */
  if (p.cortarInicio && p.cortarInicio > 0) {
    grafo["49"] = {
      class_type: "Video Slice",
      inputs: { images: ["50", 0], start_index: p.cortarInicio, length: Math.max(9, p.comprimento - p.cortarInicio) },
    };
    (grafo["52"].inputs as Record<string, unknown>).images = ["49", 0];
  }

  const segundos = (p.comprimento - 1) / p.fps;
  return {
    grafo,
    saidas: [{ no: "53", tipo: "video" }],
    // ~70 s de GPU por segundo de clipe na RTX 5060 Ti, medido nos testes de 13/08
    segundosEstimados: Math.round(segundos * 70),
  };
}

// ─────────────────────────────────────────────────────────────────────
// O despachante
// ─────────────────────────────────────────────────────────────────────

export type IdGrafo = "z-image" | "qwen-2512" | "qwen-edit" | "ernie" | "ltx25";

/**
 * O grafo certo para o id de modelo que veio da composição.
 *
 * ⚠️ `qwen-edit` sem `imagem` cairia num `LoadImage` de arquivo inexistente e
 * quebraria dentro do ComfyUI, num erro que não diz o que faltou. Então a
 * degradação acontece aqui, em português, e é registrada no trabalho.
 */
export function montarGrafo(
  id: IdGrafo,
  params: ParamsImagem | ParamsEdicao | ParamsVideo,
): { montado: GrafoMontado; aviso?: string } {
  if (id === "ltx25") return { montado: grafoLTX25(params as ParamsVideo) };
  if (id === "qwen-edit") {
    const p = params as ParamsEdicao;
    if (!p.imagem) {
      return {
        montado: grafoQwen2512(p),
        aviso: "Sem foto de referência não dá para travar o rosto — gerei no modo caprichado.",
      };
    }
    return { montado: grafoQwenEdit(p) };
  }
  if (id === "ernie") return { montado: grafoErnie(params as ParamsImagem) };
  if (id === "qwen-2512") return { montado: grafoQwen2512(params as ParamsImagem) };
  return { montado: grafoZImage(params as ParamsImagem) };
}
