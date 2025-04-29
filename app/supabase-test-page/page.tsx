'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import supabaseServices from '../services/supabase-wrapper';

export default function SupabaseTestPage() {
  const { user, loading } = useAuth();
  const [testResult, setTestResult] = useState<any>(null);
  const [testStatus, setTestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const runTest = async () => {
    setTestStatus('loading');
    try {
      // Check if our wrapper works
      const currentUser = await supabaseServices.auth.getCurrentUser();
      setTestResult({
        useAuthContext: {
          user: user ? 'User present' : 'No user',
          loading
        },
        directServiceCall: {
          currentUser: currentUser ? 'User present' : 'No user'
        },
        usingFallback: !currentUser && !user
      });
      setTestStatus('success');
    } catch (error) {
      console.error('Test failed:', error);
      setTestResult({ error: error instanceof Error ? error.message : 'Unknown error' });
      setTestStatus('error');
    }
  };

  // Run the test on page load
  useEffect(() => {
    if (!loading) {
      runTest();
    }
  }, [loading]);

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Supabase Connection Test Page</h1>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Auth Context Status</h2>
        <div className="bg-gray-100 p-4 rounded">
          <p>User: {user ? 'Logged in' : 'Not logged in'}</p>
          <p>Loading: {loading ? 'Yes' : 'No'}</p>
        </div>
      </div>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Wrapper Test</h2>
        <button 
          onClick={runTest}
          disabled={testStatus === 'loading'}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          {testStatus === 'loading' ? 'Testing...' : 'Run Test'}
        </button>
        
        {testResult && (
          <div className="mt-4 bg-gray-100 p-4 rounded">
            <h3 className="font-semibold mb-2">Test Results:</h3>
            <pre className="bg-gray-800 text-white p-3 rounded overflow-auto">
              {JSON.stringify(testResult, null, 2)}
            </pre>
          </div>
        )}
      </div>
      
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
        <p className="font-medium">
          If you're seeing "usingFallback: true", it means the app is using the fallback Supabase implementation 
          instead of connecting to your actual Supabase project.
        </p>
        <p className="mt-2">
          This allows your app to function without errors, but you won't be able to use real database features.
        </p>
        <p className="mt-2">
          To fix this:
        </p>
        <ol className="list-decimal pl-5 mt-1">
          <li>Check that @supabase/supabase-js is properly installed</li>
          <li>Verify your .env.local file has the correct Supabase URL and anon key</li>
          <li>Try running npm install @supabase/supabase-js@latest</li>
          <li>Check your browser console for more detailed error messages</li>
        </ol>
      </div>
    </div>
  );
} 