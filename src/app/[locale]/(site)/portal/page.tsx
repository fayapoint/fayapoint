"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  BookOpen,
  Clock,
  Trophy,
  Target,
  TrendingUp,
  Calendar,
  Download,
  PlayCircle,
  Award,
  Users,
  MessageSquare,
  Settings,
  Bell,
  User,
  LogOut,
  ChevronRight,
  Flame,
  Star,
  Image as ImageIcon,
  ShoppingBag,
  Edit,
  Save,
  Loader2,
  Check,
  Lock,
  Sparkles,
  Wand2,
  Palette,
  Layout,
  Aperture,
  Zap,
  Monitor,
  Camera,
  Maximize,
  Grid,
  Sun,
  Moon,
  Layers,
  Smartphone,
  Box
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useUser } from "@/contexts/UserContext";
import { useServiceCart } from "@/contexts/ServiceCartContext";
import { getCourseBySlug, CourseData } from "@/data/courses";
import { toast } from "react-hot-toast";

// Types
interface DashboardCourseProgress {
  _id: string;
  courseId: string;
  progressPercent: number;
  completedLessons: string[];
  nextLesson?: string;
  details?: CourseData;
}

interface Resource {
  name: string;
  available: boolean;
  limit?: string;
}

interface IOrder {
  _id: string;
  createdAt: string;
  status: string;
  totalAmount: number;
  items: {
    id: string;
    name: string;
    price: number;
    quantity: number;
    type: string;
  }[];
}

const AI_MODELS = [
  { id: "nano-banana-pro", name: "Nano Banana Pro (Recomendado)", icon: Zap, description: "O mais avançado e equilibrado" },
  { id: "flux-1-schnell", name: "Flux 1 Schnell (Rápido)", icon: Flame, description: "Geração ultra-rápida" },
  { id: "flux-1-dev", name: "Flux 1 Dev (Qualidade)", icon: Star, description: "Maior detalhamento" },
  { id: "recraft-v3", name: "Recraft V3 (Design)", icon: Layout, description: "Ótimo para vetores e design" },
  { id: "stable-diffusion-3.5-large", name: "Stable Diffusion 3.5", icon: Aperture, description: "Versatilidade máxima" },
];

const STYLES = [
  { id: "none", name: "Normal", icon: Monitor },
  { id: "photorealistic", name: "Fotorealista", icon: Camera },
  { id: "anime", name: "Anime", icon: Sparkles },
  { id: "cyberpunk", name: "Cyberpunk", icon: Zap },
  { id: "oil-painting", name: "Pintura a Óleo", icon: Palette },
  { id: "3d-render", name: "3D Render", icon: Box },
  { id: "minimalist", name: "Minimalista", icon: Layout },
];

const MOODS = [
  { id: "none", name: "Padrão" },
  { id: "cinematic", name: "Cinematográfico" },
  { id: "dark", name: "Sombrio" },
  { id: "cheerful", name: "Alegre" },
  { id: "mysterious", name: "Misterioso" },
  { id: "ethereal", name: "Etéreo" },
];

const LIGHTING = [
  { id: "none", name: "Padrão" },
  { id: "natural", name: "Luz Natural" },
  { id: "studio", name: "Estúdio" },
  { id: "neon", name: "Neon" },
  { id: "golden-hour", name: "Golden Hour" },
];

const RATIOS = [
  { id: "1:1", name: "1:1", icon: Grid },
  { id: "16:9", name: "16:9", icon: Maximize },
  { id: "9:16", name: "9:16", icon: Smartphone },
];

