"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { ExternalLink, Sparkles, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { createPortal } from "react-dom";

interface AITool {
  key: string;
  logo: string;
  slug?: string;
  url?: string; // External URL
  name?: string; // Fallback name
  description?: string; // Fallback description
  category?: string; // Fallback category
}

interface ToolContent extends AITool {
  isInternal: boolean;
}

// Original tools with internal pages
const originalTools: AITool[] = [
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
    logo: "https://suno.com/favicon.ico",
    slug: "suno" 
  },
  { 
    key: "githubCopilot",
    logo: "https://github.githubassets.com/favicons/favicon.svg",
    slug: "github-copilot" 
  },
  { 
    key: "cursor",
    logo: "https://www.cursor.com/favicon.ico",
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

// New tools with internal pages
const additionalTools: AITool[] = [
  { key: "meta-ai", logo: "https://static.xx.fbcdn.net/rsrc.php/yD/r/d4ZIVX-5C-b.ico", slug: "meta-ai", name: "Meta AI", category: "IA Conversacional", description: "Modelos Llama open source da Meta" },
  { key: "mistral", logo: "https://mistral.ai/favicon.ico", slug: "mistral", name: "Mistral AI", category: "IA Conversacional", description: "Modelos eficientes e poderosos da Europa" },
  { key: "grok", logo: "https://x.ai/favicon.ico", slug: "grok", name: "Grok", category: "IA Conversacional", description: "IA da xAI com acesso ao X/Twitter" },
  { key: "deepseek", logo: "https://www.deepseek.com/favicon.ico", slug: "deepseek", name: "DeepSeek", category: "IA Conversacional", description: "IA open source com raciocínio avançado" },
  { key: "cohere", logo: "https://cohere.com/favicon.ico", slug: "cohere", name: "Cohere", category: "IA Enterprise", description: "IA para empresas com RAG e embeddings" },
  { key: "hugging-face", logo: "https://huggingface.co/favicon.ico", slug: "hugging-face", name: "Hugging Face", category: "Infraestrutura IA", description: "O GitHub dos modelos de IA" },
  { key: "langchain", logo: "https://python.langchain.com/img/favicon.ico", slug: "langchain", name: "LangChain", category: "Framework", description: "Framework para apps com LLMs" },
  { key: "pinecone", logo: "https://www.pinecone.io/favicon.ico", slug: "pinecone", name: "Pinecone", category: "Banco de Dados", description: "Banco de dados vetorial para IA" },
  { key: "jasper", logo: "https://www.jasper.ai/favicon.ico", slug: "jasper", name: "Jasper", category: "Marketing", description: "Plataforma de marketing com IA" },
  { key: "copy-ai", logo: "https://www.copy.ai/favicon.ico", slug: "copy-ai", name: "Copy.ai", category: "Marketing", description: "Automação de vendas e marketing" },
  { key: "grammarly", logo: "https://www.grammarly.com/favicon.ico", slug: "grammarly", name: "Grammarly", category: "Escrita", description: "Assistente de escrita com IA" },
  { key: "descript", logo: "https://www.descript.com/favicon.ico", slug: "descript", name: "Descript", category: "Edição de Vídeo", description: "Edição de áudio e vídeo como texto" },
  { key: "synthesia", logo: "https://www.synthesia.io/favicon.ico", slug: "synthesia", name: "Synthesia", category: "Vídeo IA", description: "Vídeos com avatares de IA" },
  { key: "heygen", logo: "https://www.heygen.com/favicon.ico", slug: "heygen", name: "HeyGen", category: "Vídeo IA", description: "Avatares realistas com IA" },
  { key: "canva", logo: "https://static.canva.com/static/images/favicon.ico", slug: "canva", name: "Canva", category: "Design", description: "Design com ferramentas mágicas de IA" },
  { key: "notion-ai", logo: "https://www.notion.so/images/favicon.ico", slug: "notion-ai", name: "Notion AI", category: "Produtividade", description: "Workspace conectado com IA" },
  { key: "vercel-ai", logo: "https://vercel.com/favicon.ico", slug: "vercel-ai", name: "Vercel", category: "Infraestrutura", description: "Frontend cloud com AI SDK" },
  { key: "replit", logo: "https://replit.com/public/icons/favicon-196.png", slug: "replit", name: "Replit", category: "Código", description: "IDE com IA e deploy instantâneo" },
  { key: "figma", logo: "https://static.figma.com/app/icon/1/favicon.ico", slug: "figma", name: "Figma", category: "Design", description: "Design de interface colaborativo" },
  { key: "slack-ai", logo: "https://a.slack-edge.com/80588/marketing/img/meta/favicon-32.png", slug: "slack-ai", name: "Slack", category: "Comunicação", description: "Comunicação de equipe com IA" },
  { key: "discord", logo: "https://discord.com/assets/847541504914fd33810e70a0ea73177e.ico", slug: "discord", name: "Discord", category: "Comunidade", description: "Comunidade para devs e IA" },
  { key: "microsoft-copilot", logo: "https://www.microsoft.com/favicon.ico", slug: "microsoft-copilot", name: "Microsoft Copilot", category: "Produtividade", description: "IA no Word, Excel e Teams" },
  { key: "google-workspace-ai", logo: "https://www.google.com/favicon.ico", slug: "google-workspace-ai", name: "Google Workspace AI", category: "Produtividade", description: "Gemini no Docs, Sheets e Gmail" },
  { key: "supabase", logo: "https://supabase.com/favicon.ico", slug: "supabase", name: "Supabase", category: "Infraestrutura", description: "Backend open source com pgvector" },
  { key: "gamma", logo: "https://gamma.app/favicon.ico", slug: "gamma", name: "Gamma", category: "Apresentações", description: "Apresentações geradas por IA" },
  { key: "tome", logo: "https://tome.app/favicon.ico", slug: "tome", name: "Tome", category: "Apresentações", description: "Storytelling com IA" },
  { key: "beautiful-ai", logo: "https://www.beautiful.ai/favicon.ico", slug: "beautiful-ai", name: "Beautiful.ai", category: "Apresentações", description: "Slides profissionais com IA" },
  { key: "kling", logo: "https://klingai.com/favicon.ico", slug: "kling", name: "Kling AI", category: "Vídeo IA", description: "Geração de vídeo de alta qualidade" },
  { key: "luma", logo: "https://lumalabs.ai/favicon.ico", slug: "luma", name: "Luma Dream Machine", category: "Vídeo IA", description: "Geração de vídeo e 3D com IA" },
  { key: "v0", logo: "https://v0.dev/favicon.ico", slug: "v0", name: "v0", category: "Código", description: "Gerador de UI com IA da Vercel" },
  { key: "lovable", logo: "https://lovable.dev/favicon.ico", slug: "lovable", name: "Lovable", category: "Código", description: "Geração de apps full-stack com IA" },
  { key: "bolt", logo: "https://bolt.new/favicon.ico", slug: "bolt", name: "Bolt.new", category: "Código", description: "Apps web completos no navegador" },
  { key: "windsurf", logo: "https://windsurf.com/favicon.ico", slug: "windsurf", name: "Windsurf", category: "Código", description: "IDE com IA integrada" },
  { key: "adobe-firefly", logo: "https://www.adobe.com/favicon.ico", slug: "adobe-firefly", name: "Adobe Firefly", category: "Design", description: "IA generativa no Creative Cloud" },
  { key: "ideogram", logo: "https://ideogram.ai/favicon.ico", slug: "ideogram", name: "Ideogram", category: "Criação Visual", description: "Geração de imagens com texto perfeito" },
  { key: "napkin-ai", logo: "https://www.napkin.ai/favicon.ico", slug: "napkin-ai", name: "Napkin AI", category: "Visualização", description: "Texto em diagramas e infográficos" },
  { key: "claude-code", logo: "https://claude.ai/images/claude_app_icon.png", slug: "claude-code", name: "Claude Code", category: "Código", description: "Agente de código IA no terminal" },
];

const allTools = [...originalTools, ...additionalTools];

// ToolIcon component to handle image errors gracefully
const ToolIcon = ({ logo, name, className }: { logo: string, name: string, className: string }) => {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100 dark:bg-secondary rounded-full`}>
        <span className="text-lg font-bold text-muted-foreground">{name.charAt(0)}</span>
      </div>
    );
  }

  return (
    <img 
      src={logo} 
      alt={`${name} logo`}
      className={className}
      onError={() => setError(true)}
    />
  );
};

// Portal Tooltip Component
const PortalTooltip = ({ 
  content, 
  position, 
  onClose 
}: { 
  content: ToolContent, 
  position: { x: number, y: number } | null, 
  onClose: () => void 
}) => {
  if (!position || !content) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 5, scale: 0.98 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="fixed z-[9999] pointer-events-none"
        style={{ 
          left: position.x, 
          top: position.y, 
          transform: 'translate(-50%, 0)' 
        }}
      >
        <div className="p-4 bg-white/95 backdrop-blur-xl dark:bg-card/95 border border-gray-200/50 dark:border-border/50 shadow-2xl rounded-xl text-left w-64 relative mt-4">
           {/* Little arrow pointing up */}
           <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white dark:bg-card border-t border-l border-gray-200/50 dark:border-border/50 transform rotate-45" />

          <div className="flex items-center gap-2 mb-2 relative z-10">
            <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100">{content.name}</h4>
            {content.category && (
              <span className="text-[10px] px-2 py-0.5 bg-primary/10 text-primary rounded-full font-semibold truncate max-w-[110px]">
                {content.category}
              </span>
            )}
          </div>
          {content.description && (
            <p className="text-xs text-muted-foreground dark:text-muted-foreground leading-relaxed line-clamp-2 mb-3 relative z-10">
              {content.description}
            </p>
          )}
          <div className="flex items-center gap-1.5 text-xs font-semibold text-primary relative z-10">
              {content.isInternal ? (
                <>
                  Ver detalhes
                  <motion.span
                    animate={{ x: [0, 3, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    <ArrowUpRight className="w-3 h-3" />
                  </motion.span>
                </>
              ) : (
                <>
                  Visitar site 
                  <motion.span
                    animate={{ x: [0, 3, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    <ExternalLink className="w-3 h-3" />
                  </motion.span>
                </>
              )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};

const MarqueeRow = ({ 
  tools, 
  direction = "left", 
  speed = 80,
  onHoverTool,
  onLeaveTool,
  t
}: { 
  tools: AITool[], 
  direction?: "left" | "right", 
  speed?: number,
  onHoverTool: (e: React.MouseEvent, tool: ToolContent) => void,
  onLeaveTool: () => void,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: any
}) => {
  const [isPaused, setIsPaused] = useState(false);

  return (
    <div 
      className="flex overflow-hidden select-none py-6 group/marquee"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => {
        setIsPaused(false);
        onLeaveTool();
      }}
    >
      <div
        className="flex gap-4 flex-shrink-0"
        style={{
          animation: `marquee ${speed}s linear infinite`,
          animationDirection: direction === "right" ? "reverse" : "normal",
          animationPlayState: isPaused ? "paused" : "running",
          willChange: "transform"
        }}
      >
        {[...tools, ...tools].map((tool, i) => {
          let name = tool.name || "";
          let description = tool.description || "";
          let category = tool.category || "IA";

          try {
             // eslint-disable-next-line @typescript-eslint/no-explicit-any
             const toolCopy = t.raw(`tools.${tool.key}`) as any;
             if (toolCopy && typeof toolCopy === 'object' && toolCopy.name) {
                name = toolCopy.name;
                description = toolCopy.description;
                category = toolCopy.category;
             }
          } catch (e) {
            // Translation missing
          }
          
          if (!name) name = tool.key;

          const isInternal = !!tool.slug;
          const linkUrl = isInternal ? `/ferramentas/${tool.slug}` : (tool.url || "#");

          return (
            <motion.div
              key={`${tool.key}-${i}`}
              className="relative group/card flex-shrink-0"
              onMouseEnter={(e) => onHoverTool(e, { ...tool, name, description, category, isInternal })}
              onMouseLeave={onLeaveTool}
              whileHover={{ 
                scale: 1.1, 
                y: -5,
                zIndex: 50,
                transition: { type: "spring", stiffness: 400, damping: 25 }
              }}
            >
              <Link href={linkUrl} target={isInternal ? "_self" : "_blank"} className="block">
                <div className="w-16 h-16 md:w-24 md:h-24 flex items-center justify-center bg-white dark:bg-secondary/10 rounded-xl md:rounded-2xl shadow-sm border border-border/50 group-hover/card:shadow-xl group-hover/card:border-primary/30 transition-colors duration-300 cursor-pointer overflow-hidden relative z-10">
                  <ToolIcon 
                    logo={tool.logo} 
                    name={name} 
                    className="w-8 h-8 md:w-12 md:h-12 object-contain filter grayscale group-hover/card:grayscale-0 transition-all duration-300"
                  />
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export function AIToolsMarquee() {
  const t = useTranslations("Home.AIToolsMarquee");
  const [tooltipState, setTooltipState] = useState<{
    content: ToolContent;
    position: { x: number, y: number } | null;
  } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleHoverTool = (e: React.MouseEvent, toolContent: ToolContent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipState({
      content: toolContent,
      position: {
        x: rect.left + rect.width / 2,
        y: rect.bottom
      }
    });
  };

  const handleLeaveTool = () => {
    setTooltipState(null);
  };

  // Split tools into two rows
  const midPoint = Math.ceil(allTools.length / 2);
  const firstRow = allTools.slice(0, midPoint);
  const secondRow = allTools.slice(midPoint);

  return (
    <section className="py-12 md:py-20 relative overflow-hidden overflow-x-hidden z-10">
      {/* Background glow/gradients */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background opacity-50" />
      
      <div className="container mx-auto px-4 mb-12 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-amber-400">
              {t("badge")}
            </span>
          </h2>
          <p className="text-muted-foreground">
            {t("subtitle")}
          </p>
        </motion.div>
      </div>

      <div className="relative w-full overflow-hidden">
        {/* Side Gradients for Fade Effect */}
        <div className="absolute left-0 top-0 bottom-0 w-12 md:w-40 bg-gradient-to-r from-background to-transparent z-20 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-12 md:w-40 bg-gradient-to-l from-background to-transparent z-20 pointer-events-none" />

        <div className="flex flex-col gap-4 md:gap-6 md:-rotate-1 transform origin-center">
           <MarqueeRow 
             tools={firstRow} 
             direction="left" 
             speed={80} 
             onHoverTool={handleHoverTool}
             onLeaveTool={handleLeaveTool}
             t={t}
           />
           <MarqueeRow 
             tools={secondRow} 
             direction="right" 
             speed={80} 
             onHoverTool={handleHoverTool}
             onLeaveTool={handleLeaveTool}
             t={t}
           />
        </div>
      </div>

      {mounted && tooltipState && (
        <PortalTooltip 
          content={tooltipState.content} 
          position={tooltipState.position} 
          onClose={handleLeaveTool} 
        />
      )}
    </section>
  );
}
