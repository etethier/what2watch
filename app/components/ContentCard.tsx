'use client';

import { FaStar, FaTv, FaFilm } from 'react-icons/fa';
import { MovieTVShow } from '../types';
import TrailerButton from './TrailerButton';

interface ContentCardProps {
  content: MovieTVShow & { releaseYear?: number };
  className?: string;
}

export default function ContentCard({ content, className = '' }: ContentCardProps) {
  // Use the releaseYear from TMDB if available, otherwise use current year
  const year = content.releaseYear || new Date().getFullYear();
  
  return (
    <div className={`bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 ${className}`}>
      {/* Poster Image */}
      <div className="relative">
        {content.posterPath ? (
          <img 
            src={content.posterPath} 
            alt={content.title}
            className="w-full h-56 object-cover"
          />
        ) : (
          <div className="w-full h-56 bg-gray-300 flex items-center justify-center">
            <span className="text-gray-500">No Image</span>
          </div>
        )}
        
        {/* Type Badge - Movie or TV */}
        <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white text-xs py-1 px-2 rounded-full flex items-center">
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
        
        {/* Rating Badge */}
        {content.rating > 0 && (
          <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs py-1 px-2 rounded-full flex items-center">
            <FaStar className="mr-1" />
            {content.rating.toFixed(1)}
          </div>
        )}
        
        {/* Year Badge (if available) */}
        {content.releaseYear && (
          <div className="absolute top-10 right-2 bg-gray-800 text-white text-xs py-1 px-2 rounded-full">
            {content.releaseYear}
          </div>
        )}
        
        {/* Trailer Button - Positioned at bottom of poster */}
        <div className="absolute bottom-3 right-3">
          <TrailerButton 
            title={content.title}
            year={year}
            type={content.type}
            variant="icon"
          />
        </div>
      </div>
      
      {/* Content Details */}
      <div className="p-4">
        <h3 className="font-bold text-lg truncate" title={content.title}>
          {content.title}
          {content.releaseYear && <span className="font-normal text-gray-500 text-sm ml-2">({content.releaseYear})</span>}
        </h3>
        
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
        
        <p className="text-gray-600 text-sm mt-2 line-clamp-2" title={content.overview}>
          {content.overview}
        </p>
        
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