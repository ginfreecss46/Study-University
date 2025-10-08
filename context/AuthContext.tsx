import React, { createContext, useContext, useEffect, useState } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

import { registerForPushNotificationsAsync } from "../hooks/useNotifications";

// Crée un contexte pour l'authentification
const AuthContext = createContext<{ session: Session | null; loading: boolean }>({ session: null, loading: true });

// Hook pour utiliser le contexte d'authentification
export function useAuth() {
  return useContext(AuthContext);
}

// Fournisseur de contexte d'authentification
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Récupère la session initiale
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Écoute les changements d'état d'authentification
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    // Nettoie l'écouteur lors du démontage du composant
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Enregistre le jeton de notification push
  useEffect(() => {
    const registerToken = async () => {
      if (session) {
        try {
          const token = await registerForPushNotificationsAsync();
          if (token) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('push_token')
              .eq('id', session.user.id)
              .single();

            if (profile && profile.push_token !== token) {
              const { error } = await supabase
                .from('profiles')
                .update({ push_token: token })
                .eq('id', session.user.id);
              if (error) {
                console.error('Error updating push token:', error);
              }
            }
          }
        } catch (e) {
          console.error('Error registering for push notifications:', e);
        }
      }
    };

    registerToken();
  }, [session]);

  return (
    <AuthContext.Provider value={{ session, loading }}>{children}</AuthContext.Provider>
  );
}
