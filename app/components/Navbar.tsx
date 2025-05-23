'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { FaUser, FaSignInAlt, FaUserPlus, FaHome, FaBars, FaTimes, FaChartBar, FaFilm } from 'react-icons/fa';

export default function Navbar() {
  const { user, loading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const [showSignUpButton, setShowSignUpButton] = useState(false);

  // We need to use a combination of factors to determine if we're on the recommendations "page"
  // Since Recommendations are shown conditionally based on app state rather than a URL route
  
  // Check if the Recommendations component might be shown via localStorage
  useEffect(() => {
    // localStorage will only be available in browser context
    if (typeof window !== 'undefined') {
      // Check if user has completed a quiz - this is an approximation
      const hasCompletedQuiz = localStorage.getItem('quiz_completed') === 'true';
      
      // Only show sign-up button for non-authenticated users who have completed a quiz
      setShowSignUpButton(!user && hasCompletedQuiz);
    }
  }, [user, pathname]);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <FaFilm className="h-6 w-6 text-pink-500 mr-2" />
              <span className="text-xl font-bold bg-gradient-to-r from-pink-500 to-orange-400 bg-clip-text text-transparent">
                What2Watch
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            <div className="flex space-x-4">
              {/* Home and Analytics links only appear if user is logged in */}
              {!loading && user && (
                <>
                  <Link 
                    href="/" 
                    className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <FaHome className="inline mr-1" /> Home
                  </Link>
                  
                  <Link 
                    href="/recommendation-analytics" 
                    className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  >
                    <FaChartBar className="inline mr-1" /> Analytics
                  </Link>
                </>
              )}
              
              {!loading && (
                <>
                  {user ? (
                    <Link
                      href="/profile"
                      className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                    >
                      <FaUser className="inline mr-1" /> Profile
                    </Link>
                  ) : (
                    <>
                      <Link
                        href="/login"
                        className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                      >
                        <FaSignInAlt className="inline mr-1" /> Sign In
                      </Link>
                      
                      {/* Sign Up button only appears after completing quiz */}
                      {showSignUpButton && (
                        <Link
                          href="/signup"
                          className="px-3 py-2 rounded-md text-sm font-medium bg-gradient-to-r from-pink-500 to-orange-400 text-white hover:from-pink-600 hover:to-orange-500 px-4 py-2 rounded-full"
                        >
                          <FaUserPlus className="inline mr-1" /> Sign Up
                        </Link>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
          
          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
            <button
              type="button"
              onClick={toggleMobileMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-pink-500"
              aria-expanded={mobileMenuOpen}
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? (
                <FaTimes className="block h-6 w-6" />
              ) : (
                <FaBars className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu, show/hide based on menu state */}
      {mobileMenuOpen && (
        <div className="sm:hidden absolute w-full bg-white shadow-lg z-50">
          <div className="pt-2 pb-3 space-y-1">
            {/* Home and Analytics links only appear if user is logged in */}
            {!loading && user && (
              <>
                <Link
                  href="/"
                  className="block px-4 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  onClick={toggleMobileMenu}
                >
                  <FaHome className="inline mr-2" /> Home
                </Link>
                
                <Link
                  href="/recommendation-analytics"
                  className="block px-4 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  onClick={toggleMobileMenu}
                >
                  <FaChartBar className="inline mr-2" /> Analytics
                </Link>
              </>
            )}

            {!loading && (
              <>
                {user ? (
                  <Link
                    href="/profile"
                    className="block px-4 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                    onClick={toggleMobileMenu}
                  >
                    <FaUser className="inline mr-2" /> Profile
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="block px-4 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                      onClick={toggleMobileMenu}
                    >
                      <FaSignInAlt className="inline mr-2" /> Sign In
                    </Link>
                    
                    {/* Sign Up button only appears after completing quiz */}
                    {showSignUpButton && (
                      <div className="px-4 py-2">
                        <Link
                          href="/signup"
                          className="block w-full text-center font-medium bg-gradient-to-r from-pink-500 to-orange-400 text-white hover:from-pink-600 hover:to-orange-500 px-4 py-2 rounded-full"
                          onClick={toggleMobileMenu}
                        >
                          <FaUserPlus className="inline mr-2" /> Sign Up
                        </Link>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
} 