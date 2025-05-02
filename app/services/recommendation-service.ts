import { MovieTVShow } from '../types';
import * as tmdbService from './tmdb-service';
import { estimateRedditBuzz, getRedditBuzzWithFallback } from './reddit-service';

// Define QuizAnswer interface here since it's not exported from types
interface QuizAnswer {
  question: string;
  answer: string;
}

type MoodToGenreMap = {
  [key: string]: string[];
};

// Map moods to relevant genres
const MOOD_TO_GENRE_MAP: MoodToGenreMap = {
  happy: ['35', '10751', '16'], // Comedy, Family, Animation
  sad: ['18', '10749'], // Drama, Romance
  excited: ['28', '12', '53', '878'], // Action, Adventure, Thriller, Science Fiction
  scared: ['27', '9648'], // Horror, Mystery
  relaxed: ['35', '10751', '10770'], // Comedy, Family, TV Movie
  thoughtful: ['18', '99', '36'], // Drama, Documentary, History
};

// Map content types to TMDB media types
const CONTENT_TYPE_MAP: { [key: string]: string } = {
  movie: 'movie',
  tvShow: 'tv',
  both: 'both',
};

/**
 * Extracts preference details from quiz answers
 * @param quizAnswers - Array of quiz answers from the user
 * @returns Object containing extracted preferences
 */
export const extractPreferences = (quizAnswers: QuizAnswer[]) => {
  let mood = '';
  let contentType = 'both';
  let genres: string[] = [];
  let duration = 120; // Default duration in minutes
  let era = 'any'; // Default era preference: any, new, classic
  
  quizAnswers.forEach((answer) => {
    // Extract mood preference
    if (answer.question.includes('mood') || answer.question.includes('feeling')) {
      mood = answer.answer.toLowerCase();
    }
    
    // Extract content type preference
    if (answer.question.includes('movie') || answer.question.includes('TV show')) {
      if (answer.answer.toLowerCase().includes('movie')) {
        contentType = 'movie';
      } else if (answer.answer.toLowerCase().includes('tv')) {
        contentType = 'tvShow';
      } else {
        contentType = 'both';
      }
    }
    
    // Extract duration preference
    if (answer.question.includes('time') || answer.question.includes('duration')) {
      if (answer.answer.toLowerCase().includes('short')) {
        duration = 90;
      } else if (answer.answer.toLowerCase().includes('long')) {
        duration = 180;
      } else {
        duration = 120;
      }
    }
    
    // Extract era preference
    if (answer.question.includes('recent') || answer.question.includes('new') || answer.question.includes('old')) {
      if (answer.answer.toLowerCase().includes('new') || answer.answer.toLowerCase().includes('recent')) {
        era = 'new';
      } else if (answer.answer.toLowerCase().includes('classic') || answer.answer.toLowerCase().includes('old')) {
        era = 'classic';
      }
    }
    
    // Extract specific genre preferences if mentioned
    const genreKeywords = [
      { keywords: ['action', 'adventure'], id: '28' },
      { keywords: ['comedy', 'funny', 'laugh'], id: '35' },
      { keywords: ['drama', 'emotional'], id: '18' },
      { keywords: ['horror', 'scary'], id: '27' },
      { keywords: ['romance', 'romantic', 'love'], id: '10749' },
      { keywords: ['sci-fi', 'science fiction'], id: '878' },
      { keywords: ['thriller', 'suspense'], id: '53' },
      { keywords: ['documentary', 'real'], id: '99' },
      { keywords: ['fantasy', 'magical'], id: '14' },
      { keywords: ['mystery', 'detective'], id: '9648' },
    ];
    
    genreKeywords.forEach(({ keywords, id }) => {
      keywords.forEach(keyword => {
        if (answer.answer.toLowerCase().includes(keyword) && !genres.includes(id)) {
          genres.push(id);
        }
      });
    });
  });
  
  // If no specific genres were detected, use mood-based genres
  if (genres.length === 0 && mood && MOOD_TO_GENRE_MAP[mood]) {
    genres = MOOD_TO_GENRE_MAP[mood];
  }
  
  return {
    mood,
    contentType,
    genres,
    duration,
    era,
  };
};

/**
 * Get recommendations based on quiz answers
 * @param quizAnswers - Array of quiz answers from the user
 * @returns Promise with recommendation results
 */
