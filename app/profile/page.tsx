'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { FaArrowLeft, FaUser, FaEdit, FaFilm, FaHeart, FaCheckCircle } from 'react-icons/fa';
import { supabase } from '../services/supabase';
import { MovieTVShow } from '../types';

export default function Profile() {
  const { user, loading, signOut, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'watchlist' | 'watched'>('profile');
  const [displayName, setDisplayName] = useState<string>('');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [watchlist, setWatchlist] = useState<MovieTVShow[]>([]);
  const [watchedContent, setWatchedContent] = useState<MovieTVShow[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    // If we had user metadata, we could populate the display name here
    if (user) {
      setDisplayName(user.email?.split('@')[0] || 'User');
      
      // Get user metadata if it exists
      const getUserMetadata = async () => {
        try {
          const { data, error } = await supabase
            .from('users')
            .select('display_name')
            .eq('id', user.id)
            .single();
            
          if (error) {
            console.error('Error fetching user metadata:', error);
            return;
          }
          
          if (data && data.display_name) {
            setDisplayName(data.display_name);
          }
        } catch (error) {
          console.error('Error fetching user metadata:', error);
        }
      };
      
      getUserMetadata();
    }
  }, [user]);

  useEffect(() => {
    // Load data when tab changes
    if (!user) return;
    
    if (activeTab === 'watchlist') {
      fetchWatchlist();
    } else if (activeTab === 'watched') {
      fetchWatchedContent();
    }
  }, [activeTab, user]);

  const fetchWatchlist = async () => {
    if (!user) return;
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('user_watchlist')
        .select('content(*)')
        .eq('user_id', user.id);
        
      if (error) {
        console.error('Error fetching watchlist:', error);
        return;
      }
      
      // Transform the data to match MovieTVShow type
      const watchlistItems: MovieTVShow[] = data.map((item: any) => ({
        id: item.content.id,
        title: item.content.title,
        overview: item.content.overview,
        posterPath: item.content.poster_path,
        type: item.content.type,
        rating: item.content.imdb_rating,
        genres: [],
        imdbRating: item.content.imdb_rating,
        rottenTomatoesScore: item.content.rotten_tomatoes_score,
        redditBuzz: item.content.reddit_buzz
      }));
      
      setWatchlist(watchlistItems);
    } catch (error) {
      console.error('Error fetching watchlist:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWatchedContent = async () => {
    if (!user) return;
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('user_watched_content')
        .select('content(*)')
        .eq('user_id', user.id);
        
      if (error) {
        console.error('Error fetching watched content:', error);
        return;
      }
      
      // Transform the data to match MovieTVShow type
      const watchedItems: MovieTVShow[] = data.map((item: any) => ({
        id: item.content.id,
        title: item.content.title,
        overview: item.content.overview,
        posterPath: item.content.poster_path,
        type: item.content.type,
        rating: item.content.imdb_rating,
        genres: [],
        imdbRating: item.content.imdb_rating,
        rottenTomatoesScore: item.content.rotten_tomatoes_score,
        redditBuzz: item.content.reddit_buzz
      }));
      
      setWatchedContent(watchedItems);
    } catch (error) {
      console.error('Error fetching watched content:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    // Redirect to home page after sign out
    window.location.href = '/';
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    
    try {
      // Use the updateProfile method from AuthContext
      const { error } = await updateProfile({ display_name: displayName });
      
      if (error) {
        console.error('Error updating profile:', error);
        return;
      }
      
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const removeFromWatchlist = async (contentId: number) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('user_watchlist')
        .delete()
        .eq('user_id', user.id)
        .eq('content_id', contentId);
      
      if (error) {
        console.error('Error removing from watchlist:', error);
        return;
      }
      
      // Update local state
      setWatchlist(watchlist.filter(item => item.id !== contentId));
    } catch (error) {
      console.error('Error removing from watchlist:', error);
    }
  };

  const removeFromWatched = async (contentId: number) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('user_watched_content')
        .delete()
        .eq('user_id', user.id)
        .eq('content_id', contentId);
      
      if (error) {
        console.error('Error removing from watched content:', error);
        return;
      }
      
      // Update local state
      setWatchedContent(watchedContent.filter(item => item.id !== contentId));
    } catch (error) {
      console.error('Error removing from watched content:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white p-4 flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white p-4">
        <div className="max-w-4xl mx-auto">
          <Link href="/" className="inline-flex items-center text-gray-600 hover:text-black mb-6">
            <FaArrowLeft className="mr-2" /> Back to Home
          </Link>
          
          <div className="bg-gray-50 p-8 rounded-lg text-center">
            <FaUser className="text-5xl text-gray-300 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-4">Sign In Required</h1>
            <p className="mb-6 text-gray-600">Please sign in to view your profile</p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/login" className="bg-pink-500 text-white px-6 py-2 rounded-md hover:bg-pink-600 transition-colors">
                Sign In
              </Link>
              <Link href="/signup" className="border border-pink-500 text-pink-500 px-6 py-2 rounded-md hover:bg-pink-50 transition-colors">
                Create Account
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-4">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="inline-flex items-center text-gray-600 hover:text-black mb-6">
          <FaArrowLeft className="mr-2" /> Back to Home
        </Link>
        
        <div className="bg-gray-50 p-8 rounded-lg">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8">
            <div className="flex items-center mb-4 sm:mb-0">
              <div className="w-16 h-16 rounded-full bg-pink-100 flex items-center justify-center text-pink-500 mr-4">
                <FaUser className="text-2xl" />
              </div>
              
              {isEditing ? (
                <div>
                  <input 
                    type="text" 
                    value={displayName} 
                    onChange={(e) => setDisplayName(e.target.value)} 
                    className="text-2xl font-bold border-b border-gray-300 pb-1 focus:outline-none focus:border-pink-500"
                  />
                  <div className="text-gray-500">{user.email}</div>
                </div>
              ) : (
                <div>
                  <h1 className="text-2xl font-bold">{displayName}</h1>
                  <div className="text-gray-500">{user.email}</div>
                </div>
              )}
            </div>
            
            <div>
              {isEditing ? (
                <button 
                  onClick={handleSaveProfile}
                  className="bg-pink-500 text-white px-4 py-2 rounded-md hover:bg-pink-600 transition-colors"
                >
                  Save Profile
                </button>
              ) : (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center text-gray-700 hover:text-pink-500"
                >
                  <FaEdit className="mr-1" /> Edit Profile
                </button>
              )}
            </div>
          </div>
          
          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <div className="flex space-x-6">
              <button 
                onClick={() => setActiveTab('profile')}
                className={`pb-3 ${activeTab === 'profile' ? 'border-b-2 border-pink-500 text-pink-500 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <FaUser className="inline mr-2" /> Profile
              </button>
              <button 
                onClick={() => setActiveTab('watchlist')}
                className={`pb-3 ${activeTab === 'watchlist' ? 'border-b-2 border-pink-500 text-pink-500 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <FaHeart className="inline mr-2" /> Watchlist
              </button>
              <button 
                onClick={() => setActiveTab('watched')}
                className={`pb-3 ${activeTab === 'watched' ? 'border-b-2 border-pink-500 text-pink-500 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <FaCheckCircle className="inline mr-2" /> Watched
              </button>
            </div>
          </div>
          
          {/* Tab Content */}
          {activeTab === 'profile' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Account Information</h2>
              
              <div className="mb-8">
                <h3 className="font-medium mb-2">Preferences</h3>
                <p className="text-gray-600 text-sm mb-4">Your quiz preferences will be used to improve recommendations.</p>
                
                <Link href="/" className="inline-flex items-center text-pink-500 hover:text-pink-600">
                  <FaFilm className="mr-2" /> Take Quiz Again
                </Link>
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                <button 
                  onClick={handleSignOut}
                  className="text-red-500 hover:text-red-600"
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}
          
          {activeTab === 'watchlist' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">My Watchlist</h2>
              
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-pulse text-gray-500">Loading watchlist...</div>
                </div>
              ) : watchlist.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>Your watchlist is empty.</p>
                  <p className="mt-2">Save shows and movies to watch later!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {watchlist.map(item => (
                    <div key={item.id} className="border border-gray-200 rounded-lg overflow-hidden flex">
                      {item.posterPath && (
                        <div className="w-1/3">
                          <img 
                            src={`https://image.tmdb.org/t/p/w200${item.posterPath}`} 
                            alt={item.title} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="w-2/3 p-4">
                        <h3 className="font-medium text-lg">{item.title}</h3>
                        <p className="text-sm text-gray-500 line-clamp-2 mt-1">{item.overview}</p>
                        <div className="mt-4 flex justify-end">
                          <button 
                            onClick={() => removeFromWatchlist(item.id)}
                            className="text-red-500 text-sm hover:text-red-600"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'watched' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Watched Content</h2>
              
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-pulse text-gray-500">Loading watched content...</div>
                </div>
              ) : watchedContent.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>You haven't marked any content as watched yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {watchedContent.map(item => (
                    <div key={item.id} className="border border-gray-200 rounded-lg overflow-hidden flex">
                      {item.posterPath && (
                        <div className="w-1/3">
                          <img 
                            src={`https://image.tmdb.org/t/p/w200${item.posterPath}`} 
                            alt={item.title} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="w-2/3 p-4">
                        <h3 className="font-medium text-lg">{item.title}</h3>
                        <p className="text-sm text-gray-500 line-clamp-2 mt-1">{item.overview}</p>
                        <div className="mt-4 flex justify-end">
                          <button 
                            onClick={() => removeFromWatched(item.id)}
                            className="text-red-500 text-sm hover:text-red-600"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 