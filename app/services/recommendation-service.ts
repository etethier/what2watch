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
  // Use our algorithm for Reddit buzz instead of random generation
  const releaseYear = item.media_type === 'movie' 
    ? (item.release_date ? parseInt(item.release_date.substring(0, 4)) : undefined)
    : (item.first_air_date ? parseInt(item.first_air_date.substring(0, 4)) : undefined);
  
  // Map TMDB genre IDs to human-readable genres for our algorithm
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
  
  // Ensure title is never undefined
  const contentTitle = item.media_type === 'movie' 
    ? (item.title || 'Untitled Movie') 
    : (item.name || 'Untitled TV Show');
  
  // Ensure the type is strictly 'movie' or 'tv' as required by MovieTVShow type
  const contentType = item.media_type === 'movie' ? 'movie' as const : 'tv' as const;
  
  // Get the full poster URL using the TMDB image service
  let posterUrl = tmdbService.getImageUrl(item.poster_path, tmdbService.PosterSize.LARGE);
  
  // Generate a fallback image if no poster is available
  if (!posterUrl) {
    // Check if backdrop image is available as fallback
    posterUrl = tmdbService.getImageUrl(item.backdrop_path, tmdbService.PosterSize.LARGE);
    
    // If still no image, use themed placeholders based on content type and title
    if (!posterUrl) {
      // Enhanced set of placeholder images for better variety
      const placeholders = {
        movie: [
          // Blockbuster movie poster styles
          'https://t4.ftcdn.net/jpg/03/08/50/39/360_F_308503931_PNApIvDatL3XZM8CnNgN6jZCg3RKBMgc.jpg',
          'https://t3.ftcdn.net/jpg/04/62/75/76/360_F_462757696_SWsnZNdOSZDcyCpJPMcU8PmQEgtCw6Jq.jpg',
          'https://t3.ftcdn.net/jpg/05/35/47/14/360_F_535471454_sOXFXrB5BEwbN7PnrxPOZPKaRQ9qkGzF.jpg',
          'https://thumbs.dreamstime.com/b/movie-film-poster-design-template-background-vintage-retro-style-can-be-used-backdrop-banner-brochure-leaflet-184121361.jpg',
          'https://previews.123rf.com/images/rassco/rassco1801/rassco180100287/94165529-film-noir-inspired-abstract-background-with-silhouette-of-a-woman-with-hat-and-trench-coat.jpg'
        ],
        tv: [
          // TV show poster styles 
          'https://img.freepik.com/premium-vector/retro-tv-poster-vintage-television-broadcast-advertising-promo-banner-illustration_102902-1946.jpg',
          'https://thumbs.dreamstime.com/b/tv-series-concept-vintage-cinema-poster-retro-television-old-style-vector-illustration-94804327.jpg',
          'https://as2.ftcdn.net/v2/jpg/05/24/24/95/1000_F_524249576_HTFkYIRGJPDmJ5eYpZl1tpVLqCdlJlQZ.jpg',
          'https://t4.ftcdn.net/jpg/05/29/81/39/360_F_529813974_GIkhhDWvLqcl3hLXHvEGtpfGUktHPPsB.jpg',
          'https://previews.123rf.com/images/seamartini/seamartini1609/seamartini160900562/64257088-television-show-premiere-poster-in-retro-style-tv-screen-with-rays-and-red-curtains-on-dark-beam.jpg'
        ]
      };
      
      // Add more specific genres with targeted placeholder images
      const genrePlaceholders: Record<string, string[]> = {
        'Action': [
          'https://img.freepik.com/premium-vector/action-movie-poster-design-template_27088-288.jpg',
          'https://img.freepik.com/premium-vector/car-chase-action-movie-poster-illustration_93487-5718.jpg'
        ],
        'Comedy': [
          'https://img.freepik.com/premium-vector/comedy-movie-cinema-poster-design-template_153935-36.jpg',
          'https://t3.ftcdn.net/jpg/04/07/01/00/360_F_407010016_WiqZoZfP66YdXxDpJbRidd4IItFo5DdF.jpg'
        ],
        'Drama': [
          'https://t4.ftcdn.net/jpg/02/91/88/15/360_F_291881521_3LvdYEwZ6H3QZnx3HqaYzKbzKjRvWAiz.jpg',
          'https://as1.ftcdn.net/v2/jpg/02/95/02/96/1000_F_295029616_J8bBK2SFvQRFLCxiBBf0oCZpGEnGCAIH.jpg'
        ],
        'Sci-Fi': [
          'https://t4.ftcdn.net/jpg/04/30/16/09/360_F_430160966_I8PY3VXqLCxks3eYcBAmje1NQkPpNgtx.jpg',
          'https://t4.ftcdn.net/jpg/05/11/07/43/360_F_511074341_fJ6CIgCiDML0LFGpijKWXcZD6RP5L02T.jpg'
        ],
        'Horror': [
          'https://img.freepik.com/premium-vector/horror-movie-poster-template-design_92497-270.jpg',
          'https://t3.ftcdn.net/jpg/04/38/92/54/360_F_438925433_xcZnZbgN4xnUxAVFGQYBl6JnZ1ZnKEUn.jpg'
        ],
        'Romance': [
          'https://t4.ftcdn.net/jpg/04/18/72/55/360_F_418725584_wd70rn0mgQVtYAkHdnEVglWfBFm3I8OG.jpg',
          'https://t3.ftcdn.net/jpg/04/39/44/08/360_F_439440883_rBWWu4CdxzFWQRb6bTDn2RY6iBWJuDUH.jpg'
        ]
      };
      
      // Check for specific genres to use more targeted placeholders
      if (item.genre_ids && item.genre_ids.length > 0) {
        // Map of genre IDs to genre names
        const genreMap: {[key: number]: string} = {
          28: 'Action', 35: 'Comedy', 18: 'Drama', 878: 'Sci-Fi', 
          27: 'Horror', 10749: 'Romance', 
          10759: 'Action', 10765: 'Sci-Fi'
        };
        
        // Find the first matching genre that has specific placeholders
        for (const genreId of item.genre_ids) {
          const genreName = genreMap[genreId];
          if (genreName && genrePlaceholders[genreName]) {
            const genreImages = genrePlaceholders[genreName];
            return genreImages[Math.floor(Math.random() * genreImages.length)];
          }
        }
      }
      
      // Create a deterministic index based on the content title
      // This ensures the same content always gets the same placeholder
      const titleSum = contentTitle.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const placeholderIndex = titleSum % placeholders[contentType].length;
      
      posterUrl = placeholders[contentType][placeholderIndex];
    }
  }
  
  // Create partial content object for Reddit buzz
  const contentForReddit: Partial<MovieTVShow> = {
    id: item.id,
    title: contentTitle,
    type: contentType,
    rating: item.vote_average,
    releaseYear,
    genres
  };
  
  // Use real Reddit data with algorithm as fallback
  // Note: This makes the function async
  const redditBuzz = await getRedditBuzzWithFallback(contentForReddit as MovieTVShow);
  
  // Generate random Rotten Tomatoes score that correlates with TMDB rating
  // This ensures higher-rated content also has higher RT scores
  const baseScore = Math.round(item.vote_average * 10);
  const variation = Math.floor(Math.random() * 15) - 5; // -5 to +10 variation
  const rottenTomatoesScore = Math.max(0, Math.min(100, baseScore + variation));
  
  return {
    id: item.id,
    title: contentTitle,
    overview: item.overview || '',
    posterPath: posterUrl || '',
    type: contentType,
    rating: item.vote_average,
    releaseYear,
    genres,
    streamingPlatform: streamingPlatforms[randomPlatformIndex],
    imdbRating: item.vote_average,  // Use TMDB rating as IMDb proxy
    rottenTomatoesScore,
    redditBuzz
  };
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