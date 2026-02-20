"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useUser } from "@/contexts/UserContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import toast from "react-hot-toast";
import { 
  User, Lock, Bell, Palette, Save, Loader2, 
  Eye, EyeOff, Shield, Globe, ArrowLeft,
  Linkedin, Building, Briefcase, MapPin, Link as LinkIcon
} from "lucide-react";
import Link from "next/link";

interface ProfileForm {
  name: string;
  bio: string;
  location: string;
  website: string;
  linkedin: string;
  company: string;
  position: string;
}

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface NotificationSettings {
  email: boolean;
  push: boolean;
  marketing: boolean;
  courseUpdates: boolean;
  communityActivity: boolean;
}

export default function SettingsPage() {
  const router = useRouter();
  const { user, setUser, isLoggedIn, mounted } = useUser();
  const [activeTab, setActiveTab] = useState("profile");
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [profileForm, setProfileForm] = useState<ProfileForm>({
    name: "",
    bio: "",
    location: "",
    website: "",
    linkedin: "",
    company: "",
    position: ""
  });

  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const [notifications, setNotifications] = useState<NotificationSettings>({
    email: true,
    push: true,
    marketing: false,
    courseUpdates: true,
    communityActivity: true
  });

  // Redirect if not logged in
  useEffect(() => {
    if (mounted && !isLoggedIn) {
      router.push('/login');
    }
  }, [mounted, isLoggedIn, router]);

  // Load user data
  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || "",
        bio: user.profile?.bio || "",
        location: user.profile?.location || "",
        website: user.profile?.website || "",
        linkedin: user.profile?.linkedin || "",
        company: user.profile?.company || "",
        position: user.profile?.position || ""
      });
      // Load notification settings if available
      // These would come from user.preferences.notifications
    }
  }, [user]);

  const handleSaveProfile = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('fayai_token');
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

      if (!res.ok) {
        throw new Error('Failed to update profile');
      }

      const data = await res.json();
      setUser(data.user);
      toast.success('Perfil atualizado com sucesso!');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Erro ao atualizar perfil');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error('A nova senha deve ter pelo menos 6 caracteres');
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem('fayai_token');
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to change password');
      }

      toast.success('Senha alterada com sucesso!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao alterar senha');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveNotifications = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('fayai_token');
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          preferences: {
            notifications
          }
        })
      });

      if (!res.ok) {
        throw new Error('Failed to update notifications');
      }

      toast.success('Preferências de notificação atualizadas!');
    } catch (error) {
      console.error('Error updating notifications:', error);
      toast.error('Erro ao atualizar notificações');
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted || !user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Back to Portal */}
          <Link href="/portal" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition">
            <ArrowLeft size={16} />
            Voltar ao Dashboard
          </Link>

          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">Configurações</h1>
              <p className="text-gray-400 mt-1">Gerencie seu perfil, segurança e preferências</p>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-gray-900/50 border border-gray-800 p-1 gap-1">
              <TabsTrigger value="profile" className="data-[state=active]:bg-purple-600">
                <User size={16} className="mr-2" /> Perfil
              </TabsTrigger>
              <TabsTrigger value="security" className="data-[state=active]:bg-purple-600">
                <Shield size={16} className="mr-2" /> Segurança
              </TabsTrigger>
              <TabsTrigger value="notifications" className="data-[state=active]:bg-purple-600">
                <Bell size={16} className="mr-2" /> Notificações
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-6">
              <Card className="bg-gray-900/50 border-gray-800 p-6">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <User size={20} /> Informações Pessoais
                </h2>
                
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nome Completo</Label>
                      <Input 
                        value={profileForm.name}
                        onChange={e => setProfileForm({...profileForm, name: e.target.value})}
                        className="bg-black/50 border-gray-700"
                        placeholder="Seu nome"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input 
                        value={user.email}
                        disabled
                        className="bg-black/50 border-gray-700 opacity-50"
                      />
                      <p className="text-xs text-gray-500">O email não pode ser alterado</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Bio</Label>
                    <textarea 
                      value={profileForm.bio}
                      onChange={e => setProfileForm({...profileForm, bio: e.target.value})}
                      className="w-full bg-black/50 border border-gray-700 rounded-md p-3 min-h-[100px] text-white resize-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                      placeholder="Conte um pouco sobre você..."
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2"><Briefcase size={14} /> Cargo</Label>
                      <Input 
                        value={profileForm.position}
                        onChange={e => setProfileForm({...profileForm, position: e.target.value})}
                        className="bg-black/50 border-gray-700"
                        placeholder="Ex: Product Manager"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2"><Building size={14} /> Empresa</Label>
                      <Input 
                        value={profileForm.company}
                        onChange={e => setProfileForm({...profileForm, company: e.target.value})}
                        className="bg-black/50 border-gray-700"
                        placeholder="Nome da empresa"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2"><MapPin size={14} /> Localização</Label>
                      <Input 
                        value={profileForm.location}
                        onChange={e => setProfileForm({...profileForm, location: e.target.value})}
                        className="bg-black/50 border-gray-700"
                        placeholder="São Paulo, Brasil"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2"><LinkIcon size={14} /> Website</Label>
                      <Input 
                        value={profileForm.website}
                        onChange={e => setProfileForm({...profileForm, website: e.target.value})}
                        className="bg-black/50 border-gray-700"
                        placeholder="https://seusite.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2"><Linkedin size={14} /> LinkedIn</Label>
                    <Input 
                      value={profileForm.linkedin}
                      onChange={e => setProfileForm({...profileForm, linkedin: e.target.value})}
                      className="bg-black/50 border-gray-700"
                      placeholder="https://linkedin.com/in/seuperfil"
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={handleSaveProfile} disabled={isLoading} className="bg-purple-600 hover:bg-purple-700">
                      {isLoading ? <Loader2 className="animate-spin mr-2" size={16} /> : <Save className="mr-2" size={16} />}
                      Salvar Alterações
                    </Button>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security" className="space-y-6">
              <Card className="bg-gray-900/50 border-gray-800 p-6">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <Lock size={20} /> Alterar Senha
                </h2>
                
                <div className="space-y-4 max-w-md">
                  <div className="space-y-2">
                    <Label>Senha Atual</Label>
                    <div className="relative">
                      <Input 
                        type={showCurrentPassword ? "text" : "password"}
                        value={passwordForm.currentPassword}
                        onChange={e => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                        className="bg-black/50 border-gray-700 pr-10"
                        placeholder="Digite sua senha atual"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                      >
                        {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Nova Senha</Label>
                    <div className="relative">
                      <Input 
                        type={showNewPassword ? "text" : "password"}
                        value={passwordForm.newPassword}
                        onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                        className="bg-black/50 border-gray-700 pr-10"
                        placeholder="Digite a nova senha"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                      >
                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500">Mínimo 6 caracteres</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Confirmar Nova Senha</Label>
                    <Input 
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={e => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                      className="bg-black/50 border-gray-700"
                      placeholder="Confirme a nova senha"
                    />
                  </div>

                  <Button 
                    onClick={handleChangePassword} 
                    disabled={isLoading || !passwordForm.currentPassword || !passwordForm.newPassword}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {isLoading ? <Loader2 className="animate-spin mr-2" size={16} /> : <Lock className="mr-2" size={16} />}
                    Alterar Senha
                  </Button>
                </div>
              </Card>

              <Card className="bg-gray-900/50 border-gray-800 p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Shield size={20} /> Plano Atual
                </h2>
                <div className="flex items-center justify-between p-4 bg-black/30 rounded-lg">
                  <div>
                    <p className="font-medium capitalize">{user.subscription?.plan || 'Free'}</p>
                    <p className="text-sm text-gray-400">Status: {user.subscription?.status || 'Ativo'}</p>
                  </div>
                  <Link href="/planos">
                    <Button variant="outline" size="sm">
                      Gerenciar Plano
                    </Button>
                  </Link>
                </div>
              </Card>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications" className="space-y-6">
              <Card className="bg-gray-900/50 border-gray-800 p-6">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <Bell size={20} /> Preferências de Notificação
                </h2>
                
                <div className="space-y-6">
                  <div className="flex items-center justify-between py-3 border-b border-gray-800">
                    <div>
                      <p className="font-medium">Notificações por Email</p>
                      <p className="text-sm text-gray-400">Receba atualizações importantes por email</p>
                    </div>
                    <Switch 
                      checked={notifications.email}
                      onCheckedChange={(checked: boolean) => setNotifications({...notifications, email: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between py-3 border-b border-gray-800">
                    <div>
                      <p className="font-medium">Notificações Push</p>
                      <p className="text-sm text-gray-400">Receba notificações no navegador</p>
                    </div>
                    <Switch 
                      checked={notifications.push}
                      onCheckedChange={(checked: boolean) => setNotifications({...notifications, push: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between py-3 border-b border-gray-800">
                    <div>
                      <p className="font-medium">Atualizações de Cursos</p>
                      <p className="text-sm text-gray-400">Novos conteúdos e atualizações dos seus cursos</p>
                    </div>
                    <Switch 
                      checked={notifications.courseUpdates}
                      onCheckedChange={(checked: boolean) => setNotifications({...notifications, courseUpdates: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between py-3 border-b border-gray-800">
                    <div>
                      <p className="font-medium">Atividade da Comunidade</p>
                      <p className="text-sm text-gray-400">Respostas e menções nos fóruns</p>
                    </div>
                    <Switch 
                      checked={notifications.communityActivity}
                      onCheckedChange={(checked: boolean) => setNotifications({...notifications, communityActivity: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium">Marketing e Promoções</p>
                      <p className="text-sm text-gray-400">Ofertas especiais e novidades</p>
                    </div>
                    <Switch 
                      checked={notifications.marketing}
                      onCheckedChange={(checked: boolean) => setNotifications({...notifications, marketing: checked})}
                    />
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button onClick={handleSaveNotifications} disabled={isLoading} className="bg-purple-600 hover:bg-purple-700">
                      {isLoading ? <Loader2 className="animate-spin mr-2" size={16} /> : <Save className="mr-2" size={16} />}
                      Salvar Preferências
                    </Button>
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
