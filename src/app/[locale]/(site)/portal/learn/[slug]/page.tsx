"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Loader2, ArrowLeft, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import Link from "next/link";

export default function CourseReaderPage() {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();
  
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContent = async () => {
      const token = localStorage.getItem('fayapoint_token');
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const res = await fetch(`/api/courses/${slug}/content`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (res.status === 401) {
            router.push('/login');
            return;
        }

        const data = await res.json();

        if (!res.ok) {
            if (res.status === 403) {
                setError("access_denied");
            } else {
                throw new Error(data.error || 'Erro ao carregar conteúdo');
            }
            return;
        }

        setContent(data.content);
        setTitle(data.title);
      } catch (err) {
        console.error(err);
        setError("error");
        toast.error("Erro ao carregar conteúdo do curso");
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
        fetchContent();
    }
  }, [slug, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="animate-spin text-purple-500" size={32} />
      </div>
    );
  }

  if (error === "access_denied") {
      return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
            <div className="bg-gray-900 border border-gray-800 p-8 rounded-xl max-w-md text-center">
                <div className="w-16 h-16 bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Lock className="text-red-500" size={32} />
                </div>
                <h1 className="text-2xl font-bold mb-4">Acesso Bloqueado</h1>
                <p className="text-gray-400 mb-6">
                    Você precisa adquirir este curso ou fazer upgrade do seu plano para acessar este conteúdo.
                </p>
                <div className="flex flex-col gap-3">
                    <Link href={`/curso/${slug}`}>
                        <Button className="w-full bg-purple-600 hover:bg-purple-700">Ver Detalhes do Curso</Button>
                    </Link>
                    <Link href="/portal">
                        <Button variant="outline" className="w-full">Voltar ao Portal</Button>
                    </Link>
                </div>
            </div>
        </div>
      );
  }

  if (error) {
    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
            <p className="text-red-400 mb-4">Ocorreu um erro ao carregar o curso.</p>
            <Link href="/portal">
                <Button variant="outline">Voltar</Button>
            </Link>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
        {/* Header */}
        <div className="border-b border-gray-800 bg-gray-900/50 sticky top-0 z-10 backdrop-blur">
            <div className="container mx-auto px-4 h-16 flex items-center gap-4">
                <Link href="/portal">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft size={20} />
                    </Button>
                </Link>
                <h1 className="font-semibold text-lg truncate">{title}</h1>
            </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="max-w-none">
                <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                        h1: ({node, ...props}) => <h1 className="text-3xl font-bold mb-6 text-purple-400" {...props} />,
                        h2: ({node, ...props}) => <h2 className="text-2xl font-bold mb-4 mt-8 text-purple-300" {...props} />,
                        h3: ({node, ...props}) => <h3 className="text-xl font-semibold mb-3 mt-6 text-purple-200" {...props} />,
                        p: ({node, ...props}) => <p className="mb-4 text-gray-300 leading-relaxed" {...props} />,
                        ul: ({node, ...props}) => <ul className="list-disc pl-6 mb-4 text-gray-300 space-y-2" {...props} />,
                        ol: ({node, ...props}) => <ol className="list-decimal pl-6 mb-4 text-gray-300 space-y-2" {...props} />,
                        li: ({node, ...props}) => <li className="pl-1" {...props} />,
                        a: ({node, ...props}) => <a className="text-pink-400 hover:underline transition-colors" target="_blank" rel="noopener noreferrer" {...props} />,
                        blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-purple-500 pl-4 py-2 my-6 bg-gray-900/50 italic text-gray-400 rounded-r" {...props} />,
                        code: ({node, className, children, ...props}) => {
                            const match = /language-(\w+)/.exec(className || '')
                            const isInline = !match && !className?.includes('language-') // approximation
                             // Actually react-markdown passes `inline` boolean in props but types might vary. 
                             // Let's just style broadly.
                            return (
                                <code className="bg-gray-800/80 px-1.5 py-0.5 rounded text-sm font-mono text-pink-300" {...props}>
                                    {children}
                                </code>
                            )
                        },
                        pre: ({node, ...props}) => <pre className="bg-gray-900 p-4 rounded-lg overflow-x-auto mb-6 border border-gray-800" {...props} />,
                        img: ({node, ...props}) => <img className="rounded-lg border border-gray-800 my-6 max-w-full h-auto" alt={props.alt || "Course Image"} {...props} />,
                        hr: ({node, ...props}) => <hr className="my-8 border-gray-800" {...props} />,
                        table: ({node, ...props}) => <div className="overflow-x-auto mb-6"><table className="min-w-full border-collapse border border-gray-800 text-left" {...props} /></div>,
                        th: ({node, ...props}) => <th className="bg-gray-900 border border-gray-800 p-2 font-semibold text-purple-300" {...props} />,
                        td: ({node, ...props}) => <td className="border border-gray-800 p-2 text-gray-300" {...props} />,
                    }}
                >
                    {content}
                </ReactMarkdown>
            </div>
        </div>
    </div>
  );
}
