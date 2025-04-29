'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface MovieTVShow {
  id: number;
  title: string;
  overview: string;
  posterPath: string;
  rating: number;
}

export default function TMDBTestPage() {
  const [movies, setMovies] = useState<MovieTVShow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string>('');

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        // Get trending movies from TMDB
        const key = process.env.NEXT_PUBLIC_TMDB_API_KEY;
        setApiKey(key ? 'API key found (hidden)' : 'No API key found');
        
        if (!key) {
          setError('TMDB API key not found in environment variables');
          setLoading(false);
          return;
        }
        
        const response = await fetch(
          `https://api.themoviedb.org/3/trending/movie/day?api_key=${key}`
        );
        
        if (!response.ok) {
          throw new Error(`TMDB API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        const formattedMovies = data.results.slice(0, 8).map((movie: any) => ({
          id: movie.id,
          title: movie.title,
          overview: movie.overview,
          posterPath: movie.poster_path 
            ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` 
            : '',
          rating: movie.vote_average
        }));
        
        setMovies(formattedMovies);
        setError(null);
      } catch (err) {
        console.error('Error fetching TMDB data:', err);
        setError(`Failed to fetch data from TMDB: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">TMDB API Test</h1>
      
      <div className="bg-gray-100 p-4 rounded mb-4">
        <p><strong>API Key Status:</strong> {apiKey}</p>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {loading ? (
        <div className="text-center py-10">
          <p className="text-xl">Loading content...</p>
        </div>
      ) : (
        <div>
          <h2 className="text-2xl font-bold mb-4">Trending Movies</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {movies.map(movie => (
              <div key={movie.id} className="bg-gray-100 rounded overflow-hidden shadow-md">
                {movie.posterPath ? (
                  <img 
                    src={movie.posterPath} 
                    alt={movie.title}
                    className="w-full h-48 object-cover" 
                  />
                ) : (
                  <div className="w-full h-48 bg-gray-300 flex items-center justify-center">
                    No Image
                  </div>
                )}
                <div className="p-3">
                  <h3 className="font-bold truncate">{movie.title}</h3>
                  <p className="text-sm text-gray-600">Rating: {movie.rating.toFixed(1)}</p>
                </div>
              </div>
            ))}
          </div>
          
          {movies.length > 0 && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              Success! Your TMDB API key is working correctly.
            </div>
          )}
        </div>
      )}
      
      <div className="mt-8 text-center">
        <Link href="/" className="text-blue-500 underline">Back to Home</Link>
      </div>
    </div>
  );
} 