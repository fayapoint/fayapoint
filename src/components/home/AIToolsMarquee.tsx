import { Badge } from "@/components/ui/badge";

const aiTools = [
  "ChatGPT", "Claude", "Midjourney", "DALL-E 3", "Perplexity", 
  "Gemini", "Stable Diffusion", "RunwayML", "ElevenLabs", "Suno",
  "GitHub Copilot", "Cursor", "n8n", "Make", "Zapier", "Flowise",
  "NotebookLM", "Pika Labs", "Google Veo", "Synthesia", "HeyGen",
  "AutoGPT", "AgentGPT", "LangChain", "Pinecone", "Qdrant",
];

export function AIToolsMarquee() {
  return (
    <section className="py-12 border-y border-white/10 overflow-hidden">
      <div className="relative">
        <div className="flex animate-marquee">
          {[...aiTools, ...aiTools].map((tool, i) => (
            <div key={i} className="flex items-center mx-4 whitespace-nowrap">
              <Badge 
                variant="outline" 
                className="text-lg px-4 py-2 border-purple-500/50 bg-purple-900/20"
              >
                {tool}
              </Badge>
            </div>
          ))}
        </div>
      </div>
      <div className="text-center mt-6">
        <p className="text-sm text-gray-400">
          Domine mais de 100 ferramentas de IA com nossos cursos especializados
        </p>
      </div>
    </section>
  );
}
