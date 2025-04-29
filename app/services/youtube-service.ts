// YouTube API Service for What2Watch
// This service handles fetching trailers from YouTube

// Base URL for YouTube Data API
const YOUTUBE_API_BASE_URL = 'https://www.googleapis.com/youtube/v3';

/**
 * Search for a trailer on YouTube
 * @param query The search query (e.g. "Movie Title official trailer")
 * @returns Object containing videoId, title, and thumbnail URL
 */
export async function searchTrailer(query: string): Promise<{
  videoId: string;
  title: string;
  thumbnailUrl: string;
} | null> {
  try {
    const searchQuery = `${query} official trailer`;
    const response = await fetch(
      `${YOUTUBE_API_BASE_URL}/search?part=snippet&maxResults=1&q=${encodeURIComponent(searchQuery)}&type=video&key=${process.env.NEXT_PUBLIC_YOUTUBE_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.items && data.items.length > 0) {
      const video = data.items[0];
      return {
        videoId: video.id.videoId,
        title: video.snippet.title,
        thumbnailUrl: video.snippet.thumbnails.high.url
      };
    }
    
    return null;
  } catch (error) {
    console.error("Error searching for trailer:", error);
    return null;
  }
}

/**
 * Get trailer for a specific movie or TV show
 * @param title The title of the movie or TV show
 * @param year Optional release year to improve search accuracy
 * @param type Optional type ('movie' or 'tv') to improve search accuracy
 * @returns Object containing videoId, title, and thumbnail URL
 */
export async function getTrailer(title: string, year?: number, type?: 'movie' | 'tv'): Promise<{
  videoId: string;
  title: string;
  thumbnailUrl: string;
} | null> {
  try {
    // Create a more specific search query for better results
    let searchQuery = title;
    
    if (year) {
      searchQuery += ` ${year}`;
    }
    
    if (type) {
      searchQuery += ` ${type === 'movie' ? 'movie' : 'tv series'}`;
    }
    
    searchQuery += ' official trailer';
    
    const response = await fetch(
      `${YOUTUBE_API_BASE_URL}/search?part=snippet&maxResults=1&q=${encodeURIComponent(searchQuery)}&type=video&key=${process.env.NEXT_PUBLIC_YOUTUBE_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.items && data.items.length > 0) {
      const video = data.items[0];
      return {
        videoId: video.id.videoId,
        title: video.snippet.title,
        thumbnailUrl: video.snippet.thumbnails.high.url
      };
    }
    
    // Fall back to a more generic search if specific search yields no results
    if (year || type) {
      return await searchTrailer(title);
    }
    
    return null;
  } catch (error) {
    console.error("Error getting trailer:", error);
    return null;
  }
}

/**
 * Generate embedded YouTube player URL
 * @param videoId YouTube video ID
 * @param autoplay Whether to autoplay the video (default: true)
 * @returns URL for embedding the YouTube player
 */
export function getEmbedUrl(videoId: string, autoplay: boolean = true): string {
  return `https://www.youtube.com/embed/${videoId}?autoplay=${autoplay ? '1' : '0'}&rel=0`;
}

/**
 * Get multiple trailers for a movie or TV show (for different seasons, teasers, etc.)
 * @param title The title of the movie or TV show
 * @param maxResults Maximum number of results to return (default: 5)
 * @returns Array of trailer objects
 */
export async function getMultipleTrailers(title: string, maxResults: number = 5): Promise<{
  videoId: string;
  title: string;
  thumbnailUrl: string;
}[]> {
  try {
    const searchQuery = `${title} trailer`;
    const response = await fetch(
      `${YOUTUBE_API_BASE_URL}/search?part=snippet&maxResults=${maxResults}&q=${encodeURIComponent(searchQuery)}&type=video&key=${process.env.NEXT_PUBLIC_YOUTUBE_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.items && data.items.length > 0) {
      return data.items.map((video: any) => ({
        videoId: video.id.videoId,
        title: video.snippet.title,
        thumbnailUrl: video.snippet.thumbnails.high.url
      }));
    }
    
    return [];
  } catch (error) {
    console.error("Error getting multiple trailers:", error);
    return [];
  }
} 