'use client';

import { useState, useRef, useEffect } from 'react';
import { FaStar, FaTv, FaFilm, FaTrophy, FaReddit, FaFire, FaComments, FaHeart, FaRegHeart, FaBookmark, FaRegBookmark, FaThumbsUp, FaThumbsDown, FaInfoCircle } from 'react-icons/fa';
import { IoFastFoodOutline } from 'react-icons/io5';
import { BsChatSquareQuote, BsExclamationTriangle } from 'react-icons/bs';
import { MovieTVShow, EnhancedBuzzType } from '../types';
import TrailerButton from './TrailerButton';

interface ContentCardProps {
  content: MovieTVShow & { releaseYear?: number };
  className?: string;
  rank?: number;
}

// Function to get rank colors based on rank
const getRankColors = (rank?: number) => {
  if (!rank || rank > 3) return null;
  
  if (rank === 1) {
    return {
      bg: 'bg-amber-100',
      text: 'text-amber-800',
      border: 'border-amber-500',
      label: '#1 Top Match',
      icon: <FaTrophy className="text-amber-500 mr-1" />
    };
  } else if (rank === 2) {
    return {
      bg: 'bg-gray-100',
      text: 'text-gray-800',
      border: 'border-gray-400',
      label: '#2 Recommended',
      icon: <FaTrophy className="text-gray-400 mr-1" />
    };
  } else if (rank === 3) {
    return {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-300',
      label: '#3 Great Match',
      icon: <FaTrophy className="text-amber-300 mr-1" />
    };
  }
  
  return null;
};

// Enhanced Reddit buzz styling with sentiment analysis
const getRedditBuzzStyle = (buzzType?: EnhancedBuzzType | 'High' | 'Medium' | 'Low') => {
  switch (buzzType) {
    case 'Trending Positive':
      return {
        bg: 'bg-green-100',
        text: 'text-green-700',
        border: 'border-green-200',
        icon: <FaReddit className="text-green-500 mr-1" />,
        label: 'Trending Positive'
      };
    case 'Trending Negative':
      return {
        bg: 'bg-red-100',
        text: 'text-red-700',
        border: 'border-red-200',
        icon: <FaReddit className="text-red-500 mr-1" />,
        label: 'Trending Negative'
      };
    case 'Trending Mixed':
      return {
        bg: 'bg-orange-100',
        text: 'text-orange-700',
        border: 'border-orange-200',
        icon: <FaReddit className="text-orange-500 mr-1" />,
        label: 'Trending Mixed'
      };
    case 'Popular Discussion':
      return {
        bg: 'bg-blue-100',
        text: 'text-blue-700',
        border: 'border-blue-200',
        icon: <FaComments className="text-blue-500 mr-1" />,
        label: 'Popular Discussion'
      };
    case 'Controversial':
      return {
        bg: 'bg-purple-100', 
        text: 'text-purple-700',
        border: 'border-purple-200',
        icon: <BsExclamationTriangle className="text-purple-500 mr-1" />,
        label: 'Controversial'
      };
    case 'Niche Interest':
      return {
        bg: 'bg-yellow-100',
        text: 'text-yellow-700',
        border: 'border-yellow-200',
        icon: <BsChatSquareQuote className="text-yellow-500 mr-1" />,
        label: 'Niche Interest'
      };
    case 'High':
      return {
        bg: 'bg-orange-100',
        text: 'text-orange-700',
        border: 'border-orange-200',
        icon: <FaReddit className="text-orange-500 mr-1" />,
        label: 'Trending'
      };
    case 'Medium':
      return {
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        border: 'border-amber-200',
        icon: <FaReddit className="text-amber-500 mr-1" />,
        label: 'Trending'
      };
    case 'Low':
      return {
        bg: 'bg-gray-100',
        text: 'text-gray-700',
        border: 'border-gray-200',
        icon: <FaReddit className="text-gray-400 mr-1" />,
        label: 'Discussed'
      };
    default:
      return null;
  }
};