export const getRecommendations = async (quizAnswers: QuizAnswer[]) => {
  try {
    // Extract user preferences
    const preferences = extractPreferences(quizAnswers);
    
    // Fetch content items from TMDB based on genres
    let results: tmdbService.TMDBContentItem[] = [];
    
    // Get content for each genre with proper media type
    for (const genre of preferences.genres) {
      const movieResults = await tmdbService.discoverMovies({ with_genres: genre });
      const tvResults = await tmdbService.discoverTVShows({ with_genres: genre });
      
      results = [
        ...results,
        ...movieResults.results.map(item => ({ ...item, media_type: 'movie' as const })),
        ...tvResults.results.map(item => ({ ...item, media_type: 'tv' as const }))
      ];
    }
    
    // Deduplicate results
    const uniqueIds = new Set();
    results = results.filter(item => {
      if (uniqueIds.has(item.id)) {
        return false;
      }
      uniqueIds.add(item.id);
      return true;
    });
    
    // Calculate content relevance based on genres
    const relevanceScores: Record<number, number> = {};
    results.forEach(item => {
      let score = 0;
      
      // Match genres (explicit match)
      item.genre_ids?.forEach(genreId => {
        if (preferences.genres.includes(genreId.toString())) {
          score += 20;
        }
      });
      
      // Popularity bonus
      score += Math.min(item.popularity / 10, 10);
      
      // Rating bonus
      score += item.vote_average * 2;
      
      // Match release year preference
      if (preferences.era === 'new' && item.release_date) {
        const year = parseInt(item.release_date.substring(0, 4));
        if (year >= new Date().getFullYear() - 3) {
          score += 15;
        }
      } else if (preferences.era === 'classic' && item.release_date) {
        const year = parseInt(item.release_date.substring(0, 4));
        if (year < 2000) {
          score += 15;
        }
      }
      
      // Match content type preference
      if (preferences.contentType === 'movie' && item.media_type === 'movie') {
        score += 10;
      } else if (preferences.contentType === 'tv' && item.media_type === 'tv') {
        score += 10;
      }
      
      relevanceScores[item.id] = score;
    });
    
    // Sort by popularity first for initial ranking
    results.sort((a, b) => b.popularity - a.popularity);
    
    // Convert all the raw results to our format
    const contentItems = await Promise.all(results.map(item => adaptToWhat2WatchFormat(item)));
    
    // Sort recommendations by weighting relevance score, rating, and Reddit buzz
    const recommendations = contentItems.map((content) => {
      // Ensure content is treated as MovieTVShow
      const typedContent = content as MovieTVShow;
      const relevanceScore = relevanceScores[typedContent.id] || 0;
      
      // Add bonus points for high Reddit buzz
      let buzzBonus = 0;
      if (typedContent.redditBuzz === 'High') buzzBonus = 10;
      else if (typedContent.redditBuzz === 'Medium') buzzBonus = 5;
      
      // Final score combines relevance, rating, and Reddit buzz
      const finalScore = relevanceScore + (typedContent.rating / 2) + buzzBonus;
      
      return {
        content: typedContent,
        relevance_score: finalScore,
        rank: 0 // Will be assigned after sorting
      };
    });
    
    // Sort by final score and assign ranks
    recommendations.sort((a, b) => b.relevance_score - a.relevance_score);
    recommendations.forEach((rec, index) => {
      rec.rank = index + 1;
    });
    
    return recommendations.slice(0, 10);
  } catch (error) {
    console.error('Error getting recommendations:', error);
    return [];
  }
};

/**
 * Adapt TMDB content item to What2Watch format
 * @param item - TMDB content item
 * @returns Transformed content item in What2Watch format
 */
