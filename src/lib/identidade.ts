import User, { type IUser } from '@/models/User';
import { cpfValido, normalizarCpf, normalizarEmail } from '@/lib/cpf';

/**
 * A identidade da conta — e-mails e CPF, num lugar só (10/08/2026).
 *
 * ## As quatro regras, escritas como o Ricardo pediu
 *
 * 1. **Não pode haver duas contas com o mesmo e-mail** — nem como principal,
 *    nem como secundário. O índice único em `emails.email` é a rede; estas
 *    funções são a mensagem legível antes dela.
 * 2. **Um CPF por conta** — índice único esparso em `cpf`.
 * 3. **Vários e-mails por conta** — `emails[]`.
 * 4. **Nunca mais de um CPF na mesma conta** — o campo é escalar de propósito.
 *    Trocar exige apoio humano (ver `definirCpf`): CPF que se troca sozinho não
 *    serve para impedir conta múltipla, que é a razão de ele existir aqui.
 *
 * ## A regra de segurança que não está no pedido, mas decide o desenho
 *
 * **Só e-mail com posse provada entra na busca de login.** Um e-mail digitado à
 * mão é contato; um e-mail que veio de um login social é identidade. Sem essa
 * distinção, escrever o e-mail de outra pessoa na minha conta faria o próximo
 * login dela cair aqui dentro.
 */

export interface ResultadoIdentidade {
  ok: boolean;
  /** Mensagem pronta para a tela — em português, sem jargão de banco. */
  erro?: string;
  /** Código para o cliente reagir sem parsear texto. */
  codigo?: 'invalido' | 'em_uso' | 'ja_tem' | 'nao_encontrado' | 'principal' | 'imutavel';
}

/**
 * Acha a conta de um e-mail, seja ele o principal ou um secundário PROVADO.
 *
 * É esta função que o login social usa. O `verificado: true` no segundo ramo é
 * a trava descrita acima — tirá-lo abre sequestro de conta.
 */
export async function acharPorQualquerEmail(email: string) {
  const alvo = normalizarEmail(email);
  if (!alvo) return null;
  return User.findOne(filtroPorQualquerEmail(alvo));
}

/**
 * O mesmo filtro, cru, para quem precisa encadear `.select()` — o login busca a
 * senha, que é `select: false`. Uma cópia do `$or` escrita à mão no login era
 * onde a regra ia sair de sincronia na primeira mudança.
 */
export function filtroPorQualquerEmail(email: string) {
  const alvo = normalizarEmail(email);
  return {
    $or: [{ email: alvo }, { emailsVerificados: alvo }],
  };
}

/**
 * Este endereço já PERTENCE a alguém?
 *
 * ⚠️ "Pertencer" é posse provada: principal, ou verificado. Um e-mail apenas
 * digitado como contato NÃO reserva nada — se reservasse, eu escreveria o
 * endereço de um estranho na minha conta e ele nunca mais conseguiria se
 * cadastrar nem entrar. Foi assim na primeira versão, e é a razão de
 * `emailsVerificados` existir.
 */
export async function emailEmUso(email: string, exceto?: string) {
  const alvo = normalizarEmail(email);
  const dono = await User.findOne({
    $or: [{ email: alvo }, { emailsVerificados: alvo }],
  }).select('_id');
  if (!dono) return false;
  return exceto ? String(dono._id) !== String(exceto) : true;
}

/**
 * Garante que o e-mail principal também esteja na lista.
 *
 * Sem isto a tela teria de tratar "o principal" como um caso à parte em todo
 * lugar, e o índice único de `emails.email` não protegeria o endereço mais
 * importante de todos.
 */
export function garantirPrincipalNaLista(user: IUser): boolean {
  const principal = normalizarEmail(user.email);
  if (!principal) return false;
  let mudou = false;

  const lista = user.emails || [];
  if (!lista.some((e) => normalizarEmail(e.email) === principal)) {
    user.emails = [
      { email: principal, verificado: !!user.emailVerified, origem: 'login', addedAt: user.createdAt || new Date() },
      ...lista,
    ];
    mudou = true;
  }

  // O principal é sempre posse provada — é por ele que a pessoa entra. Sem
  // isto, uma conta antiga não apareceria no índice de exclusividade e o mesmo
  // endereço poderia ser verificado por outra conta.
  if (!(user.emailsVerificados || []).includes(principal)) {
    user.emailsVerificados = [...(user.emailsVerificados || []), principal];
    mudou = true;
  }

  return mudou;
}

/**
 * Vincula um e-mail a esta conta.
 *
 * `verificado` só vem `true` de quem provou posse — hoje, o retorno do OAuth do
 * Google. Nenhuma rota do usuário passa `true` daqui.
 */
