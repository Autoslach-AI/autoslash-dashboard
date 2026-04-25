"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { AuthForm } from "@/components/ui/sign-in";
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  const [isAdminExists, setIsAdminExists] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();
  const CREATOR_EMAIL = 'autoslachai@gmail.com';

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const { data } = await supabase
          .from('company_profile')
          .select('is_locked')
          .eq('id', 1)
          .single();
        
        setIsAdminExists(data?.is_locked || false);
      } catch (err) {
        setIsAdminExists(false);
      }
    };
    checkAdmin();
  }, [supabase]);

  const handleAuth = async (data: { email: string; password?: string }, isRegistration?: boolean) => {
    setLoading(true);
    setError(null);
    setMessage(null);

    const targetEmail = data.email.toLowerCase().trim();

    if (isRegistration) {
      if (targetEmail !== CREATOR_EMAIL) {
        setError("L'initialisation est réservée au Créateur.");
        setLoading(false);
        return;
      }
      const { error: signUpError } = await supabase.auth.signUp({ 
        email: targetEmail, 
        password: data.password || '' 
      });
      
      if (signUpError) {
        setError(signUpError.message);
      } else {
        // CRITICAL: Lock the hub immediately in the database state
        await supabase.from('company_profile').upsert({ id: 1, is_locked: true, company_name: 'LUMIA' });
        setMessage("Compte Admin créé ! Connectez-vous maintenant.");
        setLoading(false);
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ 
        email: targetEmail, 
        password: data.password || '' 
      });
      if (error) setError("Identifiants incorrects.");
      else window.location.href = '/admin';
    }
    setLoading(false);
  };

  const handleResetPassword = async (emailInput?: string) => {
    if (!emailInput || emailInput.toLowerCase().trim() !== CREATOR_EMAIL) {
      setError("Email non autorisé pour la récupération.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(emailInput.trim(), {
      redirectTo: `${window.location.origin}/admin/reset-password`,
    });
    setLoading(false);

    if (error) setError(error.message);
    else setMessage("Lien de récupération envoyé.");
  };

  if (isAdminExists === null) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-white/20 animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-black flex items-center justify-center p-6 font-sans">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full"
      >
        <AuthForm 
          onEmailSubmit={handleAuth}
          onForgotPassword={() => {
            const emailInput = document.getElementById('email') as HTMLInputElement;
            handleResetPassword(emailInput?.value);
          }}
          loading={loading}
          error={error}
          message={message}
          isAdminExists={isAdminExists}
          className="shadow-2xl border-none"
        />
      </motion.div>
    </main>
  );
}
