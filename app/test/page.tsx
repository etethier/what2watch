'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import supabaseServices from '../services/supabase-wrapper';

export default function TestPage() {
  const { user, loading } = useAuth();
  const [testStatus, setTestStatus] = useState('Checking Supabase connection...');

  useEffect(() => {
    const runTest = async () => {
      try {
        // Simple test
        const currentUser = await supabaseServices.auth.getCurrentUser();
        setTestStatus('Connection test complete. Check console for details.');
        console.log('Test results:', { 
          currentUser: currentUser ? 'User present' : 'No user',
          usingFallback: !currentUser
        });
      } catch (error) {
        console.error('Test error:', error);
        setTestStatus('Error testing connection. Check console.');
      }
    };
    
    if (!loading) {
      runTest();
    }
  }, [loading]);

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Simple Test Page</h1>
      
      <div className="bg-gray-100 rounded p-4 mb-4">
        <p><strong>Status:</strong> {testStatus}</p>
        <p><strong>Auth:</strong> {loading ? 'Loading...' : (user ? 'Logged In' : 'Not Logged In')}</p>
      </div>
      
      <div className="text-sm text-gray-600">
        <p>This is a simplified test page to verify the app is working correctly.</p>
        <p>The port being used is 3009. Try accessing this through:</p>
        <ul className="list-disc pl-5 mt-2">
          <li><a href="http://localhost:3009/test" className="text-blue-500 underline">localhost:3009/test</a></li>
          <li><a href="http://127.0.0.1:3009/test" className="text-blue-500 underline">127.0.0.1:3009/test</a></li>
          <li><a href="http://192.168.1.201:3009/test" className="text-blue-500 underline">192.168.1.201:3009/test</a> (your network IP)</li>
        </ul>
      </div>
    </div>
  );
} 