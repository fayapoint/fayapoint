"use client";

import { useEffect } from "react";
import { lerRefGuardado } from "@/lib/attribution";
import { useUser } from "@/contexts/UserContext";

/**
 * FECHA O VÍNCULO DE INDICAÇÃO ASSIM QUE EXISTE UMA SESSÃO — 06/09/2026.
 *
 * O código de quem indicou é guardado no navegador quando a pessoa chega por
 * `/f/<codigo>` ou `?ref=`, e só pode virar vínculo quando existe conta. Entre
 * uma coisa e outra podem passar 90 dias.
 *
 * ## Por que aqui, e não no fim do cadastro
 *
 * Porque há dois cadastros e um deles sai do site. O do e-mail termina em
 * `/registro`, onde daria para chamar direto; o do Google sai para o
 * `accounts.google.com`, volta pelo `api/auth/google-callback` — que redireciona
 * do SERVIDOR — e aterrissa no portal sem nunca voltar à tela de registro. Um
 * gancho na página de cadastro cobriria metade das contas, e a metade
 * descoberta seria justamente a que a gente acabou de tornar a mais fácil.
 *
 * Montado ao lado do `AttributionTracker`, no layout: onde há sessão, há
 * tentativa.
 *
 * ## Uma tentativa por código, e ela é silenciosa
 *
 * A marca de consumido é gravada ANTES da resposta chegar. Se a rota falhar por
 * rede, o vínculo se perde — e é o certo: repetir a cada navegação transformaria
 * um código inexistente em uma consulta ao banco por página, para sempre. O
 * caminho de recuperação é a pessoa digitar o código, que o painel oferece.
 */
const MARCA = "fayai_ref_consumido_v1";

export function VinculoDeIndicacao() {
  const { user } = useUser();

  useEffect(() => {
    if (!user) return;

    const codigo = lerRefGuardado();
    if (!codigo) return;

    let jaFeito: string | null = null;
    try {
      jaFeito = window.localStorage.getItem(MARCA);
    } catch {
      // Navegador com armazenamento bloqueado: segue sem a marca. O índice
      // único em `Indicacao.indicadoUserId` é quem impede o duplicado de fato.
    }
    if (jaFeito === codigo) return;

    try {
      window.localStorage.setItem(MARCA, codigo);
    } catch {
      // idem
    }

    fetch("/api/fundadores/vincular", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ codigo, origem: "cookie" }),
    }).catch(() => {
      // Silencioso de propósito: o vínculo é um bônus do cadastro, nunca uma
      // condição dele. Falhar aqui não pode acender erro na tela de quem
      // acabou de criar conta.
    });
  }, [user]);

  return null;
}
