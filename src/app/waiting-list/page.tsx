"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle, Gift, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function WaitingListPage() {
  const router = useRouter();

  useEffect(() => {
    const triggerWebhook = async () => {
      try {
        await fetch('/api/webhooks/waiting-list', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ event: 'waiting_list_joined' }),
        });
      } catch (error) {
        console.error('Error sending waiting list webhook:', error);
      }
    };

    triggerWebhook();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Header />
      <main className="flex-grow flex items-center justify-center text-center px-4 pt-28 pb-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-2xl p-8 space-y-8 bg-gray-900/50 backdrop-blur-xl border border-green-500/50 rounded-2xl shadow-2xl shadow-green-500/20"
        >
          <CheckCircle className="mx-auto h-16 w-16 text-green-400" />
          <h1 className="text-4xl font-bold tracking-tight text-white">Parabéns! Você está na lista!</h1>
          <p className="mt-4 text-xl text-gray-300">Você garantiu seu lugar na vanguarda da revolução da IA. Em breve, você receberá um e-mail com mais informações e um presente especial de boas-vindas.</p>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button onClick={() => router.push('/cursos')} className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold">
              <Sparkles className="mr-2 h-5 w-5" />
              Explorar Cursos
            </Button>
            <Button onClick={() => router.push('/comunidade')} variant="outline" className="w-full sm:w-auto">
              <Gift className="mr-2 h-5 w-5" />
              Conheça a Comunidade
            </Button>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
