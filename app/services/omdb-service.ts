/**
 * OMDB API Service
 * This service provides functions to interact with the OMDB API
 * for fetching movie and TV show data.
 */

const OMDB_API_KEY = process.env.NEXT_PUBLIC_OMDB_API_KEY;
const BASE_URL = 'https://www.omdbapi.com/';

/**
 * Interface for OMDB search result item
 */
export interface OMDBSearchResult {
  Title: string;
  Year: string;
  imdbID: string;
  Type: string;
  Poster: string;
}

/**
 * Interface for OMDB search response
 */
export interface OMDBSearchResponse {
  Search?: OMDBSearchResult[];
  totalResults?: string;
  Response: string;
  Error?: string;
}

/**
 * Interface for detailed OMDB movie/show data
 */
export interface OMDBDetailedItem {
  Title: string;
  Year: string;
  Rated: string;
  Released: string;
  Runtime: string;
  Genre: string;
  Director: string;
  Writer: string;
  Actors: string;
  Plot: string;
  Language: string;
  Country: string;
  Awards: string;
  Poster: string;
  Ratings: Array<{ Source: string; Value: string }>;
  Metascore: string;
  imdbRating: string;
  imdbVotes: string;
  imdbID: string;
  Type: string;
  DVD?: string;
  BoxOffice?: string;
  Production?: string;
  Website?: string;
  Response: string;
  Error?: string;
}

/**
 * Check if the API key is set and valid
 */
export const isApiKeySet = (): boolean => {
  return !!OMDB_API_KEY && OMDB_API_KEY.length > 0;
};

/**
 * Search for movies and shows by title
 * @param title - The title to search for
 * @param page - Optional page number (defaults to 1)
 * @param type - Optional type filter (movie, series, episode)
 * @returns Promise with search results
 */
export const search = async (
  title: string,
  page: number = 1,
  type?: 'movie' | 'series' | 'episode'
): Promise<OMDBSearchResponse> => {
  if (!isApiKeySet()) {
    return { Response: 'False', Error: 'API key not set' };
  }

  try {
    let url = `${BASE_URL}?apikey=${OMDB_API_KEY}&s=${encodeURIComponent(title)}&page=${page}`;
    
    if (type) {
      url += `&type=${type}`;
    }

    const response = await fetch(url);
    const data = await response.json();
    
    return data;
  } catch (error) {
    console.error('Error searching OMDB:', error);
    return { Response: 'False', Error: 'Failed to fetch data from OMDB API' };
  }
};

/**
 * Get detailed information about a movie or show by title
 * @param title - The exact title of the movie or show
 * @param year - Optional year of release
 * @param type - Optional type (movie, series, episode)
 * @returns Promise with detailed item info
 */
export const getByTitle = async (
  title: string,
  year?: string,
  type?: 'movie' | 'series' | 'episode'
): Promise<OMDBDetailedItem> => {
  if (!isApiKeySet()) {
    return { Response: 'False', Error: 'API key not set' } as OMDBDetailedItem;
  }

  try {
    let url = `${BASE_URL}?apikey=${OMDB_API_KEY}&t=${encodeURIComponent(title)}`;
    
    if (year) {
      url += `&y=${year}`;
    }
    
    if (type) {
      url += `&type=${type}`;
    }

    const response = await fetch(url);
    const data = await response.json();
    
    return data;
  } catch (error) {
    console.error('Error fetching from OMDB by title:', error);
    return { Response: 'False', Error: 'Failed to fetch data from OMDB API' } as OMDBDetailedItem;
  }
};

/**
 * Get detailed information about a movie or show by IMDb ID
 * @param imdbId - The IMDb ID of the movie or show
 * @returns Promise with detailed item info
 */
export const getById = async (imdbId: string): Promise<OMDBDetailedItem> => {
  if (!isApiKeySet()) {
    return { Response: 'False', Error: 'API key not set' } as OMDBDetailedItem;
  }

  try {
    const url = `${BASE_URL}?apikey=${OMDB_API_KEY}&i=${imdbId}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    return data;
  } catch (error) {
    console.error('Error fetching from OMDB by ID:', error);
    return { Response: 'False', Error: 'Failed to fetch data from OMDB API' } as OMDBDetailedItem;
  }
};

/**
 * Get Rotten Tomatoes score from OMDB ratings
 * @param omdbData OMDB response object
 * @returns Rotten Tomatoes score as a number (0-100) or null if not available
 */
export function getRottenTomatoesScore(omdbData: OMDBDetailedItem): number | null {
  if (!omdbData?.Ratings) return null;
  
  const rtRating = omdbData.Ratings.find(rating => rating.Source === 'Rotten Tomatoes');
  
  if (!rtRating) return null;
  
  // Extract number from "94%" format
  const scoreMatch = rtRating.Value.match(/(\d+)%/);
  if (scoreMatch && scoreMatch[1]) {
    return parseInt(scoreMatch[1], 10);
  }
  
  return null;
}

/**
 * Get Metacritic score from OMDB data
 * @param omdbData OMDB response object
 * @returns Metacritic score as a number (0-100) or null if not available
 */
export function getMetacriticScore(omdbData: OMDBDetailedItem): number | null {
  if (!omdbData?.Metascore || omdbData.Metascore === 'N/A') return null;
  
  return parseInt(omdbData.Metascore, 10);
}

/**
 * Get IMDb rating from OMDB data
 * @param omdbData OMDB response object
 * @returns IMDb rating as a number (0-10) or null if not available
 */
export function getImdbRating(omdbData: OMDBDetailedItem): number | null {
  if (!omdbData?.imdbRating || omdbData.imdbRating === 'N/A') return null;
  
  return parseFloat(omdbData.imdbRating);
}

/**
 * Extract genres from OMDB data
 * @param omdbData OMDB response object 
 * @returns Array of genre strings
 */
export function extractGenres(omdbData: OMDBDetailedItem): string[] {
  if (!omdbData?.Genre || omdbData.Genre === 'N/A') return [];
  
  return omdbData.Genre.split(', ');
}

/**
 * Parse runtime in minutes from OMDB data
 * @param omdbData OMDB response object
 * @returns Runtime in minutes as a number or null if not available
 */
export function getRuntimeMinutes(omdbData: OMDBDetailedItem): number | null {
  if (!omdbData?.Runtime || omdbData.Runtime === 'N/A') return null;
  
  const runtimeMatch = omdbData.Runtime.match(/(\d+)/);
  if (runtimeMatch && runtimeMatch[1]) {
    return parseInt(runtimeMatch[1], 10);
  }
  
  return null;
} 