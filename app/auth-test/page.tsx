'use client';

import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Link from 'next/link';

export default function AuthTest() {
  const { user, loading, signIn, signUp, signOut } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      const { error } = await signIn(email, password);
      if (error) {
        setError(error.message);
      } else {
        setSuccessMessage('Successfully signed in!');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      const { error } = await signUp(email, password);
      if (error) {
        setError(error.message);
      } else {
        setSuccessMessage('Successfully signed up! Please check your email for confirmation.');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    setError(null);
    setSuccessMessage(null);

    try {
      const { error } = await signOut();
      if (error) {
        setError(error.message);
      } else {
        setSuccessMessage('Successfully signed out!');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-bold mb-2">Auth Test Page</h1>
        <Link href="/" className="text-blue-500 hover:text-blue-700 mb-6 block">
          Back to Home
        </Link>

        <div className="bg-gray-50 p-6 rounded-lg shadow-sm mb-8">
          <h2 className="text-xl font-bold mb-4">Current Auth State</h2>
          
          {loading ? (
            <div className="text-gray-500">Loading authentication state...</div>
          ) : user ? (
            <div>
              <div className="p-4 bg-green-50 rounded-md text-green-700 mb-4">
                <p>✅ <strong>Signed in as:</strong></p>
                <div className="mt-2 bg-white p-3 rounded font-mono text-sm overflow-auto">
                  <p><strong>User ID:</strong> {user.id}</p>
                  <p><strong>Email:</strong> {user.email}</p>
                  <p><strong>Created at:</strong> {new Date(user.created_at).toLocaleString()}</p>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="text-gray-700">
              <p className="mb-4">Not signed in</p>
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="Enter your email"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="Enter your password"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Min 6 characters for signup
                  </p>
                </div>

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={handleSignIn}
                    disabled={isSubmitting}
                    className={`bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors ${
                      isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={handleSignUp}
                    disabled={isSubmitting}
                    className={`bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors ${
                      isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                  >
                    Sign Up
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-700 rounded-md mb-4">
            <strong>Error:</strong> {error}
          </div>
        )}

        {successMessage && (
          <div className="p-4 bg-green-50 text-green-700 rounded-md mb-4">
            <strong>Success:</strong> {successMessage}
          </div>
        )}

        <div className="mt-8 text-gray-500 text-sm">
          <p>This is a test page to verify authentication functionality.</p>
          <p className="mt-1">
            For the actual application, use the{' '}
            <Link href="/login" className="text-blue-500 hover:text-blue-700">
              Login
            </Link>{' '}
            and{' '}
            <Link href="/signup" className="text-blue-500 hover:text-blue-700">
              Signup
            </Link>{' '}
            pages.
          </p>
        </div>
      </div>
    </div>
  );
} 