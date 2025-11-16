"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, User, ArrowRight, Zap, Briefcase, BarChart, BrainCircuit,
  Code, Palette, TrendingUp, Users, Lightbulb, Rocket, Target,
  GraduationCap, Building2, Megaphone, Camera, PenTool, Calculator,
  Sparkles, Crown, Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Progress } from '@/components/ui/progress';
import { useUser } from '@/contexts/UserContext';

interface FormData {
  name: string;
  email: string;
  role: string;
  interest: string;
}

const steps = [
  { id: 1, title: 'Bem-vindo!', icon: Zap },
  { id: 2, title: 'Seu Perfil', icon: User },
  { id: 3, title: 'Seus Interesses', icon: BrainCircuit },
];

const roleOptions = [
  { value: 'developer', label: 'Desenvolvedor', icon: Code, emoji: '💻' },
  { value: 'designer', label: 'Designer', icon: Palette, emoji: '🎨' },
  { value: 'marketing', label: 'Marketing', icon: Megaphone, emoji: '📢' },
  { value: 'business', label: 'Empresário', icon: Building2, emoji: '🏢' },
  { value: 'sales', label: 'Vendas', icon: TrendingUp, emoji: '📈' },
  { value: 'student', label: 'Estudante', icon: GraduationCap, emoji: '🎓' },
  { value: 'content', label: 'Criador de Conteúdo', icon: Camera, emoji: '📸' },
  { value: 'other', label: 'Outro', icon: Users, emoji: '👤' },
];

const interestOptions = [
  { value: 'automation', label: 'Automação', icon: Zap, emoji: '⚡' },
  { value: 'chatgpt', label: 'ChatGPT & IA Conversacional', icon: BrainCircuit, emoji: '🤖' },
  { value: 'image', label: 'Geração de Imagens', icon: Palette, emoji: '🎨' },
  { value: 'productivity', label: 'Produtividade', icon: Target, emoji: '🎯' },
  { value: 'business', label: 'Negócios & Estratégia', icon: TrendingUp, emoji: '💼' },
  { value: 'learning', label: 'Aprendizado Contínuo', icon: GraduationCap, emoji: '📚' },
  { value: 'innovation', label: 'Inovação', icon: Lightbulb, emoji: '💡' },
  { value: 'all', label: 'Tudo sobre IA!', icon: Rocket, emoji: '🚀' },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    interest: '',
  });
  const [loading, setLoading] = useState(false);
  const [checkingUser, setCheckingUser] = useState(false);
  const [isReturningUser, setIsReturningUser] = useState(false);
  const router = useRouter();
  const { setUser } = useUser();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const checkUserExists = async (email: string) => {
    if (!email || !email.includes('@')) return;
    
    setCheckingUser(true);
    try {
      const response = await fetch(`/api/users?email=${encodeURIComponent(email)}`);
      const data = await response.json();
      
      if (data.exists && data.user) {
        setIsReturningUser(true);
        setFormData(prev => ({
          ...prev,
          name: data.user.name || prev.name,
          role: data.user.role || prev.role,
          interest: data.user.interest || prev.interest,
        }));
      } else {
        setIsReturningUser(false);
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setCheckingUser(false);
    }
  };

  const handleNextStep = () => {
    setStep(step + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Save user to MongoDB
      const userResponse = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...formData, source: 'onboarding_v2' }),
      });

      const userData = await userResponse.json();
      
      // Save user to global context
      if (userData.success && userData.user) {
        setUser(userData.user);
      }

      // Send webhook
      await fetch('/api/webhooks/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...formData, source: 'onboarding_v2' }),
      });
    } catch (error) {
      console.error('Error sending webhook:', error);
    }

    router.push('/waiting-list');
  };

  const progress = (step / steps.length) * 100;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Header />
      <main className="flex-grow flex items-center justify-center p-4 pt-28 pb-16">
        <div className="w-full max-w-2xl">
          <div className="mb-8">
            <Progress value={progress} className="w-full" />
            <div className="flex justify-between mt-2">
              {steps.map((s) => (
                <div key={s.id} className={`flex items-center gap-2 ${s.id <= step ? 'text-white' : 'text-gray-500'}`}>
                  <s.icon className="w-5 h-5" />
                  <span>{s.title}</span>
                </div>
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className="w-full p-8 bg-gray-900/50 backdrop-blur-xl border border-purple-500/50 rounded-2xl shadow-2xl shadow-purple-500/20"
            >
              {step === 1 && <Step1 next={handleNextStep} />}
              {step === 2 && <Step2 next={handleNextStep} data={formData} onChange={handleChange} onEmailBlur={checkUserExists} checkingUser={checkingUser} isReturningUser={isReturningUser} />}
              {step === 3 && <Step3 submit={handleSubmit} data={formData} setFormData={setFormData} loading={loading} isReturningUser={isReturningUser} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
      <Footer />
    </div>
  );
}

const Step1 = ({ next }: { next: () => void }) => (
  <div className="text-center space-y-6">
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: "spring", duration: 0.8 }}
    >
      <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 mb-6">
        <Sparkles className="w-12 h-12 text-white" />
      </div>
    </motion.div>
    
    <motion.h1 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="text-4xl font-bold tracking-tight bg-gradient-to-r from-purple-400 via-pink-400 to-purple-600 bg-clip-text text-transparent"
    >
      Bem-vindo à Elite da IA! 🚀
    </motion.h1>
    
    <motion.p 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="text-lg text-gray-300 max-w-md mx-auto"
    >
      Você está a poucos passos de garantir <span className="font-bold text-purple-400">acesso exclusivo</span> aos melhores cursos e ferramentas de IA do Brasil.
    </motion.p>
    
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7 }}
      className="flex flex-col gap-3 items-center"
    >
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <div className="flex -space-x-2">
          {['🎨', '💻', '🚀', '⚡'].map((emoji, i) => (
            <div key={i} className="w-8 h-8 rounded-full bg-gray-800 border-2 border-gray-700 flex items-center justify-center text-xs">
              {emoji}
            </div>
          ))}
        </div>
        <span>Junte-se a <strong className="text-white">2.847+</strong> pioneiros</span>
      </div>
      
      <Button 
        onClick={next} 
        size="lg"
        className="mt-4 h-14 px-8 text-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
      >
        Começar Agora <ArrowRight className="ml-2" />
      </Button>
      
      <p className="text-xs text-gray-500 mt-2">⏱️ Leva menos de 60 segundos</p>
    </motion.div>
  </div>
);

