import SocialAccount from '@/models/SocialAccount';

/**
 * A conta com que a pessoa ENTROU também é uma conta conectada (27/07/2026).
 *
 * O sintoma que trouxe isto: o Ricardo entra no portal com o Google, a foto do
 * Google aparece no menu — e a aba "Contas" mostra o Google como desconectado,
 * pedindo para ele entrar de novo com a mesma conta que acabou de usar. É
 * estranho porque É estranho: nós tínhamos a identidade dele e fingíamos que
 * não.
 *
 * ## O que este vínculo é, e o que ele não é
 *
 * O login social pede `openid email profile`. Isso identifica a pessoa e nada
 * mais — **não** dá permissão de publicar no YouTube, ler inscritos ou tocar
 * em qualquer API do Google. Então o vínculo entra com `status: 'pending'`:
 * conectado como identidade, ainda sem permissão de publicação.
 *
 * Marcar como `active` seria mais bonito na tela e mentira no produto: o botão
 * "publicar" apareceria e falharia com 403 do Google na frente do usuário. A
 * tela mostra "conectado" e, ao lado, o que falta para publicar — que é UM
 * clique de permissão extra, não um novo login, porque a sessão do Google já
 * está aberta no navegador.
 */
export interface IdentidadeGoogle {
  id: string;
  email: string;
  name?: string;
  picture?: string;
}

const ESCOPOS_DE_IDENTIDADE = ['openid', 'email', 'profile'];

/** Escopos que realmente destravam publicação — ver `/api/social/connect/google`. */
export const ESCOPO_YOUTUBE = 'https://www.googleapis.com/auth/youtube.readonly';

export async function vincularGoogleDoLogin(userId: unknown, google: IdentidadeGoogle): Promise<void> {
  try {
    const existente = await SocialAccount.findOne({ userId, platform: 'google' });

    // Se já existe um vínculo COM permissão (veio do fluxo de conexão social),
    // o login não pode rebaixá-lo: quem entrou hoje não perdeu o YouTube que
    // autorizou ontem.
    if (existente && existente.status === 'active') {
      existente.username = google.email;
      if (google.picture) existente.metadata.profilePictureUrl = google.picture;
      await existente.save();
      return;
    }

    await SocialAccount.findOneAndUpdate(
      { userId, platform: 'google' },
      {
        $set: {
          platformUserId: google.id,
          username: google.email,
          profileUrl: '',
          status: 'pending',
          isActive: true,
          scopes: ESCOPOS_DE_IDENTIDADE,
          'metadata.profilePictureUrl': google.picture || '',
        },
        $setOnInsert: { userId, platform: 'google' },
      },
      { upsert: true, new: true }
    );
  } catch (error) {
    // Um vínculo que falha não pode derrubar o login — a pessoa entra, e a aba
    // Contas mostra o Google como não conectado, que é o estado anterior.
    console.error('[social-identity] falha ao vincular Google do login:', error);
  }
}