export async function vincularEmail(
  user: IUser,
  email: string,
  opcoes: { verificado: boolean; origem: 'login' | 'google' | 'manual' },
): Promise<ResultadoIdentidade> {
  const alvo = normalizarEmail(email);

  garantirPrincipalNaLista(user);

  /**
   * A exclusividade só é cobrada de quem vai GANHAR poder com o vínculo.
   *
   * - Verificado (veio do OAuth): reserva o endereço, então não pode pertencer
   *   a outra conta.
   * - Manual (contato/recibo): não reserva nada. Ainda assim recusamos quando o
   *   endereço é posse provada de OUTRA conta — ali não é ambiguidade, é o
   *   e-mail de outra pessoa, e listá-lo só geraria recibo indo para o lugar
   *   errado.
   */
  if (await emailEmUso(alvo, String(user._id))) {
    return {
      ok: false,
      erro: 'Este e-mail já pertence a outra conta. Um e-mail não pode estar em duas contas.',
      codigo: 'em_uso',
    };
  }

  const jaTem = (user.emails || []).find((e) => normalizarEmail(e.email) === alvo);
  if (jaTem) {
    // Reentrar com o Google promove um e-mail que estava só como contato — é o
    // único caminho de verificação que existe hoje, e ele tem de funcionar.
    if (opcoes.verificado && !jaTem.verificado) {
      jaTem.verificado = true;
      jaTem.origem = opcoes.origem;
      user.emailsVerificados = [...new Set([...(user.emailsVerificados || []), alvo])];
      await user.save();
      return { ok: true };
    }
    return { ok: false, erro: 'Este e-mail já está nesta conta.', codigo: 'ja_tem' };
  }

  user.emails = [
    ...(user.emails || []),
    { email: alvo, verificado: opcoes.verificado, origem: opcoes.origem, addedAt: new Date() },
  ];
  if (opcoes.verificado) {
    user.emailsVerificados = [...new Set([...(user.emailsVerificados || []), alvo])];
  }
  await user.save();
  return { ok: true };
}

export async function desvincularEmail(user: IUser, email: string): Promise<ResultadoIdentidade> {
  const alvo = normalizarEmail(email);
  if (alvo === normalizarEmail(user.email)) {
    return {
      ok: false,
      erro: 'Este é o e-mail principal da conta. Defina outro como principal antes de removê-lo.',
      codigo: 'principal',
    };
  }
  const antes = (user.emails || []).length;
  user.emails = (user.emails || []).filter((e) => normalizarEmail(e.email) !== alvo);
  if (user.emails.length === antes) return { ok: false, erro: 'E-mail não encontrado.', codigo: 'nao_encontrado' };
  // Sai da lista visível E do índice de exclusividade: um endereço removido
  // precisa ficar livre para a conta certa reivindicá-lo.
  user.emailsVerificados = (user.emailsVerificados || []).filter((e) => normalizarEmail(e) !== alvo);
  await user.save();
  return { ok: true };
}

/**
 * Troca qual e-mail é o principal.
 *
 * ⚠️ Só entre e-mails VERIFICADOS. O principal é a chave de login, o destino do
 * recibo e o que a Asaas recebe: promovê-lo a um endereço não provado seria
 * mover a conta para um lugar onde ninguém demonstrou estar.
 */
export async function definirPrincipal(user: IUser, email: string): Promise<ResultadoIdentidade> {
  const alvo = normalizarEmail(email);
  garantirPrincipalNaLista(user);
  const escolhido = (user.emails || []).find((e) => normalizarEmail(e.email) === alvo);
  if (!escolhido) return { ok: false, erro: 'E-mail não encontrado nesta conta.', codigo: 'nao_encontrado' };
  if (!escolhido.verificado) {
    return {
      ok: false,
      erro: 'Só um e-mail verificado pode ser o principal. Entre uma vez com o Google usando este e-mail.',
      codigo: 'invalido',
    };
  }
  if (await emailEmUso(alvo, String(user._id))) {
    return { ok: false, erro: 'Este e-mail já pertence a outra conta.', codigo: 'em_uso' };
  }
  user.email = alvo;
  user.emailVerified = user.emailVerified || new Date();
  await user.save();
  return { ok: true };
}

/**
 * Grava o CPF.
 *
 * Uma vez, e só uma. Quem já tem CPF gravado não troca sozinho: se trocar
 * fosse livre, a mesma pessoa usaria um documento por conta e o índice único
 * deixaria de significar qualquer coisa. Troca legítima (digitou errado, mudou
 * de titular) passa pelo suporte, que é raro e é o ponto.
 */
export async function definirCpf(user: IUser, valor: string): Promise<ResultadoIdentidade> {
  const cpf = normalizarCpf(valor);
  if (!cpfValido(cpf)) {
    return { ok: false, erro: 'CPF inválido. Confira os números.', codigo: 'invalido' };
  }
  if (user.cpf && user.cpf !== cpf) {
    return {
      ok: false,
      erro: 'Esta conta já tem um CPF cadastrado. Para trocar, fale com o suporte.',
      codigo: 'imutavel',
    };
  }
  if (user.cpf === cpf) return { ok: true };

  const outro = await User.findOne({ cpf }).select('_id');
  if (outro && String(outro._id) !== String(user._id)) {
    return {
      ok: false,
      erro: 'Já existe uma conta com este CPF. Cada pessoa tem uma conta — entre com ela ou fale com o suporte.',
      codigo: 'em_uso',
    };
  }

  user.cpf = cpf;
  user.cpfVerifiedAt = new Date();
  // O checkout da Asaas lê `billing.cpfCnpj`. Manter os dois em sincronia é o
  // que faz o CPF preenchido aqui poupar o formulário lá — se ficassem
  // separados, a pessoa digitaria o mesmo documento duas vezes.
  user.billing = { ...(user.billing || {}), cpfCnpj: cpf };
  await user.save();
  return { ok: true };
}
