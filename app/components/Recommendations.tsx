'use client';

import { useState, useEffect } from 'react';
import { MovieTVShow } from '../types';
import { FaArrowLeft, FaInfoCircle, FaFilter, FaSlidersH, FaSearch, FaTrophy } from 'react-icons/fa';
import supabaseService from '../services/supabase-wrapper';
import ContentCard from './ContentCard';

interface RecommendationsProps {
  recommendations: MovieTVShow[];
  onRetakeQuiz: () => void;
  sessionId?: string;
}

export default function Recommendations({ recommendations, onRetakeQuiz, sessionId }: RecommendationsProps) {
  const [visibleCount, setVisibleCount] = useState<number>(6);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [allRecommendations, setAllRecommendations] = useState<MovieTVShow[]>(recommendations);
  const [canLoadMore, setCanLoadMore] = useState<boolean>(true);

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
    // Increase visible count
    setVisibleCount(prev => prev + 6);
    
    // In a real app, this would make an API call to load more recommendations
    // If we had sessionId, we could use it to fetch more recommendations from Supabase
    if (sessionId) {
      // This would be implemented in a full solution
      try {
        setIsLoading(true);
        // Mock fetching additional recommendations - in a real app, you would call an API
        // const moreRecommendations = await supabaseService.content.getMoreRecommendations(sessionId, visibleCount);
        
        // For demo purposes, duplicate the recommendations with new IDs to simulate new content
        const newRecommendations = recommendations.map((item, index) => ({
          ...item,
          id: allRecommendations.length + index + 1 // Generate new unique IDs
        }));
        
        // Add new recommendations to the existing list
        setAllRecommendations(prev => [...prev, ...newRecommendations]);
        
      } catch (error) {
        console.error('Error fetching more recommendations:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    // Check if we can still load more content
    if (visibleCount + 6 >= filteredRecommendations.length) {
      setCanLoadMore(false);
    } else {
      setCanLoadMore(true);
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

  const filteredRecommendations = allRecommendations.filter(item => {
    // Apply search filter
    if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Apply type filter
    if (activeFilter === 'movies' && item.type !== 'movie') {
      return false;
    }
    if (activeFilter === 'tv' && item.type !== 'tv') {
      return false;
    }
    
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 text-black p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header with back button and info bar */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <button 
            onClick={onRetakeQuiz}
            className="flex items-center text-gray-600 hover:text-pink-500 transition-colors mb-4 md:mb-0"
          >
            <FaArrowLeft className="mr-2" />
            <span>Back to Quiz</span>
          </button>
          
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <span>Source:</span>
            <span className="bg-pink-50 text-pink-600 px-2 py-1 rounded-full font-medium">
              TMDB Popular
            </span>
            <FaInfoCircle className="text-gray-400" title="Results are based on popular picks from TMDB" />
          </div>
        </div>
        
        {/* Main title with gradient */}
        <h1 className="text-3xl md:text-4xl font-bold mb-3 bg-gradient-to-r from-pink-500 via-red-500 to-orange-400 bg-clip-text text-transparent">
          Here's what you should watch next
        </h1>
        <p className="text-gray-600 mb-8">Personalized recommendations based on your preferences</p>
        
        {/* Sign-in tip section - only show if user is not logged in */}
        {!currentUser && (
          <div className="bg-gradient-to-r from-pink-50 to-pink-100 rounded-lg p-6 mb-8 shadow-sm">
            <p className="text-pink-800 font-medium mb-3 text-lg">
              Want better recommendations? Sign in to save your preferences!
            </p>
            <p className="text-pink-700 mb-4 text-sm">
              Create an account to keep track of what you've watched and get more personalized suggestions.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={handleSignIn}
                className="bg-gradient-to-r from-pink-500 to-orange-400 text-white px-6 py-2 rounded-md hover:shadow-md transition-all"
              >
                Sign In
              </button>
              <button 
                onClick={handleCreateAccount}
                className="border border-pink-500 text-pink-500 px-6 py-2 rounded-md hover:bg-pink-50 transition-colors"
              >
                Create Account
              </button>
            </div>
          </div>
        )}
        
        {/* Filters and search */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
          {/* Filter buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-4 py-2 rounded-full ${
                activeFilter === 'all' ? 'bg-pink-600 text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveFilter('movie')}
              className={`px-4 py-2 rounded-full ${
                activeFilter === 'movie' ? 'bg-pink-600 text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              Movies
            </button>
            <button
              onClick={() => setActiveFilter('tv')}
              className={`px-4 py-2 rounded-full ${
                activeFilter === 'tv' ? 'bg-pink-600 text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              TV Shows
            </button>
          </div>

          {/* Search input */}
          <div className="relative w-full sm:w-auto">
            <input
              type="text"
              placeholder="Search titles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-full sm:w-64 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
            <div className="absolute left-3 top-2.5 text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Top recommendations explanation */}
        {filteredRecommendations.length > 0 && (
          <div className="mb-8 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg p-6 shadow-sm border border-pink-100">
            <h3 className="text-xl font-bold text-gray-800 mb-2 flex items-center">
              <FaTrophy className="text-yellow-500 mr-2" /> 
              Top Recommendations
            </h3>
            <p className="text-gray-700">
              Based on your quiz answers, we've curated a personalized list of content just for you! 
              The <span className="font-semibold">top 3 recommendations</span> are highlighted with special badges 
              and represent the best match for your preferences.
            </p>
          </div>
        )}
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your personalized data...</p>
          </div>
        )}
        
        {/* Empty state */}
        {!isLoading && filteredRecommendations.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <p className="text-gray-600 text-lg mb-4">No results match your search</p>
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="text-pink-500 hover:text-pink-600"
              >
                Clear search
              </button>
            )}
          </div>
        )}
        
        {/* Recommendations grid using ContentCard component */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {filteredRecommendations.slice(0, visibleCount).map((item, index) => (
            <ContentCard 
              key={item.id} 
              content={item} 
              rank={index < 3 ? index + 1 : undefined}
              className={index < 3 ? 'border-2 border-gradient-pink-purple shadow-lg transform hover:scale-105 transition-all duration-300' : 'hover:translate-y-[-5px] transition-transform'}
            />
          ))}
        </div>
        
        {/* Show More button - always visible */}
        <div className="text-center mt-8">
          <button
            onClick={showMore}
            className="px-6 py-3 bg-gradient-to-r from-pink-500 to-orange-400 text-white rounded-full hover:shadow-lg transition-all duration-300 flex items-center justify-center mx-auto"
            disabled={isLoading || filteredRecommendations.length <= visibleCount}
          >
            {isLoading ? (
              <>
                <span className="animate-spin h-4 w-4 border-t-2 border-b-2 border-white rounded-full mr-2"></span>
                Loading...
              </>
            ) : filteredRecommendations.length <= visibleCount ? (
              'All recommendations loaded'
            ) : (
              'Show More Recommendations'
            )}
          </button>
        </div>
        
        {/* Test page links */}
        <div className="text-center mt-16 text-sm text-gray-500 space-x-4">
          <a href="/youtube-test" className="text-pink-500 underline hover:text-pink-600">
            Test YouTube Trailers
          </a>
          <a href="/tmdb-test" className="text-pink-500 underline hover:text-pink-600">
            Test TMDB API
          </a>
        </div>
      </div>
    </div>
  );
} 