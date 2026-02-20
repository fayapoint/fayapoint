"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  Send,
  Loader2,
  Sparkles,
  BookOpen,
  Lightbulb,
  Code,
  Mic,
  Paperclip,
  RotateCcw,
  Copy,
  Check,
  MessageSquare,
  Zap,
  Crown,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "react-hot-toast";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface AIAssistantPanelProps {
  isPro: boolean;
  userName: string;
  aiChats: number;
}

const SUGGESTED_PROMPTS = [
  { icon: BookOpen, text: "Explique o conceito de Prompt Engineering", category: "Aprendizado" },
  { icon: Lightbulb, text: "Dicas para criar prompts melhores no ChatGPT", category: "Dicas" },
  { icon: Code, text: "Como automatizar tarefas com n8n?", category: "Automação" },
  { icon: Sparkles, text: "Melhores práticas para gerar imagens com IA", category: "Criativo" },
];

export function AIAssistantPanel({ isPro, userName, aiChats }: AIAssistantPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `Olá ${userName}! 👋 Sou o assistente de IA da FayAi. Estou aqui para ajudar com suas dúvidas sobre os cursos, ferramentas de IA, automação e muito mais. Como posso ajudar você hoje?`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const token = localStorage.getItem("fayai_token");
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: input.trim() }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao processar mensagem");
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      toast.error(errorMessage);
      
      // Add error message
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    toast.success("Copiado!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleReset = () => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: `Olá ${userName}! 👋 Conversa reiniciada. Como posso ajudar?`,
        timestamp: new Date(),
      },
    ]);
  };

  const handleSuggestedPrompt = (text: string) => {
    setInput(text);
    textareaRef.current?.focus();
  };

  if (!isPro) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <Card className="bg-gray-900/50 border-gray-800 p-8 text-center max-w-md">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Bot size={40} className="text-purple-400" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Assistente IA</h2>
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50 mb-4">
            <Crown size={12} className="mr-1" />
            Recurso PRO
          </Badge>
          <p className="text-gray-400 mb-6">
            Upgrade para Pro para ter acesso ao assistente de IA personalizado. 
            Tire dúvidas, receba dicas e acelere seu aprendizado!
          </p>
          <Button className="bg-gradient-to-r from-purple-600 to-pink-600">
            <Crown size={16} className="mr-2" />
            Fazer Upgrade
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] max-h-[800px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
            <Bot size={24} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              Assistente IA
              <Badge className="bg-green-500/20 text-green-400 text-xs">Online</Badge>
            </h2>
            <p className="text-sm text-gray-400">Seu tutor pessoal de IA</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-purple-500/50 text-purple-400">
            <MessageSquare size={12} className="mr-1" />
            {aiChats} conversas
          </Badge>
          <Button variant="ghost" size="icon" onClick={handleReset} title="Reiniciar conversa">
            <RotateCcw size={18} />
          </Button>
        </div>
      </div>

      {/* Chat Area */}
      <Card className="flex-1 bg-gray-900/30 border-gray-800 overflow-hidden flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <AnimatePresence mode="popLayout">
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={cn(
                  "flex gap-3",
                  message.role === "user" && "flex-row-reverse"
                )}
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                    message.role === "assistant"
                      ? "bg-gradient-to-br from-purple-500 to-pink-500"
                      : "bg-gray-700"
                  )}
                >
                  {message.role === "assistant" ? (
                    <Sparkles size={16} className="text-white" />
                  ) : (
                    <span className="text-xs font-bold">
                      {userName.substring(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>

                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-3 relative group",
                    message.role === "assistant"
                      ? "bg-gray-800 rounded-tl-sm"
                      : "bg-purple-600 rounded-tr-sm"
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p className="text-[10px] text-gray-500 mt-1">
                    {message.timestamp.toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>

                  {message.role === "assistant" && (
                    <button
                      onClick={() => handleCopy(message.id, message.content)}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/10 rounded"
                    >
                      {copiedId === message.id ? (
                        <Check size={14} className="text-green-400" />
                      ) : (
                        <Copy size={14} className="text-gray-400" />
                      )}
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-3"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Sparkles size={16} className="text-white" />
              </div>
              <div className="bg-gray-800 rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin text-purple-400" />
                  <span className="text-sm text-gray-400">Pensando...</span>
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompts */}
        {messages.length <= 1 && (
          <div className="px-4 pb-4">
            <p className="text-xs text-gray-500 mb-2">Sugestões:</p>
            <div className="grid grid-cols-2 gap-2">
              {SUGGESTED_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSuggestedPrompt(prompt.text)}
                  className="flex items-center gap-2 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition text-left group"
                >
                  <prompt.icon
                    size={16}
                    className="text-purple-400 shrink-0 group-hover:scale-110 transition"
                  />
                  <span className="text-xs text-gray-300 line-clamp-2">{prompt.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Digite sua pergunta..."
                className="bg-gray-800 border-gray-700 min-h-[48px] max-h-[120px] resize-none pr-12"
                rows={1}
              />
              <div className="absolute bottom-2 right-2 flex items-center gap-1">
                <button className="p-1.5 hover:bg-white/10 rounded-lg transition opacity-50 hover:opacity-100">
                  <Paperclip size={16} className="text-gray-400" />
                </button>
                <button className="p-1.5 hover:bg-white/10 rounded-lg transition opacity-50 hover:opacity-100">
                  <Mic size={16} className="text-gray-400" />
                </button>
              </div>
            </div>
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="bg-purple-600 hover:bg-purple-700 h-12 px-4"
            >
              {isLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Send size={18} />
              )}
            </Button>
          </div>
          <p className="text-[10px] text-gray-500 mt-2 text-center">
            Pressione Enter para enviar • Shift + Enter para nova linha
          </p>
        </div>
      </Card>
    </div>
  );
}