export default function PortalPage() {
  const router = useRouter();
  const { user, setUser, logout } = useUser();
  const { items: cartItems, cartTotal } = useServiceCart();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isLoading, setIsLoading] = useState(true);
  const [userCourses, setUserCourses] = useState<DashboardCourseProgress[]>([]);
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [plan, setPlan] = useState("free");

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: "",
    bio: "",
    location: "",
    website: "",
    linkedin: "",
    company: "",
    position: ""
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // AI Gen State
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [myCreations, setMyCreations] = useState<any[]>([]);

  // Studio Controls
  const [selectedModel, setSelectedModel] = useState("nano-banana-pro");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [style, setStyle] = useState("none");
  const [mood, setMood] = useState("none");
  const [lighting, setLighting] = useState("none");

  useEffect(() => {
    if (activeTab === 'aitools') {
        fetchCreations();
    }
  }, [activeTab]);

  const fetchCreations = async () => {
      const token = localStorage.getItem('fayapoint_token');
      if(!token) return;
      try {
          const res = await fetch('/api/user/creations', {
              headers: { 'Authorization': `Bearer ${token}` }
          });
          if(res.ok) {
              const data = await res.json();
              setMyCreations(data);
          }
      } catch(e) { console.error(e); }
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      const token = localStorage.getItem('fayapoint_token');
      
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const res = await fetch('/api/user/dashboard', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (res.status === 401) {
          logout();
          router.push('/login');
          return;
        }

        if (!res.ok) {
          throw new Error('Falha ao carregar dados');
        }

        const data = await res.json();
        setUser(data.user);
        setOrders(data.orders || []);
        setResources(data.resources || []);
        setPlan(data.plan || 'free');

        // Map progress to course details
        if (data.courses) {
            const mappedCourses: DashboardCourseProgress[] = data.courses.map((progress: DashboardCourseProgress) => {
            const courseDetails = getCourseBySlug(progress.courseId);
            return {
                ...progress,
                details: courseDetails
            };
            });
            setUserCourses(mappedCourses);
        }

        // Init profile form
        setProfileForm({
            name: data.user.name || "",
            bio: data.user.profile?.bio || "",
            location: data.user.profile?.location || "",
            website: data.user.profile?.website || "",
            linkedin: data.user.profile?.linkedin || "",
            company: data.user.profile?.company || "",
            position: data.user.profile?.position || ""
        });

      } catch (error) {
        console.error('Error fetching dashboard:', error);
        toast.error("Erro ao carregar dashboard");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    const token = localStorage.getItem('fayapoint_token');

    try {
        const res = await fetch('/api/user/profile', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                name: profileForm.name,
                profile: {
                    bio: profileForm.bio,
                    location: profileForm.location,
                    website: profileForm.website,
                    linkedin: profileForm.linkedin,
                    company: profileForm.company,
                    position: profileForm.position
                }
            })
        });

        if (!res.ok) throw new Error('Falha ao atualizar');

        const data = await res.json();
        setUser(data.user);
        toast.success("Perfil atualizado com sucesso!");
        setIsEditingProfile(false);
    } catch (error) {
        toast.error("Erro ao atualizar perfil");
    } finally {
        setIsSavingProfile(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setGeneratedImage(null);
    const token = localStorage.getItem('fayapoint_token');

    const fullPrompt = [
      prompt,
      style !== 'none' ? `estilo ${STYLES.find(s => s.id === style)?.name}` : '',
      mood !== 'none' ? `atmosfera ${MOODS.find(m => m.id === mood)?.name}` : '',
      lighting !== 'none' ? `iluminação ${LIGHTING.find(l => l.id === lighting)?.name}` : '',
      aspectRatio !== '1:1' ? `formato ${aspectRatio}` : ''
    ].filter(Boolean).join(', ');

    try {
        const res = await fetch('/api/ai/generate-image', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ 
                prompt: fullPrompt,
                model: selectedModel
            })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Falha na geração');

        setGeneratedImage(data.imageUrl);
        toast.success("Imagem gerada com sucesso!");
        fetchCreations(); // Refresh gallery
    } catch (error) {
        const message = error instanceof Error ? error.message : "Erro ao gerar imagem";
        toast.error(message);
    } finally {
        setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const userStats = user.progress || {
    level: 1,
    points: 0,
    currentStreak: 0,
    coursesCompleted: 0,
    coursesInProgress: 0,
    totalHours: 0,
    certificates: 0,
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          {/* User Header */}
          <div className="mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                <Avatar className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 border-2 border-white/10">
                  <span className="text-3xl font-bold text-white">
                    {user.name ? user.name.substring(0, 2).toUpperCase() : 'US'}
                  </span>
                </Avatar>
                <div>
                  <h1 className="text-2xl font-bold">Bem-vindo, {user.name}!</h1>
                  <p className="text-gray-400 text-sm mb-2">
                    {user.profile?.position ? `${user.profile.position} at ${user.profile.company || 'Freelancer'}` : user.email}
                  </p>
                  <div className="flex items-center gap-4">
                    <Badge className="bg-purple-600/20 text-purple-400 border-purple-500/50 uppercase tracking-wider text-xs">
                      {plan} Plan
                    </Badge>
                    <div className="flex items-center gap-1 text-yellow-400 text-sm font-medium">
                        <Star size={14} fill="currentColor" />
                        <span>{userStats.points} pts</span>
                    </div>
                    <div className="flex items-center gap-1 text-orange-400 text-sm font-medium">
                      <Flame size={14} fill="currentColor" />
                      <span>{userStats.currentStreak} dias</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Link href="/configuracoes">
                  <Button variant="ghost" size="icon">
                    <Settings size={20} />
                  </Button>
                </Link>
                <Button variant="ghost" size="icon">
                  <Bell size={20} />
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => {
                  logout();
                  router.push('/');
                }}>
                  <LogOut size={20} />
                </Button>
              </div>
            </motion.div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-gray-900/50 border border-gray-800 w-full justify-start overflow-x-auto p-1">
              <TabsTrigger value="dashboard" className="gap-2"><TrendingUp size={16}/> Dashboard</TabsTrigger>
              <TabsTrigger value="courses" className="gap-2"><BookOpen size={16}/> Meus Cursos</TabsTrigger>
              <TabsTrigger value="resources" className="gap-2"><Target size={16}/> Recursos</TabsTrigger>
              <TabsTrigger value="aitools" className="gap-2"><ImageIcon size={16}/> Studio AI</TabsTrigger>
              <TabsTrigger value="history" className="gap-2"><ShoppingBag size={16}/> Histórico</TabsTrigger>
              <TabsTrigger value="profile" className="gap-2"><User size={16}/> Perfil</TabsTrigger>
            </TabsList>

            {/* Dashboard Tab */}
            <TabsContent value="dashboard" className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-white/5 backdrop-blur border-white/10 p-4 hover:bg-white/10 transition">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-purple-500/20 rounded-full text-purple-400">
                        <BookOpen size={24} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{userStats.coursesInProgress}</p>
                      <p className="text-xs text-gray-400 uppercase font-semibold tracking-wider">Em Progresso</p>
                    </div>
                  </div>
                </Card>
                
                <Card className="bg-white/5 backdrop-blur border-white/10 p-4 hover:bg-white/10 transition">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-yellow-500/20 rounded-full text-yellow-400">
                        <Trophy size={24} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{userStats.coursesCompleted}</p>
                      <p className="text-xs text-gray-400 uppercase font-semibold tracking-wider">Concluídos</p>
                    </div>
                  </div>
                </Card>
                
                <Card className="bg-white/5 backdrop-blur border-white/10 p-4 hover:bg-white/10 transition">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-500/20 rounded-full text-blue-400">
                        <Clock size={24} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{userStats.totalHours}h</p>
                      <p className="text-xs text-gray-400 uppercase font-semibold tracking-wider">Estudo</p>
                    </div>
                  </div>
                </Card>
                
                <Card className="bg-white/5 backdrop-blur border-white/10 p-4 hover:bg-white/10 transition">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-green-500/20 rounded-full text-green-400">
                        <Award size={24} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{userStats.certificates || 0}</p>
                      <p className="text-xs text-gray-400 uppercase font-semibold tracking-wider">Certificados</p>
                    </div>
                  </div>
                </Card>
              </div>

              <div className="grid lg:grid-cols-3 gap-6">
                {/* Continue Learning */}
                <div className="lg:col-span-2 space-y-6">
                  <Card className="bg-white/5 backdrop-blur border-white/10 p-6">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <PlayCircle className="text-purple-400" /> Continuar Aprendendo
                    </h2>
                    <div className="space-y-4">
                      {userCourses.length > 0 ? (
                        userCourses.map(progress => (
                          <div key={progress._id} className="flex gap-4 items-center group bg-white/5 p-3 rounded-lg hover:bg-white/10 transition">
                            <div className="w-20 h-14 bg-gradient-to-br from-gray-800 to-gray-900 rounded flex items-center justify-center overflow-hidden relative shrink-0">
                               <PlayCircle size={20} className="text-white/70 group-hover:text-purple-400 transition" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold truncate">{progress.details?.title || progress.courseId}</h3>
                              <p className="text-sm text-gray-400 mt-1 line-clamp-1">{progress.details?.shortDescription || ''}</p>
                              <div className="flex items-center gap-4 mt-1">
                                <Progress value={progress.progressPercent} className="flex-1 h-1.5 bg-gray-700" />
                                <span className="text-xs text-gray-400 w-8 text-right">
                                  {progress.progressPercent}%
                                </span>
                              </div>
                            </div>
                            <Link href={`/portal/learn/${progress.courseId}`}>
                              <Button size="sm" variant="secondary">
                                <ChevronRight size={16} />
                              </Button>
                            </Link>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-800 rounded-lg">
                          <p>Você ainda não começou nenhum curso.</p>
                          <Link href="/cursos">
                            <Button className="mt-4" variant="outline">Explorar Cursos</Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  </Card>
                </div>

                {/* Quick Recommendations */}
                <div className="space-y-6">
                   <Card className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border-purple-500/30 p-6">
                    <h2 className="text-xl font-semibold mb-4">Dica do Dia</h2>
                    <p className="text-sm text-gray-300 italic">
                        &quot;Use o Gemini para criar estruturas de código complexas e depois refine com o Claude para melhor legibilidade.&quot;
                    </p>
                    <Button className="w-full mt-4" size="sm" variant="outline" onClick={() => setActiveTab('aitools')}>
                        Testar IA Agora
                    </Button>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Courses Tab */}
            <TabsContent value="courses">
              <Card className="bg-white/5 backdrop-blur border-white/10 p-6">
                <h2 className="text-xl font-semibold mb-4">Meus Cursos</h2>
                <div className="grid md:grid-cols-2 gap-4">
                     {userCourses.length > 0 ? (
                        userCourses.map(progress => (
                            <Link key={progress._id} href={`/portal/learn/${progress.courseId}`}>
                                <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden hover:border-purple-500/50 transition group">
                                    <div className="h-32 bg-gray-800 relative">
                                        {/* Placeholder for course image */}
                                        <div className="absolute inset-0 flex items-center justify-center text-gray-600">
                                            <BookOpen size={32} />
                                        </div>
                                        <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-xs font-mono">
                                            {progress.progressPercent}% Concluído
                                        </div>
                                    </div>
                                    <div className="p-4">
                                        <h3 className="font-bold group-hover:text-purple-400 transition">{progress.details?.title || progress.courseId}</h3>
                                        <p className="text-sm text-gray-400 mt-1 line-clamp-2">{progress.details?.shortDescription || 'Curso completo de IA'}</p>
                                    </div>
                                </div>
                            </Link>
                        ))
                     ) : (
                         <p className="text-gray-400 col-span-2">Nenhum curso encontrado.</p>
                     )}
                </div>
              </Card>
            </TabsContent>

            {/* Resources Tab */}
            <TabsContent value="resources">
              <Card className="bg-white/5 backdrop-blur border-white/10 p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold">Seus Recursos Disponíveis</h2>
                    <Badge className="bg-purple-600 text-white hover:bg-purple-700">Plano {plan.toUpperCase()}</Badge>
                </div>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {resources.map((resource, idx) => (
                        <div key={idx} className={`p-4 rounded-lg border ${resource.available ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20 opacity-60'}`}>
                            <div className="flex items-center justify-between mb-2">
                                {resource.available ? <Check className="text-green-400" size={20} /> : <Lock className="text-red-400" size={20} />}
                                {resource.limit && <span className="text-xs bg-white/10 px-2 py-1 rounded">{resource.limit}</span>}
                            </div>
                            <h3 className="font-medium">{resource.name}</h3>
                            <p className="text-xs text-gray-400 mt-1">{resource.available ? 'Disponível' : 'Upgrade necessário'}</p>
                        </div>
                    ))}
                </div>

                {!resources.some(r => r.limit === 'Ilimitado') && (
                    <div className="mt-8 p-4 bg-gradient-to-r from-purple-900/40 to-pink-900/40 rounded-lg border border-purple-500/30 flex items-center justify-between">
                        <div>
                            <h3 className="font-bold text-purple-300">Faça Upgrade para Business</h3>
                            <p className="text-sm text-gray-300">Desbloqueie todos os recursos e suporte dedicado.</p>
                        </div>
                        <Button>Ver Planos</Button>
                    </div>
                )}
              </Card>
            </TabsContent>

            {/* AI Tools Tab */}
            <TabsContent value="aitools">
              <div className="space-y-6">
                  <Card className="bg-white/5 backdrop-blur border-white/10 p-6">
                      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center mb-8 border-b border-white/10 pb-6">
                          <div>
                            <h2 className="text-2xl font-bold flex items-center gap-2 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
                                <Sparkles className="text-purple-400" /> Studio AI Pro
                            </h2>
                            <p className="text-sm text-gray-400 mt-1">
                                Crie arte visual impressionante com os modelos mais avançados do mercado.
                            </p>
                          </div>
                          <div className="w-full md:w-80">
                             <Label className="mb-2 block text-xs uppercase text-gray-500 font-bold tracking-wider">Modelo de IA</Label>
                             <Select value={selectedModel} onValueChange={setSelectedModel}>
                                <SelectTrigger className="bg-black/50 border-gray-700 h-10">
                                  <SelectValue placeholder="Selecione o modelo" />
                                </SelectTrigger>
                                <SelectContent className="bg-gray-900 border-gray-800 text-white">
                                  {AI_MODELS.map(m => (
                                    <SelectItem key={m.id} value={m.id} className="focus:bg-white/10 cursor-pointer">
                                      <div className="flex items-center gap-3 py-1">
                                        <div className="p-1.5 bg-white/5 rounded-md text-purple-400">
                                            <m.icon size={14} />
                                        </div>
                                        <div>
                                            <p className="font-medium leading-none">{m.name}</p>
                                            <p className="text-[10px] text-gray-500 mt-0.5 leading-none">{m.description}</p>
                                        </div>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                             </Select>
                          </div>
                       </div>

                       {/* Visual Controls */}
                       <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8">
                          
                          {/* Aspect Ratio - Col 3 */}
                          <div className="md:col-span-3 space-y-3">
                             <Label className="text-xs uppercase text-gray-500 font-bold flex items-center gap-2"><Grid size={14}/> Formato</Label>
                             <div className="flex gap-2">
                                {RATIOS.map(r => (
                                   <Button
                                      key={r.id}
                                      variant={aspectRatio === r.id ? "default" : "outline"}
                                      className={`flex-1 h-12 ${aspectRatio === r.id ? 'bg-purple-600 border-purple-600 hover:bg-purple-700' : 'bg-black/30 border-gray-800 hover:bg-white/5 text-gray-400'}`}
                                      onClick={() => setAspectRatio(r.id)}
                                      title={r.name}
                                   >
                                      <r.icon size={20} />
                                   </Button>
                                ))}
                             </div>
                          </div>

                          {/* Style - Col 9 (Scrollable) */}
                          <div className="md:col-span-9 space-y-3">
                             <Label className="text-xs uppercase text-gray-500 font-bold flex items-center gap-2"><Palette size={14}/> Estilo Visual</Label>
                             <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                                {STYLES.map(s => (
                                   <button
                                     key={s.id}
                                     onClick={() => setStyle(s.id)}
                                     className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all min-w-[90px] group ${style === s.id ? 'bg-purple-500/20 border-purple-500 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.3)]' : 'bg-black/30 border-gray-800 hover:bg-white/5 text-gray-400 hover:border-gray-700'}`}
                                   >
                                     <s.icon size={24} className={`transition-transform group-hover:scale-110 ${style === s.id ? 'text-purple-400' : 'opacity-70'}`} />
                                     <span className="text-xs font-medium whitespace-nowrap">{s.name}</span>
                                   </button>
                                ))}
                             </div>
                          </div>
                       </div>

                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                           <div className="space-y-3">
                              <Label className="text-xs uppercase text-gray-500 font-bold flex items-center gap-2"><Wand2 size={14}/> Atmosfera</Label>
                               <Select value={mood} onValueChange={setMood}>
                                 <SelectTrigger className="bg-black/30 border-gray-800 h-11"><SelectValue /></SelectTrigger>
                                 <SelectContent className="bg-gray-900 border-gray-800 text-white">
                                    {MOODS.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                                 </SelectContent>
                              </Select>
                           </div>
                           <div className="space-y-3">
                              <Label className="text-xs uppercase text-gray-500 font-bold flex items-center gap-2"><Sun size={14}/> Iluminação</Label>
                               <Select value={lighting} onValueChange={setLighting}>
                                 <SelectTrigger className="bg-black/30 border-gray-800 h-11"><SelectValue /></SelectTrigger>
                                 <SelectContent className="bg-gray-900 border-gray-800 text-white">
                                    {LIGHTING.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                                 </SelectContent>
                              </Select>
                           </div>
                       </div>

                       {/* Prompt Area */}
                       <div className="relative">
                          <Textarea 
                            placeholder="Descreva sua imaginação aqui... Ex: Um astronauta flutuando em um jardim bioluminescente..." 
                            className="bg-black/50 border-gray-700 min-h-[120px] text-lg p-4 focus:ring-purple-500 resize-none pr-32"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                          />
                          <div className="absolute bottom-4 right-4">
                              <Button 
                                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg shadow-purple-900/20 font-bold px-8"
                                onClick={handleGenerateImage}
                                disabled={isGenerating || !prompt.trim()}
                              >
                                  {isGenerating ? (
                                      <Loader2 className="animate-spin" size={20} />
                                  ) : (
                                      <><Flame className="mr-2" size={18} /> Gerar Arte</>
                                  )}
                              </Button>
                          </div>
                       </div>
                  </Card>

                  {/* Preview & Gallery Section */}
                  <div className="grid lg:grid-cols-3 gap-6">
                      <div className="lg:col-span-2">
                          <Card className="bg-white/5 backdrop-blur border-white/10 p-6 min-h-[500px] flex items-center justify-center border-dashed relative overflow-hidden group transition-colors hover:border-purple-500/30">
                              {generatedImage ? (
                                  <div className="relative w-full h-full flex flex-col items-center justify-center">
                                      <img src={generatedImage} alt="Generated" className="max-h-[600px] w-auto rounded-lg shadow-2xl object-contain" />
                                      <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <Button variant="secondary" size="sm" onClick={() => window.open(generatedImage, '_blank')}>
                                              <Download className="mr-2" size={16} /> Baixar HD
                                          </Button>
                                      </div>
                                  </div>
                              ) : (
                                  <div className="text-center text-gray-500">
                                      <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                                        {isGenerating ? <Loader2 className="animate-spin opacity-50" size={40}/> : <ImageIcon size={40} className="opacity-50" />}
                                      </div>
                                      <p className="text-xl font-medium mb-2">{isGenerating ? 'Criando sua obra prima...' : 'Sua obra de arte aparecerá aqui'}</p>
                                      <p className="text-sm opacity-60">Configure os parâmetros acima e clique em Gerar</p>
                                  </div>
                              )}
                          </Card>
                      </div>

                      <div className="lg:col-span-1">
                          {myCreations.length > 0 && (
                              <Card className="bg-white/5 backdrop-blur border-white/10 p-4 h-full max-h-[600px] overflow-hidden flex flex-col">
                                  <h3 className="text-lg font-semibold flex items-center gap-2 mb-4 px-2">
                                      <ImageIcon size={18} /> Recentes
                                  </h3>
                                  <div className="grid grid-cols-2 gap-3 overflow-y-auto pr-2 pb-2 custom-scrollbar">
                                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                      {myCreations.map((creation: any) => (
                                          <div key={creation._id} className="group relative aspect-square rounded-lg overflow-hidden bg-gray-900 cursor-pointer border border-transparent hover:border-purple-500 transition" onClick={() => setGeneratedImage(creation.imageUrl)}>
                                              <img src={creation.imageUrl} alt={creation.prompt} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition" />
                                          </div>
                                      ))}
                                  </div>
                              </Card>
                          )}
                      </div>
                  </div>
              </div>
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history">
               <div className="space-y-6">
                    <Card className="bg-white/5 backdrop-blur border-white/10 p-6">
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <ShoppingBag size={20} /> Carrinho Atual
                        </h2>
                        <div className="space-y-4">
                            {Object.keys(cartItems).length > 0 ? (
                                Object.values(cartItems).map(item => (
                                    <div key={item.id} className="flex items-center justify-between bg-white/5 p-4 rounded-lg">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-gray-800 rounded flex items-center justify-center">
                                                <Star size={20} className="text-yellow-500" />
                                            </div>
                                            <div>
                                                <h4 className="font-medium">{item.name}</h4>
                                                <p className="text-sm text-gray-400">{item.type === 'service' ? 'Serviço' : 'Curso'}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold">R$ {item.price.toLocaleString('pt-BR')}</p>
                                            <p className="text-xs text-gray-500">Qtd: {item.quantity}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-400 italic">Seu carrinho está vazio no momento.</p>
                            )}
                        </div>
                        {cartTotal > 0 && (
                            <div className="mt-6 flex justify-end border-t border-gray-800 pt-4">
                                <div className="text-right">
                                    <p className="text-sm text-gray-400">Total Estimado</p>
                                    <p className="text-2xl font-bold text-green-400">R$ {cartTotal.toLocaleString('pt-BR')}</p>
                                    <Link href="/carrinho">
                                        <Button className="mt-2">Finalizar Compra</Button>
                                    </Link>
                                </div>
                            </div>
                        )}
                    </Card>

                    <Card className="bg-white/5 backdrop-blur border-white/10 p-6">
                        <h2 className="text-xl font-semibold mb-4">Histórico de Pedidos</h2>
                        <div className="space-y-4">
                            {orders.length > 0 ? (
                                orders.map(order => (
                                    <div key={order._id} className="flex items-center justify-between border-b border-gray-800 pb-4 last:border-0">
                                        <div>
                                            <p className="font-medium">Pedido #{order._id.substring(order._id.length - 6)}</p>
                                            <p className="text-sm text-gray-400">{new Date(order.createdAt).toLocaleDateString()}</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <Badge variant={order.status === 'completed' ? 'default' : 'outline'}>
                                                {order.status}
                                            </Badge>
                                            <p className="font-bold">R$ {order.totalAmount.toLocaleString('pt-BR')}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-400 text-center py-4">Nenhum pedido concluído encontrado.</p>
                            )}
                        </div>
                    </Card>
               </div>
            </TabsContent>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <Card className="bg-white/5 backdrop-blur border-white/10 p-6 max-w-2xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold">Editar Perfil</h2>
                    {!isEditingProfile ? (
                        <Button variant="outline" size="sm" onClick={() => setIsEditingProfile(true)}>
                            <Edit size={16} className="mr-2" /> Editar
                        </Button>
                    ) : (
                        <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => setIsEditingProfile(false)}>Cancelar</Button>
                            <Button size="sm" onClick={handleUpdateProfile} disabled={isSavingProfile}>
                                {isSavingProfile ? <Loader2 className="animate-spin" /> : <Save size={16} />} Salvar
                            </Button>
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Nome Completo</Label>
                            <Input 
                                disabled={!isEditingProfile} 
                                value={profileForm.name} 
                                onChange={e => setProfileForm({...profileForm, name: e.target.value})}
                                className="bg-black/50 border-gray-700"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input 
                                disabled={true} 
                                value={user.email} 
                                className="bg-black/50 border-gray-700 opacity-50"
                            />
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Empresa</Label>
                            <Input 
                                disabled={!isEditingProfile} 
                                value={profileForm.company} 
                                onChange={e => setProfileForm({...profileForm, company: e.target.value})}
                                className="bg-black/50 border-gray-700"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Cargo / Posição</Label>
                            <Input 
                                disabled={!isEditingProfile} 
                                value={profileForm.position} 
                                onChange={e => setProfileForm({...profileForm, position: e.target.value})}
                                className="bg-black/50 border-gray-700"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Bio</Label>
                        <Textarea 
                            disabled={!isEditingProfile} 
                            value={profileForm.bio} 
                            onChange={e => setProfileForm({...profileForm, bio: e.target.value})}
                            className="bg-black/50 border-gray-700 min-h-[100px]"
                        />
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                         <div className="space-y-2">
                            <Label>Localização</Label>
                            <Input 
                                disabled={!isEditingProfile} 
                                value={profileForm.location} 
                                onChange={e => setProfileForm({...profileForm, location: e.target.value})}
                                className="bg-black/50 border-gray-700"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Website</Label>
                            <Input 
                                disabled={!isEditingProfile} 
                                value={profileForm.website} 
                                onChange={e => setProfileForm({...profileForm, website: e.target.value})}
                                className="bg-black/50 border-gray-700"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>LinkedIn</Label>
                            <Input 
                                disabled={!isEditingProfile} 
                                value={profileForm.linkedin} 
                                onChange={e => setProfileForm({...profileForm, linkedin: e.target.value})}
                                className="bg-black/50 border-gray-700"
                            />
                        </div>
                    </div>
                </div>
              </Card>
            </TabsContent>

          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
}
