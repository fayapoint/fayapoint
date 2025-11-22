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
  Star
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUser } from "@/contexts/UserContext";
import { getCourseBySlug, CourseData } from "@/data/courses";
import { toast } from "react-hot-toast";

// Keep static for layout demo
const upcomingEvents = [
  {
    id: 1,
    title: "Live: Q&A sobre ChatGPT Avançado",
    date: "20 Out, 19:00",
    type: "live",
  },
  {
    id: 2,
    title: "Workshop: Criando Agentes de IA",
    date: "22 Out, 20:00",
    type: "workshop",
  },
  {
    id: 3,
    title: "Mentoria em Grupo",
    date: "25 Out, 19:30",
    type: "mentoria",
  },
];

const achievements = [
  {
    id: 1,
    title: "Primeira Aula",
    description: "Complete sua primeira aula",
    icon: "🎯",
    earned: true,
  },
  {
    id: 2,
    title: "Sequência de 7 Dias",
    description: "Estude por 7 dias seguidos",
    icon: "🔥",
    earned: true,
  },
  {
    id: 3,
    title: "Mestre do ChatGPT",
    description: "Complete o curso de ChatGPT",
    icon: "🤖",
    earned: false,
  },
  {
    id: 4,
    title: "Criador de Conteúdo",
    description: "Crie 10 projetos práticos",
    icon: "🎨",
    earned: false,
  },
];

const recommendations = [
  {
    id: 1,
    title: "Claude para Desenvolvedores",
    reason: "Baseado no seu interesse em programação",
    duration: "10 horas",
    level: "Intermediário",
  },
  {
    id: 2,
    title: "Perplexity: Pesquisa Avançada",
    reason: "Complementa seus estudos de ChatGPT",
    duration: "4 horas",
    level: "Iniciante",
  },
];

interface DashboardCourseProgress {
  _id: string;
  courseId: string;
  progressPercent: number;
  completedLessons: string[];
  nextLesson?: string;
  details?: CourseData;
}

