'use client';

import { useState, useEffect } from 'react';
import { MovieTVShow } from '../types';
import { FaArrowLeft, FaInfoCircle } from 'react-icons/fa';
import supabaseService from '../services/supabase-wrapper';
import ContentCard from './ContentCard';

interface RecommendationsProps {
  recommendations: MovieTVShow[];
  onRetakeQuiz: () => void;
  sessionId?: string;
}

export default function Recommendations({ recommendations, onRetakeQuiz, sessionId }: RecommendationsProps) {
  const [visibleCount, setVisibleCount] = useState<number>(10);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Fetch user on component mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        setIsLoading(true);
        const user = await supabaseService.auth.getCurrentUser();
        setCurrentUser(user);
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, []);

  const showMore = async () => {
    setVisibleCount(prev => prev + 10);
    
    // In a real app, this would make an API call to load more recommendations
    // If we had sessionId, we could use it to fetch more recommendations from Supabase
    if (sessionId) {
      // This would be implemented in a full solution
      // const moreRecommendations = await supabaseService.content.getMoreRecommendations(sessionId, visibleCount);
      // Add more recommendations to the list
    }
  };

  const handleSignIn = () => {
    // Redirect to the login page
    window.location.href = '/login';
  };

  const handleCreateAccount = () => {
    // Redirect to the signup page
    window.location.href = '/signup';
  };

  return (
    <div className="min-h-screen bg-white text-black p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header with back button */}
        <div className="flex items-center mb-4">
          <button 
            onClick={onRetakeQuiz}
            className="flex items-center text-gray-600 hover:text-black transition-colors"
          >
            <FaArrowLeft className="mr-2" />
            <span>Back to Quiz</span>
          </button>
        </div>
        
        {/* Main title */}
        <h1 className="text-3xl md:text-4xl font-bold mb-3 flex items-center">
          Here's what you should watch next <span className="ml-2">🎬</span>
        </h1>
        <p className="text-gray-600 mb-2">Here are some popular recommendations:</p>
        <p className="text-gray-600 mb-8 flex items-center text-sm">
          Recommendation source: Popular picks <FaInfoCircle className="ml-2 text-gray-400" />
        </p>
        
        {/* Sign-in tip section - only show if user is not logged in */}
        {!currentUser && (
          <div className="bg-pink-50 rounded-lg p-4 mb-8">
            <p className="text-pink-800 font-medium mb-3">
              Tip: Sign in to get personalized recommendations based on your preferences!
            </p>
            <div className="flex gap-2">
              <button 
                onClick={handleSignIn}
                className="bg-pink-500 text-white px-4 py-2 rounded-md hover:bg-pink-600 transition-colors"
              >
                Sign In
              </button>
              <button 
                onClick={handleCreateAccount}
                className="border border-pink-500 text-pink-500 px-4 py-2 rounded-md hover:bg-pink-50 transition-colors"
              >
                Create Account
              </button>
            </div>
          </div>
        )}
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="text-center py-4">
            <p>Loading your personalized data...</p>
          </div>
        )}
        
        {/* Recommendations grid using ContentCard component */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {recommendations.slice(0, visibleCount).map((item, index) => (
            <ContentCard 
              key={item.id} 
              content={item} 
              className={index < 3 ? 'border-2 border-yellow-400' : ''}
            />
          ))}
        </div>
        
        {/* Show more button */}
        {visibleCount < recommendations.length && (
          <div className="text-center mt-8">
            <button
              onClick={showMore}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-6 rounded-full transition-colors"
            >
              Show More
            </button>
          </div>
        )}
        
        {/* Test page link */}
        <div className="text-center mt-12 text-sm">
          <a href="/youtube-test" className="text-blue-500 underline">
            Test YouTube Trailers
          </a>
        </div>
      </div>
    </div>
  );
} 