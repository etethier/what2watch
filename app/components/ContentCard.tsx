'use client';

import { useState, useRef, useEffect } from 'react';
import { FaStar, FaTv, FaFilm, FaTrophy, FaFire, FaComments, FaHeart, FaRegHeart, FaBookmark, FaRegBookmark, FaThumbsUp, FaThumbsDown, FaInfoCircle, FaImdb, FaPlay, FaChevronDown, FaChevronUp, FaEye, FaLightbulb } from 'react-icons/fa';
import { IoFastFoodOutline } from 'react-icons/io5';
import { BsChatSquareQuote, BsExclamationTriangle } from 'react-icons/bs';
import { SiRottentomatoes } from 'react-icons/si';
import { MovieTVShow } from '../types';
import TrailerButton from './TrailerButton';

// Helper function to get streaming platform URLs
const getStreamingPlatformUrl = (platform: string, title?: string): string => {
  // Normalize platform name by removing spaces and converting to lowercase
  const normalizedPlatform = platform.toLowerCase().replace(/\s+/g, '');
  
  // Map of streaming platforms to their base URLs - explicitly using US versions
  const platformUrls: Record<string, string> = {
    'netflix': 'https://www.netflix.com/us/search?q=',
    'prime': 'https://www.amazon.com/s?k=',
    'primevideo': 'https://www.amazon.com/s?k=',
    'hulu': 'https://www.hulu.com/search?q=',
    'disney+': 'https://www.disneyplus.com/search?q=',
    'disneyplus': 'https://www.disneyplus.com/search?q=',
    'hbomax': 'https://www.max.com/search?q=',
    'max': 'https://www.max.com/search?q=',
    'appletv+': 'https://tv.apple.com/us/search?term=',
    'appletv': 'https://tv.apple.com/us/search?term=',
    'peacock': 'https://www.peacocktv.com/search?q=',
    'paramount+': 'https://www.paramountplus.com/us/search/?q=',
    'paramountplus': 'https://www.paramountplus.com/us/search/?q=',
    'starz': 'https://www.starz.com/us/en/search?q=',
    'showtime': 'https://www.sho.com/search?q='
  };
  
  // Get URL for the platform if it exists in our map
  const baseUrl = platformUrls[normalizedPlatform] || `https://www.google.com/search?q=watch+on+${encodeURIComponent(platform)}+in+US+`;
  
  // Append the title to the URL if provided
  return title ? `${baseUrl}${encodeURIComponent(title)}` : baseUrl;
};

interface ContentCardProps {
  content: MovieTVShow & { 
    releaseYear?: number;
    explanation?: string;
    // Allow streamingPlatform to be a string or array of strings
  };
  className?: string;
  rank?: number;
  isUserLoggedIn?: boolean;
  onAuthRequired?: () => void;
  onContentWatched?: (contentId: number) => void;
}

// Function to calculate match percentage based on rank
const getMatchPercentage = (rank?: number): string => {
  if (!rank) return '';
  if (rank === 1) return '98%';
  if (rank === 2) return '95%';
  if (rank === 3) return '92%';
  if (rank <= 5) return '90%';
  if (rank <= 10) return '85%';
  return '80%';
};

// Hook to manage screen size
function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const media = window.matchMedia(query);
      
      const updateMatch = () => {
        setMatches(media.matches);
      };
      
      // Set initial value
      updateMatch();
      
      // Add listener
      if (media.addEventListener) {
        media.addEventListener('change', updateMatch);
        return () => media.removeEventListener('change', updateMatch);
      } else {
        // Fallback for older browsers
        media.addListener(updateMatch);
        return () => media.removeListener(updateMatch);
      }
    }
    return undefined;
  }, [query]);

  return matches;
}

