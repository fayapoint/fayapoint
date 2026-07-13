"use client";

import { useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, User, ArrowRight, Zap, Briefcase, BrainCircuit,
  Code, Palette, TrendingUp, Users, Lightbulb, Rocket, Target,
  GraduationCap, Building2, Megaphone, Camera,
  Sparkles, Star, Lock, Eye, EyeOff, AlertCircle
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useUser } from '@/contexts/UserContext';
import { HoneypotField } from '@/components/security/HoneypotField';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface FormData {
  name: string;
  email: string;
  password: string;
  role: string;
  interest: string;
}

type Translator = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (key: string, values?: Record<string, any>): string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rich(key: string, values?: Record<string, any>): ReactNode;
  raw(key: string): unknown;
};

const steps = [
  { id: 1, key: 'welcome', icon: Zap },
  { id: 2, key: 'profile', icon: User },
  { id: 3, key: 'interests', icon: BrainCircuit },
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
  const t = useTranslations("Onboarding");
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    role: '',
    interest: '',
  });
  const [loading, setLoading] = useState(false);
  const [checkingUser, setCheckingUser] = useState(false);
  const [emailExists, setEmailExists] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isBotDetected, setIsBotDetected] = useState(false);
  const router = useRouter();
  const { isLoggedIn, setUser, mounted } = useUser();

  // Redirect logged-in users to portal
  useEffect(() => {
    if (mounted && isLoggedIn) {
      router.push('/portal');
    }
  }, [mounted, isLoggedIn, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null);
    if (e.target.name === 'email') {
      setEmailExists(false);
    }
  };

  const checkUserExists = async (email: string) => {
    if (!email || !email.includes('@')) return;
    
    setCheckingUser(true);
    try {
      const response = await fetch(`/api/auth/check-email?email=${encodeURIComponent(email)}`);
      const data = await response.json();
      
      if (data.exists) {
        setEmailExists(true);
      } else {
        setEmailExists(false);
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setCheckingUser(false);
    }
  };

  const handleNextStep = () => {
    if (emailExists) {
      // Don't proceed if email exists - redirect to login
      router.push('/login');
      return;
    }
    setStep(step + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Bot detection - silently fail
    if (isBotDetected) {
      console.warn('[SECURITY] Bot submission blocked');
      // Fake success to not tip off bots
      toast.success('Conta criada com sucesso!');
      setTimeout(() => router.push('/'), 2000);
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      // Register new user
      const userResponse = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, source: 'onboarding_v2' }),
      });
      const userData = await userResponse.json();

      if (!userResponse.ok) {
        throw new Error(userData.error || 'Erro ao criar conta');
      }

      // Save user to global context and localStorage
      if (userData.token) {
        setUser(userData.user);
        localStorage.setItem('fayai_token', userData.token);
        localStorage.setItem('fayai_user', JSON.stringify(userData.user));
      }

      // Send webhook (legacy/n8n support)
      const { password, ...webhookData } = formData;
      await fetch('/api/webhooks/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...webhookData, source: 'onboarding_v2' }),
      }).catch(() => {}); // Don't fail if webhook fails
      
      toast.success('Conta criada com sucesso!');
      router.push('/portal');

    } catch (error) {
      console.error('Error submitting form:', error);
      const message = error instanceof Error ? error.message : 'Erro ao criar conta';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const progress = (step / steps.length) * 100;

  // Show loading while checking auth state
  if (!mounted) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <main className="flex-grow flex items-center justify-center p-4 pt-28 pb-16">
        <div className="w-full max-w-2xl">
          <div className="mb-8">
            <Progress value={progress} className="w-full" />
            <div className="flex justify-between mt-2">
              {steps.map((s) => (
                <div key={s.id} className={`flex items-center gap-2 ${s.id <= step ? 'text-white' : 'text-muted-foreground'}`}>
                  <s.icon className="w-5 h-5" />
                  <span>{t(`steps.${s.key}`)}</span>
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
              className="w-full p-8 bg-card/50 backdrop-blur-xl border border-amber-500/50 rounded-2xl shadow-2xl shadow-amber-500/20"
            >
              {/* Honeypot for bot detection */}
              <HoneypotField onBotDetected={() => setIsBotDetected(true)} />
              
              {step === 1 && <Step1 next={handleNextStep} t={t} />}
              {step === 2 && <Step2 next={handleNextStep} data={formData} onChange={handleChange} onEmailBlur={checkUserExists} checkingUser={checkingUser} emailExists={emailExists} error={error} t={t} />}
              {step === 3 && <Step3 submit={handleSubmit} data={formData} setFormData={setFormData} loading={loading} t={t} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

const Step1 = ({ next, t }: { next: () => void; t: Translator }) => (
  <div className="text-center space-y-6">
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: "spring", duration: 0.8 }}
    >
      <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-amber-500 to-yellow-600 mb-6">
        <Sparkles className="w-12 h-12 text-white" />
      </div>
    </motion.div>
    
    <motion.h1 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="text-4xl font-bold tracking-tight bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-600 bg-clip-text text-transparent"
    >
      {t("step1.title")}
    </motion.h1>
    
    <motion.p 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="text-lg text-muted-foreground max-w-md mx-auto"
    >
      {t.rich("step1.description", {
          bold: (chunks: ReactNode) => <span className="font-bold text-amber-400">{chunks}</span>
      })}
    </motion.p>
    
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7 }}
      className="flex flex-col gap-3 items-center"
    >
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <div className="flex -space-x-2">
          {['🎨', '💻', '🚀', '⚡'].map((emoji, i) => (
            <div key={i} className="w-8 h-8 rounded-full bg-secondary border-2 border-border flex items-center justify-center text-xs">
              {emoji}
            </div>
          ))}
        </div>
        <span>{t.rich("step1.joinCount", {
            count: "2.847+",
            strong: (chunks: ReactNode) => <strong className="text-white">{chunks}</strong>
        })}</span>
      </div>
      
      <Button 
        onClick={next} 
        size="lg"
        className="mt-4 h-14 px-8 text-lg bg-gradient-to-r from-amber-600 to-yellow-700 hover:from-amber-700 hover:to-yellow-800"
      >
        {t("step1.button")} <ArrowRight className="ml-2" />
      </Button>
      
      <p className="text-xs text-muted-foreground mt-2">{t("step1.timeEstimate")}</p>
    </motion.div>
  </div>
);

const Step2 = ({ next, data, onChange, onEmailBlur, checkingUser, emailExists, error, t }: { 
  next: () => void, 
  data: FormData, 
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
  onEmailBlur: (email: string) => void,
  checkingUser: boolean,
  emailExists: boolean,
  error: string | null,
  t: Translator
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">{t("step2.new.title")}</h2>
        <p className="text-sm text-muted-foreground">{t("step2.new.description")}</p>
      </div>
      
      <div className="relative">
        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input 
          name="email" 
          type="email" 
          placeholder={t("step2.new.fields.email")} 
          value={data.email} 
          onChange={onChange}
          onBlur={(e) => onEmailBlur(e.target.value)}
          className={`pl-10 h-12 text-lg bg-secondary/50 border-border focus:border-amber-500 transition-colors ${emailExists ? 'border-yellow-500' : ''}`}
          required 
        />
        {checkingUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
          </motion.div>
        )}
      </div>

      {/* Email exists warning */}
      {emailExists && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg"
        >
          <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-yellow-200 text-sm">Este email já está cadastrado.</p>
            <Link href="/login" className="text-yellow-400 hover:text-yellow-300 text-sm underline">
              Clique aqui para fazer login
            </Link>
          </div>
        </motion.div>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg"
        >
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-200 text-sm">{error}</p>
        </motion.div>
      )}
      
      <div className="relative">
        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input 
          name="name" 
          placeholder={t("step2.new.fields.name")} 
          value={data.name} 
          onChange={onChange} 
          className="pl-10 h-12 text-lg bg-secondary/50 border-border focus:border-amber-500 transition-colors" 
          required 
        />
      </div>

      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input 
          name="password" 
          type={showPassword ? "text" : "password"} 
          placeholder={t("step2.new.fields.password")} 
          value={data.password} 
          onChange={onChange} 
          className="pl-10 h-12 text-lg bg-secondary/50 border-border focus:border-amber-500 transition-colors pr-10" 
          required 
          minLength={6}
        />
        <button 
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
        >
          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>
      
      <div className="flex gap-3">
        <Button 
          onClick={next} 
          disabled={!data.name || !data.email || !data.password || checkingUser || emailExists}
          className="flex-1 h-12 text-lg bg-primary hover:bg-primary/90"
        >
          {t("step2.new.cta")} <ArrowRight className="ml-2" />
        </Button>
      </div>
      
      <p className="text-xs text-center text-muted-foreground">
        Já tem uma conta? <Link href="/login" className="text-amber-400 hover:text-amber-300 underline">Fazer login</Link>
      </p>
    </div>
  );
};

