"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import {
  ChevronRight,
  MessageCircle,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";

const phoneNumber = "5521971908530";

/**
 * As três mensagens prontas. O TEXTO vem das mensagens (`WhatsApp.quick1..3`)
 * porque é ele que entra no WhatsApp — quem lê o site em inglês precisa abrir a
 * conversa em inglês, senão o primeiro contato já sai errado.
 */
const CHAVES_RAPIDAS = ["quick1", "quick2", "quick3"] as const;

const CHAVE_ACOPLADO = "fayai:whatsapp-acoplado";
/**
 * Onde o botão acoplado deve pousar.
 *
 * O componente é montado como irmão do rodapé, então acoplar "onde ele está"
 * o joga DEPOIS da grade de links. O pedido era entre o rodapé e os botões —
 * quem quiser esse encaixe declara um elemento com este id ali. Sem o encaixe
 * o botão acopla no próprio lugar, que continua resolvendo o problema real
 * (parar de flutuar sobre a leitura) em qualquer página.
 */
const ID_ENCAIXE = "wpp-acoplado";

/**
 * O rodapé está à vista?
 *
 * A versão anterior media a sobreposição e **subia** o botão — o que o mantinha
 * flutuando por cima do conteúdo, só que mais alto. Era o oposto do pedido: no
 * celular o card continuava atravessado na leitura. Agora a resposta é
 * binária, porque a decisão é binária: chegou ao fim da página, o botão sai do
 * ar e assume um lugar próprio no fluxo.
 */
function useRodapeAVista() {
  const [aVista, setAVista] = useState(false);

  useEffect(() => {
    const rodape = document.querySelector("footer");
    if (!rodape) return;

    const observador = new IntersectionObserver(
      ([entrada]) => setAVista(entrada.isIntersecting),
      { rootMargin: "0px 0px -8% 0px" }
    );
    observador.observe(rodape);
    return () => observador.disconnect();
  }, []);

  return aVista;
}

/**
 * A escolha do visitante de acoplar o botão, guardada entre páginas.
 *
 * Quem clicou no X disse "não quero isto flutuando"; devolver o card flutuando
 * na página seguinte é ignorar o que a pessoa acabou de pedir. Lido só depois
 * da montagem — `localStorage` não existe no servidor e ler durante o render
 * daria divergência de hidratação.
 */
function useEscolhaAcoplado(): [boolean, () => void] {
  const [acoplado, setAcoplado] = useState(false);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(CHAVE_ACOPLADO) === "1") setAcoplado(true);
    } catch {
      /* navegador com armazenamento bloqueado: segue flutuando, sem quebrar */
    }
  }, []);

  const acoplar = () => {
    setAcoplado(true);
    try {
      window.localStorage.setItem(CHAVE_ACOPLADO, "1");
    } catch {
      /* idem */
    }
  };

  return [acoplado, acoplar];
}

export function WhatsAppButton() {
  const t = useTranslations("WhatsApp");
  const [isOpen, setIsOpen] = useState(false);
  const rodapeAVista = useRodapeAVista();
  const [escolheuAcoplar, acoplar] = useEscolhaAcoplado();

  /** Acoplado por escolha, ou porque a página acabou. */
  const acoplado = escolheuAcoplar || rodapeAVista;

  const [encaixe, setEncaixe] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setEncaixe(acoplado ? document.getElementById(ID_ENCAIXE) : null);
  }, [acoplado]);

  const links = useMemo(
    () =>
      CHAVES_RAPIDAS.map((chave) => {
        const message = t(chave);
        return {
          message,
          href: `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`,
        };
      }),
    [t]
  );

  const conteudo = (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        opacity: { duration: 0.5, delay: acoplado ? 0 : 0.6 },
        scale: { duration: 0.5, delay: acoplado ? 0 : 0.6 },
      }}
      className={
        // Dentro do encaixe do rodapé a largura e o respiro já vêm do
        // contêiner; repetir margem aqui empurra o botão para cima da grade.
        encaixe
          ? "relative z-10 flex w-full flex-col items-stretch gap-3"
          : acoplado
            ? "relative z-10 mx-auto flex w-full max-w-5xl flex-col items-stretch gap-3 px-4 pb-6 sm:px-8"
            : "fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3"
      }
    >
      {isOpen && (
        <div className={`${acoplado ? "w-full" : "w-[320px]"} max-w-[calc(100vw-2rem)] overflow-hidden rounded-[28px] border border-border bg-[linear-gradient(180deg,rgba(10,16,28,0.94),rgba(3,7,18,0.98))] shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-2xl`}>
          <div className="border-b border-white/8 bg-[linear-gradient(135deg,rgba(16,185,129,0.22),rgba(6,95,70,0.08))] p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-500/15">
                  <MessageCircle className="h-5 w-5 text-green-300" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-green-200/80">{t("brand")}</p>
                  <h3 className="mt-1 text-lg font-bold text-white">{t("title")}</h3>
                  <p className="mt-1 text-sm leading-6 text-green-50/75">
                    {t("subtitle")}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-full border border-border bg-secondary p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
                aria-label={t("close")}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="space-y-3 p-4">
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-secondary">
                  <UserRound className="h-4 w-4 text-white/80" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{t("humanTitle")}</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {t("humanBody")}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {links.map((item) => (
                <a
                  key={item.message}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 transition hover:border-green-400/30 hover:bg-green-500/5"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-xl bg-green-500/10">
                      <Sparkles className="h-4 w-4 text-green-300" />
                    </div>
                    <span className="text-sm leading-5 text-white/85">{item.message}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-green-300 transition group-hover:translate-x-0.5" />
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="relative">
        {/* O X no canto superior esquerdo NÃO fecha: acopla. Fechar de vez
            esconderia o atendimento, que é o que a página quer oferecer; o
            que incomoda é ele flutuar sobre o texto, e é só isso que sai. */}
        {!acoplado && (
          <button
            type="button"
            onClick={() => {
              acoplar();
              setIsOpen(false);
            }}
            title={t("dockTitle")}
            aria-label={t("dockAria")}
            className="absolute -left-2 -top-2 z-10 grid h-7 w-7 place-items-center rounded-full border border-white/15 bg-[#0b1220] text-white/60 shadow-lg transition hover:text-white hover:border-white/35"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}

        <button
          type="button"
          onClick={() => setIsOpen((current) => !current)}
          className={`group flex items-center gap-3 rounded-full border border-green-400/20 bg-[linear-gradient(135deg,rgba(22,163,74,0.95),rgba(20,184,166,0.92))] px-5 py-3 text-white shadow-[0_18px_50px_rgba(22,163,74,0.28)] transition hover:scale-[1.02] ${
            acoplado ? "w-full justify-center" : ""
          }`}
          aria-label={t("openAria")}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
            <MessageCircle className="h-5 w-5" />
          </div>
          <div className={acoplado ? "text-left" : "hidden text-left sm:block"}>
            <div className="text-xs uppercase tracking-[0.18em] text-white/75">{t("kicker")}</div>
            <div className="text-sm font-semibold">{t("brand")}</div>
          </div>
        </button>
      </div>
    </motion.div>
  );

  return encaixe ? createPortal(conteudo, encaixe) : conteudo;
}
