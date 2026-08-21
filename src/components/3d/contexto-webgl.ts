"use client";

import { useCallback, useEffect, useRef } from "react";
import type { WebGLRenderer } from "three";

/**
 * Devolve o contexto WebGL quando a peça sai de cena.
 *
 * ── Por que isto existe ────────────────────────────────────────────────────
 *
 * Contexto WebGL é recurso escasso: o Chrome mantém cerca de **16 vivos por
 * aba** e, ao passar do teto, mata os mais antigos. É daí que sai o
 * `THREE.WebGLRenderer: Context Lost.` repetido no console de páginas que nem
 * 3D pesado têm.
 *
 * O logo do cabeçalho é o caso: ele monta e desmonta um `<Canvas>` a cada
 * passada de cursor e, sozinho, **a cada 10–20 segundos**, em toda página do
 * site. Meia dúzia de minutos de navegação estoura o teto.
 *
 * ── O que resolve, e o que não ─────────────────────────────────────────────
 *
 * `gl.dispose()` — o que o r3f já chama no desmonte — libera as coisas do
 * three (geometrias, texturas, programas), **não o contexto**. Quem devolve o
 * contexto na hora é `WEBGL_lose_context.loseContext()`, e é isso que
 * `forceContextLoss()` chama. Sem ele o contexto fica pendurado até o coletor
 * de lixo do navegador se lembrar dele — que é tarde demais quando um novo
 * nasce a cada 15 segundos.
 *
 * ── O `preventDefault` e por que ele tem hora para parar ───────────────────
 *
 * Enquanto a peça está em cena, `preventDefault()` no `webglcontextlost` é o
 * que **permite ao navegador restaurar** o contexto (o three reinicializa
 * sozinho no `webglcontextrestored`). Sem ele a perda é definitiva e o canvas
 * fica vazio até a página recarregar.
 *
 * Na saída o `preventDefault` tem de parar: `forceContextLoss()` dispara o
 * mesmo evento, e impedir o padrão ali faria o navegador restaurar justamente
 * o contexto que estamos devolvendo.
 *
 * Uso: `const aoCriar = useContextoWebGL()` e `<Canvas onCreated={aoCriar}>`.
 */
export function useContextoWebGL() {
  const renderizador = useRef<WebGLRenderer | null>(null);
  const saindo = useRef(false);

  const aoCriar = useCallback(({ gl }: { gl: WebGLRenderer }) => {
    renderizador.current = gl;
    gl.domElement.addEventListener("webglcontextlost", (e) => {
      if (saindo.current) return;
      e.preventDefault();
    });
  }, []);

  useEffect(
    () => () => {
      const gl = renderizador.current;
      renderizador.current = null;
      if (!gl) return;
      saindo.current = true;
      try {
        gl.forceContextLoss();
      } catch {
        // Navegador sem a extensão: não há o que devolver, e não há o que
        // quebrar — o `dispose` abaixo continua valendo.
      }
      gl.dispose();
    },
    []
  );

  return aoCriar;
}
