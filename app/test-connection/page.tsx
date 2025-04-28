"use client";

import { useState, useEffect } from 'react';
import { testConnection } from '../services/supabase-minimal';

export default function TestConnection() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    async function checkConnection() {
      try {
        console.log('NEXT_PUBLIC_SUPABASE_URL exists:', Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL));
        console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY exists:', Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY));
        
        const connectionResult = await testConnection();
        console.log('Connection test result:', connectionResult);
        
        setResult(connectionResult);
        setStatus(connectionResult.success ? 'success' : 'error');
      } catch (error) {
        console.error('Error testing connection:', error);
        setResult({ error: (error as Error).message });
        setStatus('error');
      }
    }

    checkConnection();
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-center mb-6">Supabase Connection Test</h1>
        
        {status === 'loading' && (
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-lg text-gray-600">Testing connection to Supabase...</p>
          </div>
        )}
        
        {status === 'success' && (
          <div className="text-center">
            <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h2 className="text-xl font-bold text-green-600 mb-2">Connection Successful!</h2>
            <p className="text-gray-600 mb-4">{result.message}</p>
            {result.duration && (
              <p className="text-sm text-gray-500">Connection time: {result.duration.toFixed(2)}ms</p>
            )}
          </div>
        )}
        
        {status === 'error' && (
          <div className="text-center">
            <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </div>
            <h2 className="text-xl font-bold text-red-600 mb-2">Connection Failed</h2>
            <p className="text-gray-600 mb-4">{result.message || 'An error occurred while connecting to Supabase'}</p>
            {result.error && (
              <div className="mt-4 p-4 bg-red-50 rounded-md overflow-auto text-left">
                <p className="font-mono text-sm text-red-800">
                  {typeof result.error === 'string' 
                    ? result.error 
                    : JSON.stringify(result.error, null, 2)}
                </p>
              </div>
            )}
          </div>
        )}

        <div className="mt-8 p-4 bg-gray-100 rounded-md">
          <h3 className="font-medium mb-2">Environment Variables</h3>
          <p className="text-sm">
            NEXT_PUBLIC_SUPABASE_URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}
          </p>
          <p className="text-sm">
            NEXT_PUBLIC_SUPABASE_ANON_KEY: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}
          </p>
        </div>

        <div className="mt-6 text-center">
          <a href="/" className="text-blue-500 hover:text-blue-700">Back to Home</a>
        </div>
      </div>
    </div>
  );
} 