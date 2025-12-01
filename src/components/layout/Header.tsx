"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Menu, X, ChevronDown, LogOut, UserCircle, BookOpen, Wrench, Newspaper, Users, Briefcase, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeSwitcher } from "@/components/theme/ThemeSwitcher";
import { LocaleSwitcher } from "@/components/layout/LocaleSwitcher";
import { useUser } from "@/contexts/UserContext";
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import { NavCart } from "@/components/cart/NavCart";
import type { LucideIcon } from "lucide-react";

// Mobile navigation link component
interface MobileNavLinkProps {
  href: string;
  icon: LucideIcon;
  children: React.ReactNode;
  onClick?: () => void;
}

function MobileNavLink({ href, icon: Icon, children, onClick }: MobileNavLinkProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 px-3 py-3 rounded-xl text-foreground/90 hover:text-foreground hover:bg-accent active:bg-accent/80 transition-colors"
    >
      <Icon size={20} className="text-muted-foreground" />
      <span className="font-medium">{children}</span>
    </Link>
  );
}

const coursesMenu = [
  {
    titleKey: "menus.courses.sections.beginner.title",
    items: [
      { labelKey: "menus.courses.sections.beginner.items.chatgptZero", href: "/curso/chatgpt-zero" },
      { labelKey: "menus.courses.sections.beginner.items.firstAutomations", href: "/curso/primeiras-automacoes" },
      { labelKey: "menus.courses.sections.beginner.items.everydayAI", href: "/curso/ia-dia-a-dia" },
    ],
  },
  {
    titleKey: "menus.courses.sections.intermediate.title",
    items: [
      { labelKey: "menus.courses.sections.intermediate.items.promptEngineering", href: "/curso/prompt-engineering" },
      { labelKey: "menus.courses.sections.intermediate.items.n8nAutomation", href: "/curso/automacao-n8n" },
      { labelKey: "menus.courses.sections.intermediate.items.midjourneyMasterclass", href: "/curso/midjourney-masterclass" },
    ],
  },
  {
    titleKey: "menus.courses.sections.advanced.title",
    items: [
      { labelKey: "menus.courses.sections.advanced.items.aiAgents", href: "/curso/agentes-ia" },
      { labelKey: "menus.courses.sections.advanced.items.ragKnowledge", href: "/curso/rag-knowledge" },
      { labelKey: "menus.courses.sections.advanced.items.aiInProduction", href: "/curso/ia-producao" },
      { labelKey: "menus.courses.sections.advanced.items.chatgptAllowlisting", href: "/chatgpt-allowlisting" },
    ],
  },
];

