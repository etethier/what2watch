'use client';

import { useState } from 'react';
import { FaStar, FaTv, FaFilm, FaTrophy, FaReddit, FaFire, FaComments } from 'react-icons/fa';
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
        label: 'Hot on Reddit'
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
  };
  
  // Handle image loaded
  const handleImageLoaded = () => {
    setImageLoaded(true);
  };

  const rankColors = getRankColors(rank);
  const redditBuzzStyle = getRedditBuzzStyle(content.redditBuzz);
  
  return (
    <div className={`relative bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 ${className}`}>
      {/* Rank badge for top 3 */}
      {rankColors && (
        <div className={`absolute top-2 left-2 z-10 rounded-full px-3 py-1 ${rankColors.bg} ${rankColors.text} border ${rankColors.border} font-bold text-sm flex items-center`}>
          {rankColors.icon}
          <span>{rankColors.label}</span>
        </div>
      )}

      {/* Reddit Buzz badge */}
      {redditBuzzStyle && (
        <div className={`absolute top-${rankColors ? '12' : '2'} left-2 z-10 rounded-full px-3 py-1 ${redditBuzzStyle.bg} ${redditBuzzStyle.text} border ${redditBuzzStyle.border} text-sm flex items-center`}>
          {redditBuzzStyle.icon}
          <span>{redditBuzzStyle.label}</span>
        </div>
      )}

      {/* Poster Image Container with fixed aspect ratio */}
      <div className="relative aspect-[2/3] bg-gray-100">
        {/* Skeleton loader */}
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse"></div>
        )}
        
        {/* Content icon overlay - always visible for easier identification */}
        <div className="absolute top-2 right-2 bg-gray-800 bg-opacity-70 text-white text-xs p-1.5 rounded-full flex items-center shadow-sm z-10">
          {content.type === 'movie' ? (
            <FaFilm size={12} />
          ) : (
            <FaTv size={12} />
          )}
        </div>
        
        {/* Actual image */}
        {content.posterPath ? (
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
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-300">
            <div className="text-center p-4">
              <div className="text-4xl mb-3">
                {content.type === 'movie' ? <FaFilm className="mx-auto text-gray-400" /> : <FaTv className="mx-auto text-gray-400" />}
              </div>
              <span className="text-gray-700 font-bold text-lg">{content.title}</span>
              {content.releaseYear && (
                <span className="block text-gray-600 mt-1">{content.releaseYear}</span>
              )}
            </div>
          </div>
        )}
        
        {/* Fallback for image errors */}
        {imageError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-300">
            <div className="text-center p-4">
              <div className="text-4xl mb-3">
                {content.type === 'movie' ? <FaFilm className="mx-auto text-gray-400" /> : <FaTv className="mx-auto text-gray-400" />}
              </div>
              <span className="text-gray-700 font-bold text-lg">{content.title}</span>
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
      
      {/* Content Details */}
      <div className="p-4">
        {/* Title with ellipsis for long titles */}
        <h3 className="font-bold text-lg line-clamp-1" title={content.title}>
          {content.title}
        </h3>
        
        {/* Separate row for metadata */}
        <div className="flex items-center text-sm text-gray-500 mt-1 mb-2">
          {content.releaseYear && <span className="mr-2">{content.releaseYear}</span>}
          {content.streamingPlatform && (
            <span className="inline-block bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded">
              {content.streamingPlatform}
            </span>
          )}
        </div>
        
        {/* Genres */}
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
        
        {/* Overview with fixed height */}
        <p className="text-gray-600 text-sm mt-2 line-clamp-2 h-10" title={content.overview}>
          {content.overview}
        </p>
        
        {/* Rating metrics in a row */}
        <div className="flex items-center justify-between mt-3 mb-3 text-sm">
          {content.imdbRating && content.imdbRating > 0 && (
            <div className="flex items-center">
              <FaStar className="text-yellow-500 mr-1" />
              <span className="font-medium">{content.imdbRating.toFixed(1)}</span>
              <span className="text-gray-500 ml-1">IMDb</span>
            </div>
          )}
          
          {content.rottenTomatoesScore && content.rottenTomatoesScore > 0 && (
            <div className="flex items-center">
              <IoFastFoodOutline className="text-red-600 mr-1" />
              <span className="font-medium">{content.rottenTomatoesScore}%</span>
              <span className="text-gray-500 ml-1">RT</span>
            </div>
          )}
          
          {redditBuzzStyle && (
            <a 
              href={`https://www.reddit.com/search?q=${encodeURIComponent(content.title)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center hover:underline"
            >
              <FaReddit className="text-orange-500 mr-1" />
              <span className="text-gray-600">Reddit</span>
            </a>
          )}
        </div>
        
        {/* Match badge for top 3 recommendations */}
        {rank && rank <= 3 && (
          <div className="mb-3 px-2 py-1 bg-gradient-to-r from-pink-50 to-orange-50 border border-pink-100 rounded-md text-center">
            <span className="text-sm font-medium text-pink-600">
              {rank === 1 ? '98% Match' : rank === 2 ? '95% Match' : '92% Match'} with your preferences
            </span>
          </div>
        )}
        
        {/* Full Trailer Button */}
        <div className="mt-3">
          <TrailerButton 
            title={content.title}
            year={year}
            type={content.type}
            variant="secondary"
            className="w-full text-sm"
          />
        </div>
      </div>
    </div>
  );
} 