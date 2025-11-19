"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState } from "react";
import { Quote, Star, MessageSquare, Sparkles, TrendingUp } from "lucide-react";
import { SectionDivider } from "@/components/ui/section-divider";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { useTranslations } from "next-intl";

const testimonialMeta = [
  { key: "ana", image: "/testimonials/ana.jpg", rating: 5 },
  { key: "carlos", image: "/testimonials/carlos.jpg", rating: 5 },
  { key: "juliana", image: "/testimonials/juliana.jpg", rating: 5 },
  { key: "pedro", image: "/testimonials/pedro.jpg", rating: 5 },
  { key: "mariana", image: "/testimonials/mariana.jpg", rating: 5 },
  { key: "roberto", image: "/testimonials/roberto.jpg", rating: 5 },
];

export function TestimonialsSection() {
  const sectionRef = useRef(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const t = useTranslations("Home.Testimonials");
  const testimonials = testimonialMeta.map((meta) => {
    const copy = t.raw(`items.${meta.key}`) as { name: string; role: string; content: string };
    return { ...meta, ...copy };
  });

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });
  
  const y = useTransform(scrollYProgress, [0, 1], [50, -50]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.8, 1, 0.8]);
  
  return (
    <section ref={sectionRef} className="py-20 relative overflow-visible">
      <SectionDivider icon={MessageSquare} />
      
      {/* Enhanced Background with Floating Elements */}
      <div className="absolute inset-0">
        <motion.div
          style={{ y }}
          className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px]"
        />
        <motion.div
          style={{ y: useTransform(y, v => v * -1.5) }}
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-[120px]"
        />
        
        {/* Floating quotes */}
        <motion.div
          animate={{ 
            y: [0, -30, 0],
            rotate: [0, 15, 0]
          }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-20 right-10 text-purple-400/10"
        >
          <Quote size={80} />
        </motion.div>
        
        <motion.div
          animate={{ 
            y: [0, 30, 0],
            rotate: [0, -15, 0]
          }}
          transition={{ duration: 10, repeat: Infinity, delay: 2 }}
          className="absolute bottom-20 left-10 text-pink-400/10"
        >
          <Quote size={60} />
        </motion.div>
      </div>
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-16 relative z-10"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, type: "spring" }}
            viewport={{ once: true }}
            className="inline-block mb-6"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/30 to-pink-600/30 blur-2xl" />
              <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-full px-6 py-3 flex items-center gap-3">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles className="w-5 h-5 text-yellow-400" />
                </motion.div>
                <span className="text-sm font-semibold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                  {t("badge")}
                </span>
                <motion.div
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <TrendingUp className="w-5 h-5 text-green-400" />
                </motion.div>
              </div>
            </div>
          </motion.div>
          
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
              {t("title")}
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            {t("description")}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto relative z-10">
          {testimonials.map((testimonial, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 50, rotateX: -15 }}
              whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{ 
                delay: i * 0.15,
                duration: 0.8,
                type: "spring",
                stiffness: 100
              }}
              viewport={{ once: true }}
              onHoverStart={() => setHoveredIndex(i)}
              onHoverEnd={() => setHoveredIndex(null)}
              style={{ perspective: 1000 }}
            >
              <motion.div
                whileHover={{ 
                  scale: 1.05,
                  y: -10,
                  transition: { duration: 0.3 }
                }}
                className="h-full relative"
              >
                {/* Glow effect on hover */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-2xl blur-xl"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: hoveredIndex === i ? 1 : 0 }}
                  transition={{ duration: 0.3 }}
                />
                
                <Card className="relative backdrop-blur-xl bg-card/50 border-border hover:border-primary/30 p-6 h-full flex flex-col rounded-2xl transition-all duration-300 hover:shadow-xl hover:shadow-primary/5">
                  {/* Quote icon */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                    viewport={{ once: true }}
                    className="absolute -top-3 -right-3"
                  >
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 blur-md" />
                      <div className="relative bg-black rounded-full p-2">
                        <Quote className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  </motion.div>
                  
                  {/* Stars with animation */}
                  <div className="flex mb-4 gap-1">
                    {[...Array(testimonial.rating)].map((_, starIndex) => (
                      <motion.div
                        key={starIndex}
                        initial={{ opacity: 0, scale: 0, rotate: -180 }}
                        whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                        transition={{ 
                          delay: 0.6 + i * 0.1 + starIndex * 0.05,
                          type: "spring",
                          stiffness: 200
                        }}
                        viewport={{ once: true }}
                      >
                        <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                      </motion.div>
                    ))}
                  </div>
                  
                  {/* Testimonial content with glassmorphism */}
                  <div className="relative flex-grow mb-6">
                    <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent rounded-lg" />
                    <p className="relative text-foreground/90 italic leading-relaxed">
                      &ldquo;{testimonial.content}&rdquo;
                    </p>
                  </div>
                  
                  {/* Author info with enhanced styling */}
                  <div className="flex items-center gap-4">
                    <motion.div
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.6 }}
                      className="relative"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full blur-md opacity-60" />
                      <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                        {testimonial.name.split(' ').map(n => n[0]).join('')}
                      </div>
                    </motion.div>
                    <div>
                      <div className="font-semibold text-foreground">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                    </div>
                  </div>
                  
                  {/* Success indicator */}
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: "100%" }}
                    transition={{ delay: 0.8 + i * 0.1, duration: 1 }}
                    viewport={{ once: true }}
                    className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-primary to-accent rounded-b-2xl"
                  />
                </Card>
              </motion.div>
            </motion.div>
          ))}
        </div>
        
        {/* Call to action */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <p className="text-gray-400 mb-4">{t("ctaLabel")}</p>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full blur-md group-hover:blur-lg transition-all duration-300" />
            <Link 
              href="/cursos"
              className="relative inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full text-white font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-300"
            >
              {t("ctaButton")}
              <motion.div
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <Sparkles className="w-4 h-4" />
              </motion.div>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
