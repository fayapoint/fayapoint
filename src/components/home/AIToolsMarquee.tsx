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
    logo: "https://logo.clearbit.com/perplexity.ai",
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
    logo: "https://logo.clearbit.com/suno.ai",
    slug: "suno" 
  },
  { 
    key: "githubCopilot",
    logo: "https://github.githubassets.com/favicons/favicon.svg",
    slug: "github-copilot" 
  },
  { 
    key: "cursor",
    logo: "https://logo.clearbit.com/cursor.sh",
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

// New tools to expand the list (Main Players & Popular Tools)
const additionalTools: AITool[] = [
  { key: "meta", logo: "https://logo.clearbit.com/meta.com", name: "Meta AI", category: "LLM Open Source", url: "https://ai.meta.com/", description: "Llama e tecnologias open source da Meta." },
  { key: "mistral", logo: "https://logo.clearbit.com/mistral.ai", name: "Mistral AI", category: "LLM Open Source", url: "https://mistral.ai/", description: "Modelos de IA eficientes e poderosos da Europa." },
  { key: "cohere", logo: "https://logo.clearbit.com/cohere.com", name: "Cohere", category: "LLM Enterprise", url: "https://cohere.com/", description: "IA focada em empresas e desenvolvedores." },
  { key: "huggingface", logo: "https://logo.clearbit.com/huggingface.co", name: "Hugging Face", category: "Hub de Modelos", url: "https://huggingface.co/", description: "A comunidade de IA e open source." },
  { key: "langchain", logo: "https://logowik.com/content/uploads/images/langchain9692.logowik.com.webp", name: "LangChain", category: "Framework", url: "https://langchain.com/", description: "Construa aplicações com LLMs facilmente." },
  { key: "pinecone", logo: "https://logo.clearbit.com/pinecone.io", name: "Pinecone", category: "Vector DB", url: "https://pinecone.io/", description: "Banco de dados vetorial para IA." },
  { key: "jasper", logo: "https://logo.clearbit.com/jasper.ai", name: "Jasper", category: "Marketing", url: "https://jasper.ai/", description: "Crie conteúdo de marketing com IA." },
  { key: "copyai", logo: "https://logo.clearbit.com/copy.ai", name: "Copy.ai", category: "Marketing", url: "https://copy.ai/", description: "Escrita automatizada para vendas e marketing." },
  { key: "descript", logo: "https://logo.clearbit.com/descript.com", name: "Descript", category: "Edição de Vídeo", url: "https://descript.com/", description: "Edição de áudio e vídeo como texto." },
  { key: "synthesia", logo: "https://logo.clearbit.com/synthesia.io", name: "Synthesia", category: "Avatar AI", url: "https://synthesia.io/", description: "Vídeos com avatares de IA em minutos." },
  { key: "heygen", logo: "https://logo.clearbit.com/heygen.com", name: "HeyGen", category: "Avatar AI", url: "https://heygen.com/", description: "Geração de vídeo com avatares realistas." },
  { key: "canva", logo: "https://logo.clearbit.com/canva.com", name: "Canva", category: "Design", url: "https://canva.com/", description: "Design simples com ferramentas mágicas de IA." },
  { key: "notion", logo: "https://logo.clearbit.com/notion.so", name: "Notion AI", category: "Produtividade", url: "https://notion.so/", description: "Seu workspace conectado com IA." },
  { key: "linear", logo: "https://logo.clearbit.com/linear.app", name: "Linear", category: "Gestão", url: "https://linear.app/", description: "Gestão de projetos moderna e rápida." },
  { key: "vercel", logo: "https://logo.clearbit.com/vercel.com", name: "Vercel", category: "Deploy", url: "https://vercel.com/", description: "Infraestrutura frontend e edge AI." },
  { key: "replit", logo: "https://logo.clearbit.com/replit.com", name: "Replit", category: "Coding", url: "https://replit.com/", description: "IDE colaborativo e deploy instantâneo." },
  { key: "docker", logo: "https://logo.clearbit.com/docker.com", name: "Docker", category: "DevOps", url: "https://docker.com/", description: "Containers para desenvolvimento moderno." },
  { key: "postman", logo: "https://logo.clearbit.com/postman.com", name: "Postman", category: "API", url: "https://postman.com/", description: "Plataforma para construção de APIs." },
  { key: "figma", logo: "https://logo.clearbit.com/figma.com", name: "Figma", category: "Design", url: "https://figma.com/", description: "Design de interface colaborativo." },
  { key: "slack", logo: "https://logo.clearbit.com/slack.com", name: "Slack", category: "Comunicação", url: "https://slack.com/", description: "Onde o trabalho acontece." },
  { key: "discord", logo: "https://logo.clearbit.com/discord.com", name: "Discord", category: "Comunidade", url: "https://discord.com/", description: "Lugar para conversar e interagir." },
  { key: "zoom", logo: "https://logo.clearbit.com/zoom.us", name: "Zoom", category: "Reuniões", url: "https://zoom.us/", description: "Videoconferências com IA integrada." },
  { key: "microsoft", logo: "https://logo.clearbit.com/microsoft.com", name: "Microsoft", category: "Produtividade", url: "https://microsoft.com/", description: "Copilot para Microsoft 365." },
  { key: "google", logo: "https://logo.clearbit.com/google.com", name: "Google", category: "Tech Giant", url: "https://google.com/", description: "Gemini e ecossistema Google AI." },
  { key: "supabase", logo: "https://logo.clearbit.com/supabase.com", name: "Supabase", category: "Backend", url: "https://supabase.com/", description: "A alternativa Open Source ao Firebase." },
  { key: "stripe", logo: "https://logo.clearbit.com/stripe.com", name: "Stripe", category: "Pagamentos", url: "https://stripe.com/", description: "Infraestrutura financeira para internet." },
  { key: "gamma", logo: "https://logo.clearbit.com/gamma.app", name: "Gamma", category: "Apresentações", url: "https://gamma.app/", description: "Apresentações bonitas geradas por IA." },
  { key: "tome", logo: "https://logo.clearbit.com/tome.app", name: "Tome", category: "Storytelling", url: "https://tome.app/", description: "Formato de storytelling generativo." },
  { key: "beautifulai", logo: "https://logo.clearbit.com/beautiful.ai", name: "Beautiful.ai", category: "Apresentações", url: "https://beautiful.ai/", description: "Slides de design profissional com IA." },
];

const allTools = [...originalTools, ...additionalTools];

// ToolIcon component to handle image errors gracefully
const ToolIcon = ({ logo, name, className }: { logo: string, name: string, className: string }) => {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-full`}>
        <span className="text-lg font-bold text-gray-500">{name.charAt(0)}</span>
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
        <div className="p-4 bg-white/95 backdrop-blur-xl dark:bg-gray-900/95 border border-gray-200/50 dark:border-gray-800/50 shadow-2xl rounded-xl text-left w-64 relative mt-4">
           {/* Little arrow pointing up */}
           <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white dark:bg-gray-900 border-t border-l border-gray-200/50 dark:border-gray-800/50 transform rotate-45" />

          <div className="flex items-center gap-2 mb-2 relative z-10">
            <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100">{content.name}</h4>
            {content.category && (
              <span className="text-[10px] px-2 py-0.5 bg-primary/10 text-primary rounded-full font-semibold truncate max-w-[110px]">
                {content.category}
              </span>
            )}
          </div>
          {content.description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2 mb-3 relative z-10">
              {content.description}
            </p>
          )}
          <div className="flex items-center gap-1.5 text-xs font-semibold text-primary relative z-10">
              {content.isInternal ? (
                <>
                  Ver curso 
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

          const isInternal = !!tool.slug && originalTools.some(t => t.key === tool.key);
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
                <div className="w-20 h-20 md:w-24 md:h-24 flex items-center justify-center bg-white dark:bg-secondary/10 rounded-2xl shadow-sm border border-border/50 group-hover/card:shadow-xl group-hover/card:border-primary/30 transition-colors duration-300 cursor-pointer overflow-hidden relative z-10">
                  <ToolIcon 
                    logo={tool.logo} 
                    name={name} 
                    className="w-10 h-10 md:w-12 md:h-12 object-contain filter grayscale group-hover/card:grayscale-0 transition-all duration-300"
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