export default function ContentCard({ content, className = '', rank }: ContentCardProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState<'liked' | 'disliked' | null>(null);
  const [showFeedbackThanks, setShowFeedbackThanks] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const retried = useRef(false);
  
  // Check if the item is in saved watchlist on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Get watchlist from localStorage
      const savedWatchlist = localStorage.getItem('watchlist');
      if (savedWatchlist) {
        const watchlist = JSON.parse(savedWatchlist);
        setIsSaved(watchlist.some((item: any) => item.id === content.id));
      }
      
      // Check for existing feedback
      const feedbackData = localStorage.getItem('recommendation_feedback');
      if (feedbackData) {
        const feedback = JSON.parse(feedbackData);
        const existingFeedback = feedback.find((item: any) => item.contentId === content.id);
        if (existingFeedback) {
          setFeedbackGiven(existingFeedback.type);
        }
      }
    }
  }, [content.id]);
  
  // Hide the feedback thanks message after 3 seconds
  useEffect(() => {
    if (showFeedbackThanks) {
      const timer = setTimeout(() => {
        setShowFeedbackThanks(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [showFeedbackThanks]);
  
  // Use the releaseYear from TMDB if available, otherwise use current year
  const year = content.releaseYear || new Date().getFullYear();
  
  // Handle image loading error
  const handleImageError = () => {
    console.warn(`Image error for: ${content.title}`);
    setImageError(true);
    
    // Set a data attribute to help with debugging
    if (process.env.NODE_ENV === 'development') {
      console.log('Image load failed for:', content.title, content.posterPath);
    }
    
    // Try to load the image again once after a short delay
    // This helps with transient network issues
    if (!retried.current) {
      retried.current = true;
      setTimeout(() => {
        // Reset the error state and try loading again
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
      }
      
      // Save to localStorage
      localStorage.setItem('watchlist', JSON.stringify(watchlist));
      
      // Update state
      setIsSaved(!isSaved);
      
      // Show a toast message
      const message = isSaved 
        ? `${content.title} removed from watchlist` 
        : `${content.title} added to watchlist`;
      
      // You could implement a toast notification system here
      console.log(message);
    }
  };
  
  // Record recommendation feedback
  const recordFeedback = (type: 'liked' | 'disliked') => {
    if (typeof window !== 'undefined') {
      // Get current feedback data
      const feedbackData = localStorage.getItem('recommendation_feedback');
      let feedback = feedbackData ? JSON.parse(feedbackData) : [];
      
      // Remove any existing feedback for this content
      feedback = feedback.filter((item: any) => item.contentId !== content.id);
      
      // Add new feedback
      feedback.push({
        contentId: content.id,
        title: content.title,
        type,
        rank: rank || 0,
        timestamp: new Date().toISOString(),
        genres: content.genres
      });
      
      // Save to localStorage
      localStorage.setItem('recommendation_feedback', JSON.stringify(feedback));
      
      // Update state
      setFeedbackGiven(type);
      setShowFeedbackThanks(true);
      
      // In a real app, you would send this to your analytics/backend
      // sendRecommendationFeedback(content.id, type, rank);
      console.log(`Recommendation feedback recorded for ${content.title}: ${type}`);
    }
  };
  
  // Toggle details view
  const toggleDetails = () => {
    setShowDetails(!showDetails);
  };

  // We still calculate rankColors for use in other places, but we won't show the badge on the image
  const rankColors = getRankColors(rank);
  const redditBuzzStyle = getRedditBuzzStyle(content.redditBuzz);
  
  return (
    <div className={`relative bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 ${className}`}>
      {/* Poster Image Container with fixed aspect ratio */}
      <div className="relative aspect-[2/3] bg-gray-100">
        {/* Skeleton loader */}
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse"></div>
        )}
        
        {/* Content icon overlay - always visible for easier identification */}
        <div className="absolute top-2 right-2 z-10 bg-gray-800 bg-opacity-70 text-white text-xs p-1 rounded-full">
          {content.type === 'movie' ? (
            <FaFilm size={12} />
          ) : (
            <FaTv size={12} />
          )}
        </div>
        
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
        
        {/* Type Badge - Movie or TV */}
        <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white text-xs py-1 px-2 rounded-full flex items-center shadow-sm">
          {content.type === 'movie' ? (
            <>
              <FaFilm className="mr-1" />
              Movie
            </>
          ) : (
            <>
              <FaTv className="mr-1" />
              TV
            </>
          )}
        </div>
        
        {/* Year Badge (if available) */}
        {content.releaseYear && (
          <div className="absolute bottom-2 left-2 bg-gray-800 text-white text-xs py-1 px-2 rounded-full shadow-sm">
            {content.releaseYear}
          </div>
        )}
        
        {/* Trailer Button - Positioned at bottom of poster */}
        <div className="absolute bottom-2 right-2">
          <TrailerButton 
            title={content.title}
            year={year}
            type={content.type}
            variant="icon"
          />
        </div>
        
        {/* Dark gradient overlay at the bottom for better visibility of badges */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/70 to-transparent"></div>
      </div>
      
      {/* Content Details - Slimmed down version */}
      <div className="p-4">
        {/* Title with ellipsis for long titles */}
        <h3 className="font-bold text-lg line-clamp-1" title={content.title}>
          {content.title}
        </h3>
        
        {/* Metadata row - simplified */}
        <div className="flex items-center justify-between text-sm text-gray-500 mt-1 mb-2">
          <div className="flex items-center space-x-2">
            {content.releaseYear && <span>{content.releaseYear}</span>}
            {content.imdbRating && content.imdbRating > 0 && (
              <div className="flex items-center">
                <FaStar className="text-yellow-500 mr-1" />
                <span>{content.imdbRating.toFixed(1)}</span>
              </div>
            )}
          </div>
          
          {/* Reddit Buzz - simplified */}
          {redditBuzzStyle && (
            <span className={`inline-flex items-center text-xs rounded-full px-2 py-0.5 ${redditBuzzStyle.bg} ${redditBuzzStyle.text}`}>
              {redditBuzzStyle.icon}
              <span className="hidden sm:inline">{redditBuzzStyle.label}</span>
            </span>
          )}
        </div>
        
        {/* Top 3 tags or genres */}
        <div className="flex flex-wrap gap-1 mt-2">
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
        
        {/* Compact match info for top 3 */}
        {rank && rank <= 3 && (
          <div className="mt-3 text-sm">
            <div className="flex items-center">
              <div className={`h-2 w-2 rounded-full mr-2 ${rank === 1 ? 'bg-green-500' : rank === 2 ? 'bg-green-400' : 'bg-green-300'}`}></div>
              <span className="font-medium text-green-700">
                {rank === 1 ? '98%' : rank === 2 ? '95%' : '92%'} Match
              </span>
            </div>
          </div>
        )}
        
        {/* Action buttons - simplified */}
        <div className="mt-3 grid grid-cols-3 gap-2">
          <button 
            onClick={toggleWatchlist}
            className={`flex items-center justify-center py-2 rounded-md text-sm transition-colors ${
              isSaved 
                ? 'bg-pink-100 text-pink-600 hover:bg-pink-200' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {isSaved ? <FaBookmark /> : <FaRegBookmark />}
            <span className="sr-only md:not-sr-only md:ml-1">
              {isSaved ? 'Saved' : 'Save'}
            </span>
          </button>
          
          <TrailerButton 
            title={content.title}
            year={year}
            type={content.type}
            variant="minimal"
            className="text-sm py-2"
          />
          
          <button
            onClick={toggleDetails}
            className="flex items-center justify-center py-2 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm transition-colors"
          >
            <FaInfoCircle />
            <span className="sr-only md:not-sr-only md:ml-1">
              {showDetails ? 'Less' : 'More'}
            </span>
          </button>
        </div>
        
        {/* Expandable details */}
        {showDetails && (
          <div className="mt-3 pt-3 border-t border-gray-100 animate-[fadeIn_0.3s_ease-in-out]">
            {/* Overview */}
            <p className="text-gray-600 text-sm mb-3" title={content.overview}>
              {content.overview}
            </p>
            
            {/* Streaming info */}
            {content.streamingPlatform && (
              <div className="mb-3">
                <h4 className="text-xs font-medium text-gray-500 mb-1">AVAILABLE ON</h4>
                <a 
                  href={`https://www.google.com/search?q=watch+${encodeURIComponent(content.title)}+on+${encodeURIComponent(content.streamingPlatform)}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full inline-flex items-center hover:bg-blue-200 transition-colors"
                >
                  <span className="font-medium">{content.streamingPlatform}</span>
                </a>
              </div>
            )}
            
            {/* Quick feedback */}
            <div className="mb-2">
              <h4 className="text-xs font-medium text-gray-500 mb-1">
                {feedbackGiven ? 'YOUR FEEDBACK' : 'WAS THIS HELPFUL?'}
              </h4>
              
              {showFeedbackThanks ? (
                <div className="text-center py-2 text-sm text-green-700">
                  Thanks for your feedback!
                </div>
              ) : feedbackGiven ? (
                <div className="flex items-center">
                  <span className={`text-sm ${feedbackGiven === 'liked' ? 'text-green-600' : 'text-red-600'} flex items-center`}>
                    {feedbackGiven === 'liked' ? (
                      <>
                        <FaThumbsUp className="mr-1" /> Helpful
                      </>
                    ) : (
                      <>
                        <FaThumbsDown className="mr-1" /> Not helpful
                      </>
                    )}
                  </span>
                  <button 
                    onClick={() => setFeedbackGiven(null)}
                    className="ml-auto text-xs text-gray-500 hover:text-gray-700"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button 
                    onClick={() => recordFeedback('liked')}
                    className="flex items-center justify-center py-1 px-2 bg-green-50 border border-green-200 rounded-md text-green-700 hover:bg-green-100 transition-colors text-sm"
                  >
                    <FaThumbsUp className="mr-1" /> Yes
                  </button>
                  <button 
                    onClick={() => recordFeedback('disliked')}
                    className="flex items-center justify-center py-1 px-2 bg-red-50 border border-red-200 rounded-md text-red-700 hover:bg-red-100 transition-colors text-sm"
                  >
                    <FaThumbsDown className="mr-1" /> No
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 