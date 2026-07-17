import type { SubscriptionPlan } from "@/lib/course-tiers";

/**
 * Studio AI — catálogo único de modelos (Fase 4, 17/07/2026).
 * Fonte compartilhada entre a API (/api/ai/generate-image) e a UI do Studio.
 * Thumbnails de exemplo por modelo: /portal/studio/<id>.webp (geradas com o
 * MESMO prompt de referência em cada modelo para mostrar a diferença real).
 */

export type StudioModel = {
  id: string;
  /** id do modelo no OpenRouter */
  orModel: string;
  name: string;
  /** o que o modelo é */
  description: string;
  /** quando usar (explicação breve de uso — item 4.4) */
  uso: string;
  /** plano mínimo */
  minPlan: SubscriptionPlan;
  /** aceita imagem de referência (edição/consistência — item 4.3) */
  supportsEdit?: boolean;
  badge?: string;
};

/* IDs verificados no catálogo real do OpenRouter em 17/07/2026 —
   Flux/SD/Recraft SAÍRAM do chat-completions (400 invalid model ID). */
export const STUDIO_MODELS: StudioModel[] = [
  {
    id: "nano-banana-1",
    orModel: "google/gemini-2.5-flash-image",
    name: "Nano Banana",
    description: "Rápido, gratuito e confiável",
    uso: "Posts do dia a dia, rascunhos e testes de ideia — ótimo acabamento.",
    minPlan: "free",
    badge: "Grátis",
  },
  {
    id: "gemini-flash-lite",
    orModel: "google/gemini-3.1-flash-lite-image",
    name: "Gemini 3.1 Lite",
    description: "A nova geração, versão ligeira",
    uso: "Volume: muitas variações rápidas para escolher a melhor.",
    minPlan: "free",
    badge: "Grátis",
  },
  {
    id: "gemini-flash",
    orModel: "google/gemini-3.1-flash-image",
    name: "Gemini 3.1 Flash",
    description: "Nova geração com mais qualidade",
    uso: "Imagens de redes sociais com acabamento superior e boa velocidade.",
    minPlan: "explorador",
  },
  {
    id: "gemini-pro-image",
    orModel: "google/gemini-3-pro-image",
    name: "Gemini 3 Pro",
    description: "Alta qualidade estável do Google",
    uso: "Peças importantes: detalhes, composição e texto dentro da imagem.",
    minPlan: "profissional",
  },
  {
    id: "nano-banana-pro",
    orModel: "google/gemini-3-pro-image-preview",
    name: "Nano Banana Pro",
    description: "Qualidade máxima + edição",
    uso: "EDIÇÃO e consistência: envie uma referência e mantenha o personagem.",
    minPlan: "profissional",
    supportsEdit: true,
    badge: "Omni",
  },
  {
    id: "gpt-5-image-mini",
    orModel: "openai/gpt-5-image-mini",
    name: "GPT Image Mini",
    description: "O gerador da OpenAI, versão ágil",
    uso: "Composições criativas e instruções em linguagem natural.",
    minPlan: "profissional",
  },
  {
    id: "gpt-image-2",
    orModel: "openai/gpt-5.4-image-2",
    name: "GPT Image 2",
    description: "O topo de linha da OpenAI",
    uso: "Quando a peça precisa impressionar: máxima fidelidade ao pedido.",
    minPlan: "expert",
    badge: "Novo",
  },
];

/** Cota DIÁRIA de gerações por plano (item 4.1/4.2). */
export const DAILY_IMAGE_QUOTA: Record<SubscriptionPlan, number> = {
  free: 2,
  explorador: 15,
  profissional: 40,
  expert: 120,
};

const PLAN_ORDER: SubscriptionPlan[] = ["free", "explorador", "profissional", "expert"];

export function planAtLeast(plan: SubscriptionPlan, min: SubscriptionPlan): boolean {
  return PLAN_ORDER.indexOf(plan) >= PLAN_ORDER.indexOf(min);
}

export function getStudioModel(id: string): StudioModel | undefined {
  return STUDIO_MODELS.find((m) => m.id === id);
}