export default function PortalPage() {
  const router = useRouter();
  const { user, setUser, logout } = useUser();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isLoading, setIsLoading] = useState(true);
  const [userCourses, setUserCourses] = useState<DashboardCourseProgress[]>([]);

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

        // Map progress to course details
        const mappedCourses: DashboardCourseProgress[] = data.courses.map((progress: DashboardCourseProgress) => {
          const courseDetails = getCourseBySlug(progress.courseId);
          return {
            ...progress,
            details: courseDetails
          };
        });
        
        setUserCourses(mappedCourses);
      } catch (error) {
        console.error('Error fetching dashboard:', error);
        toast.error("Erro ao carregar dashboard");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [router, setUser, logout]);

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
                <Avatar className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500">
                  <span className="text-2xl font-bold">
                    {user.name ? user.name.substring(0, 2).toUpperCase() : 'US'}
                  </span>
                </Avatar>
                <div>
                  <h1 className="text-2xl font-bold">Bem-vindo, {user.name}!</h1>
                  <div className="flex items-center gap-4 mt-1">
                    <Badge className="bg-purple-600/20 text-purple-400 border-purple-500/50">
                      Nível {userStats.level}
                    </Badge>
                    <span className="text-gray-400">{userStats.points} pontos</span>
                    <div className="flex items-center gap-1 text-orange-400">
                      <Flame size={16} />
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
            <TabsList className="bg-gray-900/50 border border-gray-800">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="courses">Meus Cursos</TabsTrigger>
              <TabsTrigger value="certificates">Certificados</TabsTrigger>
              <TabsTrigger value="downloads">Downloads</TabsTrigger>
            </TabsList>

            {/* Dashboard Tab */}
            <TabsContent value="dashboard" className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-white/5 backdrop-blur border-white/10 p-4">
                  <div className="flex items-center gap-3">
                    <BookOpen className="text-purple-400" size={24} />
                    <div>
                      <p className="text-2xl font-bold">{userStats.coursesInProgress}</p>
                      <p className="text-sm text-gray-400">Em Progresso</p>
                    </div>
                  </div>
                </Card>
                
                <Card className="bg-white/5 backdrop-blur border-white/10 p-4">
                  <div className="flex items-center gap-3">
                    <Trophy className="text-yellow-400" size={24} />
                    <div>
                      <p className="text-2xl font-bold">{userStats.coursesCompleted}</p>
                      <p className="text-sm text-gray-400">Concluídos</p>
                    </div>
                  </div>
                </Card>
                
                <Card className="bg-white/5 backdrop-blur border-white/10 p-4">
                  <div className="flex items-center gap-3">
                    <Clock className="text-blue-400" size={24} />
                    <div>
                      <p className="text-2xl font-bold">{userStats.totalHours}h</p>
                      <p className="text-sm text-gray-400">Total de Estudo</p>
                    </div>
                  </div>
                </Card>
                
                <Card className="bg-white/5 backdrop-blur border-white/10 p-4">
                  <div className="flex items-center gap-3">
                    <Award className="text-green-400" size={24} />
                    <div>
                      <p className="text-2xl font-bold">{userStats.certificates || 0}</p>
                      <p className="text-sm text-gray-400">Certificados</p>
                    </div>
                  </div>
                </Card>
              </div>

              <div className="grid lg:grid-cols-3 gap-6">
                {/* Continue Learning */}
                <div className="lg:col-span-2">
                  <Card className="bg-white/5 backdrop-blur border-white/10 p-6">
                    <h2 className="text-xl font-semibold mb-4">Continuar Aprendendo</h2>
                    <div className="space-y-4">
                      {userCourses.length > 0 ? (
                        userCourses.map(progress => (
                          <div key={progress._id} className="flex gap-4 items-center">
                            <div className="w-24 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center overflow-hidden relative">
                               {/* Ideally use course image */}
                               <PlayCircle size={24} className="text-white/70 absolute z-10" />
                               {/* If we had image url: <img src={progress.details?.imageUrl} ... /> */}
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold">{progress.details?.title || progress.courseId}</h3>
                              <p className="text-sm text-gray-400 mb-2">
                                Próxima aula: {progress.nextLesson || 'Introdução'}
                              </p>
                              <div className="flex items-center gap-4">
                                <Progress value={progress.progressPercent} className="flex-1 h-2" />
                                <span className="text-sm text-gray-400">
                                  {progress.progressPercent}%
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                {progress.completedLessons?.length || 0}/{progress.details?.totalLessons || '?'} aulas
                              </p>
                            </div>
                            <Link href={`/curso/${progress.courseId}`}>
                              <Button size="sm" variant="ghost">
                                <ChevronRight size={16} />
                              </Button>
                            </Link>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-400">
                          <p>Você ainda não começou nenhum curso.</p>
                          <Link href="/cursos">
                            <Button className="mt-4" variant="outline">Explorar Cursos</Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  </Card>

                  {/* Achievements */}
                  <Card className="bg-white/5 backdrop-blur border-white/10 p-6 mt-6">
                    <h2 className="text-xl font-semibold mb-4">Conquistas</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {achievements.map(achievement => (
                        <div
                          key={achievement.id}
                          className={`text-center p-4 rounded-lg border ${
                            achievement.earned
                              ? 'bg-purple-900/20 border-purple-500/50'
                              : 'bg-gray-900/50 border-gray-800 opacity-50'
                          }`}
                        >
                          <div className="text-3xl mb-2">{achievement.icon}</div>
                          <p className="text-sm font-medium">{achievement.title}</p>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  {/* Upcoming Events */}
                  <Card className="bg-white/5 backdrop-blur border-white/10 p-6">
                    <h2 className="text-xl font-semibold mb-4">Próximos Eventos</h2>
                    <div className="space-y-3">
                      {upcomingEvents.map(event => (
                        <div key={event.id} className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{event.title}</p>
                            <p className="text-sm text-gray-400">{event.date}</p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {event.type}
                          </Badge>
                        </div>
                      ))}
                    </div>
                    <Button className="w-full mt-4" variant="outline" size="sm">
                      Ver Calendário Completo
                    </Button>
                  </Card>

                  {/* Recommendations */}
                  <Card className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border-purple-500/30 p-6">
                    <h2 className="text-xl font-semibold mb-4">Recomendado para Você</h2>
                    <div className="space-y-3">
                      {recommendations.map(course => (
                        <div key={course.id} className="space-y-1">
                          <h4 className="font-medium">{course.title}</h4>
                          <p className="text-xs text-gray-400">{course.reason}</p>
                          <div className="flex items-center gap-2 text-xs">
                            <Badge variant="outline" className="text-xs">
                              {course.level}
                            </Badge>
                            <span className="text-gray-500">{course.duration}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Link href="/cursos">
                      <Button className="w-full mt-4" size="sm">
                        Explorar Cursos
                      </Button>
                    </Link>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* My Courses Tab */}
            <TabsContent value="courses">
              <Card className="bg-white/5 backdrop-blur border-white/10 p-6">
                <h2 className="text-xl font-semibold mb-4">Meus Cursos</h2>
                <p className="text-gray-400">Seus cursos aparecerão aqui...</p>
              </Card>
            </TabsContent>

            {/* Certificates Tab */}
            <TabsContent value="certificates">
              <Card className="bg-white/5 backdrop-blur border-white/10 p-6">
                <h2 className="text-xl font-semibold mb-4">Certificados</h2>
                <p className="text-gray-400">Seus certificados aparecerão aqui...</p>
              </Card>
            </TabsContent>

            {/* Downloads Tab */}
            <TabsContent value="downloads">
              <Card className="bg-white/5 backdrop-blur border-white/10 p-6">
                <h2 className="text-xl font-semibold mb-4">Downloads</h2>
                <p className="text-gray-400">Materiais para download aparecerão aqui...</p>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
}
