/**
 * Streaming Platform Service
 * Handles integration with various streaming platform APIs to fetch trending content
 * and availability information
 */

import { MovieTVShow } from '../types';
import axios from 'axios';

// Streaming platform enum
export enum StreamingPlatform {
  NETFLIX = 'netflix',
  AMAZON = 'amazon',
  DISNEY = 'disney',
  HBO = 'hbo',
  HULU = 'hulu',
  APPLE = 'apple',
  PARAMOUNT = 'paramount'
}

// Configuration for API endpoints
const API_CONFIG = {
  // TMDB API configuration - For streaming availability and trending content
  TMDB: {
    BASE_URL: 'https://api.themoviedb.org/3',
    TRENDING_ENDPOINT: '/trending/{media_type}/{time_window}',
    WATCH_PROVIDERS_ENDPOINT: '/movie/{movie_id}/watch/providers',
    API_KEY: process.env.NEXT_PUBLIC_TMDB_API_KEY || '',
    DEFAULT_REGION: 'US'
  },
  // Configuration for any direct streaming platform APIs we might use
  STREAMING_PLATFORMS: {
    [StreamingPlatform.NETFLIX]: {
      BASE_URL: 'https://netflix-api-placeholder.com',
      TRENDING_ENDPOINT: '/trending'
    },
    [StreamingPlatform.DISNEY]: {
      BASE_URL: 'https://disney-api-placeholder.com',
      TRENDING_ENDPOINT: '/trending'
    }
    // Add other platforms as needed
  },
  // Third-party aggregator API options
  WATCHMODE: {
    BASE_URL: 'https://api.watchmode.com/v1',
    TITLE_DETAILS_ENDPOINT: '/title/{id}/details',
    SOURCES_ENDPOINT: '/title/{id}/sources',
    API_KEY: process.env.WATCHMODE_API_KEY || ''  
  }
};

// Interfaces
export interface StreamingTrendingItem {
  id: number;
  title: string;
  poster_path: string;
  media_type: 'movie' | 'tv';
  genre_ids: number[];
  overview: string;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  streamingPlatform: StreamingPlatform;
  trendingRank: number;
}

export interface StreamingAvailability {
  platform: StreamingPlatform;
  available: boolean;
  link?: string;
  price?: number;
  quality?: string; // SD, HD, 4K, etc.
  subscriptionRequired?: boolean;
}

// Genre mapping from TMDB IDs to our genre names
const GENRE_ID_MAP: Record<number, string> = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Science Fiction',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western'
};

/**
 * Checks if specific content is available on a given streaming platform
 * @param contentId Content ID to check
 * @param platform Platform to check availability on
 * @returns Boolean indicating availability
 */
export async function isAvailableOn(contentId: number, platform: StreamingPlatform): Promise<boolean> {
  try {
    const availability = await getStreamingAvailability(contentId);
    return availability.some(a => a.platform === platform && a.available);
  } catch (error) {
    console.error('Error checking streaming availability:', error);
    return false;
  }
}

/**
 * Gets all streaming platforms where content is available
 * @param contentId Content ID to check
 * @returns Array of streaming availability objects
 */
export async function getStreamingAvailability(contentId: number): Promise<StreamingAvailability[]> {
  try {
    if (!API_CONFIG.TMDB.API_KEY) {
      console.warn('TMDB API key not found, using mock data');
      return getMockStreamingAvailability(contentId);
    }

    // Use TMDB API to get watch providers
    const endpoint = API_CONFIG.TMDB.WATCH_PROVIDERS_ENDPOINT.replace('{movie_id}', contentId.toString());
    const response = await axios.get(`${API_CONFIG.TMDB.BASE_URL}${endpoint}`, {
      params: {
        api_key: API_CONFIG.TMDB.API_KEY,
        language: 'en-US'
      }
    });

    // Check if we have results for our region
    const results = response.data.results;
    const regionData = results[API_CONFIG.TMDB.DEFAULT_REGION];
    
    if (!regionData) {
      return [];
    }

    // Convert TMDB watch providers to our format
    const availability: StreamingAvailability[] = [];
    
    // Process flatrate (subscription) services
    if (regionData.flatrate) {
      regionData.flatrate.forEach((provider: any) => {
        const platform = mapProviderToPlatform(provider.provider_id);
        if (platform) {
          availability.push({
            platform,
            available: true,
            link: regionData.link || '',
            subscriptionRequired: true
          });
        }
      });
    }
    
    // Process rent options
    if (regionData.rent) {
      regionData.rent.forEach((provider: any) => {
        const platform = mapProviderToPlatform(provider.provider_id);
        if (platform) {
          availability.push({
            platform,
            available: true,
            link: regionData.link || '',
            price: provider.price,
            subscriptionRequired: false
          });
        }
      });
    }
    
    // Process buy options
    if (regionData.buy) {
      regionData.buy.forEach((provider: any) => {
        const platform = mapProviderToPlatform(provider.provider_id);
        if (platform) {
          availability.push({
            platform,
            available: true,
            link: regionData.link || '',
            price: provider.price,
            subscriptionRequired: false
          });
        }
      });
    }
    
    return availability;
  } catch (error) {
    console.error('Error fetching streaming availability:', error);
    return getMockStreamingAvailability(contentId);
  }
}

