"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Code2, 
  Lock, 
  Zap, 
  BookOpen, 
  ChevronDown, 
  ChevronRight,
  Copy,
  Check,
  ExternalLink,
  Shield,
  Image as ImageIcon,
  Calendar,
  User,
  GraduationCap
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Endpoint {
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  path: string;
  description: string;
  auth: boolean;
  requestBody?: string;
  responseBody?: string;
}

interface APICategory {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  endpoints: Endpoint[];
}

const apiCategories: APICategory[] = [
  {
    id: "auth",
    title: "Autenticação",
    description: "Endpoints para login, registro e gerenciamento de sessão",
    icon: <Lock className="w-5 h-5" />,
    endpoints: [
      {
        method: "POST",
        path: "/api/auth/login",
        description: "Autenticar usuário e obter token JWT",
        auth: false,
        requestBody: `{
  "email": "usuario@exemplo.com",
  "password": "sua_senha"
}`,
        responseBody: `{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "...",
    "name": "Nome do Usuário",
    "email": "usuario@exemplo.com",
    "subscription": { "plan": "free" }
  }
}`
      },
      {
        method: "POST",
        path: "/api/auth/register",
        description: "Criar nova conta de usuário",
        auth: false,
        requestBody: `{
  "name": "Nome Completo",
  "email": "usuario@exemplo.com",
  "password": "senha_segura",
  "interest": "ia-generativa"
}`,
        responseBody: `{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { ... }
}`
      },
      {
        method: "POST",
        path: "/api/auth/check-email",
        description: "Verificar se um email já está registrado",
        auth: false,
        requestBody: `{ "email": "usuario@exemplo.com" }`,
        responseBody: `{ "exists": true }`
      },
      {
        method: "POST",
        path: "/api/auth/change-password",
        description: "Alterar senha do usuário autenticado",
        auth: true,
        requestBody: `{
  "currentPassword": "senha_atual",
  "newPassword": "nova_senha"
}`,
        responseBody: `{ "success": true }`
      }
    ]
  },
  {
    id: "user",
    title: "Usuário",
    description: "Gerenciamento de perfil e dados do usuário",
    icon: <User className="w-5 h-5" />,
    endpoints: [
      {
        method: "GET",
        path: "/api/user/dashboard",
        description: "Obter dados completos do dashboard do usuário",
        auth: true,
        responseBody: `{
  "user": {
    "name": "...",
    "email": "...",
    "subscription": { "plan": "pro" },
    "progress": {
      "level": 5,
      "points": 1250,
      "currentStreak": 7
    }
  },
  "enrolledCourses": [...],
  "enrollmentSlots": {...}
}`
      },
      {
        method: "POST",
        path: "/api/user/checkin",
        description: "Registrar check-in diário e ganhar XP",
        auth: true,
        requestBody: `{ "type": "daily_login" }`,
        responseBody: `{
  "success": true,
  "xpEarned": 10,
  "newStreak": 8
}`
      }
    ]
  },
  {
    id: "courses",
    title: "Cursos",
    description: "Acesso a cursos, matrículas e conteúdo",
    icon: <GraduationCap className="w-5 h-5" />,
    endpoints: [
      {
        method: "GET",
        path: "/api/courses",
        description: "Listar todos os cursos disponíveis",
        auth: false,
        responseBody: `{
  "courses": [
    {
      "slug": "chatgpt-masterclass",
      "title": "ChatGPT Masterclass",
      "level": "Iniciante",
      "duration": "8h",
      "modules": 12
    }
  ]
}`
      },
      {
        method: "GET",
        path: "/api/courses/[slug]",
        description: "Obter detalhes de um curso específico",
        auth: false,
        responseBody: `{
  "course": {
    "slug": "...",
    "title": "...",
    "description": "...",
    "curriculum": [...]
  }
}`
      },
      {
        method: "POST",
        path: "/api/courses/enroll",
        description: "Matricular-se em um curso (respeitando limites do plano)",
        auth: true,
        requestBody: `{ "courseSlug": "chatgpt-masterclass" }`,
        responseBody: `{
  "success": true,
  "enrollment": {
    "courseSlug": "...",
    "enrolledAt": "2025-01-01T00:00:00Z"
  }
}`
      },
      {
        method: "GET",
        path: "/api/courses/[slug]/content",
        description: "Acessar conteúdo completo do curso (requer matrícula)",
        auth: true,
        responseBody: `{
  "modules": [
    {
      "title": "Introdução",
      "lessons": [...]
    }
  ]
}`
      }
    ]
  },
  {
    id: "ai",
    title: "IA Generativa",
    description: "Geração de imagens e chat com IA",
    icon: <ImageIcon className="w-5 h-5" />,
    endpoints: [
      {
        method: "POST",
        path: "/api/ai/generate-image",
        description: "Gerar imagem com IA (limites por plano)",
        auth: true,
        requestBody: `{
  "prompt": "Um gato astronauta no espaço",
  "model": "nano-banana-1",
  "style": "photorealistic",
  "aspectRatio": "1:1"
}`,
        responseBody: `{
  "success": true,
  "imageUrl": "https://...",
  "model": "nano-banana-1"
}`
      },
      {
        method: "POST",
        path: "/api/ai/chat",
        description: "Chat com assistente IA (apenas planos Pro+)",
        auth: true,
        requestBody: `{
  "message": "Explique o que é machine learning",
  "conversationId": "optional-id"
}`,
        responseBody: `{
  "response": "Machine learning é...",
  "conversationId": "..."
}`
      },
      {
        method: "GET",
        path: "/api/user/creations",
        description: "Listar imagens geradas pelo usuário",
        auth: true,
        responseBody: `{
  "creations": [
    {
      "id": "...",
      "prompt": "...",
      "imageUrl": "...",
      "createdAt": "..."
    }
  ]
}`
      }
    ]
  },
  {
    id: "consultation",
    title: "Consultoria",
    description: "Agendamento de consultorias e reuniões",
    icon: <Calendar className="w-5 h-5" />,
    endpoints: [
      {
        method: "POST",
        path: "/api/consultation/request",
        description: "Criar solicitação de consultoria com agendamento automático",
        auth: false,
        requestBody: `{
  "name": "Nome do Cliente",
  "email": "cliente@empresa.com",
  "company": "Empresa LTDA",
  "details": "Preciso de ajuda com...",
  "source": "pricing-page",
  "cartItems": [
    { "id": "...", "name": "...", "price": 1500 }
  ],
  "cartTotal": 1500
}`,
        responseBody: `{
  "success": true,
  "requestId": "...",
  "bookingUrl": "https://calendar.google.com/...",
  "startInTimeZone": "Segunda, 10 de Janeiro às 14:00"
}`
      },
      {
        method: "GET",
        path: "/api/calendar/next-slot",
        description: "Obter próximo horário disponível na agenda",
        auth: false,
        responseBody: `{
  "startUtc": "2025-01-10T17:00:00Z",
  "endUtc": "2025-01-10T17:30:00Z",
  "startInTimeZone": "Segunda, 10 de Janeiro às 14:00",
  "bookingUrl": "https://calendar.google.com/..."
}`
      }
    ]
  }
];

