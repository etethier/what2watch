import { MovieTVShow } from '../types';
import * as tmdbService from './tmdb-service';
import { estimateRedditBuzz, getRedditBuzzWithFallback } from './reddit-service';

// Define QuizAnswer interface here since it's not exported from types
interface QuizAnswer {
  question: string;
  answer: string;
  genres_priority?: Array<{
    genre: string;
    priority: number;
  }>;
}

type MoodToGenreMap = {
  [key: string]: string[];
};

// Map moods to relevant genres
const MOOD_TO_GENRE_MAP: MoodToGenreMap = {
  laugh: ['35', '10751'], // Comedy, Family
  cry: ['18', '10749'], // Drama, Romance
  drama: ['18', '80', '10768'], // Drama, Crime, War & Politics
  'mind-blowing': ['878', '14', '9648'], // Sci-Fi, Fantasy, Mystery
  uplifting: ['35', '10751', '10749'], // Comedy, Family, Romance
  'plot-twists': ['9648', '53', '80'], // Mystery, Thriller, Crime
  cozy: ['10751', '35', '14'], // Family, Comedy, Fantasy
  dark: ['27', '53', '80'], // Horror, Thriller, Crime
  educational: ['99', '36', '10768'], // Documentary, History, War & Politics
  background: ['35', '10751', '10402'], // Comedy, Family, Music
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
  let prioritizedGenres: Array<{genre: string, priority: number}> = [];
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
    
    // Check for genres with priority information
    if (answer.question.includes('genre') && answer.genres_priority && answer.genres_priority.length > 0) {
      console.log('Found prioritized genres:', answer.genres_priority);
      prioritizedGenres = answer.genres_priority;
      
      // Map string genre values to TMDB genre IDs
      const genreToTMDBId: Record<string, string> = {
        'comedy': '35',
        'action': '28',
        'thriller': '53',
        'scifi-fantasy': '878',  // Using Sci-Fi as primary genre ID
        'romance': '10749',
        'documentary': '99',
        'true-crime': '80',      // Using Crime as closest match
        'animated': '16',
        'supernatural': '14',    // Using Fantasy as closest match
        'historical': '36'
      };
      
      // Extract genres array from the prioritized genres
      genres = prioritizedGenres.map(pg => {
        const genreKey = pg.genre.toLowerCase();
        return genreToTMDBId[genreKey] || '';
      }).filter(id => id !== ''); // Remove empty IDs
      
      // If we have prioritized genres, don't continue with other extraction methods
      return;
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
    prioritizedGenres,
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
    console.log('Getting recommendations with quiz answers:', quizAnswers);
    
    // Extract user preferences
    const preferences = extractPreferences(quizAnswers);
    console.log('Extracted preferences:', preferences);
    
    // Log the preferences to see what's being used
    console.log('Using preferences for recommendation:', {
      mood: preferences.mood,
      contentType: preferences.contentType,
      genres: preferences.genres,
      prioritizedGenres: preferences.prioritizedGenres, 
      duration: preferences.duration,
      era: preferences.era
    });
    
    // Fetch content items from TMDB based on genres
    let results: tmdbService.TMDBContentItem[] = [];
    
    // Get content for each genre with proper media type
    for (const genre of preferences.genres) {
      console.log(`Fetching content for genre ID ${genre}`);
      
      // Filter by media type based on user preference
      if (preferences.contentType === 'both' || preferences.contentType === 'movie') {
        const movieResults = await tmdbService.discoverMovies({ 
          with_genres: genre,
          // Add sorting by popularity to get diverse results
          sort_by: 'popularity.desc'
        });
        console.log(`Found ${movieResults.results.length} movies for genre ${genre}`);
        results = [
          ...results,
          ...movieResults.results.map(item => ({ ...item, media_type: 'movie' as const }))
        ];
      }
      
      if (preferences.contentType === 'both' || preferences.contentType === 'tvShow') {
        const tvResults = await tmdbService.discoverTVShows({ 
          with_genres: genre,
          // Add sorting by popularity to get diverse results
          sort_by: 'popularity.desc'
        });
        console.log(`Found ${tvResults.results.length} TV shows for genre ${genre}`);
        results = [
          ...results,
          ...tvResults.results.map(item => ({ ...item, media_type: 'tv' as const }))
        ];
      }
    }
    
    // If we didn't get results from genre search, try a broader approach
    if (results.length < 5) {
      console.log('Not enough genre-specific results, trying broader search');
      
      // Try to get trending/popular content as a fallback
      if (preferences.contentType === 'both' || preferences.contentType === 'movie') {
        const popularMovies = await tmdbService.getPopularMovies();
        results = [
          ...results,
          ...popularMovies.results.map(item => ({ ...item, media_type: 'movie' as const }))
        ];
      }
      
      if (preferences.contentType === 'both' || preferences.contentType === 'tvShow') {
        const popularTV = await tmdbService.getPopularTVShows();
        results = [
          ...results,
          ...popularTV.results.map(item => ({ ...item, media_type: 'tv' as const }))
        ];
      }
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
    
    console.log(`After deduplication, have ${results.length} results`);
    
    // Calculate content relevance based on user preferences
    const relevanceScores: Record<number, number> = {};
    results.forEach(item => {
      let score = 0;
      
      // Match genres (explicit match)
      item.genre_ids?.forEach(genreId => {
        // Base genre match score
        if (preferences.genres.includes(genreId.toString())) {
          score += 20; // Base score for genre match
          
          // Apply priority boosting if we have prioritized genres
          if (preferences.prioritizedGenres && preferences.prioritizedGenres.length > 0) {
            // Find matching prioritized genre
            const matchingGenreInfo = preferences.prioritizedGenres.find(pg => {
              const genreKey = pg.genre.toLowerCase();
              const genreToTMDBId: Record<string, string> = {
                'comedy': '35',
                'action': '28',
                'thriller': '53',
                'scifi-fantasy': '878',  // Using Sci-Fi as primary genre ID
                'romance': '10749',
                'documentary': '99',
                'true-crime': '80',      // Using Crime as closest match
                'animated': '16',
                'supernatural': '14',    // Using Fantasy as closest match
                'historical': '36'
              };
              return genreToTMDBId[genreKey] === genreId.toString();
            });
            
            if (matchingGenreInfo) {
              // Calculate priority boost - higher priority (lower number) gets higher boost
              // Priority 1: +30, Priority 2: +20, Priority 3: +10
              const priorityBoost = (4 - matchingGenreInfo.priority) * 10;
              score += priorityBoost;
              console.log(`Applied priority boost of ${priorityBoost} for genre with priority ${matchingGenreInfo.priority}`);
            }
          }
        }
      });
      
      // Popularity bonus (with a cap to prevent overwhelming other factors)
      score += Math.min(item.popularity / 10, 10);
      
      // Rating bonus
      score += item.vote_average * 2;
      
      // Match era preference
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
      
      // Match content type preference with higher weight
      if (preferences.contentType === 'movie' && item.media_type === 'movie') {
        score += 15;
      } else if (preferences.contentType === 'tvShow' && item.media_type === 'tv') {
        score += 15;
      }
      
      // Add some randomization to avoid always recommending the same items
      // This helps break ties between similar items
      score += Math.random() * 5;
      
      relevanceScores[item.id] = score;
    });
    
    // Convert all the raw results to our format
    const contentItems = await Promise.all(results.map(item => adaptToWhat2WatchFormat(item)));
    
    // Sort recommendations by weighting relevance score, rating, and Reddit buzz
    const recommendations = contentItems.map((content) => {
      // Ensure content is treated as MovieTVShow
      const typedContent = content as MovieTVShow;
      const relevanceScore = relevanceScores[typedContent.id] || 0;
      
      // Add bonus points for high Reddit buzz - INCREASED WEIGHT
      let buzzBonus = 0;
      if (typedContent.redditBuzz === 'High') buzzBonus = 20; // Increased from 10
      else if (typedContent.redditBuzz === 'Medium') buzzBonus = 10; // Increased from 5
      else if (typedContent.redditBuzz === 'Low') buzzBonus = 2; // Added small bonus for low buzz
      
      // Add bonus points for Rotten Tomatoes score
      let rtBonus = 0;
      if (typedContent.rottenTomatoesScore) {
        if (typedContent.rottenTomatoesScore >= 90) rtBonus = 25; // "Certified Fresh" equivalent
        else if (typedContent.rottenTomatoesScore >= 75) rtBonus = 15; // "Fresh" equivalent
        else if (typedContent.rottenTomatoesScore >= 60) rtBonus = 5; // "Mixed" equivalent
      }
      
      // Add bonus points for IMDb rating
      let imdbBonus = 0;
      if (typedContent.imdbRating) {
        if (typedContent.imdbRating >= 8.5) imdbBonus = 25; // Exceptional rating
        else if (typedContent.imdbRating >= 7.5) imdbBonus = 15; // Very good rating
        else if (typedContent.imdbRating >= 6.5) imdbBonus = 5; // Above average rating
      }
      
      // Final score combines all factors - weighted toward external ratings
      // Previously: relevanceScore + (typedContent.rating / 2) + buzzBonus
      const finalScore = (relevanceScore * 0.6) + // Genre/preference match at 60% weight
                        (typedContent.rating * 0.5) + // Basic rating at half weight
                        buzzBonus + // Reddit bonus
                        rtBonus + // Rotten Tomatoes bonus 
                        imdbBonus; // IMDb bonus
      
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
    
    console.log(`Returning ${Math.min(recommendations.length, 10)} recommendations`);
    
    return recommendations.slice(0, 10);
  } catch (error) {
    console.error('Error getting recommendations:', error);
    // Return an empty array instead of falling back to sample data
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
    const type = item.media_type === 'tv' ? 'tv' as const : 'movie' as const;
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

    // Generate realistic IMDb rating that correlates with TMDB rating but with less variance
    // IMDb typically has less extreme scores than Rotten Tomatoes
    const imdbVariation = (Math.random() * 1.0) - 0.5; // -0.5 to +0.5 variation
    const imdbRating = Math.max(1, Math.min(10, item.vote_average + imdbVariation));

    return {
      id: item.id,
      title,
      overview: item.overview,
      posterPath: posterUrl,
      type,
      rating: item.vote_average,
      genres: genres.length > 0 ? genres : ['Drama'], // Ensure we always have at least one genre
      streamingPlatform: streamingPlatforms[randomPlatformIndex],
      imdbRating, // Using enhanced IMDb calculation
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
      type: item.media_type === 'tv' ? 'tv' as const : 'movie' as const,
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

/**
 * Get recommendations with A/B testing between different algorithms
 * @param quizAnswers - Array of quiz answers from the user
 * @param testGroup - Optional test group identifier (A or B)
 * @returns Promise with recommendation results
 */
export const getRecommendationsWithABTest = async (quizAnswers: any[], testGroup?: string) => {
  try {
    // If testGroup is not provided, randomly assign one
    const group = testGroup || (Math.random() > 0.5 ? 'A' : 'B');
    
    // Create a record of which algorithm was used
    if (typeof window !== 'undefined') {
      localStorage.setItem('recommendation_algorithm', group);
    }
    
    // Group A: Current algorithm
    if (group === 'A') {
      console.log('Using algorithm A: Standard recommendations');
      return getRecommendations(quizAnswers);
    }
    
    // Group B: Enhanced algorithm with multiple TMDB endpoints
    console.log('Using algorithm B: Enhanced recommendations with multiple TMDB endpoints');
    return getEnhancedRecommendations(quizAnswers);
  } catch (error) {
    console.error('Error getting recommendations with A/B test:', error);
    return [];
  }
};

/**
 * Get enhanced recommendations using multiple TMDB endpoints
 * @param quizAnswers - Array of quiz answers from the user
 * @returns Promise with enhanced recommendation results
 */
export const getEnhancedRecommendations = async (quizAnswers: QuizAnswer[]) => {
  try {
    // Extract user preferences
    const preferences = extractPreferences(quizAnswers);
    
    // Determine content type
    const contentType = preferences.contentType === 'both' ? 'both' : 
                       (preferences.contentType === 'movie' ? 'movie' : 'tv');
    
    // Step 1: Get comprehensive content as a starting point
    let results = await tmdbService.fetchComprehensiveContent(contentType as 'movie' | 'tv' | 'both', 2);
    
    // Step 2: Get content for each genre with proper media type
    for (const genre of preferences.genres) {
      if (contentType === 'movie' || contentType === 'both') {
        const genreMovies = await tmdbService.getContentByGenre(
          parseInt(genre), 
          'movie'
        );
        results = [...results, ...genreMovies.results];
      }
      
      if (contentType === 'tv' || contentType === 'both') {
        const genreTV = await tmdbService.getContentByGenre(
          parseInt(genre), 
          'tv'
        );
        results = [...results, ...genreTV.results];
      }
    }
    
    // Step 3: If user prefers new content, get upcoming movies
    if (preferences.era === 'new' && (contentType === 'movie' || contentType === 'both')) {
      const upcomingMovies = await tmdbService.getUpcomingMovies();
      results = [...results, ...upcomingMovies.results];
    }
    
    // Step 4: If user prefers classic content, get content by time period
    if (preferences.era === 'classic') {
      const classicYearRanges = [[1970, 1979], [1980, 1989], [1990, 1999]];
      
      for (const [startYear, endYear] of classicYearRanges) {
        if (contentType === 'movie' || contentType === 'both') {
          const classicMovies = await tmdbService.getContentByTimePeriod(
            startYear, 
            endYear, 
            'movie'
          );
          results = [...results, ...classicMovies.results];
        }
        
        if (contentType === 'tv' || contentType === 'both') {
          const classicTV = await tmdbService.getContentByTimePeriod(
            startYear, 
            endYear, 
            'tv'
          );
          results = [...results, ...classicTV.results];
        }
      }
    }
    
    // Step 5: Deduplicate results
    const uniqueIds = new Set();
    results = results.filter(item => {
      if (uniqueIds.has(item.id)) {
        return false;
      }
      uniqueIds.add(item.id);
      return true;
    });
    
    // Step 6: Calculate content relevance based on preferences
    const relevanceScores: Record<number, number> = {};
    results.forEach(item => {
      let score = 0;
      
      // Match genres (explicit match)
      item.genre_ids?.forEach(genreId => {
        if (preferences.genres.includes(genreId.toString())) {
          score += 20;
          
          // Apply priority boosting if we have prioritized genres
          if (preferences.prioritizedGenres && preferences.prioritizedGenres.length > 0) {
            // Find matching prioritized genre
            const matchingGenreInfo = preferences.prioritizedGenres.find(pg => {
              const genreKey = pg.genre.toLowerCase();
              const genreToTMDBId: Record<string, string> = {
                'comedy': '35',
                'action': '28',
                'thriller': '53',
                'scifi-fantasy': '878',  // Using Sci-Fi as primary genre ID
                'romance': '10749',
                'documentary': '99',
                'true-crime': '80',      // Using Crime as closest match
                'animated': '16',
                'supernatural': '14',    // Using Fantasy as closest match
                'historical': '36'
              };
              return genreToTMDBId[genreKey] === genreId.toString();
            });
            
            if (matchingGenreInfo) {
              // Calculate priority boost - higher priority (lower number) gets higher boost
              // Priority 1: +30, Priority 2: +20, Priority 3: +10
              const priorityBoost = (4 - matchingGenreInfo.priority) * 10;
              score += priorityBoost;
              console.log(`Enhanced algorithm: Applied priority boost of ${priorityBoost} for genre with priority ${matchingGenreInfo.priority}`);
            }
          }
        }
      });
      
      // Popularity bonus
      score += Math.min(item.popularity / 10, 10);
      
      // Rating bonus
      score += item.vote_average * 2;
      
      // Top-rated bonus
      if (item.vote_average >= 8 && item.vote_count > 1000) {
        score += 15;
      }
      
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
    
    // Step 7: Convert all the raw results to our format
    const contentItems = await Promise.all(results.map(item => adaptToWhat2WatchFormat(item)));
    
    // Step 8: Apply final scoring and ranking
    const recommendations = contentItems.map((content) => {
      // Ensure content is treated as MovieTVShow
      const typedContent = content as MovieTVShow;
      const relevanceScore = relevanceScores[typedContent.id] || 0;
      
      // Add bonus points for high Reddit buzz - INCREASED WEIGHT
      let buzzBonus = 0;
      if (typedContent.redditBuzz === 'High') buzzBonus = 20; // Increased from 10
      else if (typedContent.redditBuzz === 'Medium') buzzBonus = 10; // Increased from 5
      else if (typedContent.redditBuzz === 'Low') buzzBonus = 2; // Added small bonus for low buzz
      
      // Add bonus points for Rotten Tomatoes score
      let rtBonus = 0;
      if (typedContent.rottenTomatoesScore) {
        if (typedContent.rottenTomatoesScore >= 90) rtBonus = 25; // "Certified Fresh" equivalent
        else if (typedContent.rottenTomatoesScore >= 75) rtBonus = 15; // "Fresh" equivalent
        else if (typedContent.rottenTomatoesScore >= 60) rtBonus = 5; // "Mixed" equivalent
      }
      
      // Add bonus points for IMDb rating
      let imdbBonus = 0;
      if (typedContent.imdbRating) {
        if (typedContent.imdbRating >= 8.5) imdbBonus = 25; // Exceptional rating
        else if (typedContent.imdbRating >= 7.5) imdbBonus = 15; // Very good rating
        else if (typedContent.imdbRating >= 6.5) imdbBonus = 5; // Above average rating
      }
      
      // Final score combines all factors - weighted toward external ratings
      // Previously: relevanceScore + (typedContent.rating / 2) + buzzBonus
      const finalScore = (relevanceScore * 0.6) + // Genre/preference match at 60% weight
                        (typedContent.rating * 0.5) + // Basic rating at half weight
                        buzzBonus + // Reddit bonus
                        rtBonus + // Rotten Tomatoes bonus 
                        imdbBonus; // IMDb bonus
      
      return {
        content: typedContent,
        relevance_score: finalScore,
        rank: 0 // Will be assigned after sorting
      };
    });
    
    // Step 9: Sort by final score and assign ranks
    recommendations.sort((a, b) => b.relevance_score - a.relevance_score);
    recommendations.forEach((rec, index) => {
      rec.rank = index + 1;
    });
    
    // Return top 20 recommendations
    return recommendations.slice(0, 20);
  } catch (error) {
    console.error('Error getting enhanced recommendations:', error);
    return [];
  }
};

/**
 * Store content items in Supabase database for faster retrieval
 * @param contentItems - Array of MovieTVShow items to store
 * @returns Promise with success status
 */
export const storeContentInDatabase = async (contentItems: MovieTVShow[]): Promise<boolean> => {
  try {
    // Ensure we have the supabase client
    const { supabase } = await import('../services/supabase');
    
    if (!supabase) {
      console.error('Supabase client not available');
      return false;
    }
    
    // Prepare the data for insertion
    const formattedData = contentItems.map(item => ({
      id: item.id,
      title: item.title,
      overview: item.overview,
      poster_path: item.posterPath,
      type: item.type,
      rating: item.rating,
      genres: item.genres,
      release_year: item.releaseYear,
      streaming_platform: item.streamingPlatform,
      imdb_rating: item.imdbRating,
      rotten_tomatoes_score: item.rottenTomatoesScore,
      reddit_buzz: item.redditBuzz,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
    
    // Insert the data, using upsert to avoid duplicates
    const { error } = await supabase
      .from('content_library')
      .upsert(formattedData, { onConflict: 'id' });
    
    if (error) {
      console.error('Error storing content in database:', error);
      return false;
    }
    
    console.log(`Successfully stored ${contentItems.length} content items in database`);
    return true;
  } catch (error) {
    console.error('Unexpected error storing content in database:', error);
    return false;
  }
};

/**
 * Get content from Supabase database
 * @param filters - Optional filters to apply
 * @returns Promise with content items
 */
export const getContentFromDatabase = async (filters?: {
  type?: 'movie' | 'tv',
  genreContains?: string[],
  releaseYearGte?: number,
  releaseYearLte?: number,
  ratingGte?: number,
  limit?: number
}): Promise<MovieTVShow[]> => {
  try {
    // Ensure we have the supabase client
    const { supabase } = await import('../services/supabase');
    
    if (!supabase) {
      console.error('Supabase client not available');
      return [];
    }
    
    // Start building the query
    let query = supabase.from('content_library').select('*');
    
    // Apply filters if provided
    if (filters) {
      if (filters.type) {
        query = query.eq('type', filters.type);
      }
      
      if (filters.genreContains && filters.genreContains.length > 0) {
        // This assumes genres is stored as an array in Supabase
        // and uses the "array contains" operator
        query = query.contains('genres', filters.genreContains);
      }
      
      if (filters.releaseYearGte) {
        query = query.gte('release_year', filters.releaseYearGte);
      }
      
      if (filters.releaseYearLte) {
        query = query.lte('release_year', filters.releaseYearLte);
      }
      
      if (filters.ratingGte) {
        query = query.gte('rating', filters.ratingGte);
      }
      
      if (filters.limit) {
        query = query.limit(filters.limit);
      }
    }
    
    // Execute the query
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching content from database:', error);
      return [];
    }
    
    if (!data || data.length === 0) {
      console.log('No content found in database matching filters');
      return [];
    }
    
    // Convert database format to MovieTVShow format
    const contentItems: MovieTVShow[] = data.map(item => ({
      id: item.id,
      title: item.title,
      overview: item.overview,
      posterPath: item.poster_path,
      type: item.type,
      rating: item.rating,
      genres: item.genres,
      releaseYear: item.release_year,
      streamingPlatform: item.streaming_platform,
      imdbRating: item.imdb_rating,
      rottenTomatoesScore: item.rotten_tomatoes_score,
      redditBuzz: item.reddit_buzz
    }));
    
    console.log(`Retrieved ${contentItems.length} content items from database`);
    return contentItems;
  } catch (error) {
    console.error('Unexpected error getting content from database:', error);
    return [];
  }
}; 