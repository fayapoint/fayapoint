"use client";

import { useMemo, useState } from "react";
import {
  ChevronRight,
  MessageCircle,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";

const phoneNumber = "5521971908530";

const quickMessages = [
  "Olá! Quero entender qual plano faz mais sentido para mim.",
  "Olá! Quero liberar o curso grátis do mês e conhecer a plataforma.",
  "Olá! Quero ajuda para escolher meus cursos e certificações deste mês.",
];

export function WhatsAppButton() {
  const [isOpen, setIsOpen] = useState(false);

  const links = useMemo(
    () =>
      quickMessages.map((message) => ({
        message,
        href: `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`,
      })),
    []
  );

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {isOpen && (
        <div className="w-[320px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(10,16,28,0.94),rgba(3,7,18,0.98))] shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
          <div className="border-b border-white/8 bg-[linear-gradient(135deg,rgba(16,185,129,0.22),rgba(6,95,70,0.08))] p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-500/15">
                  <MessageCircle className="h-5 w-5 text-green-300" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-green-200/80">WhatsApp FayAi</p>
                  <h3 className="mt-1 text-lg font-bold text-white">Converse com nossa equipe</h3>
                  <p className="mt-1 text-sm leading-6 text-green-50/75">
                    Tire dúvidas sobre planos, curso grátis do mês, matrícula e certificação.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-full border border-white/10 bg-white/5 p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
                aria-label="Fechar WhatsApp"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="space-y-3 p-4">
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-white/5">
                  <UserRound className="h-4 w-4 text-white/80" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Atendimento humano</p>
                  <p className="mt-1 text-xs leading-5 text-gray-400">
                    Abra uma conversa já com o contexto certo para continuar no WhatsApp sem atrito.
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

      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="group flex items-center gap-3 rounded-full border border-green-400/20 bg-[linear-gradient(135deg,rgba(22,163,74,0.95),rgba(20,184,166,0.92))] px-5 py-3 text-white shadow-[0_18px_50px_rgba(22,163,74,0.28)] transition hover:scale-[1.02]"
        aria-label="Abrir WhatsApp"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
          <MessageCircle className="h-5 w-5" />
        </div>
        <div className="hidden text-left sm:block">
          <div className="text-xs uppercase tracking-[0.18em] text-white/75">Atendimento</div>
          <div className="text-sm font-semibold">WhatsApp FayAi</div>
        </div>
      </button>
    </div>
  );
}