const toolsMenu = [
  {
    titleKey: "menus.tools.sections.conversational.title",
    items: [
      { labelKey: "menus.tools.sections.conversational.items.chatgpt", href: "/ferramentas/chatgpt" },
      { labelKey: "menus.tools.sections.conversational.items.claude", href: "/ferramentas/claude" },
      { labelKey: "menus.tools.sections.conversational.items.gemini", href: "/ferramentas/gemini" },
      { labelKey: "menus.tools.sections.conversational.items.perplexity", href: "/ferramentas/perplexity" },
    ],
  },
  {
    titleKey: "menus.tools.sections.visual.title",
    items: [
      { labelKey: "menus.tools.sections.visual.items.midjourney", href: "/ferramentas/midjourney" },
      { labelKey: "menus.tools.sections.visual.items.dalle", href: "/ferramentas/dalle" },
      { labelKey: "menus.tools.sections.visual.items.stableDiffusion", href: "/ferramentas/stable-diffusion" },
      { labelKey: "menus.tools.sections.visual.items.leonardo", href: "/ferramentas/leonardo" },
    ],
  },
  {
    titleKey: "menus.tools.sections.automation.title",
    items: [
      { labelKey: "menus.tools.sections.automation.items.n8n", href: "/ferramentas/n8n" },
      { labelKey: "menus.tools.sections.automation.items.make", href: "/ferramentas/make" },
      { labelKey: "menus.tools.sections.automation.items.zapier", href: "/ferramentas/zapier" },
      { labelKey: "menus.tools.sections.automation.items.flowise", href: "/ferramentas/flowise" },
    ],
  },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { user, isLoggedIn, logout, mounted } = useUser();
  const t = useTranslations("Header");

  return (
    <header className="fixed top-0 w-full h-16 z-[999] bg-background/80 backdrop-blur-xl border-b border-border">
      <nav className="container mx-auto px-4">
        <div className="flex items-center h-16">
          {/* Logo */}
          <Link 
            href="/" 
            className="text-2xl font-bold text-primary hover:opacity-80 transition flex-shrink-0"
          >
            {t("logo")}
          </Link>

          {/* Spacer - pushes content to right */}
          <div className="flex-1" />

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <NavigationMenu>
              <NavigationMenuList>
                {/* Cursos Dropdown */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="bg-transparent text-foreground/90 hover:text-primary font-medium">
                    {t("nav.courses")}
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="grid grid-cols-3 gap-4 p-6 w-[600px] bg-gray-900/95 backdrop-blur-xl">
                      {coursesMenu.map((section) => (
                        <div key={section.titleKey}>
                          <h3 className="font-semibold text-purple-400 mb-3">
                            {t(section.titleKey)}
                          </h3>
                          <ul className="space-y-2">
                            {section.items.map((item) => (
                              <li key={item.href}>
                                <Link
                                  href={item.href}
                                  className="text-sm text-gray-300 hover:text-white hover:translate-x-1 transition-all duration-200 block"
                                >
                                  {t(item.labelKey)}
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
                          {t("menus.courses.viewAll")}
                          <ChevronDown className="w-4 h-4 -rotate-90" />
                        </Link>
                      </div>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                {/* Ferramentas Dropdown */}
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="bg-transparent text-foreground/90 hover:text-primary font-medium">
                    {t("nav.tools")}
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="grid grid-cols-3 gap-4 p-6 w-[600px] bg-gray-900/95 backdrop-blur-xl">
                      {toolsMenu.map((section) => (
                        <div key={section.titleKey}>
                          <h3 className="font-semibold text-purple-400 mb-3">
                            {t(section.titleKey)}
                          </h3>
                          <ul className="space-y-2">
                            {section.items.map((item) => (
                              <li key={item.href}>
                                <Link
                                  href={item.href}
                                  className="text-sm text-gray-300 hover:text-white hover:translate-x-1 transition-all duration-200 block"
                                >
                                  {t(item.labelKey)}
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
                          {t("menus.tools.viewAll")}
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
                    {t("nav.blog")}
                  </Link>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <Link href="/sobre" className={cn(
                    "px-3 py-2 text-sm font-medium transition",
                    pathname === "/sobre" 
                      ? "text-primary" 
                      : "text-foreground/90 hover:text-primary"
                  )}>
                    {t("nav.about")}
                  </Link>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <Link href="/comunidade" className={cn(
                    "px-3 py-2 text-sm font-medium transition",
                    pathname === "/comunidade" 
                      ? "text-primary" 
                      : "text-foreground/90 hover:text-primary"
                  )}>
                    {t("nav.community")}
                  </Link>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <Link href="/casos" className={cn(
                    "px-3 py-2 text-sm font-medium transition",
                    pathname === "/casos" 
                      ? "text-primary" 
                      : "text-foreground/90 hover:text-primary"
                  )}>
                    {t("nav.cases")}
                  </Link>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <NavCart />
            <LocaleSwitcher />
            <ThemeSwitcher />
            {mounted && isLoggedIn && user ? (
              <>
                <div className="flex items-center gap-2 text-foreground/80">
                  <Link href="/portal" className="flex items-center gap-2 hover:text-primary transition">
                    <UserCircle size={20} />
                    <span className="text-sm font-medium">{t("auth.greeting", { name: user.name.split(" ")[0] })}</span>
                  </Link>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={logout}
                  className="text-foreground/80 hover:text-foreground"
                >
                  <LogOut size={16} className="mr-2" />
                  {t("buttons.signOut")}
                </Button>
              </>
            ) : mounted ? (
              <>
                <Link href="/login">
                  <Button variant="ghost" className="text-foreground/80 hover:text-foreground">
                    {t("buttons.signIn")}
                  </Button>
                </Link>
                <Link href="/onboarding">
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    {t("buttons.startFree")}
                  </Button>
                </Link>
              </>
            ) : null}
          </div>
        </div>

        {/* Mobile Menu Overlay - only render when menu is open */}
        {mobileMenuOpen && (
          <div 
            className="md:hidden fixed inset-0 top-16 bg-black/50 backdrop-blur-sm z-40 animate-in fade-in duration-200"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div 
            className="md:hidden fixed top-16 left-0 right-0 bg-background border-b border-border shadow-2xl z-50 animate-in slide-in-from-top-2 duration-200"
          >
          <div className="px-4 py-5 space-y-1 max-h-[calc(100vh-5rem)] overflow-y-auto">
            {/* Quick Actions */}
            <div className="pb-4 flex items-center justify-between border-b border-border">
              <span className="text-sm text-muted-foreground font-medium">Quick Actions</span>
              <div className="flex items-center gap-2">
                <NavCart />
                <LocaleSwitcher />
                <ThemeSwitcher />
              </div>
            </div>

            {/* Navigation Links */}
            <nav className="py-2 space-y-1">
              <MobileNavLink 
                href="/cursos" 
                icon={BookOpen}
                onClick={() => setMobileMenuOpen(false)}
              >
                {t("nav.courses")}
              </MobileNavLink>
              <MobileNavLink 
                href="/ferramentas" 
                icon={Wrench}
                onClick={() => setMobileMenuOpen(false)}
              >
                {t("nav.tools")}
              </MobileNavLink>
              <MobileNavLink 
                href="/blog" 
                icon={Newspaper}
                onClick={() => setMobileMenuOpen(false)}
              >
                {t("nav.blog")}
              </MobileNavLink>
              <MobileNavLink 
                href="/sobre" 
                icon={Info}
                onClick={() => setMobileMenuOpen(false)}
              >
                {t("nav.about")}
              </MobileNavLink>
              <MobileNavLink 
                href="/comunidade" 
                icon={Users}
                onClick={() => setMobileMenuOpen(false)}
              >
                {t("nav.community")}
              </MobileNavLink>
              <MobileNavLink 
                href="/casos" 
                icon={Briefcase}
                onClick={() => setMobileMenuOpen(false)}
              >
                {t("nav.cases")}
              </MobileNavLink>
            </nav>

            {/* Auth Section */}
            <div className="pt-4 space-y-3 border-t border-border">
              {mounted && isLoggedIn && user ? (
                <>
                  <Link 
                    href="/portal" 
                    className="flex items-center gap-3 p-3 rounded-xl bg-accent/50 hover:bg-accent transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <UserCircle size={24} className="text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{user.name}</p>
                      <p className="text-sm text-muted-foreground">View Dashboard</p>
                    </div>
                  </Link>
                  <Button 
                    variant="outline" 
                    className="w-full h-12 text-base"
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                  >
                    <LogOut size={18} className="mr-2" />
                    {t("buttons.signOut")}
                  </Button>
                </>
              ) : mounted ? (
                <div className="grid grid-cols-2 gap-3">
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="block">
                    <Button variant="outline" className="w-full h-12 text-base">
                      {t("buttons.signIn")}
                    </Button>
                  </Link>
                  <Link href="/onboarding" onClick={() => setMobileMenuOpen(false)} className="block">
                    <Button className="w-full h-12 text-base bg-primary text-primary-foreground">
                      {t("buttons.startFree")}
                    </Button>
                  </Link>
                </div>
              ) : null}
            </div>
          </div>
        </div>
        )}
      </nav>

      {/* Mobile Menu Button */}
      <button
        className="md:hidden absolute right-4 top-1/2 -translate-y-1/2 z-[1000] flex items-center justify-center w-11 h-11 rounded-xl bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 active:scale-95 transition-all pointer-events-auto"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
        aria-expanded={mobileMenuOpen}
      >
        {mobileMenuOpen ? <X size={24} strokeWidth={2.5} /> : <Menu size={24} strokeWidth={2.5} />}
      </button>
    </header>
  );
}
