'use client';

import { useState, useEffect } from 'react';
import { createDebugClient, testSupabaseConnection } from '../services/supabase-debug';

export default function SupabaseDebugPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Testing Supabase connection...');
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    const runTest = async () => {
      try {
        // Create client - this just checks if we can create the client
        const client = createDebugClient();
        if (!client) {
          setStatus('error');
          setMessage('Failed to create Supabase client. Check console for details.');
          return;
        }
        
        // Test connection - this tries to make an actual API call
        const testResult = await testSupabaseConnection();
        setResult(testResult);
        
        if (testResult.success) {
          setStatus('success');
          setMessage('Supabase connection successful!');
        } else {
          setStatus('error');
          setMessage(`Supabase connection failed: ${testResult.error}`);
        }
      } catch (error) {
        console.error('Error in debug page:', error);
        setStatus('error');
        setMessage(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };
    
    runTest();
  }, []);

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Supabase Debug Page</h1>
      
      <div className={`p-4 rounded mb-4 ${
        status === 'loading' ? 'bg-blue-100' : 
        status === 'success' ? 'bg-green-100' : 'bg-red-100'
      }`}>
        <p className="font-semibold">{message}</p>
      </div>
      
      <div className="bg-gray-100 p-4 rounded">
        <h2 className="text-lg font-semibold mb-2">Environment Variables:</h2>
        <p>NEXT_PUBLIC_SUPABASE_URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set'}</p>
        <p>NEXT_PUBLIC_SUPABASE_ANON_KEY: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Not set'}</p>
      </div>
      
      {result && (
        <div className="mt-4 bg-gray-100 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Test Result:</h2>
          <pre className="bg-gray-800 text-white p-3 rounded overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
      
      <div className="mt-8">
        <p className="text-gray-600">
          If you're experiencing issues with Supabase, try the following:
        </p>
        <ul className="list-disc pl-6 mt-2 text-gray-600">
          <li>Check that your .env.local file has the correct Supabase URL and anon key</li>
          <li>Make sure @supabase/supabase-js is properly installed</li>
          <li>Try running npm install @supabase/supabase-js@latest</li>
          <li>Check your browser console for more detailed error messages</li>
        </ul>
      </div>
    </div>
  );
} 