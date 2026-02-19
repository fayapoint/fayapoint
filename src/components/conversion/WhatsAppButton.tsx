"use client";

import { MessageCircle } from "lucide-react";

export function WhatsAppButton() {
  const phoneNumber = "5521971908530";
  const message = encodeURIComponent(
    "Olá! Gostaria de saber mais sobre os cursos de IA da FayaPoint."
  );

  return (
    <a
      href={`https://wa.me/${phoneNumber}?text=${message}`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 group"
      aria-label="Falar no WhatsApp"
    >
      <div className="flex items-center gap-2 pl-4 pr-5 py-3">
        <MessageCircle className="w-6 h-6" />
        <span className="text-sm font-semibold hidden sm:inline">
          WhatsApp
        </span>
      </div>
    </a>
  );
}
