'use client';

import { useState, useEffect } from 'react';
import { MovieTVShow } from '../types';
import { FaArrowLeft, FaInfoCircle, FaFilter, FaSlidersH, FaSearch, FaTrophy, FaUserPlus, FaSignInAlt, FaTimes } from 'react-icons/fa';
import supabaseService from '../services/supabase-wrapper';
import ContentCard from './ContentCard';

interface RecommendationsProps {
  recommendations: MovieTVShow[];
  onRetakeQuiz: () => void;
  sessionId?: string;
}

// Authentication Modal Component
const AuthModal = ({ isOpen, onClose, onSignIn, onSignUp }: {
  isOpen: boolean;
  onClose: () => void;
  onSignIn: () => void;
  onSignUp: () => void;
}) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative">
        <button 
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
          aria-label="Close"
        >
          <FaTimes size={20} />
        </button>
        
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-gray-800 mb-2">
            Save Your Favorites
          </h3>
          <p className="text-gray-600">
            Create an account to save movies and shows to your watchlist and get personalized recommendations.
          </p>
        </div>
        
        <div className="space-y-4">
          <button
            onClick={onSignUp}
            className="w-full bg-gradient-to-r from-pink-500 to-orange-400 text-white py-3 px-4 rounded-lg flex items-center justify-center font-medium hover:shadow-md transition-all"
          >
            <FaUserPlus className="mr-2" />
            Create an Account
          </button>
          
          <button
            onClick={onSignIn}
            className="w-full border border-pink-500 text-pink-500 py-3 px-4 rounded-lg flex items-center justify-center font-medium hover:bg-pink-50 transition-colors"
          >
            <FaSignInAlt className="mr-2" />
            Sign In
          </button>
          
          <button
            onClick={onClose}
            className="w-full text-gray-500 py-2 hover:text-gray-700 transition-colors"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
};

export default function Recommendations({ recommendations, onRetakeQuiz, sessionId }: RecommendationsProps) {
  const [visibleCount, setVisibleCount] = useState<number>(6);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [allRecommendations, setAllRecommendations] = useState<MovieTVShow[]>(recommendations);
  const [canLoadMore, setCanLoadMore] = useState<boolean>(true);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);

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

  const handleAuthRequired = () => {
    setShowAuthModal(true);
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

  // Split recommendations into top 3 and others
  const topRecommendations = filteredRecommendations.slice(0, 3);
  const otherRecommendations = filteredRecommendations.slice(3, visibleCount);

  // Get rank display for top recommendations
  const getRankDisplay = (rank: number) => {
    const colors = ['text-yellow-500', 'text-gray-400', 'text-amber-600'];
    const emojis = ['🥇', '🥈', '🥉'];
    
    return (
      <div className="flex items-center mb-2">
        <span className={`text-2xl font-bold ${colors[rank-1]} mr-2`}>{rank}</span>
        <span className="text-xl">{emojis[rank-1]}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 text-black p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header with back button only (removed info bar) */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <button 
            onClick={onRetakeQuiz}
            className="flex items-center text-gray-600 hover:text-pink-500 transition-colors mb-4 md:mb-0"
          >
            <FaArrowLeft className="mr-2" />
            <span>Back to Quiz</span>
          </button>
        </div>
        
        {/* Main title with gradient */}
        <h1 className="text-3xl md:text-4xl font-bold mb-3 bg-gradient-to-r from-pink-500 via-red-500 to-orange-400 bg-clip-text text-transparent">
          Here's what you should watch next
        </h1>
        <p className="text-gray-600 mb-8">Personalized recommendations based on your preferences</p>
        
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
        
        {/* TOP RECOMMENDATIONS SECTION */}
        {topRecommendations.length > 0 && (
          <div className="mb-12">
            {/* Header for top picks section */}
            <div className="mb-8 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg p-6 shadow-sm border border-pink-100">
              <h3 className="text-xl font-bold text-gray-800 mb-2 flex items-center">
                <FaTrophy className="text-yellow-500 mr-2" /> 
                Your Top 3 Picks
              </h3>
              <p className="text-gray-700 mb-2">
                Our algorithm analyzed your quiz answers to find these perfect matches. 
                They're specifically selected based on your genre preferences, rating thresholds, 
                and current popularity trends.
              </p>
              <p className="text-xs text-gray-500 italic">
                Pro tip: Click the "Watch Trailer" button to preview any recommendation before deciding what to watch.
              </p>
            </div>
            
            {/* Top 3 recommendations with large cards and prominent ranking */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {topRecommendations.map((item, index) => (
                <div key={item.id} className="flex flex-col top-recommendation">
                  {/* Rank display */}
                  <div className="rank-badge">
                    {getRankDisplay(index + 1)}
                  </div>
                  
                  {/* Card with special styling */}
                  <div className="flex-1 transform transition-all">
                    <ContentCard 
                      content={item} 
                      rank={index + 1}
                      className="border-2 border-gradient-pink-purple shadow-lg h-full"
                      isUserLoggedIn={!!currentUser}
                      onAuthRequired={handleAuthRequired}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* DIVIDER BETWEEN SECTIONS */}
        {topRecommendations.length > 0 && otherRecommendations.length > 0 && (
          <div className="relative my-12">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-gradient-to-r from-white via-gray-50 to-white px-4 text-lg font-medium text-gray-500">
                More Recommendations
              </span>
            </div>
          </div>
        )}
        
        {/* OTHER RECOMMENDATIONS SECTION */}
        {otherRecommendations.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {otherRecommendations.map((item) => (
              <ContentCard 
                key={item.id} 
                content={item}
                className="hover:translate-y-[-5px] transition-transform"
                isUserLoggedIn={!!currentUser}
                onAuthRequired={handleAuthRequired}
              />
            ))}
          </div>
        )}
        
        {/* Show More button - always visible */}
        {filteredRecommendations.length > 3 && (
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
        )}
        
        {/* Test page links */}
        <div className="text-center mt-16 text-sm text-gray-500 space-x-4">
          <a href="/youtube-test" className="text-pink-500 underline hover:text-pink-600">
            Test YouTube Trailers
          </a>
          <a href="/tmdb-test" className="text-pink-500 underline hover:text-pink-600">
            Test TMDB API
          </a>
        </div>
        
        {/* Authentication Modal */}
        <AuthModal 
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSignIn={handleSignIn}
          onSignUp={handleCreateAccount}
        />
      </div>
    </div>
  );
} 