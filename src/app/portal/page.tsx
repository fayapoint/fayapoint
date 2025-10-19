"use client";

import { useState } from "react";
import Link from "next/link";
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

const userStats = {
  name: "João Silva",
  avatar: "/avatar.jpg",
  level: 12,
  points: 3450,
  currentStreak: 7,
  longestStreak: 21,
  coursesCompleted: 8,
  coursesInProgress: 3,
  totalHours: 47,
  certificates: 5,
};

const inProgressCourses = [
  {
    id: 1,
    title: "ChatGPT Masterclass",
    progress: 75,
    nextLesson: "Automação com APIs",
    thumbnail: "/courses/chatgpt.jpg",
    totalLessons: 24,
    completedLessons: 18,
  },
  {
    id: 2,
    title: "Midjourney: Arte com IA",
    progress: 45,
    nextLesson: "Parameters Avançados",
    thumbnail: "/courses/midjourney.jpg",
    totalLessons: 20,
    completedLessons: 9,
  },
  {
    id: 3,
    title: "n8n Workflows",
    progress: 30,
    nextLesson: "Integração com ChatGPT",
    thumbnail: "/courses/n8n.jpg",
    totalLessons: 30,
    completedLessons: 9,
  },
];

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

export default function PortalPage() {
  const [activeTab, setActiveTab] = useState("dashboard");

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
                  <span className="text-2xl font-bold">JS</span>
                </Avatar>
                <div>
                  <h1 className="text-2xl font-bold">Bem-vindo, {userStats.name}!</h1>
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
                <Button variant="ghost" size="icon">
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
                      <p className="text-2xl font-bold">{userStats.certificates}</p>
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
                      {inProgressCourses.map(course => (
                        <div key={course.id} className="flex gap-4 items-center">
                          <div className="w-24 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                            <PlayCircle size={24} className="text-white/70" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold">{course.title}</h3>
                            <p className="text-sm text-gray-400 mb-2">
                              Próxima aula: {course.nextLesson}
                            </p>
                            <div className="flex items-center gap-4">
                              <Progress value={course.progress} className="flex-1 h-2" />
                              <span className="text-sm text-gray-400">
                                {course.progress}%
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              {course.completedLessons}/{course.totalLessons} aulas
                            </p>
                          </div>
                          <Link href={`/curso/${course.id}/continuar`}>
                            <Button size="sm" variant="ghost">
                              <ChevronRight size={16} />
                            </Button>
                          </Link>
                        </div>
                      ))}
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
