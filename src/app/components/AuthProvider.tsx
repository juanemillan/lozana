'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/lib/profile';

type AuthState = {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthState>({
  user: null,
  profile: null,
  loading: true,
  refreshProfile: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

/**
 * La sesión vive en localStorage (default de supabase-js). El gate visual que
 * cuelga de acá es solo UX: la seguridad real la da RLS en Postgres, así que
 * saltarse la UI no da acceso a ninguna fila.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (userId: string | undefined) => {
    if (!userId) {
      setProfile(null);
      return;
    }
    const { data, error } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();
    if (error) console.error(error);
    setProfile(data ?? null);
  }, []);

  const refreshProfile = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    await loadProfile(data.user?.id);
  }, [loadProfile]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      const sessionUser = data.session?.user ?? null;
      setUser(sessionUser);
      await loadProfile(sessionUser?.id);
      setLoading(false);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ?? null;
      setUser(nextUser);
      // El trigger handle_new_user crea el perfil al registrarse, así que acá
      // ya debería existir; si no, queda null y el onboarding lo crea igual.
      loadProfile(nextUser?.id);
    });

    return () => sub.subscription.unsubscribe();
  }, [loadProfile]);

  return (
    <AuthContext value={{ user, profile, loading, refreshProfile }}>{children}</AuthContext>
  );
}