const Step2 = ({ next, data, onChange, onEmailBlur, checkingUser, isReturningUser }: { 
  next: () => void, 
  data: FormData, 
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
  onEmailBlur: (email: string) => void,
  checkingUser: boolean,
  isReturningUser: boolean
}) => (
  <div className="space-y-6">
    {isReturningUser ? (
      <div className="text-center space-y-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", duration: 0.6 }}
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 mb-4">
            <Crown className="w-10 h-10 text-white" />
          </div>
        </motion.div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-600 bg-clip-text text-transparent">
          Que bom te ver de novo, {data.name}! ✨
        </h2>
        <p className="text-gray-300">Você já está na nossa lista VIP! Vamos atualizar suas informações?</p>
        <Button onClick={next} size="lg" className="mt-6 bg-gradient-to-r from-green-500 to-emerald-600">
          Atualizar Meu Perfil <ArrowRight className="ml-2" />
        </Button>
      </div>
    ) : (
      <>
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Vamos começar! 🚀</h2>
          <p className="text-sm text-gray-400">Só precisamos de seu nome e email</p>
        </div>
        
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input 
            name="email" 
            type="email" 
            placeholder="seu@email.com" 
            value={data.email} 
            onChange={onChange}
            onBlur={(e) => onEmailBlur(e.target.value)}
            className="pl-10 h-12 text-lg" 
            required 
          />
          {checkingUser && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent" />
            </motion.div>
          )}
        </div>
        
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input 
            name="name" 
            placeholder="Seu nome completo" 
            value={data.name} 
            onChange={onChange} 
            className="pl-10 h-12 text-lg" 
            required 
          />
        </div>
        
        <div className="flex gap-3">
          <Button 
            onClick={next} 
            disabled={!data.name || !data.email || checkingUser}
            className="flex-1 h-12 text-lg"
          >
            Continuar <ArrowRight className="ml-2" />
          </Button>
        </div>
        
        <p className="text-xs text-center text-gray-500">
          💡 <strong>Dica:</strong> Complete todas as etapas para aumentar suas chances de acesso antecipado!
        </p>
      </>
    )}
  </div>
);