const methodColors: Record<string, string> = {
  GET: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  POST: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  PUT: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  DELETE: "bg-red-500/20 text-red-400 border-red-500/30",
  PATCH: "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

function CodeBlock({ code, language = "json" }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <pre className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 overflow-x-auto text-sm">
        <code className="text-zinc-300">{code}</code>
      </pre>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-2 rounded-md bg-zinc-800 hover:bg-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        {copied ? (
          <Check className="w-4 h-4 text-green-400" />
        ) : (
          <Copy className="w-4 h-4 text-zinc-400" />
        )}
      </button>
    </div>
  );
}

function EndpointCard({ endpoint }: { endpoint: Endpoint }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-zinc-800 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-4 p-4 hover:bg-zinc-900/50 transition-colors text-left"
      >
        <Badge className={cn("font-mono text-xs px-2 py-1 border", methodColors[endpoint.method])}>
          {endpoint.method}
        </Badge>
        <code className="text-sm text-zinc-300 font-mono flex-1">{endpoint.path}</code>
        {endpoint.auth && (
          <Badge variant="outline" className="text-xs border-amber-500/30 text-amber-400">
            <Lock className="w-3 h-3 mr-1" />
            Auth
          </Badge>
        )}
        {expanded ? (
          <ChevronDown className="w-5 h-5 text-zinc-500" />
        ) : (
          <ChevronRight className="w-5 h-5 text-zinc-500" />
        )}
      </button>
      
      {expanded && (
        <div className="border-t border-zinc-800 p-4 space-y-4 bg-zinc-900/30">
          <p className="text-zinc-400">{endpoint.description}</p>
          
          {endpoint.requestBody && (
            <div>
              <h4 className="text-sm font-medium text-zinc-300 mb-2">Request Body</h4>
              <CodeBlock code={endpoint.requestBody} />
            </div>
          )}
          
          {endpoint.responseBody && (
            <div>
              <h4 className="text-sm font-medium text-zinc-300 mb-2">Response</h4>
              <CodeBlock code={endpoint.responseBody} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CategorySection({ category }: { category: APICategory }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <section id={category.id} className="scroll-mt-24">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-4 p-4 bg-zinc-900/50 rounded-lg hover:bg-zinc-900 transition-colors mb-4"
      >
        <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 text-purple-400">
          {category.icon}
        </div>
        <div className="flex-1 text-left">
          <h2 className="text-xl font-semibold text-white">{category.title}</h2>
          <p className="text-sm text-zinc-500">{category.description}</p>
        </div>
        <Badge variant="outline" className="text-xs">
          {category.endpoints.length} endpoints
        </Badge>
        {expanded ? (
          <ChevronDown className="w-5 h-5 text-zinc-500" />
        ) : (
          <ChevronRight className="w-5 h-5 text-zinc-500" />
        )}
      </button>
      
      {expanded && (
        <div className="space-y-2 ml-4">
          {category.endpoints.map((endpoint, idx) => (
            <EndpointCard key={idx} endpoint={endpoint} />
          ))}
        </div>
      )}
    </section>
  );
}

export default function APIDocsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      
      <main className="pt-24 pb-20">
        {/* Hero */}
        <section className="container mx-auto px-4 mb-16">
          <div className="max-w-4xl">
            <Badge variant="secondary" className="mb-4">
              <Code2 className="w-3 h-3 mr-1" />
              API Reference
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Documentação da API
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Integre os serviços da FayaPoint em suas aplicações. 
              Nossa API RESTful oferece acesso a autenticação, cursos, IA generativa e muito mais.
            </p>
            
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900 rounded-lg border border-zinc-800">
                <Zap className="w-4 h-4 text-amber-400" />
                <span className="text-sm">Base URL:</span>
                <code className="text-sm text-purple-400 font-mono">https://fayapoint.com/api</code>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900 rounded-lg border border-zinc-800">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span className="text-sm">Autenticação:</span>
                <code className="text-sm text-emerald-400 font-mono">Bearer Token (JWT)</code>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Start */}
        <section className="container mx-auto px-4 mb-16">
          <div className="max-w-4xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-purple-400" />
              Quick Start
            </h2>
            <p className="text-muted-foreground mb-4">
              Para começar, faça login e use o token retornado no header <code className="text-purple-400">Authorization</code>:
            </p>
            <CodeBlock code={`// 1. Fazer login
const response = await fetch('https://fayapoint.com/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'seu@email.com',
    password: 'sua_senha'
  })
});

const { token } = await response.json();

// 2. Usar o token em requisições autenticadas
const dashboard = await fetch('https://fayapoint.com/api/user/dashboard', {
  headers: {
    'Authorization': \`Bearer \${token}\`
  }
});`} language="javascript" />
          </div>
        </section>

        {/* Navigation */}
        <section className="container mx-auto px-4 mb-8">
          <div className="max-w-4xl">
            <div className="flex flex-wrap gap-2">
              {apiCategories.map((cat) => (
                <a
                  key={cat.id}
                  href={`#${cat.id}`}
                  className="flex items-center gap-2 px-3 py-2 bg-zinc-900 hover:bg-zinc-800 rounded-lg border border-zinc-800 transition-colors text-sm"
                >
                  {cat.icon}
                  {cat.title}
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* API Categories */}
        <section className="container mx-auto px-4">
          <div className="max-w-4xl space-y-8">
            {apiCategories.map((category) => (
              <CategorySection key={category.id} category={category} />
            ))}
          </div>
        </section>

        {/* Rate Limits */}
        <section className="container mx-auto px-4 mt-16">
          <div className="max-w-4xl bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-4">Limites de Uso</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 bg-zinc-900 rounded-lg border border-zinc-800">
                <h3 className="font-medium text-zinc-300 mb-2">Free</h3>
                <ul className="text-sm text-zinc-500 space-y-1">
                  <li>1 imagem total</li>
                  <li>1 curso iniciante</li>
                  <li>100 req/hora</li>
                </ul>
              </div>
              <div className="p-4 bg-zinc-900 rounded-lg border border-purple-500/30">
                <h3 className="font-medium text-purple-400 mb-2">Starter</h3>
                <ul className="text-sm text-zinc-500 space-y-1">
                  <li>50 imagens/mês</li>
                  <li>3 cursos</li>
                  <li>1000 req/hora</li>
                </ul>
              </div>
              <div className="p-4 bg-zinc-900 rounded-lg border border-amber-500/30">
                <h3 className="font-medium text-amber-400 mb-2">Pro / Business</h3>
                <ul className="text-sm text-zinc-500 space-y-1">
                  <li>Ilimitado</li>
                  <li>Todos os cursos</li>
                  <li>10000 req/hora</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="container mx-auto px-4 mt-16">
          <div className="max-w-4xl text-center">
            <h2 className="text-2xl font-semibold mb-4">Precisa de ajuda?</h2>
            <p className="text-muted-foreground mb-6">
              Nossa equipe está pronta para ajudar com integrações e casos de uso avançados.
            </p>
            <div className="flex justify-center gap-4">
              <Button asChild variant="outline">
                <a href="/contato">
                  Falar com o time
                </a>
              </Button>
              <Button asChild className="bg-gradient-to-r from-purple-600 to-pink-600">
                <a href="/agendar-consultoria">
                  Agendar consultoria
                  <ExternalLink className="w-4 h-4 ml-2" />
                </a>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