export default function ContentCard({ 
  content, 
  className = '', 
  rank,
  isUserLoggedIn = false,
  onAuthRequired,
  onContentWatched
}: ContentCardProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [hasWatched, setHasWatched] = useState(false);
  const [showMoreInfo, setShowMoreInfo] = useState(false);
  const [showAllPlatforms, setShowAllPlatforms] = useState(false);
  const [showSaveNotification, setShowSaveNotification] = useState(false);
  const [showWatchedNotification, setShowWatchedNotification] = useState(false);
  const [showExplanationTooltip, setShowExplanationTooltip] = useState(false);
  const retried = useRef(false);
  const isMobile = useMediaQuery('(max-width: 640px)');
  
  // Add timeout refs to clear notification timeouts when component unmounts
  const saveNotificationTimeout = useRef<NodeJS.Timeout | null>(null);
  const watchedNotificationTimeout = useRef<NodeJS.Timeout | null>(null);
  
  // Clear timeouts on unmount
  useEffect(() => {
    return () => {
      if (saveNotificationTimeout.current) {
        clearTimeout(saveNotificationTimeout.current);
      }
      if (watchedNotificationTimeout.current) {
        clearTimeout(watchedNotificationTimeout.current);
      }
    };
  }, []);
  
  // Check if the item is in saved watchlist on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Get watchlist from localStorage
      const savedWatchlist = localStorage.getItem('watchlist');
      if (savedWatchlist) {
        const watchlist = JSON.parse(savedWatchlist);
        setIsSaved(watchlist.some((item: any) => item.id === content.id));
      }
      
      // Check if user has watched this content
      const watchedContent = localStorage.getItem('watched_content');
      if (watchedContent) {
        const watched = JSON.parse(watchedContent);
        setHasWatched(watched.some((item: any) => item.id === content.id));
      }
    }
  }, [content.id]);
  
  // Use the releaseYear from TMDB if available, otherwise use current year
  const year = content.releaseYear || new Date().getFullYear();
  
  // Handle image loading error
  const handleImageError = () => {
    console.warn(`Image error for: ${content.title}`);
    setImageError(true);
    
    // Try to load the image again once after a short delay
    if (!retried.current) {
      retried.current = true;
      setTimeout(() => {
        setImageError(false);
        setImageLoaded(false);
      }, 1500);
    }
  };
  
  // Handle image loaded
  const handleImageLoaded = () => {
    setImageLoaded(true);
    retried.current = false; // Reset retry state on successful load
  };
  
  // Toggle watchlist status
  const toggleWatchlist = () => {
    // If user is not logged in and tries to save, show auth prompt
    if (!isUserLoggedIn && !isSaved && onAuthRequired) {
      onAuthRequired();
      return;
    }
    
    if (typeof window !== 'undefined') {
      // Get current watchlist
      const savedWatchlist = localStorage.getItem('watchlist');
      let watchlist = savedWatchlist ? JSON.parse(savedWatchlist) : [];
      
      if (isSaved) {
        // Remove from watchlist
        watchlist = watchlist.filter((item: any) => item.id !== content.id);
      } else {
        // Add to watchlist
        watchlist.push({
          id: content.id,
          title: content.title,
          type: content.type,
          posterPath: content.posterPath,
          savedAt: new Date().toISOString()
        });
        
        // Show notification only when saving (not when removing)
        if (isUserLoggedIn) {
          setShowSaveNotification(true);
          
          // Clear any existing timeout
          if (saveNotificationTimeout.current) {
            clearTimeout(saveNotificationTimeout.current);
          }
          
          // Hide notification after 3 seconds
          saveNotificationTimeout.current = setTimeout(() => {
            setShowSaveNotification(false);
          }, 3000);
        }
      }
      
      // Save to localStorage
      localStorage.setItem('watchlist', JSON.stringify(watchlist));
      
      // Update state
      setIsSaved(!isSaved);
    }
  };
  
  // Toggle watched status
  const toggleWatched = () => {
    // If user is not logged in and tries to mark as watched, show auth prompt
    if (!isUserLoggedIn && !hasWatched && onAuthRequired) {
      onAuthRequired();
      return;
    }
    
    if (typeof window !== 'undefined') {
      // Get current watched content
      const watchedContent = localStorage.getItem('watched_content');
      let watched = watchedContent ? JSON.parse(watchedContent) : [];
      
      // Track if this is from the watchlist for notification
      let isFromWatchlist = false;
      
      if (hasWatched) {
        // Remove from watched
        watched = watched.filter((item: any) => item.id !== content.id);
      } else {
        // Check if this item was in the watchlist
        const savedWatchlist = localStorage.getItem('watchlist');
        let watchlistItemDate = null;
        let timeToWatch = null;
        
        if (savedWatchlist) {
          const watchlist = JSON.parse(savedWatchlist);
          const watchlistItem = watchlist.find((item: any) => item.id === content.id);
          
          if (watchlistItem) {
            isFromWatchlist = true;
            watchlistItemDate = new Date(watchlistItem.savedAt);
            
            // Calculate time between saving and watching
            const watchedDate = new Date();
            timeToWatch = watchedDate.getTime() - watchlistItemDate.getTime();
          }
        }
        
        // Add to watched
        watched.push({
          id: content.id,
          title: content.title,
          type: content.type,
          posterPath: content.posterPath,
          watchedAt: new Date().toISOString(),
          fromWatchlist: isFromWatchlist,
          timeToWatch: isFromWatchlist ? timeToWatch : null
        });
        
        // Notify parent component that content was marked as watched
        if (onContentWatched) {
          onContentWatched(content.id);
        }
        
        // Show notification only when marking as watched (not when removing)
        if (isUserLoggedIn) {
          setShowWatchedNotification(true);
          
          // Clear any existing timeout
          if (watchedNotificationTimeout.current) {
            clearTimeout(watchedNotificationTimeout.current);
          }
          
          // Hide notification after 3 seconds
          watchedNotificationTimeout.current = setTimeout(() => {
            setShowWatchedNotification(false);
          }, 3000);
        }
      }
      
      // Save to localStorage
      localStorage.setItem('watched_content', JSON.stringify(watched));
      
      // Update state
      setHasWatched(!hasWatched);
    }
  };
  
  // Toggle more info view
  const toggleMoreInfo = () => {
    setShowMoreInfo(!showMoreInfo);
  };

  const matchPercentage = getMatchPercentage(rank);
  
  // Convert streamingPlatform to array for consistent handling
  const platforms = Array.isArray(content.streamingPlatform) 
    ? content.streamingPlatform 
    : content.streamingPlatform 
      ? [content.streamingPlatform] 
      : [];
      
  // Determine if we need a "show more" button for platforms
  const hasMultiplePlatforms = platforms.length > 1;
  const displayPlatforms = showAllPlatforms ? platforms : platforms.slice(0, 1);
  
  // Get the last watched timestamp for this content
  const getLastWatchedDate = () => {
    if (typeof window !== 'undefined') {
      const watchedContent = localStorage.getItem('watched_content');
      if (watchedContent) {
        const watched = JSON.parse(watchedContent);
        const watchedItem = watched.find((item: any) => item.id === content.id);
        if (watchedItem && watchedItem.watchedAt) {
          const watchedDate = new Date(watchedItem.watchedAt);
          
          // If watched today
          if (new Date().toDateString() === watchedDate.toDateString()) {
            return 'Watched today';
          }
          
          // If watched yesterday
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          if (yesterday.toDateString() === watchedDate.toDateString()) {
            return 'Watched yesterday';
          }
          
          // If watched this week
          const daysAgo = Math.floor((new Date().getTime() - watchedDate.getTime()) / (1000 * 60 * 60 * 24));
          if (daysAgo < 7) {
            return `Watched ${daysAgo} days ago`;
          }
          
          // If watched longer ago
          return `Watched on ${watchedDate.toLocaleDateString()}`;
        }
      }
    }
    return 'Watched';
  };
  
  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 flex flex-col h-full ${className}`}>
      {/* Success notifications */}
      {showSaveNotification && (
        <div className="absolute top-2 left-1/2 transform -translate-x-1/2 bg-green-500 text-white text-sm py-1.5 px-3 rounded-full shadow-md z-10 animate-fadeIn">
          Successfully saved to your watchlist
        </div>
      )}
      
      {showWatchedNotification && (
        <div className="absolute top-2 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white text-sm py-1.5 px-3 rounded-full shadow-md z-10 animate-fadeIn">
          <span className="font-semibold">{content.title}</span> marked as watched
        </div>
      )}
      
      {/* Poster Image with match percentage overlay */}
      <div className="relative aspect-[2/3] bg-gray-100">
        {/* Skeleton loader */}
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse"></div>
        )}
        
        {/* Actual image */}
        {content.posterPath && !imageError ? (
          <img 
            src={content.posterPath} 
            alt={content.title}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onError={handleImageError}
            onLoad={handleImageLoaded}
            loading="lazy"
            data-content-id={content.id}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-pink-50 to-orange-50">
            <div className="text-center p-4">
              <div className="text-5xl mb-4">
                {content.type === 'movie' ? 
                  <FaFilm className="mx-auto text-pink-300" /> : 
                  <FaTv className="mx-auto text-pink-300" />
                }
              </div>
              <h3 className="text-gray-800 font-bold text-lg line-clamp-2 px-2">{content.title}</h3>
              {content.releaseYear && (
                <span className="block text-gray-600 mt-1">{content.releaseYear}</span>
              )}
            </div>
          </div>
        )}
        
        {/* Dark gradient overlay at the bottom for better visibility of title */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/70 to-transparent"></div>

        {/* Recommendation explanation badge */}
        {content.explanation && (
          <div className="absolute top-2 left-2">
            <div 
              className="group relative"
              onMouseEnter={() => setShowExplanationTooltip(true)}
              onMouseLeave={() => setShowExplanationTooltip(false)}
            >
              <div className={`bg-gradient-to-r from-pink-500 to-orange-400 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center`}>
                <FaLightbulb className="mr-1" size={10} />
                <span>{content.explanation.split(' ').slice(0, 2).join(' ')}</span>
              </div>
              {/* Tooltip */}
              {showExplanationTooltip && (
                <div className="absolute z-50 top-full left-0 mt-1 w-48 bg-gray-900 text-white text-xs rounded py-1.5 px-2 animate-tooltipFadeIn">
                  {content.explanation}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Watched indicator badge */}
        {hasWatched && (
          <div className="group relative">
            <div className="absolute top-2 right-2 bg-blue-500/90 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center animate-pulse-slow">
              <FaEye className="mr-1" size={10} />
              <span>Watched</span>
            </div>
            <div className="absolute top-10 right-0 hidden group-hover:block bg-black text-white text-xs rounded p-2 z-10 whitespace-nowrap">
              {getLastWatchedDate()}
            </div>
          </div>
        )}
      </div>
      
      {/* ===== TOP SECTION: Title and Match % ===== */}
      <div className="p-3 pb-1 border-b border-gray-100">
        {/* Title with ellipsis for long titles */}
        <h3 className="font-bold text-lg line-clamp-1" title={content.title}>
          {content.title}
        </h3>
        
        {/* Match percentage if available */}
        {matchPercentage && (
          <div className="flex items-center mt-1.5">
            <div className={`h-2 w-2 rounded-full mr-2 ${
              rank && rank <= 3 ? 'bg-green-500' : 'bg-green-400'
            }`}></div>
            <span className="font-medium text-green-700 text-sm">
              {matchPercentage} Match
            </span>
          </div>
        )}
      </div>
      
      {/* ===== MIDDLE SECTION: Genre tags, Content type, Streaming, Buzz ===== */}
      <div className="p-3 pb-2 border-b border-gray-100 flex-grow">
        {/* Top row with content type and ratings */}
        <div className="flex items-center justify-between text-xs text-gray-500 mb-2.5">
          <div className="flex items-center gap-2">
            {/* Content Type Tag */}
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full ${
              content.type === 'movie' 
                ? 'bg-blue-50 text-blue-700' 
                : 'bg-purple-50 text-purple-700'
            }`}>
              {content.type === 'movie' ? (
                <FaFilm className="mr-1" size={10} />
              ) : (
                <FaTv className="mr-1" size={10} />
              )}
              {content.type === 'movie' ? 'Movie' : 'TV'}
            </span>
            
            {/* Optional: Release Year */}
            {content.releaseYear && (
              <span className="text-gray-500">{content.releaseYear}</span>
            )}
          </div>
          
          {/* Ratings Group - only show if available */}
          {(content.imdbRating || content.rottenTomatoesScore) && (
            <div className="flex items-center gap-1.5">
              {/* IMDb Rating */}
              {content.imdbRating && content.imdbRating > 0 && (
                <div className="flex items-center">
                  <FaImdb className="text-yellow-600 mr-0.5" size={12} />
                  <span>{content.imdbRating.toFixed(1)}</span>
                </div>
              )}
              
              {/* Rotten Tomatoes Score */}
              {content.rottenTomatoesScore && content.rottenTomatoesScore > 0 && (
                <div className="flex items-center">
                  <SiRottentomatoes className={`mr-0.5 ${
                    content.rottenTomatoesScore >= 75 ? 'text-green-600' : 
                    content.rottenTomatoesScore >= 60 ? 'text-yellow-500' : 
                    'text-red-600'
                  }`} size={12} />
                  <span>{content.rottenTomatoesScore}%</span>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Genre tags */}
        {content.genres && content.genres.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2.5">
            {content.genres.slice(0, 3).map((genre, index) => (
              <span key={index} className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                {genre}
              </span>
            ))}
            {content.genres.length > 3 && (
              <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                +{content.genres.length - 3}
              </span>
            )}
          </div>
        )}
        
        {/* Streaming Platform availability */}
        {platforms.length > 0 && (
          <div className="mb-1">
            <div className="flex flex-col space-y-1">
              {displayPlatforms.map((platform, index) => (
                <a 
                  key={index}
                  href={getStreamingPlatformUrl(platform, content.title)}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs px-2.5 py-1 rounded-md inline-flex items-center transition-all border border-gray-200 hover:border-pink-200 bg-gray-50 hover:bg-pink-50 text-gray-700"
                >
                  <FaPlay className="w-2.5 h-2.5 mr-1.5 text-pink-500" />
                  <span className="font-medium">
                    Watch on <span className="text-pink-500">{platform}</span>
                  </span>
                </a>
              ))}
              
              {/* Show more/less platforms toggle */}
              {hasMultiplePlatforms && (
                <button 
                  onClick={() => setShowAllPlatforms(!showAllPlatforms)}
                  className="text-xs text-pink-500 hover:text-pink-600 flex items-center justify-center"
                >
                  {showAllPlatforms ? (
                    <>
                      <FaChevronUp className="mr-1" size={10} />
                      Show less
                    </>
                  ) : (
                    <>
                      <FaChevronDown className="mr-1" size={10} />
                      +{platforms.length - 1} more {platforms.length - 1 === 1 ? 'platform' : 'platforms'}
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* ===== BOTTOM SECTION: Interactive buttons ===== */}
      <div className="p-3 pt-2 grid grid-cols-4 gap-1.5">
        {/* Save button */}
        <button 
          onClick={toggleWatchlist}
          className={`flex flex-col items-center justify-center py-2 px-1 rounded text-xs transition-colors ${
            isSaved 
              ? 'bg-pink-100 text-pink-600 hover:bg-pink-200' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          title={isSaved ? "Remove from watchlist" : "Save to watchlist"}
        >
          {isSaved ? <FaBookmark size={16} className="mb-1" /> : <FaRegBookmark size={16} className="mb-1" />}
          <span>Save</span>
        </button>
        
        {/* Trailer button */}
        <TrailerButton 
          title={content.title}
          year={year}
          type={content.type}
          variant="minimal"
          className="flex flex-col items-center justify-center py-2 px-1 rounded text-xs"
        />
        
        {/* Seen it button */}
        <button
          onClick={toggleWatched}
          className={`flex flex-col items-center justify-center py-2 px-1 rounded text-xs transition-colors ${
            hasWatched
              ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          title={hasWatched ? "Mark as unwatched" : "Mark as watched"}
        >
          <FaEye size={16} className="mb-1" />
          <span>Seen It</span>
        </button>
        
        {/* More info button */}
        <button
          onClick={toggleMoreInfo}
          className="flex flex-col items-center justify-center py-2 px-1 rounded text-xs bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
          title="Show more information"
        >
          <FaInfoCircle size={16} className="mb-1" />
          <span>More</span>
        </button>
      </div>
      
      {/* Expandable details panel */}
      {showMoreInfo && (
        <div className="p-3 pt-2 border-t border-gray-100 animate-[fadeIn_0.3s_ease-in-out]">
          {/* Overview */}
          <p className="text-gray-600 text-sm mb-3" title={content.overview}>
            {content.overview}
          </p>
          
          {/* Additional metadata could go here */}
          <div className="flex items-center justify-between">
            <button
              onClick={toggleMoreInfo}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 