'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Create a context for Supabase
type SupabaseContextType = {
  supabase: SupabaseClient | null;
  isLoading: boolean;
  error: string | null;
};

const SupabaseContext = createContext<SupabaseContextType>({
  supabase: null,
  isLoading: true,
  error: null,
});

// Hook to use Supabase client
export const useSupabase = () => useContext(SupabaseContext);

// Supabase provider component
export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeSupabase = () => {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseAnonKey) {
          throw new Error('Missing Supabase environment variables');
        }

        // Create client
        const client = createClient(supabaseUrl, supabaseAnonKey, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
          }
        });

        // Set client
        setSupabase(client);
        setIsLoading(false);
      } catch (e) {
        console.error('Error initializing Supabase client:', e);
        setError(e instanceof Error ? e.message : 'Failed to initialize Supabase');
        setIsLoading(false);
      }
    };

    initializeSupabase();
  }, []);

  return (
    <SupabaseContext.Provider value={{ supabase, isLoading, error }}>
      {children}
    </SupabaseContext.Provider>
  );
} 