'use client';

import { useEffect, useState } from 'react';
import { supabase } from './services/supabase';

export default function SupabaseTest() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        // A simple query to test the connection
        const { data, error } = await supabase.from('quiz_questions').select('count(*)', { count: 'exact' });
        
        if (error) throw error;
        
        setStatus('success');
      } catch (error) {
        console.error('Supabase connection error:', error);
        setStatus('error');
        setErrorMessage((error as Error).message);
      }
    };

    checkConnection();
  }, []);

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Supabase Connection Test</h1>
      
      {status === 'loading' && (
        <div className="bg-blue-50 p-4 rounded-md">
          <p className="text-blue-700">Testing connection to Supabase...</p>
        </div>
      )}
      
      {status === 'success' && (
        <div className="bg-green-50 p-4 rounded-md">
          <p className="text-green-700">✅ Successfully connected to Supabase!</p>
          <p className="mt-2">Your Supabase URL and anon key are correctly configured.</p>
        </div>
      )}
      
      {status === 'error' && (
        <div className="bg-red-50 p-4 rounded-md">
          <p className="text-red-700">❌ Failed to connect to Supabase</p>
          {errorMessage && (
            <div className="mt-2 p-3 bg-red-100 rounded text-sm font-mono">
              {errorMessage}
            </div>
          )}
          <div className="mt-4">
            <p className="font-semibold">Troubleshooting steps:</p>
            <ol className="list-decimal pl-5 mt-2 space-y-1">
              <li>Check that your Supabase URL and anon key are correct in .env.local</li>
              <li>Verify that you've run the schema.sql script in your Supabase project</li>
              <li>Make sure your Supabase project is active (not paused)</li>
              <li>Check that there are no network issues preventing the connection</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
} 