/**
 * Helper function to map TMDB provider IDs to our platform enum
 */
function mapProviderToPlatform(providerId: number): StreamingPlatform | null {
  // TMDB provider ID mapping
  // These IDs may change over time, so this would need to be maintained
  const providerMap: Record<number, StreamingPlatform> = {
    8: StreamingPlatform.NETFLIX,      // Netflix
    9: StreamingPlatform.AMAZON,       // Amazon Prime
    337: StreamingPlatform.DISNEY,     // Disney+
    384: StreamingPlatform.HBO,        // HBO Max
    15: StreamingPlatform.HULU,        // Hulu
    350: StreamingPlatform.APPLE,      // Apple TV+
    531: StreamingPlatform.PARAMOUNT   // Paramount+
  };
  
  return providerMap[providerId] || null;
}

/**
 * Fetches trending content from a specific streaming platform
 * @param platform The streaming platform to get trending content from
 * @param count Number of trending items to return
 * @returns Array of trending items
 */
export async function getTrendingByPlatform(
  platform: StreamingPlatform, 
  count: number = 10
): Promise<StreamingTrendingItem[]> {
  try {
    if (!API_CONFIG.TMDB.API_KEY) {
      console.warn('TMDB API key not found, using mock data');
      return getMockTrendingByPlatform(platform, count);
    }

    // For real implementation, use the TMDB trending endpoint
    // and then filter for content available on the specified platform
    
    // Get trending movies and TV shows
    const trendingMovies = await fetchTrendingFromTMDB('movie', 'week');
    const trendingTVShows = await fetchTrendingFromTMDB('tv', 'week');
    
    // Combine results
    const allTrending = [...trendingMovies, ...trendingTVShows];
    
    // For each item, check if it's available on the specified platform
    const results: StreamingTrendingItem[] = [];
    
    for (const item of allTrending) {
      if (results.length >= count) break;
      
      try {
        const availability = await getStreamingAvailability(item.id);
        const isAvailable = availability.some(a => a.platform === platform && a.available);
        
        if (isAvailable) {
          results.push({
            ...item,
            streamingPlatform: platform,
            trendingRank: results.length + 1 // Assign rank based on order
          });
        }
      } catch (error) {
        console.error(`Error checking availability for item ${item.id}:`, error);
      }
    }
    
    return results;
  } catch (error) {
    console.error(`Error fetching trending content for ${platform}:`, error);
    return getMockTrendingByPlatform(platform, count);
  }
}

/**
 * Fetch trending content from TMDB API
 */
async function fetchTrendingFromTMDB(mediaType: 'movie' | 'tv', timeWindow: 'day' | 'week'): Promise<any[]> {
  try {
    const endpoint = API_CONFIG.TMDB.TRENDING_ENDPOINT
      .replace('{media_type}', mediaType)
      .replace('{time_window}', timeWindow);
    
    const response = await axios.get(`${API_CONFIG.TMDB.BASE_URL}${endpoint}`, {
      params: {
        api_key: API_CONFIG.TMDB.API_KEY,
        language: 'en-US'
      }
    });
    
    return response.data.results.map((item: any) => ({
      id: item.id,
      title: item.title || item.name,
      poster_path: item.poster_path,
      media_type: item.media_type,
      genre_ids: item.genre_ids,
      overview: item.overview,
      release_date: item.release_date,
      first_air_date: item.first_air_date,
      vote_average: item.vote_average
    }));
  } catch (error) {
    console.error(`Error fetching trending ${mediaType} from TMDB:`, error);
    return [];
  }
}

