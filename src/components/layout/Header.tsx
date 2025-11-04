"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeSwitcher } from "@/components/theme/ThemeSwitcher";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";

const coursesMenu = [
  {
    title: "Iniciante",
    items: [
      { title: "ChatGPT do Zero", href: "/cursos/chatgpt-zero" },
      { title: "Primeiras Automações", href: "/cursos/primeiras-automacoes" },
      { title: "IA para o Dia a Dia", href: "/cursos/ia-dia-a-dia" },
    ],
  },
  {
    title: "Intermediário",
    items: [
      { title: "Prompt Engineering", href: "/cursos/prompt-engineering" },
      { title: "Automação com n8n", href: "/cursos/automacao-n8n" },
      { title: "Midjourney Masterclass", href: "/cursos/midjourney-masterclass" },
    ],
  },
  {
    title: "Avançado",
    items: [
      { title: "Agentes de IA", href: "/cursos/agentes-ia" },
      { title: "RAG e Knowledge Bases", href: "/cursos/rag-knowledge" },
      { title: "IA em Produção", href: "/cursos/ia-producao" },
    ],
  },
];

const toolsMenu = [
  {
    title: "IA Conversacional",
    items: [
      { title: "ChatGPT", href: "/ferramentas/chatgpt" },
      { title: "Claude", href: "/ferramentas/claude" },
      { title: "Gemini", href: "/ferramentas/gemini" },
      { title: "Perplexity", href: "/ferramentas/perplexity" },
    ],
  },
  {
    title: "Criação Visual",
    items: [
      { title: "Midjourney", href: "/ferramentas/midjourney" },
      { title: "DALL-E", href: "/ferramentas/dalle" },
      { title: "Stable Diffusion", href: "/ferramentas/stable-diffusion" },
      { title: "Leonardo AI", href: "/ferramentas/leonardo" },
    ],
  },
  {
    title: "Automação",
    items: [
      { title: "n8n", href: "/ferramentas/n8n" },
      { title: "Make", href: "/ferramentas/make" },
      { title: "Zapier", href: "/ferramentas/zapier" },
      { title: "Flowise", href: "/ferramentas/flowise" },
    ],
  },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-xl border-b border-border">
      <nav className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link 
            href="/" 
            className="text-2xl font-bold text-primary hover:opacity-80 transition"
          >
            FayaPoint AI
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <NavigationMenu>
              <NavigationMenuList>
                {/* Cursos Dropdown */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="bg-transparent text-foreground/90 hover:text-primary font-medium">
                    Cursos
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="grid grid-cols-3 gap-4 p-6 w-[600px] bg-gray-900/95 backdrop-blur-xl">
                      {coursesMenu.map((section) => (
                        <div key={section.title}>
                          <h3 className="font-semibold text-purple-400 mb-3">
                            {section.title}
                          </h3>
                          <ul className="space-y-2">
                            {section.items.map((item) => (
                              <li key={item.href}>
                                <Link
                                  href={item.href}
                                  className="text-sm text-gray-300 hover:text-white hover:translate-x-1 transition-all duration-200 block"
                                >
                                  {item.title}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                      <div className="col-span-3 mt-4 pt-4 border-t border-gray-800">
                        <Link
                          href="/cursos"
                          className="text-purple-400 hover:text-purple-300 font-medium flex items-center gap-2"
                        >
                          Ver Todos os Cursos
                          <ChevronDown className="w-4 h-4 -rotate-90" />
                        </Link>
                      </div>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                {/* Ferramentas Dropdown */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="bg-transparent text-foreground/90 hover:text-primary font-medium">
                    Ferramentas
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="grid grid-cols-3 gap-4 p-6 w-[600px] bg-gray-900/95 backdrop-blur-xl">
                      {toolsMenu.map((section) => (
                        <div key={section.title}>
                          <h3 className="font-semibold text-purple-400 mb-3">
                            {section.title}
                          </h3>
                          <ul className="space-y-2">
                            {section.items.map((item) => (
                              <li key={item.href}>
                                <Link
                                  href={item.href}
                                  className="text-sm text-gray-300 hover:text-white hover:translate-x-1 transition-all duration-200 block"
                                >
                                  {item.title}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                      <div className="col-span-3 mt-4 pt-4 border-t border-gray-800">
                        <Link
                          href="/ferramentas"
                          className="text-purple-400 hover:text-purple-300 font-medium flex items-center gap-2"
                        >
                          Ver Todas as Ferramentas
                          <ChevronDown className="w-4 h-4 -rotate-90" />
                        </Link>
                      </div>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                {/* Simple Links */}
                <NavigationMenuItem>
                  <Link href="/blog" className={cn(
                    "px-3 py-2 text-sm font-medium transition",
                    pathname === "/blog" 
                      ? "text-primary" 
                      : "text-foreground/90 hover:text-primary"
                  )}>
                    Blog
                  </Link>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <Link href="/sobre" className={cn(
                    "px-3 py-2 text-sm font-medium transition",
                    pathname === "/sobre" 
                      ? "text-primary" 
                      : "text-foreground/90 hover:text-primary"
                  )}>
                    Sobre
                  </Link>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <Link href="/comunidade" className={cn(
                    "px-3 py-2 text-sm font-medium transition",
                    pathname === "/comunidade" 
                      ? "text-primary" 
                      : "text-foreground/90 hover:text-primary"
                  )}>
                    Comunidade
                  </Link>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <ThemeSwitcher />
            <Link href="/login">
              <Button variant="ghost" className="text-foreground/80 hover:text-foreground">
                Entrar
              </Button>
            </Link>
            <Link href="/registro">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                Começar Grátis
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-gray-300 hover:text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 right-0 bg-popover/95 backdrop-blur-xl border-b border-border">
            <div className="px-4 py-6 space-y-4">
              <div className="pb-2">
                <ThemeSwitcher />
              </div>
              <Link
                href="/cursos"
                className="block text-foreground/80 hover:text-foreground py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Cursos
              </Link>
              <Link
                href="/ferramentas"
                className="block text-foreground/80 hover:text-foreground py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Ferramentas
              </Link>
              <Link
                href="/blog"
                className="block text-foreground/90 hover:text-primary transition font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Blog
              </Link>
              <Link
                href="/sobre"
                className="block text-foreground/90 hover:text-primary transition font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sobre
              </Link>
              <Link
                href="/comunidade"
                className="block text-foreground/90 hover:text-primary transition font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Comunidade
              </Link>
              <div className="pt-4 space-y-3 border-t border-gray-800">
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full">
                    Entrar
                  </Button>
                </Link>
                <Link href="/registro" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full bg-primary text-primary-foreground">
                    Começar Grátis
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
