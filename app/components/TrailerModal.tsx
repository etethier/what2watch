'use client';

import { useState, useEffect } from 'react';
import { getTrailer, getEmbedUrl } from '../services/youtube-service';
import { FaPlay, FaTimes } from 'react-icons/fa';

interface TrailerModalProps {
  title: string;
  year?: number;
  type?: 'movie' | 'tv';
  isOpen: boolean;
  onClose: () => void;
}

export default function TrailerModal({ title, year, type, isOpen, onClose }: TrailerModalProps) {
  const [trailer, setTrailer] = useState<{ videoId: string; title: string; thumbnailUrl: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTrailer() {
      if (!isOpen) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const trailerData = await getTrailer(title, year, type);
        
        if (trailerData) {
          setTrailer(trailerData);
        } else {
          setError('No trailer found for this title');
        }
      } catch (err) {
        console.error('Error fetching trailer:', err);
        setError('Failed to load trailer');
      } finally {
        setLoading(false);
      }
    }

    fetchTrailer();
  }, [title, year, type, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
      <div className="relative bg-white rounded-lg shadow-lg w-full max-w-4xl">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-xl font-bold text-gray-900 truncate">
            {trailer ? `${title} - Official Trailer` : 'Loading Trailer...'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            <FaTimes size={20} />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-64 md:h-96">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading trailer...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64 text-center p-8">
              <div>
                <p className="text-red-500 mb-4">{error}</p>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-pink-500 text-white rounded hover:bg-pink-600"
                >
                  Close
                </button>
              </div>
            </div>
          ) : trailer ? (
            <div className="aspect-w-16 aspect-h-9">
              <iframe
                src={getEmbedUrl(trailer.videoId)}
                title={`${title} Trailer`}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-64 md:h-96"
              ></iframe>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-center p-8">
              <p className="text-gray-500">No trailer available</p>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
} 