/**
 * Gets trending content from all supported streaming platforms
 * @param count Number of items to return per platform
 * @returns Combined array of trending items from all platforms
 */
export async function getAllTrendingContent(count: number = 5): Promise<StreamingTrendingItem[]> {
  try {
    // Get trending from each platform in parallel
    const allPlatforms = Object.values(StreamingPlatform);
    const platformPromises = allPlatforms.map(platform => 
      getTrendingByPlatform(platform, count)
    );
    
    const results = await Promise.all(platformPromises);
    return results.flat();
  } catch (error) {
    console.error('Error fetching all trending content:', error);
    return getMockAllTrendingContent(count);
  }
}

/**
 * Gets trending content from platforms the user is subscribed to
 * @param subscribedPlatforms Array of platforms the user is subscribed to
 * @param count Number of items to return per platform
 * @returns Array of trending items from subscribed platforms
 */
export async function getTrendingFromSubscribedPlatforms(
  subscribedPlatforms: StreamingPlatform[], 
  count: number = 5
): Promise<StreamingTrendingItem[]> {
  try {
    if (!subscribedPlatforms || subscribedPlatforms.length === 0) {
      return [];
    }
    
    // Get trending from each subscribed platform in parallel
    const platformPromises = subscribedPlatforms.map(platform => 
      getTrendingByPlatform(platform, count)
    );
    
    const results = await Promise.all(platformPromises);
    return results.flat();
  } catch (error) {
    console.error('Error fetching trending from subscribed platforms:', error);
    return [];
  }
}

/**
 * Converts a streaming trending item to our MovieTVShow format for recommendations
 */
export function convertToMovieTVShow(item: StreamingTrendingItem): MovieTVShow {
  return {
    id: item.id,
    title: item.title,
    overview: item.overview,
    posterPath: item.poster_path,
    type: item.media_type,
    rating: item.vote_average,
    genres: [], // We'd need to map genre_ids to names using a lookup table
    imdbRating: item.vote_average, // Default to TMDB rating
    rottenTomatoesScore: Math.round(item.vote_average * 10), // Rough conversion
    releaseYear: getYearFromDate(item.release_date || item.first_air_date),
    streamingPlatform: item.streamingPlatform,
    trendingOnPlatform: item.streamingPlatform,
    trendingRank: item.trendingRank
  };
}

/**
 * Gets trending content for recommendations
 * @param platforms Optional array of platforms to include
 * @param count Number of recommendations to return
 * @returns Array of MovieTVShow objects based on trending content
 */
export async function getTrendingContentForRecommendations(
  platforms?: StreamingPlatform[],
  count: number = 20
): Promise<MovieTVShow[]> {
  try {
    let trendingContent: StreamingTrendingItem[];
    
    if (platforms && platforms.length > 0) {
      trendingContent = await getTrendingFromSubscribedPlatforms(platforms, count);
    } else {
      trendingContent = await getAllTrendingContent(Math.ceil(count / Object.keys(StreamingPlatform).length));
    }
    
    // Convert to MovieTVShow format
    return trendingContent.map(convertToMovieTVShow);
  } catch (error) {
    console.error('Error getting trending content for recommendations:', error);
    return getMockRecommendations();
  }
}

// ================ MOCK DATA FUNCTIONS ================
// These functions provide mock data when APIs are unavailable

function getMockStreamingAvailability(contentId: number): StreamingAvailability[] {
  // Simple mock data based on content ID
  const mockAvailability: StreamingAvailability[] = [];
  
  // Make odd IDs available on Netflix and even IDs on Disney+
  if (contentId % 2 === 0) {
    mockAvailability.push({
      platform: StreamingPlatform.DISNEY,
      available: true,
      link: `https://www.disneyplus.com/movies/${contentId}`,
      subscriptionRequired: true
    });
    mockAvailability.push({
      platform: StreamingPlatform.AMAZON,
      available: true,
      link: `https://www.amazon.com/gp/video/detail/${contentId}`,
      price: 3.99,
      subscriptionRequired: false
    });
  } else {
    mockAvailability.push({
      platform: StreamingPlatform.NETFLIX,
      available: true,
      link: `https://www.netflix.com/title/${contentId}`,
      subscriptionRequired: true
    });
    mockAvailability.push({
      platform: StreamingPlatform.HBO,
      available: contentId % 5 === 0, // Only some titles on HBO
      link: `https://www.hbomax.com/feature/${contentId}`,
      subscriptionRequired: true
    });
  }
  
  // Add more random availability
  if (contentId % 3 === 0) {
    mockAvailability.push({
      platform: StreamingPlatform.APPLE,
      available: true,
      link: `https://tv.apple.com/movie/${contentId}`,
      price: 4.99,
      subscriptionRequired: false
    });
  }
  
  return mockAvailability;
}

