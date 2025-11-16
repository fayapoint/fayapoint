"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import { 
  Play, 
  ArrowRight, 
  Users, 
  BookOpen, 
  Trophy, 
  Star, 
  Sparkles,
  ChevronDown,
  Zap,
  Brain,
  Rocket,
  Code,
  Cpu,
  Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedGradientText } from "@/components/ui/animated-gradient-text";
import { useUser } from "@/contexts/UserContext";

export function HeroSection() {
  const { user, isLoggedIn, mounted: userMounted } = useUser();
  // Subtle background parallax only (no text rotation)
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const bgX = useSpring(useTransform(mouseX, [-300, 300], [-10, 10]));
  const bgY = useSpring(useTransform(mouseY, [-300, 300], [-10, 10]));
  
  // Animated counters
  const [studentsCount, setStudentsCount] = useState(0);
  const [coursesCount, setCoursesCount] = useState(0);
  const [completionRate, setCompletionRate] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  
  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    // Reduced sensitivity for smoother movement
    mouseX.set(x * 0.05);
    mouseY.set(y * 0.05);
  };

  useEffect(() => {
    const timer1 = setInterval(() => {
      setStudentsCount(prev => prev < 5000 ? prev + 100 : 5000);
    }, 30);
    const timer2 = setInterval(() => {
      setCoursesCount(prev => prev < 150 ? prev + 3 : 150);
    }, 50);
    const timer3 = setInterval(() => {
      setCompletionRate(prev => prev < 94 ? prev + 2 : 94);
    }, 40);

    return () => {
      clearInterval(timer1);
      clearInterval(timer2);
      clearInterval(timer3);
    };
  }, []);

  return (
    <section 
      className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden"
      onMouseMove={handleMouseMove}
    >
      {/* Enhanced Animated Background with Glassmorphism */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-accent/20" />
        
        {/* Animated Gradient Orbs */}
        <motion.div
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.3, 0.6, 0.3],
            x: [0, 100, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-20 left-10 w-[400px] h-[400px] rounded-full blur-[100px]"
          style={{
            background: 'radial-gradient(circle, rgba(var(--primary-rgb), 0.3), transparent 70%)'
          }}
        />
        <motion.div
          animate={{
            scale: [1, 1.8, 1],
            opacity: [0.3, 0.5, 0.3],
            x: [0, -100, 0],
            y: [0, 50, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 5,
          }}
          className="absolute bottom-20 right-10 w-[500px] h-[500px] rounded-full blur-[120px]"
          style={{
            background: 'radial-gradient(circle, rgba(var(--primary-rgb), 0.25), transparent 70%)'
          }}
        />
        <motion.div
          animate={{
            scale: [1, 1.6, 1],
            opacity: [0.2, 0.4, 0.2],
            rotate: [0, 360],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear",
            delay: 2,
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[150px]"
          style={{
            background: 'radial-gradient(circle, rgba(var(--primary-rgb), 0.2), transparent 70%)'
          }}
        />
        
        {/* Animated Grid Pattern */}
        <div 
          className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-5"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke='rgb(255 255 255 / 0.1)'%3e%3cpath d='M0 .5H31.5V32'/%3e%3c/svg%3e")`,
          }}
        />
        
        {/* Floating particles - only render on client */}
        {mounted && Array.from({ length: 15 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{ 
              left: `${(i * 7 + 10) % 90}%`, 
              top: `${(i * 11 + 5) % 90}%`,
              background: 'radial-gradient(circle, rgba(var(--primary-rgb), 0.4) 0%, transparent 70%)'
            }}
            animate={{
              y: [-20, 20, -20],
              opacity: [0.3, 0.6, 0.3],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 8 + (i % 5) * 2,
              repeat: Infinity,
              delay: i * 0.4,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>
      
      {/* Floating Tech Icons */}
      <motion.div
        className="absolute top-32 left-[10%] text-purple-400/20"
        animate={{
          y: [0, -20, 0],
          rotate: [0, 10, 0],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <Brain size={60} />
      </motion.div>
      
      <motion.div
        className="absolute bottom-32 right-[10%] text-pink-400/20"
        animate={{
          y: [0, 20, 0],
          rotate: [0, -10, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <Cpu size={50} />
      </motion.div>
      
      <motion.div
        className="absolute top-1/2 left-[5%] text-blue-400/20"
        animate={{
          x: [0, 20, 0],
          y: [0, -10, 0],
          rotate: [0, 360],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        <Code size={40} />
      </motion.div>
      
      <motion.div
        className="absolute top-1/3 right-[15%] text-cyan-400/20"
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, -180, -360],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        <Globe size={45} />
      </motion.div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          {/* Glassmorphism Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ 
              duration: 0.7,
              type: "spring",
              stiffness: 100
            }}
            className="inline-block mb-8"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 blur-xl" />
              <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-full px-6 py-3 flex items-center gap-2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles className="w-5 h-5 text-purple-400" />
                </motion.div>
                <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent font-semibold">
                  Nova Era da Educação em IA no Brasil
                </span>
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Zap className="w-4 h-4 text-yellow-400" />
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Enhanced Main Heading - Beautiful Animations */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="inline-block"
              >
                {userMounted && isLoggedIn && user ? `${user.name.split(' ')[0]}, domine a` : "Domine a"}{" "}
              </motion.span>
              <motion.span 
                className="relative inline-block"
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ 
                  duration: 0.7, 
                  delay: 0.4,
                  type: "spring",
                  stiffness: 120,
                  damping: 15
                }}
              >
                {/* Animated gradient background */}
                <motion.span 
                  className="absolute inset-0 -z-10 blur-2xl opacity-60"
                  animate={{ 
                    backgroundImage: [
                      'radial-gradient(ellipse at center, rgba(168, 85, 247, 0.4) 0%, transparent 70%)',
                      'radial-gradient(ellipse at center, rgba(236, 72, 153, 0.4) 0%, transparent 70%)',
                      'radial-gradient(ellipse at center, rgba(6, 182, 212, 0.4) 0%, transparent 70%)',
                      'radial-gradient(ellipse at center, rgba(168, 85, 247, 0.4) 0%, transparent 70%)',
                    ],
                    scale: [1, 1.2, 1.1, 1]
                  }}
                  transition={{ 
                    duration: 5, 
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
                <motion.span 
                  className="relative z-10 bg-clip-text text-transparent"
                  animate={{
                    backgroundImage: [
                      'linear-gradient(to right, rgb(168, 85, 247), rgb(236, 72, 153), rgb(6, 182, 212))',
                      'linear-gradient(to right, rgb(236, 72, 153), rgb(6, 182, 212), rgb(168, 85, 247))',
                      'linear-gradient(to right, rgb(6, 182, 212), rgb(168, 85, 247), rgb(236, 72, 153))',
                      'linear-gradient(to right, rgb(168, 85, 247), rgb(236, 72, 153), rgb(6, 182, 212))',
                    ]
                  }}
                  transition={{ 
                    duration: 4, 
                    repeat: Infinity,
                    ease: "linear"
                  }}
                  style={{ backgroundClip: 'text', WebkitBackgroundClip: 'text' }}
                >
                  Inteligência Artificial
                </motion.span>
              </motion.span>
              <br />
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="inline-block"
              >
                e Transforme sua Carreira
              </motion.span>
            </h1>

          {/* Glassmorphism Subheading Card */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="mb-10 max-w-3xl mx-auto"
          >
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-pink-600/10 blur-xl group-hover:blur-2xl transition-all duration-300" />
              <div className="relative backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-6">
                <p className="text-xl text-foreground/90 font-medium leading-relaxed">
                  {userMounted && isLoggedIn && user ? (
                    <>
                      Ótimo te ver aqui de novo, <span className="text-primary font-bold">{user.name.split(' ')[0]}</span>! 
                      Continue sua jornada de aprendizado com nossos cursos práticos de <span className="text-primary font-semibold">ChatGPT</span>, <span className="text-primary font-semibold">Midjourney</span>, 
                      automação e mais de <span className="text-accent font-bold">100 ferramentas de IA</span>.
                    </>
                  ) : (
                    <>
                      Aprenda com quem tem <span className="text-primary font-bold">28+ anos</span> de experiência em mídia e tecnologia. 
                      Cursos práticos de <span className="text-primary font-semibold">ChatGPT</span>, <span className="text-primary font-semibold">Midjourney</span>, 
                      automação e mais de <span className="text-accent font-bold">100 ferramentas de IA</span>.
                    </>
                  )}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Enhanced CTA Buttons with Hover Effects */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1 }}
            className="flex flex-col sm:flex-row gap-6 justify-center mb-12"
          >
            <motion.div
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link href="/aula-gratis">
                <Button 
                  size="lg" 
                  className="relative bg-primary hover:bg-primary/90 text-primary-foreground text-lg px-10 py-7 group overflow-hidden"
                >
                  <span className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                  <span className="relative flex items-center">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Play className="mr-2" />
                    </motion.div>
                    Assistir Aula Grátis
                  </span>
                </Button>
              </Link>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link href="/cursos">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/50 to-primary/50 rounded-lg blur opacity-50 group-hover:opacity-75 transition-opacity duration-300" />
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="text-lg px-10 py-7 border-2 border-primary/50 hover:border-primary hover:bg-primary/10 text-foreground" 
                  >
                    Ver Todos os Cursos 
                    <motion.div
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <ArrowRight className="ml-2" />
                    </motion.div>
                  </Button>
                </div>
              </Link>
            </motion.div>
          </motion.div>

          {/* Glassmorphism Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 1.2 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto"
          >
            {[
              { icon: Users, color: "purple", value: studentsCount, label: "Alunos", suffix: "+" },
              { icon: BookOpen, color: "pink", value: coursesCount, label: "Cursos", suffix: "+" },
              { icon: Trophy, color: "yellow", value: completionRate, label: "Conclusão", suffix: "%" },
              { icon: Star, color: "orange", value: "4.9/5", label: "Avaliação", suffix: "" },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 1.3 + index * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="group relative"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-${stat.color}-500/20 to-${stat.color}-600/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative backdrop-blur-lg bg-white/5 border border-white/10 rounded-2xl p-4 hover:border-white/20 transition-all duration-300">
                  <div className="flex items-center gap-3">
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 4, repeat: Infinity, delay: index * 0.5 }}
                      className={`text-${stat.color}-400`}
                    >
                      <stat.icon size={24} />
                    </motion.div>
                    <div>
                      <div className="text-2xl font-bold">
                        {typeof stat.value === 'number' ? stat.value.toLocaleString("pt-BR") : stat.value}{stat.suffix}
                      </div>
                      <div className="text-sm text-muted-foreground font-medium">{stat.label}</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
      >
        <div className="animate-bounce">
          <ChevronDown className="text-gray-400" />
        </div>
      </motion.div>
    </section>
  );
}
