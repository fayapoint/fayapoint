import type { ISocialAccount } from '@/models/SocialAccount';
import type { ISocialPost } from '@/models/SocialPost';

/**
 * Publicador USS — leva um SocialPost do Mongo para a rede social de verdade.
 * V1 (14/07/2026): Facebook Pages (texto/foto) e Instagram Business (foto).
 * Os tokens de página vêm do OAuth já existente (connect/facebook) e não
 * expiram enquanto a conexão do usuário for válida.
 */

const GRAPH_API = 'https://graph.facebook.com/v21.0';

export interface PublishResult {
  ok: boolean;
  platformPostId?: string;
  error?: string;
}

/** Junta conteúdo + hashtags no formato de legenda da plataforma */
export function buildCaption(post: Pick<ISocialPost, 'content' | 'hashtags'>): string {
  const tags = (post.hashtags || [])
    .map((h) => (h.startsWith('#') ? h : `#${h}`))
    .join(' ');
  return tags ? `${post.content}\n\n${tags}` : post.content;
}

async function graphPost(path: string, params: Record<string, string>): Promise<{ id?: string; error?: { message: string } }> {
  const res = await fetch(`${GRAPH_API}/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params).toString(),
  });
  return res.json().catch(() => ({ error: { message: `HTTP ${res.status} sem corpo JSON` } }));
}

async function publishToFacebookPage(account: ISocialAccount, post: ISocialPost): Promise<PublishResult> {
  const pageId = (account.metadata as { pageId?: string })?.pageId;
  const token = account.accessToken;
  if (!pageId || !token) {
    return { ok: false, error: 'Conta do Facebook sem página conectada — reconecte em Perfil Social.' };
  }

  const caption = buildCaption(post);
  const imageUrl = post.mediaUrls?.[0];

  const result = imageUrl
    ? await graphPost(`${pageId}/photos`, { url: imageUrl, caption, access_token: token })
    : await graphPost(`${pageId}/feed`, { message: caption, access_token: token });

  if (result.id) return { ok: true, platformPostId: result.id };
  return { ok: false, error: result.error?.message || 'Falha desconhecida na Graph API' };
}

async function publishToInstagram(account: ISocialAccount, post: ISocialPost): Promise<PublishResult> {
  const igUserId = account.platformUserId;
  const token = account.accessToken;
  if (!igUserId || !token) {
    return { ok: false, error: 'Conta do Instagram não conectada — reconecte em Perfil Social.' };
  }
  const imageUrl = post.mediaUrls?.[0];
  if (!imageUrl) {
    return { ok: false, error: 'O Instagram exige uma imagem — adicione uma URL de mídia ao post.' };
  }

  // Fluxo oficial em 2 passos: cria o container e publica
  const container = await graphPost(`${igUserId}/media`, {
    image_url: imageUrl,
    caption: buildCaption(post),
    access_token: token,
  });
  if (!container.id) {
    return { ok: false, error: container.error?.message || 'Falha ao criar o container de mídia' };
  }

  const published = await graphPost(`${igUserId}/media_publish`, {
    creation_id: container.id,
    access_token: token,
  });
  if (published.id) return { ok: true, platformPostId: published.id };
  return { ok: false, error: published.error?.message || 'Falha ao publicar o container' };
}

/**
 * Publica um post na plataforma da conta. NÃO altera o documento no Mongo —
 * o chamador decide como persistir o resultado (status, platformPostId, erro).
 */
export async function publishSocialPost(account: ISocialAccount, post: ISocialPost): Promise<PublishResult> {
  try {
    switch (post.platform) {
      case 'facebook':
        return await publishToFacebookPage(account, post);
      case 'instagram':
        return await publishToInstagram(account, post);
      default:
        return { ok: false, error: `Publicação em ${post.platform} ainda não é suportada — em breve.` };
    }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Erro inesperado ao publicar' };
  }
}
