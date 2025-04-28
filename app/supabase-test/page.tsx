'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

export default function SupabaseTest() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [details, setDetails] = useState<{
    url: string;
    anon_key_prefix?: string;
    tables?: string[];
    responseTime?: number;
  }>({ 
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not set',
    anon_key_prefix: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 
      `${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 8)}...` : 'Not set'
  });

  useEffect(() => {
    const checkConnection = async () => {
      try {
        console.log("Testing Supabase connection with:", {
          url: process.env.NEXT_PUBLIC_SUPABASE_URL,
          key_set: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        });

        const startTime = performance.now();

        // Simple ping test using Supabase auth (doesn't require schema setup)
        const { data: authData, error: authError } = await supabase.auth.getSession();
        
        if (authError) {
          console.error('Error connecting to Supabase auth:', authError);
          throw authError;
        }
        
        // If we got past auth, try to access a table
        const { data, error } = await supabase
          .from('quiz_questions')
          .select('count(*)', { count: 'exact' });
        
        const endTime = performance.now();
        setDetails(prev => ({ ...prev, responseTime: endTime - startTime }));
        
        if (error) {
          console.error('Error accessing quiz_questions table:', error);
          // If we get a specific error about the table not existing, that's useful info
          if (error.message.includes('does not exist')) {
            setErrorMessage(`${error.message}. Have you run the schema.sql script in your Supabase project?`);
            setStatus('error');
            return;
          }
          throw error;
        }
        
        // We successfully connected!
        setStatus('success');
        
        // Now try to get table list for additional info
        const { data: tablesData } = await supabase
          .from('_tables')
          .select('name');
          
        if (tablesData) {
          setDetails(prev => ({ 
            ...prev, 
            tables: tablesData.map((t: any) => t.name)
          }));
        }
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
          
          <div className="mt-4 p-3 bg-green-100 rounded">
            <h3 className="font-semibold">Connection Details:</h3>
            <ul className="mt-2 space-y-1">
              <li><strong>URL:</strong> {details.url}</li>
              <li><strong>Anon Key (prefix):</strong> {details.anon_key_prefix}</li>
              <li><strong>Response Time:</strong> {details.responseTime?.toFixed(2)}ms</li>
              {details.tables && (
                <li>
                  <strong>Available Tables:</strong> {details.tables.join(', ')}
                </li>
              )}
            </ul>
          </div>
        </div>
      )}
      
      {status === 'error' && (
        <div className="bg-red-50 p-4 rounded-md">
          <p className="text-red-700">❌ Failed to connect to Supabase</p>
          {errorMessage && (
            <div className="mt-2 p-3 bg-red-100 rounded text-sm font-mono overflow-auto">
              {errorMessage}
            </div>
          )}
          
          <div className="mt-4 p-3 bg-red-100 rounded">
            <h3 className="font-semibold">Connection Details:</h3>
            <ul className="mt-2 space-y-1">
              <li><strong>URL:</strong> {details.url}</li>
              <li><strong>Anon Key (prefix):</strong> {details.anon_key_prefix}</li>
              {details.responseTime && <li><strong>Response Time:</strong> {details.responseTime.toFixed(2)}ms</li>}
            </ul>
          </div>
          
          <div className="mt-4">
            <p className="font-semibold">Troubleshooting steps:</p>
            <ol className="list-decimal pl-5 mt-2 space-y-1">
              <li>Check that your Supabase URL and anon key are correct in .env.local</li>
              <li>Verify that you've run the schema.sql script in your Supabase project</li>
              <li>Make sure your Supabase project is active (not paused)</li>
              <li>Check that there are no network issues preventing the connection</li>
              <li>Ensure CORS is configured to allow requests from localhost</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
} 