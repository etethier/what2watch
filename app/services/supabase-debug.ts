import { createClient } from '@supabase/supabase-js';

// Create a simple Supabase client for debugging
export const createDebugClient = () => {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    
    console.log('Debug client - URL present:', !!supabaseUrl);
    console.log('Debug client - Key present:', !!supabaseKey);
    
    // Check if we have valid values
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase environment variables');
      return null;
    }
    
    // Return a proper client with error handling
    return createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      }
    });
  } catch (error) {
    console.error('Error creating Supabase client:', error);
    return null;
  }
};

// Test function to verify Supabase connectivity
export const testSupabaseConnection = async () => {
  const client = createDebugClient();
  if (!client) {
    return { success: false, error: 'Failed to create client' };
  }
  
  try {
    // Try a simple auth check which should work even without database tables
    const { data, error } = await client.auth.getSession();
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true, data };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};
