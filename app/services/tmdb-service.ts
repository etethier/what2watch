/**
 * TMDB API Service
 * This service provides functions to interact with The Movie Database (TMDB) API
 * for fetching movie and TV show data.
 */

const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

/**
 * Poster sizes available from TMDB
 */
export enum PosterSize {
  SMALL = 'w92',
  MEDIUM = 'w185',
  LARGE = 'w500',
  ORIGINAL = 'original'
}

/**
 * Genre information from TMDB
 */
export interface Genre {
  id: number;
  name: string;
}

/**
 * Basic movie/TV show information from TMDB
 */
export interface TMDBContentItem {
  id: number;
  title?: string;  // for movies
  name?: string;   // for TV shows
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  genre_ids: number[];
  vote_average: number;
  vote_count: number;
  release_date?: string;  // for movies
  first_air_date?: string; // for TV shows
  popularity: number;
  media_type?: 'movie' | 'tv';
}

/**
 * TMDB search/discover response format
 */
export interface TMDBResponse<T> {
  page: number;
  results: T[];
  total_results: number;
  total_pages: number;
}

/**
 * TMDB detailed movie information
 */
export interface TMDBMovieDetails extends Omit<TMDBContentItem, 'genre_ids'> {
  genres: Genre[];
  runtime: number;
  budget: number;
  revenue: number;
  status: string;
  tagline: string | null;
  imdb_id: string | null;
  homepage: string | null;
  production_companies: Array<{
    id: number;
    name: string;
    logo_path: string | null;
  }>;
  videos?: {
    results: Array<{
      id: string;
      key: string;
      name: string;
      site: string;
      type: string;
    }>;
  };
  credits?: {
    cast: Array<{
      id: number;
      name: string;
      character: string;
      profile_path: string | null;
    }>;
    crew: Array<{
      id: number;
      name: string;
      job: string;
      department: string;
      profile_path: string | null;
    }>;
  };
}

/**
 * TMDB detailed TV show information
 */
export interface TMDBTVDetails extends Omit<TMDBContentItem, 'genre_ids'> {
  genres: Genre[];
  episode_run_time: number[];
  number_of_seasons: number;
  number_of_episodes: number;
  status: string;
  type: string;
  tagline: string | null;
  homepage: string | null;
  created_by: Array<{
    id: number;
    name: string;
    profile_path: string | null;
  }>;
  videos?: {
    results: Array<{
      id: string;
      key: string;
      name: string;
      site: string;
      type: string;
    }>;
  };
  credits?: {
    cast: Array<{
      id: number;
      name: string;
      character: string;
      profile_path: string | null;
    }>;
    crew: Array<{
      id: number;
      name: string;
      job: string;
      department: string;
      profile_path: string | null;
    }>;
  };
}

/**
 * Check if the API key is set and valid
 */
export const isApiKeySet = (): boolean => {
  return !!TMDB_API_KEY && TMDB_API_KEY.length > 0;
};

/**
 * Construct the full image URL for a poster or backdrop
 * @param path - The image path from TMDB
 * @param size - The desired image size
 * @returns The complete image URL
 */
export const getImageUrl = (path: string | null, size: PosterSize = PosterSize.MEDIUM): string | null => {
  if (!path) return null;
  return `${IMAGE_BASE_URL}/${size}${path}`;
};

/**
 * Get popular movies
 * @param page - The page number to fetch (defaults to 1)
 * @returns Promise with popular movies data
 */
export const getPopularMovies = async (page: number = 1): Promise<TMDBResponse<TMDBContentItem>> => {
  if (!isApiKeySet()) {
    return { page: 0, results: [], total_results: 0, total_pages: 0 };
  }

  try {
    const url = `${BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}&page=${page}`;
    const response = await fetch(url);
    const data = await response.json();
    
    // Add media_type field to each result
    const results = data.results.map((item: TMDBContentItem) => ({
      ...item,
      media_type: 'movie'
    }));

    return { ...data, results };
  } catch (error) {
    console.error('Error fetching popular movies:', error);
    return { page: 0, results: [], total_results: 0, total_pages: 0 };
  }
};

/**
 * Get popular TV shows
 * @param page - The page number to fetch (defaults to 1)
 * @returns Promise with popular TV shows data
 */
export const getPopularTVShows = async (page: number = 1): Promise<TMDBResponse<TMDBContentItem>> => {
  if (!isApiKeySet()) {
    return { page: 0, results: [], total_results: 0, total_pages: 0 };
  }

  try {
    const url = `${BASE_URL}/tv/popular?api_key=${TMDB_API_KEY}&page=${page}`;
    const response = await fetch(url);
    const data = await response.json();
    
    // Add media_type field to each result
    const results = data.results.map((item: TMDBContentItem) => ({
      ...item,
      media_type: 'tv'
    }));

    return { ...data, results };
  } catch (error) {
    console.error('Error fetching popular TV shows:', error);
    return { page: 0, results: [], total_results: 0, total_pages: 0 };
  }
};

/**
 * Search for movies and TV shows
 * @param query - The search query
 * @param page - The page number to fetch (defaults to 1)
 * @returns Promise with search results
 */
