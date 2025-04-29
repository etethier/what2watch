import { MovieTVShow } from '../types';
import * as tmdbService from './tmdb-service';

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
  };
};

/**
 * Get recommendations based on quiz answers
 * @param quizAnswers - Array of quiz answers from the user
 * @returns Promise with recommendation results
 */
export const getRecommendations = async (quizAnswers: QuizAnswer[]) => {
  const preferences = extractPreferences(quizAnswers);
  const { contentType, genres } = preferences;
  
  // Prepare genre string for API
  const genreString = genres.join(',');
  
  // Set parameters for discovery
  const params = {
    page: 1,
    sort_by: 'popularity.desc',
    with_genres: genreString,
    'vote_average.gte': 6.0, // Only include content with rating of 6+
  };

  try {
    let results: tmdbService.TMDBContentItem[] = [];
    
    // Get recommendations based on content type preference
    if (contentType === 'movie' || contentType === 'both') {
      const movieResults = await tmdbService.discoverMovies(params);
      results = [...results, ...movieResults.results];
    }
    
    if (contentType === 'tvShow' || contentType === 'both') {
      const tvResults = await tmdbService.discoverTVShows(params);
      results = [...results, ...tvResults.results];
    }
    
    // Sort by popularity (TMDB results are already sorted, but we want to mix movies and TV shows)
    results.sort((a, b) => b.popularity - a.popularity);
    
    // Return the top 10 results
    return results.slice(0, 10);
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
export const adaptToWhat2WatchFormat = (item: tmdbService.TMDBContentItem) => {
  // Generate a random value for redditBuzz
  const redditBuzzOptions = ['Low', 'Medium', 'High'];
  const randomBuzzIndex = Math.floor(Math.random() * redditBuzzOptions.length);
  
  // Generate a random streaming platform
  const streamingPlatforms = ['Netflix', 'Disney+', 'Hulu', 'Amazon Prime', 'HBO Max', 'Apple TV+'];
  const randomPlatformIndex = Math.floor(Math.random() * streamingPlatforms.length);
  
  // Ensure title is never undefined
  const contentTitle = item.media_type === 'movie' 
    ? (item.title || 'Untitled Movie') 
    : (item.name || 'Untitled TV Show');
  
  // Ensure the type is strictly 'movie' or 'tv' as required by MovieTVShow type
  const contentType = item.media_type === 'movie' ? 'movie' as const : 'tv' as const;
  
  return {
    id: item.id,
    title: contentTitle,
    overview: item.overview,
    posterPath: item.poster_path || '/placeholder-poster.jpg',
    type: contentType,
    rating: item.vote_average,
    genres: [], // Would need to fetch genre details separately
    streamingPlatform: streamingPlatforms[randomPlatformIndex],
    imdbRating: item.vote_average, // Using TMDB rating as a proxy
    rottenTomatoesScore: Math.round(item.vote_average * 10), // Approximate conversion
    redditBuzz: redditBuzzOptions[randomBuzzIndex],
  };
};

/**
 * Get trending content from TMDB
 * @returns Promise with trending content
 */
export const getTrendingContent = async () => {
  try {
    const trendingMovies = await tmdbService.getPopularMovies();
    const trendingTVShows = await tmdbService.getPopularTVShows();
    
    // Combine and sort by popularity
    const combined = [...trendingMovies.results, ...trendingTVShows.results];
    combined.sort((a, b) => b.popularity - a.popularity);
    
    // Return the top 10 results
    return combined.slice(0, 10);
  } catch (error) {
    console.error('Error getting trending content:', error);
    return [];
  }
}; 