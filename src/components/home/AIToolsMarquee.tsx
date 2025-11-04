"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { ExternalLink, Sparkles } from "lucide-react";
import Link from "next/link";

interface AITool {
  name: string;
  description: string;
  category: string;
  logo: string; // Emoji or icon representing the tool
  slug: string;
}

const aiTools: AITool[] = [
  { 
    name: "ChatGPT", 
    description: "Assistente de IA conversacional mais avançado", 
    category: "IA Generativa", 
    logo: "https://cdn.oaistatic.com/_next/static/media/apple-touch-icon.82af6fe1.png",
    slug: "chatgpt" 
  },
  { 
    name: "Claude", 
    description: "IA conversacional da Anthropic com raciocínio avançado", 
    category: "IA Generativa", 
    logo: "https://claude.ai/images/claude_app_icon.png",
    slug: "claude" 
  },
  { 
    name: "Midjourney", 
    description: "Gerador de imagens com qualidade artística", 
    category: "Criação Visual", 
    logo: "https://cdn.midjourney.com/logo/logo-midjourney.svg",
    slug: "midjourney" 
  },
  { 
    name: "DALL-E 3", 
    description: "Criação de imagens fotorealistas da OpenAI", 
    category: "Criação Visual", 
    logo: "https://cdn.oaistatic.com/_next/static/media/apple-touch-icon.82af6fe1.png",
    slug: "dall-e" 
  },
  { 
    name: "Perplexity", 
    description: "Motor de busca potencializado por IA", 
    category: "IA Generativa", 
    logo: "https://www.perplexity.ai/favicon.svg",
    slug: "perplexity" 
  },
  { 
    name: "Gemini", 
    description: "IA multimodal do Google", 
    category: "IA Generativa", 
    logo: "https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg",
    slug: "gemini" 
  },
  { 
    name: "Stable Diffusion", 
    description: "Modelo open-source de geração de imagens", 
    category: "Criação Visual", 
    logo: "https://stability.ai/favicon.ico",
    slug: "stable-diffusion" 
  },
  { 
    name: "RunwayML", 
    description: "Ferramentas criativas de IA para vídeo e imagem", 
    category: "Criação Visual", 
    logo: "https://runwayml.com/favicon.ico",
    slug: "runwayml" 
  },
  { 
    name: "ElevenLabs", 
    description: "Síntese de voz ultra-realista", 
    category: "Áudio", 
    logo: "https://elevenlabs.io/favicon.ico",
    slug: "elevenlabs" 
  },
  { 
    name: "Suno", 
    description: "Geração de música completa com IA", 
    category: "Áudio", 
    logo: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='75' font-size='80'%3E🎵%3C/text%3E%3C/svg%3E",
    slug: "suno" 
  },
  { 
    name: "GitHub Copilot", 
    description: "Assistente de programação da GitHub", 
    category: "Código", 
    logo: "https://github.githubassets.com/favicons/favicon.svg",
    slug: "github-copilot" 
  },
  { 
    name: "Cursor", 
    description: "IDE com IA integrada", 
    category: "Código", 
    logo: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' fill='%23FF6B00'%3E%3Cpolygon points='50,10 90,90 10,90'/%3E%3C/svg%3E",
    slug: "cursor" 
  },
  { 
    name: "n8n", 
    description: "Automação de workflows com nodes visuais", 
    category: "Automação", 
    logo: "https://n8n.io/favicon.ico",
    slug: "n8n" 
  },
  { 
    name: "Make", 
    description: "Automação visual de processos (ex-Integromat)", 
    category: "Automação", 
    logo: "https://www.make.com/en/favicon.ico",
    slug: "make" 
  },
  { 
    name: "Zapier", 
    description: "Conecte apps e automatize workflows", 
    category: "Automação", 
    logo: "https://cdn.zappy.app/8d67c00a2da6bb3b23e85d1c38fd2b07.png",
    slug: "zapier" 
  },
  { 
    name: "Flowise", 
    description: "Construa agentes LLM com interface visual", 
    category: "Agentes", 
    logo: "https://docs.flowiseai.com/img/favicon.ico",
    slug: "flowise" 
  },
  { 
    name: "NotebookLM", 
    description: "Assistente de pesquisa do Google", 
    category: "Produtividade", 
    logo: "https://www.gstatic.com/lamda/images/favicon_v1_150160cddff7f294ce30.svg",
    slug: "notebooklm" 
  },
  { 
    name: "Pika Labs", 
    description: "Geração de vídeos com IA", 
    category: "Criação Visual", 
    logo: "https://pika.art/pika-logo.png",
    slug: "pika-labs" 
  },
];