export const searchContent = async (query: string, page: number = 1): Promise<TMDBResponse<TMDBContentItem>> => {
  if (!isApiKeySet()) {
    return { page: 0, results: [], total_results: 0, total_pages: 0 };
  }

  try {
    const url = `${BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=${page}`;
    const response = await fetch(url);
    const data = await response.json();
    
    // Filter to only include movies and TV shows
    const results = data.results.filter((item: TMDBContentItem & { media_type: string }) => 
      item.media_type === 'movie' || item.media_type === 'tv'
    );

    return { ...data, results };
  } catch (error) {
    console.error('Error searching content:', error);
    return { page: 0, results: [], total_results: 0, total_pages: 0 };
  }
};

/**
 * Get all available genres for movies and TV shows
 * @returns Promise with genre data
 */
export const getGenres = async (): Promise<{ movies: Genre[], tv: Genre[] }> => {
  if (!isApiKeySet()) {
    return { movies: [], tv: [] };
  }

  try {
    const [movieResponse, tvResponse] = await Promise.all([
      fetch(`${BASE_URL}/genre/movie/list?api_key=${TMDB_API_KEY}`),
      fetch(`${BASE_URL}/genre/tv/list?api_key=${TMDB_API_KEY}`)
    ]);

    const movieData = await movieResponse.json();
    const tvData = await tvResponse.json();

    return {
      movies: movieData.genres || [],
      tv: tvData.genres || []
    };
  } catch (error) {
    console.error('Error fetching genres:', error);
    return { movies: [], tv: [] };
  }
};

/**
 * Get detailed information about a specific movie
 * @param id - The TMDB movie ID
 * @returns Promise with movie details
 */
export const getMovieDetails = async (id: number): Promise<TMDBMovieDetails | null> => {
  if (!isApiKeySet()) {
    return null;
  }

  try {
    const url = `${BASE_URL}/movie/${id}?api_key=${TMDB_API_KEY}&append_to_response=videos,credits`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.success === false) {
      return null;
    }
    
    return {
      ...data,
      media_type: 'movie'
    };
  } catch (error) {
    console.error(`Error fetching movie details for ID ${id}:`, error);
    return null;
  }
};

/**
 * Get detailed information about a specific TV show
 * @param id - The TMDB TV show ID
 * @returns Promise with TV show details
 */
export const getTVDetails = async (id: number): Promise<TMDBTVDetails | null> => {
  if (!isApiKeySet()) {
    return null;
  }

  try {
    const url = `${BASE_URL}/tv/${id}?api_key=${TMDB_API_KEY}&append_to_response=videos,credits`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.success === false) {
      return null;
    }
    
    return {
      ...data,
      media_type: 'tv'
    };
  } catch (error) {
    console.error(`Error fetching TV show details for ID ${id}:`, error);
    return null;
  }
};

/**
 * Get detailed information about a movie or TV show
 * @param id - The TMDB content ID
 * @param type - The content type ('movie' or 'tv')
 * @returns Promise with content details
 */
export const getContentDetails = async (
  id: number, 
  type: 'movie' | 'tv'
): Promise<TMDBMovieDetails | TMDBTVDetails | null> => {
  return type === 'movie' ? 
    await getMovieDetails(id) : 
    await getTVDetails(id);
};

/**
 * Discover movies based on filters
 * @param options - Filter options
 * @returns Promise of TMDBResponse with movies
 */
export const discoverMovies = async (
  options: Record<string, any> = {}
): Promise<TMDBResponse<TMDBContentItem>> => {
  if (!process.env.NEXT_PUBLIC_TMDB_API_KEY) {
    throw new Error('TMDB API key is required');
  }

  try {
    // Convert options to query parameters
    const queryParams = new URLSearchParams({
      api_key: process.env.NEXT_PUBLIC_TMDB_API_KEY,
      ...options
    });

    const response = await fetch(
      `https://api.themoviedb.org/3/discover/movie?${queryParams.toString()}`
    );

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Add media_type to each item for consistent formatting
    data.results.forEach((item: TMDBContentItem) => {
      item.media_type = 'movie';
    });

    return data;
  } catch (error) {
    console.error('Error discovering movies:', error);
    return { page: 1, results: [], total_pages: 0, total_results: 0 };
  }
};

/**
 * Discover TV shows based on filters
 * @param options - Filter options
 * @returns Promise of TMDBResponse with TV shows
 */
export const discoverTVShows = async (
  options: Record<string, any> = {}
): Promise<TMDBResponse<TMDBContentItem>> => {
  if (!process.env.NEXT_PUBLIC_TMDB_API_KEY) {
    throw new Error('TMDB API key is required');
  }

  try {
    // Convert options to query parameters
    const queryParams = new URLSearchParams({
      api_key: process.env.NEXT_PUBLIC_TMDB_API_KEY,
      ...options
    });

    const response = await fetch(
      `https://api.themoviedb.org/3/discover/tv?${queryParams.toString()}`
    );

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Add media_type to each item for consistent formatting
    data.results.forEach((item: TMDBContentItem) => {
      item.media_type = 'tv';
    });

    return data;
  } catch (error) {
    console.error('Error discovering TV shows:', error);
    return { page: 1, results: [], total_pages: 0, total_results: 0 };
  }
}; 