const Step3 = ({ submit, data, setFormData, loading, t }: { 
  submit: (e: React.FormEvent) => void, 
  data: FormData, 
  setFormData: React.Dispatch<React.SetStateAction<FormData>>,
  loading: boolean,
  t: Translator
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
        <h2 className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-yellow-600 bg-clip-text text-transparent">
          {t("step3.title")}
        </h2>
        <p className="text-muted-foreground">
          {t("step3.description")}
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-full text-sm">
          <Star className="w-4 h-4 text-yellow-400" />
          <span className="text-amber-300">{t("step3.priorityHint")}</span>
        </div>
      </div>

      {/* Role Selection */}
      <div className="space-y-4">
        <label className="text-lg font-semibold flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-amber-400" />
          {t("step3.roleLabel")}
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
                  ? 'border-amber-500 bg-amber-500/20 shadow-lg shadow-amber-500/20'
                  : 'border-border hover:border-gray-600 bg-secondary/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{option.emoji}</span>
                <span className="font-medium text-sm">{t(`roles.${option.value}`)}</span>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Interest Selection */}
      <div className="space-y-4">
        <label className="text-lg font-semibold flex items-center gap-2">
          <BrainCircuit className="w-5 h-5 text-yellow-400" />
          {t("step3.interestLabel")}
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
                  ? 'border-amber-500 bg-yellow-500/20 shadow-lg shadow-amber-500/20'
                  : 'border-border hover:border-gray-600 bg-secondary/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{option.emoji}</span>
                <span className="font-medium text-sm">{t(`interests.${option.value}`)}</span>
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
          className="w-full h-14 text-lg bg-gradient-to-r from-amber-600 to-yellow-700 hover:from-amber-700 hover:to-yellow-800 relative overflow-hidden group"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
              <span>{t("step3.submitting")}</span>
            </div>
          ) : (
            <>
              <span className="relative z-10">
                {t("step3.submitNew")}
              </span>
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-amber-400 to-yellow-500"
                initial={{ x: '-100%' }}
                whileHover={{ x: 0 }}
                transition={{ duration: 0.3 }}
              />
            </>
          )}
        </Button>
        
        {(selectedRoles.length === 0 || selectedInterests.length === 0) && (
          <p className="text-xs text-center text-muted-foreground mt-2">
            {t("step3.selectionHint")}
          </p>
        )}
      </motion.div>
    </form>
  );
};
