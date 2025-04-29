'use client';

import { useState } from 'react';
import { getByTitle, getById, search } from '../services/omdb-service';
import Link from 'next/link';

export default function OMDBTestPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [idQuery, setIdQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [movieDetails, setMovieDetails] = useState<any>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string>(process.env.NEXT_PUBLIC_OMDB_API_KEY ? 'API key found (hidden)' : 'No API key found');

  const searchByTitle = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      setLoading(true);
      setError(null);
      setMovieDetails(null);
      
      // Get movie details by title
      const details = await getByTitle(searchQuery);
      
      if (details) {
        setMovieDetails(details);
      } else {
        // If exact title match fails, try search
        const results = await search(searchQuery);
        setSearchResults(results);
        
        if (results.length === 0) {
          setError('No movies or TV shows found for this query');
        }
      }
    } catch (err) {
      console.error('Error searching for movies:', err);
      setError(`Failed to fetch movie data: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const searchById = async () => {
    if (!idQuery.trim()) return;
    
    try {
      setLoading(true);
      setError(null);
      setSearchResults([]);
      
      // Get movie details by IMDb ID
      const details = await getById(idQuery);
      
      if (details) {
        setMovieDetails(details);
      } else {
        setError('No movie or TV show found with this IMDb ID');
      }
    } catch (err) {
      console.error('Error searching by ID:', err);
      setError(`Failed to fetch movie data: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const getDetailsFromResult = async (imdbId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const details = await getById(imdbId);
      
      if (details) {
        setMovieDetails(details);
        setSearchResults([]);
      } else {
        setError('Could not fetch details for the selected movie');
      }
    } catch (err) {
      console.error('Error getting details:', err);
      setError(`Failed to fetch details: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">OMDB API Test</h1>
      
      <div className="bg-gray-100 p-4 rounded mb-4">
        <p><strong>API Key Status:</strong> {apiKey}</p>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-3">Search by Title</h2>
        <label htmlFor="searchQuery" className="block text-sm font-medium text-gray-700 mb-2">
          Enter a movie or TV show title
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            id="searchQuery"
            className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="E.g., The Dark Knight"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && searchByTitle()}
          />
          <button
            onClick={searchByTitle}
            disabled={loading || !searchQuery.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-3">Search by IMDb ID</h2>
        <label htmlFor="idQuery" className="block text-sm font-medium text-gray-700 mb-2">
          Enter an IMDb ID
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            id="idQuery"
            className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="E.g., tt0468569"
            value={idQuery}
            onChange={(e) => setIdQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && searchById()}
          />
          <button
            onClick={searchById}
            disabled={loading || !idQuery.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="text-center py-10">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-600">Fetching movie data...</p>
        </div>
      ) : (
        <>
          {searchResults.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Search Results</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {searchResults.map((result) => (
                  <div key={result.imdbID} className="bg-gray-50 p-4 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer" onClick={() => getDetailsFromResult(result.imdbID)}>
                    {result.Poster && result.Poster !== 'N/A' ? (
                      <img 
                        src={result.Poster} 
                        alt={result.Title}
                        className="w-full h-48 object-cover mb-3 rounded"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gray-200 flex items-center justify-center mb-3 rounded">
                        <span className="text-gray-400">No Poster</span>
                      </div>
                    )}
                    <h3 className="font-semibold">{result.Title}</h3>
                    <p className="text-gray-600">{result.Year} • {result.Type}</p>
                    <p className="text-sm text-blue-500 mt-2">Click for details</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {movieDetails && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Movie Details</h2>
              <div className="bg-white border border-gray-200 rounded-lg shadow-md overflow-hidden">
                <div className="flex flex-col md:flex-row">
                  {/* Poster */}
                  <div className="md:w-1/3">
                    {movieDetails.Poster && movieDetails.Poster !== 'N/A' ? (
                      <img 
                        src={movieDetails.Poster} 
                        alt={movieDetails.Title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full min-h-[300px] bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-400">No Poster Available</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Details */}
                  <div className="p-6 md:w-2/3">
                    <h3 className="text-2xl font-bold mb-1">{movieDetails.Title}</h3>
                    <p className="text-gray-600 mb-4">{movieDetails.Year} • {movieDetails.Rated} • {movieDetails.Runtime}</p>
                    
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-500">Genre</p>
                      <p>{movieDetails.Genre}</p>
                    </div>
                    
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-500">Director</p>
                      <p>{movieDetails.Director}</p>
                    </div>
                    
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-500">Actors</p>
                      <p>{movieDetails.Actors}</p>
                    </div>
                    
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-500">Plot</p>
                      <p>{movieDetails.Plot}</p>
                    </div>
                    
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-500">Ratings</p>
                      <div className="flex flex-wrap gap-3 mt-1">
                        {movieDetails.Ratings?.map((rating: any, index: number) => (
                          <div key={index} className="bg-gray-100 px-3 py-1 rounded">
                            <span className="font-medium">{rating.Source}:</span> {rating.Value}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {movieDetails.Awards !== 'N/A' && (
                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-500">Awards</p>
                        <p>{movieDetails.Awards}</p>
                      </div>
                    )}
                    
                    <div className="mt-6">
                      <a 
                        href={`https://www.imdb.com/title/${movieDetails.imdbID}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline"
                      >
                        View on IMDb
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {movieDetails && (
            <div className="mt-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
              Success! Your OMDB API key is working correctly.
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