export function AIToolsMarquee() {
  const [hoveredTool, setHoveredTool] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  return (
    <section className="py-16 pb-32 relative overflow-visible">
      {/* Gradient borders */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-primary/5" />
      
      <div className="container mx-auto px-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <div className="flex items-center justify-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-primary" />
            <p className="text-sm font-semibold text-primary uppercase tracking-wider">
              +100 Ferramentas de IA
            </p>
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Domine mais de 100 ferramentas de IA com nossos cursos especializados
          </p>
        </motion.div>
      </div>

      <div 
        className="relative"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Gradient overlays for fade effect */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
        
        <motion.div 
          className="flex gap-6"
          animate={{ 
            x: isPaused ? undefined : ["-50%", "0%"]
          }}
          transition={{
            duration: 60,
            repeat: Infinity,
            ease: "linear",
            repeatType: "loop"
          }}
        >
          {[...aiTools, ...aiTools, ...aiTools].map((tool, i) => (
            <motion.div
              key={`${tool.name}-${i}`}
              className="relative group flex-shrink-0"
              onMouseEnter={() => setHoveredTool(`${tool.name}-${i}`)}
              onMouseLeave={() => setHoveredTool(null)}
              whileHover={{ scale: 1.05, y: -4 }}
            >
              {/* Tool Logo Card */}
              <Card className="w-32 h-32 flex items-center justify-center bg-card/50 border-border hover:border-primary/50 hover:bg-primary/5 backdrop-blur transition-all duration-300 cursor-pointer relative overflow-hidden">
                {/* Glow effect on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* Logo */}
                <div className="relative z-10 group-hover:scale-110 transition-transform duration-300">
                  <img 
                    src={tool.logo} 
                    alt={`${tool.name} logo`}
                    className="w-16 h-16 object-contain"
                    onError={(e) => {
                      // Fallback to text if image fails to load
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement!.innerHTML = `<div class="text-4xl">${tool.name.charAt(0)}</div>`;
                    }}
                  />
                </div>
                
                {/* Tool name badge */}
                <div className="absolute bottom-2 left-2 right-2">
                  <Badge 
                    variant="secondary" 
                    className="w-full text-xs truncate bg-background/80 backdrop-blur text-center justify-center border-primary/20"
                  >
                    {tool.name}
                  </Badge>
                </div>
              </Card>

              {/* Hover Tooltip Popup - Positioned ABOVE the card */}
              <AnimatePresence>
                {hoveredTool === `${tool.name}-${i}` && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute bottom-full mb-6 left-1/2 -translate-x-1/2 z-[100] w-72"
                  >
                    <Card className="p-4 bg-card border-primary/50 shadow-2xl shadow-primary/20">
                      <div className="flex items-start gap-3 mb-3">
                        <img 
                          src={tool.logo} 
                          alt={`${tool.name} logo`}
                          className="w-12 h-12 object-contain rounded"
                        />
                        <div className="flex-1">
                          <h4 className="font-bold text-foreground mb-1">{tool.name}</h4>
                          <Badge variant="secondary" className="text-xs">
                            {tool.category}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {tool.description}
                      </p>
                      <Link 
                        href={`/ferramentas/${tool.slug}`}
                        className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors group/link"
                      >
                        <span>Ver ferramenta</span>
                        <ExternalLink className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
                      </Link>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
