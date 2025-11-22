"use client";

import { motion } from "framer-motion";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Rocket, MessageCircle, Calendar, Sparkles, Star, CheckCircle2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import { ScheduleConsultationButton } from "@/components/consultation/ScheduleConsultationButton";

// Generate consistent particle positions
const generateParticles = () => {
  return [...Array(20)].map((_, i) => ({
    id: i,
    left: (i * 17 + 13) % 100, // Deterministic positions
    top: (i * 23 + 7) % 100,
    duration: 3 + (i % 3),
    delay: (i % 5) * 0.4,
  }));
};

export function CTASection() {
  const [mounted, setMounted] = useState(false);
  const particles = useMemo(() => generateParticles(), []);
  const t = useTranslations("Home.CTA");
  const trustItems = t.raw("trust.items") as { title: string; description: string }[];
  const trustIcons = [CheckCircle2, Zap, Star];
  const description = t.rich("description", {
    primary: (chunks) => <span className="text-primary font-bold">{chunks}</span>,
  });
  const whatsappMessage = encodeURIComponent(t("whatsapp.message"));
  const whatsappUrl = `https://wa.me/5521971908530?text=${whatsappMessage}`;

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section className="py-32 relative overflow-hidden">
      {/* Enhanced Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
        
        {/* Animated orbs */}
        <motion.div
          className="absolute top-20 left-20 w-96 h-96 rounded-full blur-[120px]"
          style={{ background: 'radial-gradient(circle, rgba(var(--primary-rgb), 0.2), transparent 70%)' }}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-20 right-20 w-96 h-96 rounded-full blur-[120px]"
          style={{ background: 'radial-gradient(circle, rgba(var(--primary-rgb), 0.25), transparent 70%)' }}
          animate={{
            scale: [1, 1.4, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
        
        {/* Floating particles */}
        {mounted && particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute w-2 h-2 bg-primary/30 rounded-full"
            style={{
              left: `${particle.left}%`,
              top: `${particle.top}%`,
            }}
            animate={{
              y: [-20, 20, -20],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: particle.duration,
              repeat: Infinity,
              delay: particle.delay,
            }}
          />
        ))}
        
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `radial-gradient(circle, rgba(var(--primary-rgb), 0.3) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          className="max-w-5xl mx-auto"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="flex justify-center mb-6"
          >
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-6 py-3">
              <Sparkles className="w-5 h-5 text-primary" />
              <span className="text-primary font-semibold">{t("badge")}</span>
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
          </motion.div>

          {/* Main Title */}
          <motion.h2 
            className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <span className="bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
              {t("title")}
            </span>
          </motion.h2>
          
          <motion.p 
            className="text-xl md:text-2xl text-muted-foreground mb-12 text-center max-w-3xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            {description}
          </motion.p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              whileHover={{ scale: 1.05, y: -4 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button 
                asChild
                size="lg" 
                className="bg-primary hover:bg-primary/90 text-primary-foreground text-lg px-12 py-8 shadow-2xl shadow-primary/30 hover:shadow-primary/50 transition-all duration-300 group relative overflow-hidden"
              >
                <Link href="/registro">
                  <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
                  <Rocket className="mr-2 group-hover:rotate-12 transition-transform" /> 
                  <span>{t("primaryButton")}</span>
                  <Zap className="ml-2 w-5 h-5 group-hover:scale-125 transition-transform" />
                </Link>
              </Button>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              whileHover={{ scale: 1.05, y: -4 }}
              whileTap={{ scale: 0.98 }}
            >
              <ScheduleConsultationButton
                size="lg"
                variant="outline"
                className="border-2 border-primary text-foreground hover:bg-primary/10 text-lg px-12 py-8 shadow-lg hover:shadow-xl hover:border-primary transition-all duration-300"
                source="home-cta-secondary"
                showCompanyRole={false}
              >
                <Calendar className="mr-2" />
                {t("secondaryButton")}
              </ScheduleConsultationButton>
            </motion.div>
          </div>

          {/* Trust Elements - Enhanced */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            {trustItems.map((item, i) => {
              const Icon = trustIcons[i % trustIcons.length];
              return (
              <motion.div
                key={`${item.title}-${i}`}
                whileHover={{ scale: 1.05, y: -4 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Card className="p-6 bg-card/50 border-primary/20 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 text-center">
                  <Icon className="w-10 h-10 text-primary mx-auto mb-3" />
                  <h4 className="font-bold text-foreground mb-1">{item.title}</h4>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </Card>
              </motion.div>
            );
            })}
          </motion.div>

          {/* WhatsApp Contact - Enhanced */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            viewport={{ once: true }}
            className="pt-12 border-t border-primary/20"
          >
            <Card className="max-w-md mx-auto p-8 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/30">
              <div className="text-center">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="inline-block mb-4"
                >
                  <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-green-500/50">
                    <MessageCircle className="w-8 h-8 text-white" />
                  </div>
                </motion.div>
                <p className="text-muted-foreground mb-4 font-medium">{t("whatsapp.prompt")}</p>
                <a 
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-green-500 hover:text-green-400 transition-colors font-bold text-lg"
                >
                  <span>{t("whatsapp.linkLabel")}</span>
                  <motion.div
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    →
                  </motion.div>
                </a>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
