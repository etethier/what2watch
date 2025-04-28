'use client';

import { useState, useEffect } from 'react';
import { MovieTVShow } from '../types';
import { FaStar, FaPlay, FaBookmark, FaEye, FaArrowLeft, FaTrophy, FaMedal, FaAward, FaInfoCircle } from 'react-icons/fa';
import { SiImdb, SiRottentomatoes } from 'react-icons/si';
import { BsReddit } from 'react-icons/bs';
import supabaseService from '../services/supabase';

interface RecommendationsProps {
  recommendations: MovieTVShow[];
  onRetakeQuiz: () => void;
  sessionId?: string;
}

export default function Recommendations({ recommendations, onRetakeQuiz, sessionId }: RecommendationsProps) {
  const [watchlisted, setWatchlisted] = useState<number[]>([]);
  const [watched, setWatched] = useState<number[]>([]);
  const [visibleCount, setVisibleCount] = useState<number>(10);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Fetch user watchlist and watched content on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      const user = await supabaseService.auth.getCurrentUser();
      setCurrentUser(user);

      if (!user) return;

      setIsLoading(true);
      try {
        // Fetch user's watchlist
        const watchlist = await supabaseService.content.getWatchlist(user.id);
        setWatchlisted(watchlist.map(item => Number(item.id)));

        // Fetch user's watched content
        const watchedContent = await supabaseService.content.getWatchedContent(user.id);
        setWatched(watchedContent.map(item => Number(item.id)));
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const toggleWatchlist = async (id: number) => {
    if (!currentUser) {
      // If user is not logged in, just toggle the state (temporary)
      setWatchlisted(prev => 
        prev.includes(id) 
          ? prev.filter(itemId => itemId !== id)
          : [...prev, id]
      );
      return;
    }

    // If user is logged in, update Supabase
    const contentId = String(id); // Convert to string for Supabase UUID
    
    if (watchlisted.includes(id)) {
      // Remove from watchlist
      const success = await supabaseService.content.removeFromWatchlist(currentUser.id, contentId);
      if (success) {
        setWatchlisted(prev => prev.filter(itemId => itemId !== id));
      }
    } else {
      // Add to watchlist
      const success = await supabaseService.content.addToWatchlist(currentUser.id, contentId);
      if (success) {
        setWatchlisted(prev => [...prev, id]);
      }
    }
  };

  const markAsWatched = async (id: number) => {
    if (!currentUser) {
      // If user is not logged in, just toggle the state (temporary)
      setWatched(prev => 
        prev.includes(id) 
          ? prev.filter(itemId => itemId !== id)
          : [...prev, id]
      );
      return;
    }

    // If user is logged in, update Supabase
    const contentId = String(id); // Convert to string for Supabase UUID
    
    if (watched.includes(id)) {
      // Unmark as watched
      const success = await supabaseService.content.unmarkAsWatched(currentUser.id, contentId);
      if (success) {
        setWatched(prev => prev.filter(itemId => itemId !== id));
      }
    } else {
      // Mark as watched
      const success = await supabaseService.content.markAsWatched(currentUser.id, contentId);
      if (success) {
        setWatched(prev => [...prev, id]);
      }
    }
  };

  const getBuzzColor = (buzz?: 'Low' | 'Medium' | 'High') => {
    switch (buzz) {
      case 'High': return 'text-red-500';
      case 'Medium': return 'text-orange-400';
      case 'Low': return 'text-yellow-300';
      default: return 'text-gray-400';
    }
  };

  const getRankBadge = (index: number) => {
    if (index === 0) return <span className="absolute -top-2 -left-2 bg-yellow-500 text-white p-2 rounded-full flex items-center justify-center w-8 h-8 font-bold shadow-md"><FaTrophy className="text-sm" /></span>;
    if (index === 1) return <span className="absolute -top-2 -left-2 bg-gray-400 text-white p-2 rounded-full flex items-center justify-center w-8 h-8 font-bold shadow-md"><FaMedal className="text-sm" /></span>;
    if (index === 2) return <span className="absolute -top-2 -left-2 bg-amber-700 text-white p-2 rounded-full flex items-center justify-center w-8 h-8 font-bold shadow-md"><FaAward className="text-sm" /></span>;
    return null;
  };

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
        
        {/* Recommendations list */}
        <div className="space-y-6">
          {recommendations.slice(0, visibleCount).map((item, index) => (
            <div
              key={item.id}
              className="bg-white rounded-lg overflow-hidden shadow-md border border-gray-200 hover:shadow-lg transition-all duration-300 relative"
            >
              {index < 3 && getRankBadge(index)}
              
              <div className="flex flex-col md:flex-row">
                {item.posterPath && (
                  <div className="md:w-1/4 h-56 md:h-full relative">
                    <img
                      src={`https://image.tmdb.org/t/p/w500${item.posterPath}`}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="p-5 flex-1">
                  <div className="flex items-center mb-2">
                    <span className="mr-2">
                      {item.type === 'movie' ? '🎬' : '📺'}
                    </span>
                    <h2 className="text-xl font-bold">{item.title}</h2>
                  </div>
                  
                  <p className="text-gray-600 mb-3 line-clamp-2">{item.overview}</p>
                  
                  <div className="flex flex-wrap gap-1 mb-3">
                    {item.genres?.map((genre, idx) => (
                      <span key={idx} className="px-2 py-1 bg-gray-100 rounded-md text-xs text-gray-700">
                        {genre}
                      </span>
                    ))}
                  </div>

                  <p className="mb-2 text-sm">
                    <span className="font-medium text-gray-500">
                      {item.type === 'movie' ? 'Movie' : 'TV Show'}
                    </span>
                    {item.streamingPlatform && (
                      <span> | {item.streamingPlatform}</span>
                    )}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 mb-4 text-sm">
                    {item.imdbRating && (
                      <div className="flex items-center gap-1">
                        <SiImdb className="text-yellow-500" />
                        <span className="font-bold">{item.imdbRating.toFixed(1)}/10</span>
                      </div>
                    )}

                    {item.rottenTomatoesScore && (
                      <div className="flex items-center gap-1">
                        <SiRottentomatoes className="text-red-500" />
                        <span className="font-bold">{item.rottenTomatoesScore}%</span>
                      </div>
                    )}

                    {item.redditBuzz && (
                      <div className="flex items-center gap-1">
                        <BsReddit className={getBuzzColor(item.redditBuzz)} />
                        <span className="font-bold">Reddit Buzz: {item.redditBuzz}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors flex items-center gap-1 text-sm">
                      <FaPlay size={12} /> Watch Trailer
                    </button>
                    <button 
                      className={`px-3 py-1 border rounded-md flex items-center gap-1 text-sm ${
                        watchlisted.includes(item.id) 
                          ? 'bg-blue-50 border-blue-500 text-blue-700' 
                          : 'border-gray-300 hover:border-blue-500 hover:text-blue-700'
                      }`}
                      onClick={() => toggleWatchlist(item.id)}
                    >
                      <FaBookmark size={12} /> {watchlisted.includes(item.id) ? 'Saved' : 'Save to Watchlist'}
                    </button>
                    <button 
                      className={`px-3 py-1 border rounded-md flex items-center gap-1 text-sm ${
                        watched.includes(item.id) 
                          ? 'bg-green-50 border-green-500 text-green-700' 
                          : 'border-gray-300 hover:border-green-500 hover:text-green-700'
                      }`}
                      onClick={() => markAsWatched(item.id)}
                    >
                      <FaEye size={12} /> {watched.includes(item.id) ? 'Watched' : 'Seen It'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Show More button - only if there might be more recommendations */}
        {recommendations.length > visibleCount && (
          <div className="text-center mt-10 mb-8">
            <button
              onClick={showMore}
              className="px-6 py-3 bg-gray-800 text-white rounded-md hover:bg-gray-900 transition-colors font-medium"
            >
              Show Me More
            </button>
          </div>
        )}
        
        {/* Retake quiz button */}
        <div className="text-center mt-8 mb-12">
          <button
            onClick={onRetakeQuiz}
            className="px-6 py-3 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-gray-700"
          >
            Retake Quiz
          </button>
        </div>
      </div>
    </div>
  );
} 