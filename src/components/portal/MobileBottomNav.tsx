"use client";
import { useT } from "@/i18n/dicionario";
import { BotaoIdioma } from "@/components/layout/BotaoIdioma";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  BookOpen,
  Image as ImageIcon,
  Trophy,
  Store,
  Menu,
  X,
  Crown,
  Flame,
  Target,
  Settings,
  Users,
  ShoppingCart,
  Palette,
  Bot,
  Gift,
  Download,
  ShoppingBag,
  Home,
  UserCog,
  Award,
  Share2,
  Gamepad2,
} from "lucide-react";
import { SaldoDeCreditos } from "@/components/portal/SaldoDeCreditos";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ThemeSwitcher } from "@/components/theme/ThemeSwitcher";
import Link from "next/link";

interface MobileBottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  plan: string;
  stats: {
    level: number;
    xp: number;
    streak: number;
  };
}

const MAIN_NAV_ITEMS = [
  { id: "dashboard", icon: LayoutDashboard, label: "Início" },
  { id: "courses", icon: BookOpen, label: "Cursos" },
  { id: "studio", icon: ImageIcon, label: "Studio" },
  { id: "store", icon: Store, label: "Loja" },
];

/**
 * ⚠️ Esta lista tem que cobrir o `MENU_ITEMS` do `DashboardSidebar`.
 *
 * Ricardo, 03/08/2026: *"quando vamos no menu mais, não temos acesso a tudo
 * que o dashboard oferece"*. Estava certo — o menu lateral tinha 17 itens e o
 * celular, 15: faltavam **Certificados** e **Perfil Social (USS)**. Quem entra
 * pelo telefone não deveria descobrir que existe uma parte do produto só
 * quando abre o computador.
 *
 * Ao acrescentar item na barra lateral, acrescente aqui também — os quatro do
 * `MAIN_NAV_ITEMS` mais estes precisam somar o menu inteiro.
 */
const MORE_NAV_ITEMS = [
  { id: "games", icon: Gamepad2, label: "Minigames", badge: "NOVO" },
  { id: "galeria", icon: ImageIcon, label: "Galeria", badge: "NOVO" },
  { id: "pod-store", icon: Palette, label: "Loja POD", badge: "NOVO" },
  { id: "cart", icon: ShoppingCart, label: "Carrinho" },
  { id: "social", icon: Share2, label: "Perfil Social", badge: "USS" },
  { id: "profile", icon: Crown, label: "Meu Perfil" },
  { id: "certificates", icon: Award, label: "Certificados" },
  { id: "assistant", icon: Bot, label: "Assistente IA", proOnly: true, badge: "PRO" },
  { id: "achievements", icon: Trophy, label: "Conquistas" },
  { id: "leaderboard", icon: Users, label: "Ranking" },
  { id: "challenges", icon: Target, label: "Desafios" },
  { id: "resources", icon: Download, label: "Recursos" },
  { id: "history", icon: ShoppingBag, label: "Histórico" },
  { id: "rewards", icon: Gift, label: "Recompensas", proOnly: true, badge: "PRO" },
];

