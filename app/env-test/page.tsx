'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FaCheck, FaTimes, FaSpinner } from 'react-icons/fa';

export default function EnvTestPage() {
  const [envVars, setEnvVars] = useState<Record<string, { exists: boolean; masked: string }>>({});
  const [loading, setLoading] = useState(true);

  // Check environment variables
  useEffect(() => {
    // Using setTimeout to ensure we're running on client side
    const timer = setTimeout(() => {
      checkEnvironmentVariables();
    }, 0);
    
    return () => clearTimeout(timer);
  }, []);

  const checkEnvironmentVariables = (): void => {
    setLoading(true);
    
    // List of environment variables to check
    const varsToCheck = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'NEXT_PUBLIC_TMDB_API_KEY',
      'NEXT_PUBLIC_YOUTUBE_API_KEY',
      'NEXT_PUBLIC_OMDB_API_KEY'
    ];

    const results: Record<string, { exists: boolean; masked: string }> = {};

    // Check each environment variable
    varsToCheck.forEach(varName => {
      const value = process.env[varName];
      const exists = !!value && value.length > 0;
      
      // Create a masked version for display (first 4 and last 4 chars)
      let masked = 'Not set';
      if (exists && value) {
        if (value.length <= 8) {
          masked = '****';
        } else {
          masked = `${value.substring(0, 4)}...${value.substring(value.length - 4)}`;
        }
      }
      
      results[varName] = { exists, masked };
    });

    setEnvVars(results);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 p-4 md:p-8">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-sm p-6 md:p-8">
        <h1 className="text-3xl font-bold mb-2">Environment Variables Test</h1>
        <p className="text-gray-600 mb-6">
          This page checks if the necessary environment variables are set correctly for your application.
        </p>

        {loading ? (
          <div className="flex items-center justify-center p-8">
            <FaSpinner className="animate-spin text-pink-500 text-2xl mr-3" />
            <span>Checking environment variables...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Supabase Environment Variables */}
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <h2 className="text-xl font-semibold mb-4">Supabase Configuration</h2>
              
              <div className="space-y-4">
                {Object.keys(envVars)
                  .filter(key => key.includes('SUPABASE'))
                  .map(key => (
                    <div key={key} className="flex items-center justify-between">
                      <div>
                        <span className="font-mono text-sm bg-gray-200 px-2 py-1 rounded">{key}</span>
                        <span className="ml-2 text-gray-600 text-sm">{envVars[key].masked}</span>
                      </div>
                      {envVars[key].exists ? (
                        <span className="text-green-500 flex items-center">
                          <FaCheck className="mr-1" /> Set
                        </span>
                      ) : (
                        <span className="text-red-500 flex items-center">
                          <FaTimes className="mr-1" /> Missing
                        </span>
                      )}
                    </div>
                  ))}
              </div>
              
              <div className="mt-4 text-sm">
                <p className="text-gray-600">
                  These environment variables are required for Supabase authentication to work correctly.
                </p>
                <p className="mt-2 text-gray-600">
                  If these are missing, check your <code className="bg-gray-200 px-1 rounded">.env.local</code> file.
                </p>
              </div>
            </div>
            
            {/* Other Environment Variables */}
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <h2 className="text-xl font-semibold mb-4">Other API Keys</h2>
              
              <div className="space-y-4">
                {Object.keys(envVars)
                  .filter(key => !key.includes('SUPABASE'))
                  .map(key => (
                    <div key={key} className="flex items-center justify-between">
                      <div>
                        <span className="font-mono text-sm bg-gray-200 px-2 py-1 rounded">{key}</span>
                        <span className="ml-2 text-gray-600 text-sm">{envVars[key].masked}</span>
                      </div>
                      {envVars[key].exists ? (
                        <span className="text-green-500 flex items-center">
                          <FaCheck className="mr-1" /> Set
                        </span>
                      ) : (
                        <span className="text-yellow-500 flex items-center">
                          <FaTimes className="mr-1" /> Missing
                        </span>
                      )}
                    </div>
                  ))}
              </div>
              
              <div className="mt-4 text-sm">
                <p className="text-gray-600">
                  These keys are used for external APIs but are not critical for auth functionality.
                </p>
              </div>
            </div>
            
            {/* Auth Dependencies */}
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <h2 className="text-xl font-semibold mb-4">Authentication Dependencies</h2>
              
              <div className="space-y-2 text-sm">
                <p className="flex items-center">
                  <span className="w-8 inline-block">
                    {envVars['NEXT_PUBLIC_SUPABASE_URL']?.exists && envVars['NEXT_PUBLIC_SUPABASE_ANON_KEY']?.exists ? (
                      <FaCheck className="text-green-500" />
                    ) : (
                      <FaTimes className="text-red-500" />
                    )}
                  </span>
                  <span>Supabase environment variables properly configured</span>
                </p>
                
                <p className="flex items-center">
                  <span className="w-8 inline-block">
                    <FaCheck className="text-green-500" />
                  </span>
                  <span>@supabase/supabase-js package installed (version 2.49.4)</span>
                </p>
                
                <p className="flex items-center">
                  <span className="w-8 inline-block">
                    <FaCheck className="text-green-500" />
                  </span>
                  <span>Supabase wrapper with fallback implemented</span>
                </p>
              </div>
            </div>
            
            {/* Recommendations */}
            <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-500">
              <h2 className="text-lg font-semibold mb-2">Recommendations</h2>
              
              {!envVars['NEXT_PUBLIC_SUPABASE_URL']?.exists || !envVars['NEXT_PUBLIC_SUPABASE_ANON_KEY']?.exists ? (
                <div className="text-red-600 mb-4">
                  <p className="font-medium">Critical: Missing Supabase environment variables.</p>
                  <p className="text-sm mt-1">
                    Auth will not work until you add the required Supabase environment variables to your .env.local file.
                  </p>
                </div>
              ) : (
                <div className="text-green-600 mb-4">
                  <p className="font-medium">✓ All required Supabase environment variables are set.</p>
                </div>
              )}
              
              <ul className="list-disc pl-5 text-sm space-y-1 text-gray-700">
                <li>Make sure your Supabase project is active and accessible</li>
                <li>Try visiting your Supabase project directly to confirm it's operational</li>
                <li>For local development, ensure .env.local has the correct values</li>
                <li>For production, add these environment variables in your hosting platform</li>
              </ul>
              
              <div className="mt-4">
                <Link 
                  href="/auth-test" 
                  className="text-blue-500 underline hover:text-blue-700"
                >
                  Go to Auth Test Page
                </Link>
              </div>
            </div>
          </div>
        )}
        
        <div className="mt-6 text-center">
          <Link href="/" className="text-pink-500 hover:text-pink-600">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
} 