function getMockTrendingByPlatform(platform: StreamingPlatform, count: number): StreamingTrendingItem[] {
  const mockTrending: StreamingTrendingItem[] = [];
  
  // Generate mock trending items based on platform
  for (let i = 1; i <= count; i++) {
    const mediaType = i % 3 === 0 ? 'tv' : 'movie';
    const genres = getRandomGenreIds();
    
    mockTrending.push({
      id: 10000 + (Object.values(StreamingPlatform).indexOf(platform) * 100) + i,
      title: `${mediaType === 'tv' ? 'TV Show' : 'Movie'} ${i} on ${platform}`,
      poster_path: '/sample/poster.jpg',
      media_type: mediaType,
      genre_ids: genres,
      overview: `This is a trending ${mediaType} on ${platform}.`,
      release_date: mediaType === 'movie' ? '2023-01-01' : undefined,
      first_air_date: mediaType === 'tv' ? '2023-01-01' : undefined,
      vote_average: 7.0 + (Math.random() * 2),
      streamingPlatform: platform,
      trendingRank: i
    });
  }
  
  return mockTrending;
}

function getMockAllTrendingContent(count: number): StreamingTrendingItem[] {
  const mockTrending: StreamingTrendingItem[] = [];
  const platforms = Object.values(StreamingPlatform);
  
  // Get some trending content from each platform
  for (const platform of platforms) {
    mockTrending.push(...getMockTrendingByPlatform(platform, count));
  }
  
  return mockTrending;
}

function getMockRecommendations(): MovieTVShow[] {
  return [
    {
      id: 12345,
      title: "Stranger Things",
      overview: "Kids encounter weird supernatural events in a small town",
      posterPath: "https://m.media-amazon.com/images/M/MV5BN2ZmYjg1YmItNWQ4OC00YWM0LWE0ZDktYThjOTZiZjhhN2Q2XkEyXkFqcGdeQXVyNjgxNTQ3Mjk@._V1_.jpg",
      type: "tv",
      rating: 8.5,
      genres: ["Sci-Fi", "Horror", "Drama"],
      releaseYear: getYearFromDate("2023-01-01"),
      imdbRating: 8.5,
      rottenTomatoesScore: 85,
      streamingPlatform: "netflix",
      trendingOnPlatform: "netflix",
      trendingRank: 1
    },
    {
      id: 12346,
      title: "House of the Dragon",
      overview: "Game of Thrones prequel set in the world of Westeros",
      posterPath: "https://m.media-amazon.com/images/M/MV5BZjBiOGIyY2YtOTA3OC00YzY1LThkYjktMGRkYTNhNTExY2I2XkEyXkFqcGdeQXVyMTEyMjM2NDc2._V1_.jpg",
      type: "tv",
      rating: 9.0,
      genres: ["Drama", "Thriller"],
      releaseYear: getYearFromDate("2023-01-01"),
      imdbRating: 9.0,
      rottenTomatoesScore: 90,
      streamingPlatform: "hbo",
      trendingOnPlatform: "hbo",
      trendingRank: 2
    }
  ];
}

function getRandomGenreIds(): number[] {
  // Return 1-3 random genre IDs
  const allGenreIds = Object.keys(GENRE_ID_MAP).map(id => parseInt(id));
  const result: number[] = [];
  const numGenres = 1 + Math.floor(Math.random() * 3);
  
  for (let i = 0; i < numGenres; i++) {
    const randomIndex = Math.floor(Math.random() * allGenreIds.length);
    result.push(allGenreIds[randomIndex]);
  }
  
  return result;
}

function getYearFromDate(date: string | undefined): number {
  if (date) {
    return parseInt(date.split('-')[0]);
  } else {
    return new Date().getFullYear();
  }
} 