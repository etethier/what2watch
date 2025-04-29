'use client';

import { useState } from 'react';
import { getTrailer, getMultipleTrailers } from '../services/youtube-service';
import Link from 'next/link';

export default function YouTubeTestPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [trailer, setTrailer] = useState<any>(null);
  const [multipleTrailers, setMultipleTrailers] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string>(process.env.NEXT_PUBLIC_YOUTUBE_API_KEY ? 'API key found (hidden)' : 'No API key found');

  const searchForTrailer = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Get single trailer
      const trailerResult = await getTrailer(searchQuery);
      setTrailer(trailerResult);
      
      // Get multiple trailers
      const multipleResults = await getMultipleTrailers(searchQuery, 3);
      setMultipleTrailers(multipleResults);
      
      if (!trailerResult && multipleResults.length === 0) {
        setError('No trailers found for this query');
      }
    } catch (err) {
      console.error('Error searching for trailers:', err);
      setError(`Failed to fetch trailers: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">YouTube API Test</h1>
      
      <div className="bg-gray-100 p-4 rounded mb-4">
        <p><strong>API Key Status:</strong> {apiKey}</p>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="mb-6">
        <label htmlFor="searchQuery" className="block text-sm font-medium text-gray-700 mb-2">
          Search for a Movie Trailer
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            id="searchQuery"
            className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-pink-500 focus:border-pink-500"
            placeholder="Enter movie title"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && searchForTrailer()}
          />
          <button
            onClick={searchForTrailer}
            disabled={loading || !searchQuery.trim()}
            className="px-4 py-2 bg-pink-500 text-white rounded hover:bg-pink-600 disabled:bg-gray-300"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="text-center py-10">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
          <p className="mt-4 text-gray-600">Searching for trailers...</p>
        </div>
      ) : (
        <>
          {trailer && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Primary Trailer</h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">{trailer.title}</h3>
                <div className="aspect-w-16 aspect-h-9 mb-4">
                  <iframe
                    src={`https://www.youtube.com/embed/${trailer.videoId}`}
                    title={trailer.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-64"
                  ></iframe>
                </div>
                <div className="text-sm">
                  <p><strong>Video ID:</strong> {trailer.videoId}</p>
                </div>
              </div>
            </div>
          )}
          
          {multipleTrailers.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Additional Trailers</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {multipleTrailers.map((trailer, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2 truncate" title={trailer.title}>
                      {trailer.title}
                    </h3>
                    <div className="aspect-w-16 aspect-h-9 mb-4">
                      <iframe
                        src={`https://www.youtube.com/embed/${trailer.videoId}`}
                        title={trailer.title}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-40"
                      ></iframe>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {trailer && (
            <div className="mt-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
              Success! Your YouTube API key is working correctly.
            </div>
          )}
        </>
      )}
      
      <div className="mt-8 text-center">
        <Link href="/" className="text-blue-500 underline">
          Back to Home
        </Link>
      </div>
    </div>
  );
} 