export const adaptToWhat2WatchFormat = async (item: tmdbService.TMDBContentItem) => {
  try {
    // Basic adaptation
    const title = item.title || item.name || 'Unknown Title';
    const type = item.media_type === 'tv' ? 'tv' : 'movie';
    const releaseYear = item.release_date 
      ? parseInt(item.release_date.substring(0, 4)) 
      : item.first_air_date 
        ? parseInt(item.first_air_date.substring(0, 4))
        : null;
    
    // Map TMDB genre IDs to human-readable genres
    const genreMap: {[key: number]: string} = {
      28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 
      80: 'Crime', 99: 'Documentary', 18: 'Drama', 10751: 'Family',
      14: 'Fantasy', 36: 'History', 27: 'Horror', 10402: 'Music',
      9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi', 10770: 'TV Movie',
      53: 'Thriller', 10752: 'War', 37: 'Western',
      // TV genres
      10759: 'Action', 10762: 'Kids', 10763: 'News', 10764: 'Reality',
      10765: 'Sci-Fi', 10766: 'Soap', 10767: 'Talk', 10768: 'War & Politics'
    };
    
    // Map genre IDs to names
    const genres = item.genre_ids?.map(id => genreMap[id] || `Genre ${id}`).filter(Boolean) || [];
    
    // Generate a random streaming platform (still use random until we implement streaming API)
    const streamingPlatforms = ['Netflix', 'Disney+', 'Hulu', 'Amazon Prime', 'HBO Max', 'Apple TV+'];
    const randomPlatformIndex = Math.floor(Math.random() * streamingPlatforms.length);
    
    // Get the poster URL from TMDB
    let posterUrl = tmdbService.getImageUrl(item.poster_path, tmdbService.PosterSize.LARGE);
    
    // Generate a fallback image if no poster is available
    if (!posterUrl) {
      // Check if backdrop image is available as fallback
      posterUrl = tmdbService.getImageUrl(item.backdrop_path, tmdbService.PosterSize.LARGE);
      
      // If still no image, use themed placeholders based on content type and title
      if (!posterUrl) {
        // Enhanced set of high-quality placeholder images with better variety
        const placeholders = {
          movie: [
            // Cinematic poster placeholders for movies
            'https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=500&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=500&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=500&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=500&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=500&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?q=80&w=500&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1542204165-65bf26472b9b?q=80&w=500&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1542204637-e67bc7d41e48?q=80&w=500&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=500&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1595769816263-9b910be24d5f?q=80&w=500&auto=format&fit=crop'
          ],
          tv: [
            // TV show themed placeholders
            'https://images.unsplash.com/photo-1593784991095-a205069470b6?q=80&w=500&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1586170737463-89ed234d7b8c?q=80&w=500&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1529798856831-427dfd0a1ab1?q=80&w=500&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?q=80&w=500&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?q=80&w=500&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1588514727390-91fd5ebaef81?q=80&w=500&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?q=80&w=500&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?q=80&w=500&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1512070904629-fa988dab2fe1?q=80&w=500&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1528928441742-b4ccac1bb04c?q=80&w=500&auto=format&fit=crop'
          ]
        };

        // Use consistent placeholder image based on content ID for same image on refresh
        const imageSeed = Math.abs(item.id % 10); // Ensure it's an index within array bounds
        posterUrl = placeholders[type][imageSeed];
      }
    }
    
    // Final fallback - if the system above fails, use a default image
    if (!posterUrl) {
      posterUrl = type === 'movie' 
        ? 'https://images.unsplash.com/photo-1542204165-65bf26472b9b?q=80&w=500&auto=format&fit=crop'
        : 'https://images.unsplash.com/photo-1593784991095-a205069470b6?q=80&w=500&auto=format&fit=crop';
    }
    
    // Generate some fake Reddit buzz for now
    const buzzLevels: ('Low' | 'Medium' | 'High')[] = ['Low', 'Medium', 'High'];
    const buzzIndex = Math.floor(item.vote_average / 3.5); // 0-10 scale to 0-2 index
    const redditBuzz = buzzLevels[Math.min(buzzIndex, 2)];

    // Generate realistic Rotten Tomatoes score that correlates with TMDB rating
    const baseScore = Math.round(item.vote_average * 10);
    const variation = Math.floor(Math.random() * 15) - 5; // -5 to +10 variation
    const rottenTomatoesScore = Math.max(0, Math.min(100, baseScore + variation));

    return {
      id: item.id,
      title,
      overview: item.overview,
      posterPath: posterUrl,
      type,
      rating: item.vote_average,
      genres: genres.length > 0 ? genres : ['Drama'], // Ensure we always have at least one genre
      streamingPlatform: streamingPlatforms[randomPlatformIndex],
      imdbRating: item.vote_average, // Using TMDB rating as IMDb for now
      rottenTomatoesScore,
      redditBuzz,
      releaseYear: releaseYear || new Date().getFullYear(), // Ensure releaseYear always has a value
    };
  } catch (error) {
    console.error('Error adapting content format:', error);
    
    // In case of error, return a minimal valid object with a placeholder image
    return {
      id: item.id || Math.floor(Math.random() * 100000),
      title: item.title || item.name || 'Unknown Title',
      overview: item.overview || 'No description available',
      posterPath: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=500&auto=format&fit=crop',
      type: 'movie',
      rating: item.vote_average || 5,
      genres: ['Drama'],
      releaseYear: new Date().getFullYear(),
      streamingPlatform: 'Netflix'
    };
  }
};

/**
 * Get trending content from TMDB
 * @returns Promise with trending content
 */
export const getTrendingContent = async () => {
  try {
    // Get multiple pages of content for more recommendations
    const trendingMoviesPage1 = await tmdbService.getPopularMovies(1);
    const trendingMoviesPage2 = await tmdbService.getPopularMovies(2);
    const trendingTVShowsPage1 = await tmdbService.getPopularTVShows(1);
    const trendingTVShowsPage2 = await tmdbService.getPopularTVShows(2);
    
    // Combine all results
    let results: tmdbService.TMDBContentItem[] = [
      ...trendingMoviesPage1.results.map(item => ({ ...item, media_type: 'movie' as const })),
      ...trendingMoviesPage2.results.map(item => ({ ...item, media_type: 'movie' as const })),
      ...trendingTVShowsPage1.results.map(item => ({ ...item, media_type: 'tv' as const })),
      ...trendingTVShowsPage2.results.map(item => ({ ...item, media_type: 'tv' as const }))
    ];
    
    // Sort by popularity
    results.sort((a, b) => b.popularity - a.popularity);
    
    // Convert to What2Watch format
    return await Promise.all(results.map(item => adaptToWhat2WatchFormat(item)));
  } catch (error) {
    console.error('Error getting trending content:', error);
    return [];
  }
}; 