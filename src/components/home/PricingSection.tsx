"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { CheckCircle2, Shield, Star, DollarSign, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SectionDivider } from "@/components/ui/section-divider";
import { useTranslations } from "next-intl";

const planKeys = ["starter", "pro", "business"] as const;

export function PricingSection() {
  const t = useTranslations("Home.Pricing");
  const plans = planKeys.map((key) => {
    const plan = t.raw(`plans.${key}`) as {
      name: string;
      price: string;
      period: string;
      description: string;
      features: string[];
      highlighted?: boolean;
      badge?: string;
      cta: string;
      href: string;
    };
    return { key, highlighted: false, ...plan };
  });

  return (
    <section className="py-20 relative bg-gradient-to-b from-background to-muted/30">
      <SectionDivider icon={DollarSign} />
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            {t("title")}
          </h2>
          <p className="text-xl text-muted-foreground">
            {t("description")}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              whileHover={{ scale: plan.highlighted ? 1.08 : 1.05, y: -12 }}
              transition={{ 
                delay: i * 0.1,
                type: "spring",
                stiffness: 200,
                damping: 20
              }}
              viewport={{ once: true }}
              className={`relative ${plan.highlighted ? "md:-mt-4" : ""}`}
            >
              {/* Colored shadow layer */}
              <div 
                className={`absolute inset-0 rounded-lg blur-2xl opacity-0 group-hover:opacity-70 transition-all duration-500 ${
                  i === 0 ? 'bg-blue-500/40' :
                  i === 1 ? 'bg-purple-500/50' :
                  'bg-orange-500/40'
                }`}
                style={{ transform: 'translateY(10px)' }}
              />
              <Card 
                className={`${
                  plan.highlighted 
                    ? 'border-primary bg-primary/10 shadow-2xl' 
                    : 'border-border bg-card/50'
                } backdrop-blur p-8 relative h-full flex flex-col hover:border-primary transition-all duration-500 group`}
                style={{
                  boxShadow: plan.highlighted 
                    ? '0 25px 50px -12px rgba(var(--primary-rgb), 0.4), 0 0 0 1px rgba(var(--primary-rgb), 0.1)'
                    : i === 0
                    ? '0 10px 40px -10px rgba(59, 130, 246, 0.2)'
                    : '0 10px 40px -10px rgba(251, 146, 60, 0.2)'
                }}
              >
                {/* Animated border glow */}
                <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: plan.highlighted
                      ? 'linear-gradient(90deg, rgba(var(--primary-rgb), 0.5), rgba(var(--primary-rgb), 0) 50%, rgba(var(--primary-rgb), 0.5))'
                      : 'linear-gradient(90deg, rgba(var(--primary-rgb), 0.3), rgba(var(--primary-rgb), 0) 50%, rgba(var(--primary-rgb), 0.3))',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 3s linear infinite',
                  }}
                />
                {plan.badge && (
                  <motion.div
                    animate={{ 
                      scale: [1, 1.15, 1],
                      rotate: [0, -3, 3, 0],
                      y: [0, -2, 0]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-accent text-primary-foreground px-4 shadow-2xl shadow-primary/50 border-2 border-background">
                      <Sparkles className="w-3 h-3 inline mr-1" />
                      {plan.badge}
                      <Sparkles className="w-3 h-3 inline ml-1" />
                    </Badge>
                  </motion.div>
                )}
                
                <div>
                  <h3 className="text-2xl font-bold mb-2 text-foreground">{plan.name}</h3>
                  <p className="text-muted-foreground mb-6">{plan.description}</p>
                  
                  <div className="mb-6">
                    <motion.span 
                      className="text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"
                      initial={{ opacity: 0, scale: 0.5 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 + i * 0.1 }}
                    >
                      R${plan.price}
                    </motion.span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                  
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, j) => (
                      <motion.li 
                        key={j} 
                        className="flex items-start gap-2"
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + i * 0.1 + j * 0.05 }}
                      >
                        <CheckCircle2 className="text-primary mt-1 flex-shrink-0" size={20} />
                        <span className="text-foreground/90">{feature}</span>
                      </motion.li>
                    ))}
                  </ul>
                </div>
                
                <Link href={plan.href} className="mt-auto">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button 
                      className={`w-full ${
                        plan.highlighted 
                          ? 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/30' 
                          : 'border-primary/50 hover:bg-primary/10'
                      }`}
                      variant={plan.highlighted ? 'default' : 'outline'}
                      size="lg"
                    >
                      {plan.cta}
                    </Button>
                  </motion.div>
                </Link>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <div className="flex items-center justify-center gap-8 mb-4">
            <motion.div 
              className="flex items-center gap-2 text-muted-foreground"
              whileHover={{ scale: 1.1 }}
              transition={{ type: "spring" }}
            >
              <Shield className="w-5 h-5 text-primary" />
              <span>{t("guarantee")}</span>
            </motion.div>
            <motion.div 
              className="flex items-center gap-2 text-muted-foreground"
              whileHover={{ scale: 1.1 }}
              transition={{ type: "spring" }}
            >
              <Star className="w-5 h-5 text-primary fill-primary" />
              <span>{t("rating")}</span>
            </motion.div>
          </div>
          <p className="text-sm text-muted-foreground/70">
            {t("footnote")}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
