'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

export default function SupabaseSimpleTest() {
  const [status, setStatus] = useState<'loading' | 'checking' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>('Initializing...');
  const [details, setDetails] = useState<{
    url: string | null;
    key_prefix: string | null;
  }>({
    url: null,
    key_prefix: null
  });

  useEffect(() => {
    // First, check if environment variables are loaded
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    setDetails({
      url: supabaseUrl || 'Not set',
      key_prefix: supabaseKey ? `${supabaseKey.substring(0, 8)}...` : 'Not set'
    });
    
    if (!supabaseUrl || !supabaseKey) {
      setStatus('error');
      setMessage('Environment variables are missing. Check your .env.local file.');
      return;
    }
    
    setStatus('checking');
    setMessage('Environment variables loaded. Attempting to create Supabase client...');
    
    try {
      // Try to create a Supabase client with the env vars
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // If we get here, client initialization worked
      setStatus('success');
      setMessage('Supabase client created successfully!');
      
      // Attempt a simple auth call
      const checkAuth = async () => {
        try {
          const { data, error } = await supabase.auth.getSession();
          if (error) {
            throw error;
          }
          setMessage('Supabase client created and auth API works!');
        } catch (error) {
          console.error("Auth API error:", error);
          setStatus('error');
          setMessage(`Supabase client created but auth API failed: ${(error as Error).message}`);
        }
      };
      
      checkAuth();
    } catch (error) {
      console.error("Supabase client creation error:", error);
      setStatus('error');
      setMessage(`Failed to create Supabase client: ${(error as Error).message}`);
    }
  }, []);

  const getStatusColor = () => {
    switch (status) {
      case 'loading': return 'bg-blue-50 text-blue-700';
      case 'checking': return 'bg-yellow-50 text-yellow-700';
      case 'success': return 'bg-green-50 text-green-700';
      case 'error': return 'bg-red-50 text-red-700';
      default: return 'bg-gray-50 text-gray-700';
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Simple Supabase Test</h1>
      
      <div className={`p-4 rounded-md ${getStatusColor()}`}>
        <p className="font-medium">{status.toUpperCase()}: {message}</p>
      </div>
      
      <div className="mt-4 p-4 bg-gray-50 rounded-md">
        <h2 className="text-xl font-semibold mb-2">Environment Variables</h2>
        <div className="font-mono text-sm">
          <p>NEXT_PUBLIC_SUPABASE_URL: {details.url}</p>
          <p>NEXT_PUBLIC_SUPABASE_ANON_KEY: {details.key_prefix}</p>
        </div>
      </div>
    </div>
  );
} 