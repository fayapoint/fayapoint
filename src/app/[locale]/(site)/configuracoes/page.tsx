import { redirect } from "next/navigation";

// Configurações vivia duplicada (perfil/senha/notificações/tema) e criava
// ambiguidade com Minha Conta. Unificado em 14/07/2026: a casa única é
// /portal/conta, aba Preferências.
export default function ConfiguracoesPage() {
  redirect("/portal/conta?tab=preferencias");
}
