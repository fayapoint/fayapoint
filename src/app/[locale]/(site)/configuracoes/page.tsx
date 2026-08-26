import { redirect } from "next/navigation";

// Configurações vivia duplicada (perfil/senha/notificações/tema) e criava
// ambiguidade com Minha Conta. Unificado em 14/07/2026: a casa única é
// /portal/conta, aba Preferências.
//
// ⚠️ O redirecionamento de verdade está no `redirects()` do `next.config.ts`.
// Sem parâmetro nenhum, esta página é 100% estática — e página estática não
// carrega código de status: até 26/08/2026 ela respondia 200 com 210 KB de
// HTML e um `<meta http-equiv="refresh">` no corpo.
export default function ConfiguracoesPage() {
  redirect("/portal/conta?tab=preferencias");
}
