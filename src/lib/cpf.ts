/**
 * CPF — normalizar, validar e formatar (10/08/2026).
 *
 * ## Por que o CPF virou obrigatório
 *
 * Ricardo: *"tem que requerer o cpf, um cpf por conta"*. Três motivos que se
 * somam:
 *
 * 1. **Pagamento** — a Asaas exige `cpfCnpj` para criar cliente e emitir
 *    cobrança. Ele já era coletado no checkout, tarde e às pressas, no pior
 *    momento (com o cartão na mão).
 * 2. **Identidade** — e-mail é infinito e grátis; CPF não é. É ele que impede
 *    a mesma pessoa de abrir cinco contas para pegar cinco vezes o crédito de
 *    boas-vindas e a cota diária de imagem.
 * 3. **Recibo** — nota e recibo saem em nome de um documento, não de um login.
 *
 * ## O que este arquivo NÃO faz
 *
 * Não consulta a Receita. O dígito verificador prova que o número é
 * *bem-formado*, não que existe nem que é de quem digitou. Isso basta para o
 * propósito daqui (barrar erro de digitação e número inventado na sequência) e
 * é o mesmo nível de garantia que a Asaas exige na criação do cliente.
 */

/** Só os dígitos. É esta forma que vai para o banco e para o índice único. */
export function normalizarCpf(valor: string): string {
  return (valor || '').replace(/\D/g, '');
}

/** `12345678909` → `123.456.789-09`. Entrada parcial sai parcial (para máscara). */
export function formatarCpf(valor: string): string {
  const d = normalizarCpf(valor).slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

/**
 * Dígito verificador, os dois.
 *
 * ⚠️ A rejeição dos onze dígitos repetidos não é preciosismo: `11111111111`
 * PASSA na conta dos dígitos verificadores. Sem essa linha, o CPF mais óbvio de
 * inventar seria aceito, e como o índice é único ele travaria o cadastro de
 * todo mundo que viesse depois com a mesma ideia.
 */
export function cpfValido(valor: string): boolean {
  const cpf = normalizarCpf(valor);
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  const digito = (ate: number): number => {
    let soma = 0;
    for (let i = 0; i < ate; i++) {
      soma += Number(cpf[i]) * (ate + 1 - i);
    }
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };

  return digito(9) === Number(cpf[9]) && digito(10) === Number(cpf[10]);
}

/** Para a tela: `123.***.**9-09`. Nunca mostre o documento inteiro de volta. */
export function mascararCpf(valor: string): string {
  const d = normalizarCpf(valor);
  if (d.length !== 11) return '';
  return `${d.slice(0, 3)}.***.***-${d.slice(9)}`;
}

/** Normaliza e-mail do jeito que o índice único espera: minúsculo e sem espaço. */
export function normalizarEmail(valor: string): string {
  return (valor || '').trim().toLowerCase();
}

const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

export function emailValido(valor: string): boolean {
  return RE_EMAIL.test(normalizarEmail(valor));
}
