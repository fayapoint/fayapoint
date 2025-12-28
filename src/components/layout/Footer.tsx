"use client";

import { useState, useEffect, type FormEvent } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { getAttributionUtmPayload } from "@/lib/attribution";
import { 
  Facebook, 
  Instagram, 
  Linkedin, 
  Twitter, 
  Youtube,
  Mail,
  MapPin,
  Phone,
  ArrowUp,
  Rocket,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const footerLinks = {
  cursos: [
    { key: "links.courses.items.beginner", href: "/cursos?level=beginner" },
    { key: "links.courses.items.intermediate", href: "/cursos?level=intermediate" },
    { key: "links.courses.items.advanced", href: "/cursos?level=advanced" },
    { key: "links.courses.items.byTool", href: "/cursos/por-ferramenta" },
    { key: "links.courses.items.byIndustry", href: "/cursos/por-setor" },
    { key: "links.courses.items.certifications", href: "/certificacoes" },
  ],
  recursos: [
    { key: "links.resources.items.blog", href: "/blog" },
    { key: "links.resources.items.guides", href: "/recursos/guias" },
    { key: "links.resources.items.templates", href: "/recursos/templates" },
    { key: "links.resources.items.roiCalculator", href: "/recursos/calculadora-roi" },
    { key: "links.resources.items.glossary", href: "/recursos/glossario" },
    { key: "links.resources.items.tools", href: "/ferramentas" },
  ],
  empresa: [
    { key: "links.company.items.about", href: "/sobre" },
    { key: "links.company.items.instructors", href: "/instrutores" },
    { key: "links.company.items.careers", href: "/carreiras" },
    { key: "links.company.items.partnerships", href: "/parcerias" },
    { key: "links.company.items.affiliates", href: "/afiliados" },
    { key: "links.company.items.contact", href: "/contato" },
  ],
  suporte: [
    { key: "links.support.items.helpCenter", href: "/ajuda" },
    { key: "links.support.items.faq", href: "/faq" },
    { key: "links.support.items.community", href: "/comunidade" },
    { key: "links.support.items.status", href: "/status" },
    { key: "links.support.items.terms", href: "/termos" },
    { key: "links.support.items.privacy", href: "/privacidade" },
  ],
};

const socialLinks = [
  { icon: Youtube, href: "https://youtube.com/@fayapoint", label: "YouTube" },
  { icon: Instagram, href: "https://instagram.com/fayapoint", label: "Instagram" },
  { icon: Linkedin, href: "https://linkedin.com/company/fayapoint", label: "LinkedIn" },
  { icon: Twitter, href: "https://twitter.com/fayapoint", label: "Twitter" },
  { icon: Facebook, href: "https://facebook.com/fayapoint", label: "Facebook" },
];

export function Footer() {
  const t = useTranslations("Footer");
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterLoading, setNewsletterLoading] = useState(false);

  // Handle scroll to show/hide back to top button
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submitNewsletter = async (e: FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;

    setNewsletterLoading(true);
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newsletterEmail,
          source: "footer_newsletter",
          leadType: "newsletter",
          referrerUrl: typeof window !== "undefined" ? window.location.href : undefined,
          utm: getAttributionUtmPayload(),
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || "Erro ao enviar");
      }

      setNewsletterEmail("");
      toast.success("Inscrição realizada!");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao enviar";
      toast.error(message);
    } finally {
      setNewsletterLoading(false);
    }
  };

  return (
    <>
      {/* Back to Top Button */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 z-50 group"
          >
            <div className="relative">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full blur-lg opacity-60 group-hover:opacity-100 transition-opacity" />
              
              {/* Button */}
              <div className="relative w-14 h-14 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center shadow-2xl border border-white/20">
                <motion.div
                  animate={{ y: [0, -3, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Rocket className="w-6 h-6 text-white transform -rotate-45" />
                </motion.div>
              </div>
              
              {/* Tooltip */}
              <div className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-gray-700">
                Voltar ao topo
                <div className="absolute top-full right-4 w-2 h-2 bg-gray-900 transform rotate-45 -mt-1 border-r border-b border-gray-700" />
              </div>
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      <footer className="bg-background border-t border-border">
      {/* Newsletter Section */}
      <div className="bg-gradient-to-r from-primary/15 to-accent/10 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h3 className="text-2xl font-bold mb-4">
              {t("newsletter.title")}
            </h3>
            <p className="text-gray-400 mb-6">
              {t("newsletter.description")}
            </p>
            <form
              className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto"
              onSubmit={submitNewsletter}
            >
              <Input
                type="email"
                autoComplete="email"
                placeholder={t("newsletter.placeholder")}
                className="flex-1 bg-input border-border"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
              />
              <Button
                type="submit"
                disabled={!newsletterEmail || newsletterLoading}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                {t("newsletter.cta")}
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-block mb-4">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                FayaPoint AI Academy
              </h2>
            </Link>
            <p className="text-gray-400 mb-4">
              {t("company.tagline")}
            </p>
            <div className="space-y-2 text-gray-400">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <a href="mailto:ricardofaya@gmail.com" className="hover:text-white">
                  ricardofaya@gmail.com
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <a href="tel:+5521971908530" className="hover:text-white">
                  (21) 97190-8530
                </a>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>{t("company.location")}</span>
              </div>
            </div>
          </div>

          {/* Links Sections */}
          <div>
            <h4 className="font-semibold text-white mb-4">{t("links.courses.title")}</h4>
            <ul className="space-y-1">
              {footerLinks.cursos.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="block py-2 text-gray-400 hover:text-white transition"
                  >
                    {t(link.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">{t("links.resources.title")}</h4>
            <ul className="space-y-1">
              {footerLinks.recursos.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="block py-2 text-gray-400 hover:text-white transition"
                  >
                    {t(link.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">{t("links.company.title")}</h4>
            <ul className="space-y-1">
              {footerLinks.empresa.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="block py-2 text-gray-400 hover:text-white transition"
                  >
                    {t(link.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">{t("links.support.title")}</h4>
            <ul className="space-y-1">
              {footerLinks.suporte.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="block py-2 text-gray-400 hover:text-white transition"
                  >
                    {t(link.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-12 pt-8 border-t border-border">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-gray-400 text-sm">
              {t("bottom.rights")}
            </div>
            
            {/* Social Links */}
            <div className="flex items-center gap-1">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-11 h-11 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>

            {/* Payment Methods */}
            <div className="flex items-center gap-4 text-gray-400 text-sm">
              <span>{t("bottom.paymentsLabel")}</span>
              <div className="flex gap-2">
                <span>Visa</span>
                <span>Master</span>
                <span>PIX</span>
                <span>Boleto</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
    </>
  );
}