const Step3 = ({ submit, data, setFormData, loading, isReturningUser }: { 
  submit: (e: React.FormEvent) => void, 
  data: FormData, 
  setFormData: React.Dispatch<React.SetStateAction<FormData>>,
  loading: boolean, 
  isReturningUser: boolean 
}) => {
  const [selectedRoles, setSelectedRoles] = useState<string[]>(data.role ? data.role.split(',') : []);
  const [selectedInterests, setSelectedInterests] = useState<string[]>(data.interest ? data.interest.split(',') : []);

  const toggleRole = (value: string) => {
    const newRoles = selectedRoles.includes(value)
      ? selectedRoles.filter(r => r !== value)
      : [...selectedRoles, value];
    setSelectedRoles(newRoles);
    setFormData({ ...data, role: newRoles.join(',') });
  };

  const toggleInterest = (value: string) => {
    const newInterests = selectedInterests.includes(value)
      ? selectedInterests.filter(i => i !== value)
      : [...selectedInterests, value];
    setSelectedInterests(newInterests);
    setFormData({ ...data, interest: newInterests.join(',') });
  };

  return (
    <form onSubmit={submit} className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
          Quase lá! ✨
        </h2>
        <p className="text-gray-400">
          Personalize sua experiência para receber conteúdo exclusivo
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/30 rounded-full text-sm">
          <Star className="w-4 h-4 text-yellow-400" />
          <span className="text-purple-300">Mais informações = Prioridade na fila!</span>
        </div>
      </div>

      {/* Role Selection */}
      <div className="space-y-4">
        <label className="text-lg font-semibold flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-purple-400" />
          Qual é sua área? (pode escolher mais de uma)
        </label>
        <div className="grid grid-cols-2 gap-3">
          {roleOptions.map((option) => (
            <motion.button
              key={option.value}
              type="button"
              onClick={() => toggleRole(option.value)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`p-4 rounded-xl border-2 transition-all text-left ${
                selectedRoles.includes(option.value)
                  ? 'border-purple-500 bg-purple-500/20 shadow-lg shadow-purple-500/20'
                  : 'border-gray-700 hover:border-gray-600 bg-gray-800/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{option.emoji}</span>
                <span className="font-medium text-sm">{option.label}</span>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Interest Selection */}
      <div className="space-y-4">
        <label className="text-lg font-semibold flex items-center gap-2">
          <BrainCircuit className="w-5 h-5 text-pink-400" />
          O que mais te interessa? (escolha quantos quiser)
        </label>
        <div className="grid grid-cols-2 gap-3">
          {interestOptions.map((option) => (
            <motion.button
              key={option.value}
              type="button"
              onClick={() => toggleInterest(option.value)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`p-4 rounded-xl border-2 transition-all text-left ${
                selectedInterests.includes(option.value)
                  ? 'border-pink-500 bg-pink-500/20 shadow-lg shadow-pink-500/20'
                  : 'border-gray-700 hover:border-gray-600 bg-gray-800/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{option.emoji}</span>
                <span className="font-medium text-sm">{option.label}</span>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Submit Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Button 
          type="submit" 
          disabled={loading || selectedRoles.length === 0 || selectedInterests.length === 0}
          className="w-full h-14 text-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 relative overflow-hidden group"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
              <span>Processando...</span>
            </div>
          ) : (
            <>
              <span className="relative z-10">
                {isReturningUser ? '✨ Atualizar & Confirmar' : '🚀 Garantir Meu Lugar VIP'}
              </span>
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400"
                initial={{ x: '-100%' }}
                whileHover={{ x: 0 }}
                transition={{ duration: 0.3 }}
              />
            </>
          )}
        </Button>
        
        {(selectedRoles.length === 0 || selectedInterests.length === 0) && (
          <p className="text-xs text-center text-gray-500 mt-2">
            ⬆️ Selecione pelo menos uma opção em cada categoria
          </p>
        )}
      </motion.div>
    </form>
  );
};
