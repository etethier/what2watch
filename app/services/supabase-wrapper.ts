// Supabase Service Wrapper
// This attempts to use the real Supabase client
// but falls back to a mock implementation if there are errors

// First, import both the real and fallback implementations
import { createClient } from '@supabase/supabase-js';
import fallbackServices from './supabase-fallback';

// Try to create a Supabase client
let supabaseClient: any = null;
let usingFallback = false;

try {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (supabaseUrl && supabaseKey) {
    supabaseClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      }
    });
    console.log('Supabase client created successfully');
  } else {
    console.warn('Missing Supabase environment variables - using fallback');
    usingFallback = true;
  }
} catch (error) {
  console.error('Error creating Supabase client:', error);
  console.warn('Using fallback Supabase implementation');
  usingFallback = true;
}

// Export our services - either the real ones or the fallbacks
export const services = usingFallback ? fallbackServices : {
  auth: {
    signUp: async (email: string, password: string) => {
      try {
        const { data, error } = await supabaseClient.auth.signUp({ email, password });
        return { user: data?.user || null, error };
      } catch (e) {
        console.error('Error in signUp:', e);
        return { user: null, error: e instanceof Error ? e : new Error('Unknown error') };
      }
    },
    
    signIn: async (email: string, password: string) => {
      try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
        return { user: data?.user || null, error };
      } catch (e) {
        console.error('Error in signIn:', e);
        return { user: null, error: e instanceof Error ? e : new Error('Unknown error') };
      }
    },
    
    signOut: async () => {
      try {
        const { error } = await supabaseClient.auth.signOut();
        return { error };
      } catch (e) {
        console.error('Error in signOut:', e);
        return { error: e instanceof Error ? e : new Error('Unknown error') };
      }
    },
    
    getCurrentUser: async () => {
      try {
        const { data } = await supabaseClient.auth.getUser();
        return data?.user || null;
      } catch (e) {
        console.error('Error in getCurrentUser:', e);
        return null;
      }
    }
  },
  
  // For now, we'll use fallbacks for the other services
  quiz: fallbackServices.quiz,
  content: fallbackServices.content
};

// Export default
export default services; 