export function MobileBottomNav({ activeTab, onTabChange, plan, stats }: MobileBottomNavProps) {
  const T = useT();
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const pathname = usePathname();
  const locale = pathname?.split("/").find((part) => part === "pt-BR" || part === "en");
  const cubeHref = locale ? `/${locale}` : "/";
  const accountHref = locale ? `/${locale}/portal/conta` : "/portal/conta";
  // Unificado 14/07: preferências vivem em Minha Conta (Configurações duplicava)
  const settingsHref = locale ? `/${locale}/portal/conta?tab=preferencias` : "/portal/conta?tab=preferencias";
  const isPro = ["pro", "business", "starter", "explorador", "profissional", "expert"].includes(plan);

  const isActiveInMore = MORE_NAV_ITEMS.some(item => item.id === activeTab);

  // iOS-safe scroll lock: position:fixed technique preserves scroll position
  const scrollYRef = useRef(0);
  useEffect(() => {
    if (isMoreOpen) {
      scrollYRef.current = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollYRef.current}px`;
      document.body.style.width = "100%";
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      document.body.style.overflow = "";
      window.scrollTo(0, scrollYRef.current);
    }
    return () => {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      document.body.style.overflow = "";
    };
  }, [isMoreOpen]);

  return (
    <>
      {/* More Menu Overlay */}
      {isMoreOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden touch-none"
          onClick={() => setIsMoreOpen(false)}
        />
      )}

      {/* More Menu Panel */}
      {isMoreOpen && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-16 left-0 right-0 bg-card border-t border-border rounded-t-3xl z-50 md:hidden max-h-[70vh] overflow-y-auto overscroll-contain"
        >
          {/* Header */}
          <div className="sticky top-0 bg-card p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm">
                <Flame className="text-orange-400" size={16} />
                <span className="font-semibold">{stats.streak}</span>
              </div>
              <div className="h-4 w-px bg-border" />
              <div className="flex items-center gap-2 text-sm">
                <span className="text-amber-400 font-bold">Lv.{stats.level}</span>
              </div>
              {/* O saldo entra AQUI porque foi aqui que o Ricardo procurou por
                  ele em 05/08/2026 e não achou — ao lado do nível, no menu que
                  lista tudo o que a conta tem. Ver `SaldoDeCreditos`. */}
              <div className="h-4 w-px bg-border" />
              <SaldoDeCreditos compacto />
            </div>
            <button
              onClick={() => setIsMoreOpen(false)}
              className="p-2 hover:bg-secondary rounded-full"
            >
              <X size={20} />
            </button>
          </div>

          {/* Menu Items */}
          <div className="p-4 grid grid-cols-3 gap-3">
            {MORE_NAV_ITEMS.map((item) => {
              const isActive = activeTab === item.id;
              const isLocked = item.proOnly && !isPro;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (!isLocked) {
                      onTabChange(item.id);
                      setIsMoreOpen(false);
                    }
                  }}
                  disabled={isLocked}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-2xl transition-all",
                    isActive
                      ? "bg-amber-500/20 text-amber-400"
                      : "hover:bg-secondary text-muted-foreground",
                    isLocked && "opacity-40"
                  )}
                >
                  <div className="relative">
                    <item.icon size={24} />
                    {item.badge && (
                      <span className={cn(
                        "absolute -top-1 -right-3 text-[8px] px-1 rounded font-bold",
                        item.badge === "PRO" 
                          ? "bg-yellow-500 text-black" 
                          : "bg-amber-500 text-white"
                      )}>
                        {T(item.badge)}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-medium">{T(item.label)}</span>
                </button>
              );
            })}
          </div>

          {/* Theme */}
          <div className="px-4 pt-3 pb-1 border-t border-border">
            <p className="text-xs text-muted-foreground mb-1.5">Tema</p>
            <ThemeSwitcher />
          </div>

          {/* Quick Links.
              "Ver o site" saiu daqui em 03/08/2026: virou item fixo da barra
              de baixo, onde o dedo o encontra sem abrir gaveta nenhuma. */}
          <div className="p-4 border-t border-border grid grid-cols-2 gap-3">
            <Link href={accountHref} className="min-w-0">
              <button className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-secondary rounded-xl text-muted-foreground hover:bg-white/10 transition">
                <UserCog size={18} />
                <span className="text-sm truncate">{T("Minha Conta")}</span>
              </button>
            </Link>
            <Link href={settingsHref} className="min-w-0">
              <button className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-secondary rounded-xl text-muted-foreground hover:bg-white/10 transition">
                <Settings size={18} />
                <span className="text-sm truncate">Config</span>
              </button>
            </Link>
            {/* No celular a barra lateral não existe, então este é o único
                lugar do portal onde o seletor de idioma cabe. */}
            <div className="col-span-2 flex justify-center pt-1">
              <BotaoIdioma />
            </div>
          </div>
        </motion.div>
      )}

      {/* Bottom Navigation Bar */}
      {/* ⚠️ `h-16` no <nav>, e não só no filho.
          Ricardo, 03/08/2026: *"o menu do footer fica absolutamente colado, sem
          um respiro ou toque final que dê uma boa impressão"*. A causa era
          exata: o <nav> não tinha altura, e o <div> de dentro pedia `h-full` —
          que sem altura no pai não resolve nada. A barra ficava com a altura do
          conteúdo, ~40px, e os ícones encostavam nas duas bordas.
          O painel "Mais" também dependia disso: ele abre em `bottom-16` (64px),
          uma medida que só agora existe de verdade. */}
      <nav
        className="fixed bottom-0 left-0 right-0 h-16 bg-card/95 backdrop-blur-xl border-t border-border z-50 md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="flex items-center justify-around h-full gap-1 px-2 py-1.5">
          {MAIN_NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 flex-1 min-w-0 h-full rounded-xl transition-colors relative",
                  isActive ? "text-amber-400" : "text-muted-foreground"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="mobileActiveTab"
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-amber-500 rounded-b-full"
                  />
                )}
                <item.icon size={19} className={isActive ? "scale-110" : ""} />
                <span className="text-[9px] font-medium leading-none truncate max-w-full">{T(item.label)}</span>
              </button>
            );
          })}

          {/* Voltar ao site.
              Estava só no fim da gaveta "Mais", atrás de três toques — e a
              home é onde mora a maior parte do conteúdo público. Ricardo:
              *"não tem uma forma de voltarmos a página home"*. Tinha, mas
              escondida, que para o dedo dá no mesmo. */}
          <Link href={cubeHref} className="flex-1 min-w-0 h-full">
            <span className="flex h-full flex-col items-center justify-center gap-1 rounded-xl text-muted-foreground transition-colors hover:text-white">
              <Home size={19} />
              <span className="text-[9px] font-medium leading-none truncate max-w-full">Site</span>
            </span>
          </Link>

          {/* More Button */}
          <button
            onClick={() => setIsMoreOpen(!isMoreOpen)}
            className={cn(
              "flex flex-col items-center justify-center gap-1 flex-1 min-w-0 h-full rounded-xl transition-colors relative",
              isMoreOpen || isActiveInMore ? "text-amber-400" : "text-muted-foreground"
            )}
          >
            {(isMoreOpen || isActiveInMore) && (
              <motion.div
                layoutId="mobileActiveTab"
                className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-amber-500 rounded-b-full"
              />
            )}
            <Menu size={19} className={isMoreOpen ? "scale-110" : ""} />
            <span className="text-[9px] font-medium leading-none">{T("Mais")}</span>
          </button>
        </div>
      </nav>
    </>
  );
}
