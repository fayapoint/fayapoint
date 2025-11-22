"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { ExternalLink, Sparkles } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

interface AITool {
  key:
    | "chatgpt"
    | "claude"
    | "midjourney"
    | "dalle3"
    | "perplexity"
    | "gemini"
    | "stableDiffusion"
    | "runwayml"
    | "elevenlabs"
    | "suno"
    | "githubCopilot"
    | "cursor"
    | "n8n"
    | "make"
    | "zapier"
    | "flowise"
    | "notebooklm"
    | "pikaLabs";
  logo: string;
  slug: string;
}

const aiTools: AITool[] = [
  { 
    key: "chatgpt",
    logo: "https://cdn.oaistatic.com/_next/static/media/apple-touch-icon.82af6fe1.png",
    slug: "chatgpt" 
  },
  { 
    key: "claude",
    logo: "https://claude.ai/images/claude_app_icon.png",
    slug: "claude" 
  },
  { 
    key: "midjourney",
    logo: "https://cdn.midjourney.com/logo/logo-midjourney.svg",
    slug: "midjourney" 
  },
  { 
    key: "dalle3",
    logo: "https://cdn.oaistatic.com/_next/static/media/apple-touch-icon.82af6fe1.png",
    slug: "dall-e" 
  },
  { 
    key: "perplexity",
    logo: "https://www.perplexity.ai/favicon.svg",
    slug: "perplexity" 
  },
  { 
    key: "gemini",
    logo: "https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg",
    slug: "gemini" 
  },
  { 
    key: "stableDiffusion",
    logo: "https://stability.ai/favicon.ico",
    slug: "stable-diffusion" 
  },
  { 
    key: "runwayml",
    logo: "https://runwayml.com/favicon.ico",
    slug: "runwayml" 
  },
  { 
    key: "elevenlabs",
    logo: "https://elevenlabs.io/favicon.ico",
    slug: "elevenlabs" 
  },
  { 
    key: "suno",
    logo: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='75' font-size='80'%3E🎵%3C/text%3E%3C/svg%3E",
    slug: "suno" 
  },
  { 
    key: "githubCopilot",
    logo: "https://github.githubassets.com/favicons/favicon.svg",
    slug: "github-copilot" 
  },
  { 
    key: "cursor",
    logo: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' fill='%23FF6B00'%3E%3Cpolygon points='50,10 90,90 10,90'/%3E%3C/svg%3E",
    slug: "cursor" 
  },
  { 
    key: "n8n",
    logo: "https://n8n.io/favicon.ico",
    slug: "n8n" 
  },
  { 
    key: "make",
    logo: "https://www.make.com/en/favicon.ico",
    slug: "make" 
  },
  { 
    key: "zapier",
    logo: "https://cdn.zappy.app/8d67c00a2da6bb3b23e85d1c38fd2b07.png",
    slug: "zapier" 
  },
  { 
    key: "flowise",
    logo: "https://docs.flowiseai.com/img/favicon.ico",
    slug: "flowise" 
  },
  { 
    key: "notebooklm",
    logo: "https://www.gstatic.com/lamda/images/favicon_v1_150160cddff7f294ce30.svg",
    slug: "notebooklm" 
  },
  { 
    key: "pikaLabs",
    logo: "https://pika.art/pika-logo.png",
    slug: "pika-labs" 
  },
];

export function AIToolsMarquee() {
  const [hoveredTool, setHoveredTool] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const t = useTranslations("Home.AIToolsMarquee");

  // Split tools into two rows
  const midPoint = Math.ceil(aiTools.length / 2);
  const firstRow = aiTools.slice(0, midPoint);
  const secondRow = aiTools.slice(midPoint);

  const MarqueeRow = ({ tools, direction = "left", speed = 40 }: { tools: AITool[], direction?: "left" | "right", speed?: number }) => (
    <div className="flex overflow-hidden select-none py-4">
      <motion.div
        className="flex gap-4 flex-shrink-0"
        initial={{ x: direction === "left" ? 0 : "-50%" }}
        animate={{ 
          x: direction === "left" ? "-50%" : 0 
        }}
        transition={{
          duration: speed,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop"
        }}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        style={{ animationPlayState: isPaused ? "paused" : "running" }}
      >
        {/* Repeat the list enough times to ensure smooth infinite scroll */}
        {[...tools, ...tools, ...tools, ...tools].map((tool, i) => {
          const toolCopy = t.raw(`tools.${tool.key}`) as {
            name: string;
            description: string;
            category: string;
          };
          const { name, description, category } = toolCopy;

          return (
            <motion.div
              key={`${tool.key}-${i}`}
              className="relative group flex-shrink-0"
              onMouseEnter={() => setHoveredTool(`${tool.key}-${i}`)}
              onMouseLeave={() => setHoveredTool(null)}
              whileHover={{ scale: 1.05, y: -2 }}
            >
              {/* Tool Logo Card - n8n style: white/clean rounded square */}
              <div className="w-20 h-20 md:w-24 md:h-24 flex items-center justify-center bg-white rounded-xl shadow-sm border border-border/50 hover:shadow-md hover:border-primary/30 transition-all duration-300 cursor-pointer overflow-hidden">
                <img 
                  src={tool.logo} 
                  alt={`${name} logo`}
                  className="w-10 h-10 md:w-12 md:h-12 object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement!.innerHTML = `<div class="text-xl font-bold text-gray-800">${name.charAt(0)}</div>`;
                  }}
                />
              </div>

              {/* Hover Tooltip Popup */}
              <AnimatePresence>
                {hoveredTool === `${tool.key}-${i}` && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full mt-4 left-1/2 -translate-x-1/2 z-[100] w-64 pointer-events-none"
                  >
                    <Card className="p-3 bg-popover border-primary/20 shadow-xl">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                          <img 
                            src={tool.logo} 
                            alt={`${name} logo`}
                            className="w-5 h-5 object-contain"
                          />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm">{name}</h4>
                          <Badge variant="outline" className="text-[10px] h-5">
                            {category}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {description}
                      </p>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );

  return (
    <section className="py-20 relative overflow-hidden z-10">
      {/* Background glow/gradients */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background opacity-50" />
      
      <div className="container mx-auto px-4 mb-12 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">
              Mais de 100 Ferramentas
            </span>
          </h2>
          <p className="text-muted-foreground">
            {t("subtitle")}
          </p>
        </motion.div>
      </div>

      <div className="relative w-full max-w-[100vw] overflow-hidden">
        {/* Side Gradients for Fade Effect */}
        <div className="absolute left-0 top-0 bottom-0 w-20 md:w-40 bg-gradient-to-r from-background to-transparent z-20 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-20 md:w-40 bg-gradient-to-l from-background to-transparent z-20 pointer-events-none" />

        <div className="flex flex-col gap-6 -rotate-1 scale-[1.02] transform origin-center">
           <MarqueeRow tools={firstRow} direction="left" speed={60} />
           <MarqueeRow tools={secondRow} direction="right" speed={50} />
        </div>
      </div>
    </section>
  );
}
