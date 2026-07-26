"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AssuntoAberto } from "@/components/radar/ModalAssunto";

/**
 * A vida do painel de detalhe.
 *
 * O painel responde ao **hover** — passar o mouse num assunto é espiar —, mas
 * espiar não pode virar um estroboscópio: sem freio, atravessar a lista faria
 * o painel entrar e sair dez vezes em dois segundos.
 *
 * Por isso são três tempos, e cada um resolve um problema diferente:
 *
 * - **250 ms para abrir.** Filtra o mouse que só está de passagem.
 * - **2 s de aviso antes de trocar.** Quando outro assunto pede a vez, o painel
 *   atual pisca e segura. Quem passou o mouse sem querer tem tempo de voltar;
 *   quem quis mesmo trocar vê que a troca foi entendida.
 * - **9 s de permanência.** Tempo generoso para ler sem precisar fechar nada.
 *
 * E duas formas de dizer "quero manter": **clicar** no assunto (intenção
 * explícita) ou o **alfinete** no painel. Fixado, nenhum tempo corre.
 */

export type EstadoPainel = "ativo" | "piscando" | "saindo";

/**
 * As formas de um painel nascer e morrer.
 *
 * Existem cinco porque a troca precisa ter **personalidade**: se todo assunto
 * entra e sai igual, a interface vira uma lista com efeito. Variando o gesto, o
 * card passa a ser uma peça própria — desmonta, dobra, desliza — e mexer no
 * radar vira algo que se faz por gosto, não só por informação.
 */
export const VARIANTES = 5;

const MS_ABRIR = 250;
const MS_AVISO = 2000;
const MS_PERMANENCIA = 9000;
const MS_SAIDA = 380;

export function usePainelAssunto() {
  const [assunto, setAssunto] = useState<AssuntoAberto | null>(null);
  const [estado, setEstado] = useState<EstadoPainel>("ativo");
  const [fixado, setFixado] = useState(false);
  /** Qual gesto este painel usa para entrar e sair. */
  const [variante, setVariante] = useState(0);
  const ultimaVariante = useRef(-1);

  /** Sorteia sem repetir a anterior — repetir mata a graça da variedade. */
  const sortearVariante = useCallback(() => {
    let v = Math.floor(Math.random() * VARIANTES);
    if (v === ultimaVariante.current) v = (v + 1) % VARIANTES;
    ultimaVariante.current = v;
    return v;
  }, []);

  const relogios = useRef<{ abrir?: number; aviso?: number; saida?: number; some?: number }>({});
  const proximo = useRef<AssuntoAberto | null>(null);

  const limpar = (...quais: Array<keyof typeof relogios.current>) => {
    for (const k of quais) {
      if (relogios.current[k]) window.clearTimeout(relogios.current[k]);
      relogios.current[k] = undefined;
    }
  };

  useEffect(() => () => limpar("abrir", "aviso", "saida", "some"), []);

  /** Agenda a saída por inatividade. Fixado não tem prazo. */
  const armarPermanencia = useCallback((fixadoAgora: boolean) => {
    limpar("saida", "some");
    if (fixadoAgora) return;
    relogios.current.saida = window.setTimeout(() => {
      setEstado("saindo");
      relogios.current.some = window.setTimeout(() => {
        setAssunto(null);
        setEstado("ativo");
      }, MS_SAIDA);
    }, MS_PERMANENCIA);
  }, []);

  const mostrar = useCallback(
    (a: AssuntoAberto, fixar: boolean) => {
      limpar("abrir", "aviso", "saida", "some");
      proximo.current = null;
      setVariante(sortearVariante());
      setAssunto(a);
      setEstado("ativo");
      setFixado(fixar);
      armarPermanencia(fixar);
    },
    [armarPermanencia, sortearVariante]
  );

  /**
   * Troca com desmontagem: o painel atual sai pelo seu próprio gesto e só
   * então o novo se monta. Trocar direto fazia o conteúdo pular dentro da
   * mesma placa e apagava a sensação de que cada assunto tem o seu card.
   */
  const trocarComGesto = useCallback(
    (a: AssuntoAberto, fixar: boolean) => {
      limpar("abrir", "aviso", "saida", "some");
      proximo.current = null;
      setEstado("saindo");
      relogios.current.some = window.setTimeout(() => mostrar(a, fixar), MS_SAIDA);
    },
    [mostrar]
  );

  /** Hover num assunto: espiar. */
  const espiar = useCallback(
    (a: AssuntoAberto) => {
      if (fixado) return;

      // Mesmo assunto: só renova o prazo de leitura.
      if (assunto && assunto.titulo === a.titulo) {
        limpar("aviso");
        proximo.current = null;
        setEstado("ativo");
        armarPermanencia(false);
        return;
      }

      if (!assunto) {
        limpar("abrir");
        relogios.current.abrir = window.setTimeout(() => mostrar(a, false), MS_ABRIR);
        return;
      }

      // Já há um painel: avisa que vai trocar e segura por um instante.
      if (proximo.current?.titulo === a.titulo) return;
      proximo.current = a;
      setEstado("piscando");
      limpar("aviso", "saida", "some");
      relogios.current.aviso = window.setTimeout(() => {
        const alvo = proximo.current;
        if (alvo) trocarComGesto(alvo, false);
      }, MS_AVISO);
    },
    [assunto, fixado, mostrar, trocarComGesto, armarPermanencia]
  );

  /** Saiu de cima sem escolher nada: só cancela a abertura que ia acontecer. */
  const largar = useCallback(() => {
    limpar("abrir");
  }, []);

  /** Clique: intenção explícita — abre e fixa. Se já havia um painel, o
   *  anterior se desmonta primeiro. */
  const abrir = useCallback(
    (a: AssuntoAberto) => {
      if (assunto && assunto.titulo !== a.titulo) trocarComGesto(a, true);
      else mostrar(a, true);
    },
    [assunto, mostrar, trocarComGesto]
  );

  const fechar = useCallback(() => {
    limpar("abrir", "aviso", "saida", "some");
    proximo.current = null;
    setFixado(false);
    setEstado("saindo");
    relogios.current.some = window.setTimeout(() => {
      setAssunto(null);
      setEstado("ativo");
    }, MS_SAIDA);
  }, []);

  const alternarPin = useCallback(() => {
    setFixado((f) => {
      const novo = !f;
      limpar("aviso");
      proximo.current = null;
      setEstado("ativo");
      armarPermanencia(novo);
      return novo;
    });
  }, [armarPermanencia]);

  return { assunto, estado, fixado, variante, espiar, largar, abrir, fechar, alternarPin };
}
