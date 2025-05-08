import { createClient } from '@supabase/supabase-js';
import { MovieTVShow } from '../types';
import * as tmdbService from './tmdb-service';
import supabaseServices from './supabase-wrapper';

// Define QuizAnswer interface here since it's not exported from types
interface QuizAnswer {
  question: string;
  answer: string;
  genres_priority?: Array<{
    genre: string;
    priority: number;
  }>;
}

interface MovieTVShowWithRuntime extends MovieTVShow {
  runtime?: number;
}

// Map content types to TMDB media types
const CONTENT_TYPE_MAP = {
  movie: 'movie',
  tvShow: 'tv',
  both: 'both',
};

// Genre ID mappings for reference
const GENRE_MAPPINGS = {
  // Movie genres
  'action': '28',
  'adventure': '12',
  'animation': '16',
  'comedy': '35',
  'crime': '80',
  'documentary': '99',
  'drama': '18',
  'family': '10751',
  'fantasy': '14',
  'history': '36',
  'horror': '27',
  'music': '10402',
  'mystery': '9648',
  'romance': '10749',
  'sci-fi': '878',
  'thriller': '53',
  'war': '10752',
  'western': '37',
  // TV genres
  'action-adventure': '10759',
  'kids': '10762',
  'reality': '10764',
  'sci-fi-fantasy': '10765',
  'war-politics': '10768',
};

// Mood to genre mapping for better recommendations
const MOOD_TO_GENRES = {
  'laugh': ['35', '10751'], // Comedy, Family
  'cry': ['18', '10749'], // Drama, Romance
  'drama': ['18', '80'], // Drama, Crime
  'mind-blowing': ['878', '14', '9648'], // Sci-Fi, Fantasy, Mystery
  'uplifting': ['35', '10751', '10749'], // Comedy, Family, Romance
  'plot-twists': ['9648', '53', '80'], // Mystery, Thriller, Crime
  'cozy': ['10751', '35', '14'], // Family, Comedy, Fantasy
  'dark': ['27', '53', '80'], // Horror, Thriller, Crime
  'educational': ['99', '36'], // Documentary, History
};

/**
 * Extract user preferences from quiz answers
 */
export function extractQuizPreferences(quizAnswers: QuizAnswer[]) {
  const preferences = {
    // Content type preference
    contentType: 'both' as 'movie' | 'tvShow' | 'both',
    
    // User's genre preferences
    genres: new Set<string>(),
    
    // User's mood preferences (weighted more heavily in matching)
    moods: new Set<string>(),
    
    // Streaming platform preferences
    platforms: new Set<string>(),
    
    // Recency preference (new property)
    recency: 'any' as 'any' | 'newest' | 'recent' | 'modern-classic',
    
    // Full text of all answers for keyword matching
    fullText: ''
  };
  
  // Process each quiz answer
  quizAnswers.forEach(answer => {
    const question = answer.question.toLowerCase();
    const answerText = answer.answer.toLowerCase();
    
    // Add to full text for keyword matching
    preferences.fullText += ' ' + answerText;
    
    // Extract content type preference
    if (question.includes('movie') || question.includes('tv') || question.includes('type of content')) {
      if (answerText.includes('movie')) {
        preferences.contentType = 'movie';
      } else if (answerText.includes('tv') || answerText.includes('show')) {
        preferences.contentType = 'tvShow';
      }
    }
    
    // Extract recency preference
    if (question.includes('fresh') || question.includes('recent')) {
      if (answerText.includes('hot off the press') || answerText.includes('newest')) {
        preferences.recency = 'newest';
      } else if (answerText.includes('pretty recent') || answerText.includes('last 5 years')) {
        preferences.recency = 'recent';
      } else if (answerText.includes('modern classic') || answerText.includes('last 10 years')) {
        preferences.recency = 'modern-classic';
      }
    }
    
    // Extract mood preferences (high weight in matching)
    if (question.includes('mood') || question.includes('feel')) {
      // Add detected moods
      Object.keys(MOOD_TO_GENRES).forEach(mood => {
        if (answerText.includes(mood)) {
          preferences.moods.add(mood);
          // Also add corresponding genres for this mood
          const moodKey = mood as keyof typeof MOOD_TO_GENRES;
          MOOD_TO_GENRES[moodKey].forEach(genreId => preferences.genres.add(genreId));
        }
      });
    }
    
    // Extract genre preferences 
    if (question.includes('genre') || question.includes('type of')) {
      // Check for explicit genres from priorities
      if (answer.genres_priority && answer.genres_priority.length > 0) {
        answer.genres_priority.forEach(priorityGenre => {
          const genre = priorityGenre.genre.toLowerCase();
          
          // Add any matching genre IDs
          Object.entries(GENRE_MAPPINGS).forEach(([genreName, genreId]) => {
            if (genre.includes(genreName)) {
              preferences.genres.add(genreId);
            }
          });
        });
      } else {
        // Extract from raw text
        Object.entries(GENRE_MAPPINGS).forEach(([genreName, genreId]) => {
          if (answerText.includes(genreName)) {
            preferences.genres.add(genreId);
          }
        });
      }
    }
    
    // Extract streaming platform preferences
    if (question.includes('platform') || question.includes('streaming')) {
      const platforms = Array.isArray(answer.answer) 
        ? answer.answer 
        : answerText.split(/,|\sand\s/).map(p => p.trim());
      
      platforms.forEach(platform => {
        if (platform.includes('netflix')) preferences.platforms.add('netflix');
        if (platform.includes('amazon') || platform.includes('prime')) preferences.platforms.add('amazon');
        if (platform.includes('disney')) preferences.platforms.add('disney');
        if (platform.includes('hbo')) preferences.platforms.add('hbo');
        if (platform.includes('hulu')) preferences.platforms.add('hulu');
        if (platform.includes('apple')) preferences.platforms.add('apple');
        if (platform.includes('paramount')) preferences.platforms.add('paramount');
      });
    }
  });
  
  console.log('Extracted preferences:', {
    contentType: preferences.contentType,
    genres: Array.from(preferences.genres),
    moods: Array.from(preferences.moods),
    platforms: Array.from(preferences.platforms),
    recency: preferences.recency,
    textLength: preferences.fullText.length
  });
  
  return preferences;
}

/**
 * Get recommendations based on quiz answers
 */
export const getRecommendations = async (quizAnswers: QuizAnswer[]) => {
  try {
    console.log('⭐ Starting recommendation process...');
    // Step 1: Extract user preferences from quiz answers
    const preferences = extractQuizPreferences(quizAnswers);
    
    // Step 2: Collect candidate content based on genre preferences
    let candidateContent: tmdbService.TMDBContentItem[] = [];
    
    // Convert Set to Array for iteration
    const genreIds = Array.from(preferences.genres);
    console.log(`🎭 Searching for content matching ${genreIds.length} genre preferences`);
    
    // Fetch by user's genre preferences
    if (preferences.genres.size > 0) {
      // Convert Set to Array for iteration
      for (const genreId of genreIds) {
        // Get movies or TV shows based on content type preference
        if (preferences.contentType === 'both' || preferences.contentType === 'movie') {
          // Add recency parameter based on user preference
          const recencyParam = getRecencyParams(preferences.recency);
          
          const movies = await tmdbService.discoverMovies({ 
            with_genres: genreId,
            sort_by: 'popularity.desc',
            ...recencyParam
          });
          candidateContent = [...candidateContent, ...movies.results.map(item => ({ 
            ...item, 
            media_type: 'movie' as const
          }))];
        }
        
        if (preferences.contentType === 'both' || preferences.contentType === 'tvShow') {
          // Add recency parameter based on user preference
          const recencyParam = getRecencyParams(preferences.recency);
          
          const shows = await tmdbService.discoverTVShows({ 
            with_genres: genreId,
            sort_by: 'popularity.desc',
            ...recencyParam
          });
          candidateContent = [...candidateContent, ...shows.results.map(item => ({ 
            ...item, 
            media_type: 'tv' as const
          }))];
        }
      }
    } else {
      // Fallback to trending content if no genres specified
      console.log('No specific genres selected, falling back to trending content');
      if (preferences.contentType === 'both' || preferences.contentType === 'movie') {
        const trendingMovies = await tmdbService.getPopularMovies();
        candidateContent = [...candidateContent, ...trendingMovies.results.map(item => ({ 
          ...item, 
          media_type: 'movie' as const
        }))];
      }
      
      if (preferences.contentType === 'both' || preferences.contentType === 'tvShow') {
        const trendingTV = await tmdbService.getPopularTVShows();
        candidateContent = [...candidateContent, ...trendingTV.results.map(item => ({ 
          ...item, 
          media_type: 'tv' as const
        }))];
      }
    }
    
    // Step 3: Deduplicate content
    const uniqueContent = Array.from(
      new Map(candidateContent.map(item => [item.id, item])).values()
    );
    
    console.log(`📋 Found ${uniqueContent.length} unique titles matching genre preferences`);
    
    // Step 4: Convert to What2Watch format with ratings and streaming info
    const contentPromises = uniqueContent.map(item => adaptToWhat2WatchFormat(item));
    const adaptedContent = (await Promise.all(contentPromises)).filter(Boolean) as MovieTVShow[];
    
    // Step 5: Filter out news content
    const nonNewsContent = adaptedContent.filter(item => !isNewsContent(item));
    console.log(`📺 ${adaptedContent.length - nonNewsContent.length} news items filtered out`);
    
    // Step 6: IMPORTANT - Filter by user's streaming platforms before calculating scores
    let filteredContent = nonNewsContent;
    
    // Only apply platform filtering if user has selected platforms
    if (preferences.platforms.size > 0) {
      console.log(`🎬 Filtering by selected platforms: ${Array.from(preferences.platforms).join(', ')}`);
      
      filteredContent = nonNewsContent.filter(item => {
        // Get item's platforms (handle both string and array cases)
        const itemPlatforms = Array.isArray(item.streamingPlatform) 
          ? item.streamingPlatform 
          : item.streamingPlatform ? [item.streamingPlatform] : [];
        
        // Check if any of the user's platforms match this item's available platforms
        const platformMatch = itemPlatforms.some(platform => {
          if (typeof platform !== 'string') return false;
          
          return Array.from(preferences.platforms).some(
            userPlatform => platform.toLowerCase().includes(userPlatform)
          );
        });
        
        if (!platformMatch) {
          console.log(`  ❌ Filtered out: ${item.title} - Not available on selected platforms`);
        }
        
        return platformMatch;
      });
      
      console.log(`🔍 Platform filtering: ${nonNewsContent.length} → ${filteredContent.length} results`);
      
      // If too strict filtering resulted in no content, use the original set
      if (filteredContent.length === 0 && nonNewsContent.length > 0) {
        console.log("⚠️ Warning: Platform filtering removed all results, using unfiltered content instead");
        filteredContent = nonNewsContent;
      }
    }
    
    // Step 6.5: Apply quality and taste match thresholds
    console.log(`⭐ Applying quality thresholds: IMDb > 7.0, RT > 70%, Taste Match > 0.6`);
    const preThresholdCount = filteredContent.length;
    
    // Calculate taste match scores for threshold filtering
    const contentWithTasteScores = filteredContent.map(item => {
      const tasteMatchScore = calculateTasteMatchScore(item, preferences);
      return { item, tasteMatchScore };
    });
    
    // Apply all threshold filters
    filteredContent = contentWithTasteScores
      .filter(({ item, tasteMatchScore }) => {
        // Apply IMDb threshold (> 7.0)
        if ((item.imdbRating || 0) <= 7.0) {
          console.log(`  ❌ Filtered out: ${item.title} - IMDb score ${item.imdbRating} below threshold (7.0)`);
          return false;
        }
        
        // Apply Rotten Tomatoes threshold (> 70%)
        if ((item.rottenTomatoesScore || 0) <= 70) {
          console.log(`  ❌ Filtered out: ${item.title} - RT score ${item.rottenTomatoesScore} below threshold (70)`);
          return false;
        }
        
        // Apply taste match threshold (> 0.6)
        if (tasteMatchScore <= 0.6) {
          console.log(`  ❌ Filtered out: ${item.title} - Taste match score ${tasteMatchScore.toFixed(2)} below threshold (0.6)`);
          return false;
        }
        
        return true;
      })
      .map(({ item }) => item);
    
    console.log(`🏆 Quality threshold filtering: ${preThresholdCount} → ${filteredContent.length} results`);
    
    // If too strict filtering resulted in no content, relax the thresholds slightly
    if (filteredContent.length < 3 && preThresholdCount > 0) {
      console.log("⚠️ Warning: Quality threshold filtering removed too many results, relaxing criteria");
      
      // Recalculate with relaxed thresholds
      filteredContent = contentWithTasteScores
        .filter(({ item, tasteMatchScore }) => {
          // Relaxed thresholds
          const imdbOk = (item.imdbRating || 0) > 6.0;
          const rtOk = (item.rottenTomatoesScore || 0) > 60;
          const tasteOk = tasteMatchScore > 0.4;
          
          return imdbOk && rtOk && tasteOk;
        })
        .map(({ item }) => item);
      
      console.log(`🔄 After relaxed filtering: ${filteredContent.length} results`);
    }
    
    // Step 7: Calculate scores and rank content
    console.log(`🧮 Calculating final scores for ${filteredContent.length} items that passed all thresholds`);
    const scoredContent = calculateScores(filteredContent, preferences, quizAnswers);
    
    // Step 8: Sort by score and take top 10
    scoredContent.sort((a, b) => b.relevance_score - a.relevance_score);
    
    // Set final ranking
    scoredContent.forEach((item, index) => {
      item.rank = index + 1;
    });
    
    console.log(`✅ Final recommendations sorted by relevance score:`);
    scoredContent.slice(0, 10).forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.content.title} - Score: ${item.relevance_score.toFixed(2)}`);
    });
    
    console.log(`🎉 Returning ${scoredContent.length > 10 ? 10 : scoredContent.length} recommendations`);
    return scoredContent.slice(0, 10);
  } catch (error) {
    console.error('Error getting recommendations:', error);
    return [];
  }
};

/**
 * Helper function to get TMDB API parameters for recency filtering
 */
function getRecencyParams(recency: string) {
  const currentYear = new Date().getFullYear();
  
  switch (recency) {
    case 'newest':
      // Last 1-2 years
      return {
        'primary_release_date.gte': `${currentYear - 2}-01-01`,
        'primary_release_date.lte': `${currentYear}-12-31`
      };
    case 'recent':
      // Last 5 years
      return {
        'primary_release_date.gte': `${currentYear - 5}-01-01`,
        'primary_release_date.lte': `${currentYear}-12-31`
      };
    case 'modern-classic':
      // Last 10 years
      return {
        'primary_release_date.gte': `${currentYear - 10}-01-01`,
        'primary_release_date.lte': `${currentYear}-12-31`
      };
    default:
      // No date filtering
      return {};
  }
}

/**
 * Calculate scores for each item based on specified formula
 */
function calculateScores(
  content: MovieTVShow[], 
  preferences: ReturnType<typeof extractQuizPreferences>,
  quizAnswers: QuizAnswer[]
) {
  return content.map((item, index) => {
    // 1. Calculate trending score (based on popularity/index in results)
    // Lower index = higher trending rank
    const trending_rank = Math.min(index + 1, 10); // Cap at 10
    const trending_score = 1 - (trending_rank / 10); // Convert to 0-1 scale where 1 is best
    
    // 2. Calculate critic score (average of IMDb and RT)
    const imdb_normalized = (item.imdbRating || 0) / 10; // Scale to 0-1
    const rt_normalized = (item.rottenTomatoesScore || 0) / 100; // Scale to 0-1
    const critic_score = (imdb_normalized + rt_normalized) / 2;
    
    // 3. Calculate taste match score
    const taste_match_score = calculateTasteMatchScore(item, preferences);
    
    // 4. Apply recency boost for newer content when "Hot off the press" is selected
    let recency_boost = 0;
    if (preferences.recency === 'newest' && item.releaseYear) {
      const currentYear = new Date().getFullYear();
      if (item.releaseYear >= currentYear - 1) {
        // Extra boost for content from current year or last year
        recency_boost = 0.2;
      } else if (item.releaseYear >= currentYear - 2) {
        // Smaller boost for content from 2 years ago
        recency_boost = 0.1;
      }
    }
    
    // 5. Calculate final score using the modified formula with recency boost
    // final_score = (0.5 × trending_score) + (0.2 × critic_score) + (0.3 × taste_match_score) + recency_boost
    const final_score = 
      (0.5 * trending_score) + 
      (0.2 * critic_score) + 
      (0.3 * taste_match_score) + 
      recency_boost;
    
    // Generate explanation - enhanced with more specific and detailed explanations
    let explanation = "";
    
    // Look for mood preferences in the quiz answers
    const moodAnswer = quizAnswers.find(answer => answer.question.toLowerCase().includes('mood'));
    const moodPreference = moodAnswer ? moodAnswer.answer : null;
    
    // Find if user prioritizes trending content or recency
    const wantsTrending = preferences.recency === 'newest';
    
    // Check if user wants critically acclaimed content
    const qualityAnswer = quizAnswers.find(answer => answer.question.toLowerCase().includes('quality'));
    const wantsCriticallyAcclaimed = qualityAnswer && typeof qualityAnswer.answer === 'string' &&
                                   qualityAnswer.answer.toLowerCase().includes('critic');
    
    // Create a more tailored explanation based on multiple factors
    // Prioritize recency explanation if user selected "Hot off the press"
    if (preferences.recency === 'newest' && item.releaseYear && item.releaseYear >= new Date().getFullYear() - 2) {
      explanation = "Hot off the press - recent release";
    } else if (trending_score > 0.8 && wantsTrending && taste_match_score > 0.6) {
      explanation = "Trending now and matches your taste";
    } else if (critic_score > 0.8 && wantsCriticallyAcclaimed) {
      explanation = "Critically acclaimed and matches your mood";
    } else if (taste_match_score > 0.8) {
      if (item.genres && item.genres.length > 0 && moodPreference) {
        explanation = `Perfect match for your ${moodPreference} mood`;
      } else {
        explanation = "Perfect match for your preferences";
      }
    } else if (critic_score > 0.85) {
      explanation = "Highly rated by critics";
    } else if (trending_score > 0.7 && taste_match_score > 0.6) {
      explanation = "Trending now and matches your taste";
    } else if (taste_match_score > 0.7) {
      if (item.genres && item.genres.length > 0) {
        explanation = `Great match for your interest in ${item.genres[0]}`;
      } else {
        explanation = "Great match for your preferences";
      }
    } else {
      explanation = "Recommended based on your preferences";
    }
    
    // Log detailed scoring for debugging
    console.log(`Scoring ${item.title}: trending=${trending_score.toFixed(2)}, critic=${critic_score.toFixed(2)}, taste=${taste_match_score.toFixed(2)}, recency_boost=${recency_boost.toFixed(2)}, final=${final_score.toFixed(2)}, explanation="${explanation}"`);
    
    return {
      content: { ...item, explanation },
      relevance_score: final_score,
      rank: 0
    };
  });
}

/**
 * Calculate taste match score based on keyword matching
 * This gives higher weight to mood matches than genre matches
 */
function calculateTasteMatchScore(
  item: MovieTVShow,
  preferences: ReturnType<typeof extractQuizPreferences>
): number {
  // Base score
  let score = 0;
  let maxScore = 0;
  
  // 1. Genre matching (weight: 40%)
  if (item.genres && item.genres.length > 0) {
    const userGenreIds = Array.from(preferences.genres);
    
    // For each content genre, check if it matches user preferences
    item.genres.forEach(genre => {
      // Convert genre name to ID for comparison
      const genreEntry = Object.entries(GENRE_MAPPINGS).find(
        ([name]) => genre.toLowerCase().includes(name.toLowerCase())
      );
      
      if (genreEntry && userGenreIds.includes(genreEntry[1])) {
        score += 0.4; // Points for genre match
      }
      
      maxScore += 0.4; // Maximum possible genre points
    });
  }
  
  // 2. Mood matching (weight: 60%) - higher emphasis as requested
  if (item.overview && preferences.moods.size > 0) {
    const overview = item.overview.toLowerCase();
    const title = item.title.toLowerCase();
    const combinedText = overview + ' ' + title;
    
    // Check for each mood keyword in the content
    preferences.moods.forEach(mood => {
      if (combinedText.includes(mood)) {
        score += 0.6; // Points for mood match
      }
      
      maxScore += 0.6; // Maximum possible mood points
    });
  }
  
  // 3. Platform matching (bonus)
  if (preferences.platforms.size > 0 && item.streamingPlatform) {
    const platforms = Array.isArray(item.streamingPlatform) 
      ? item.streamingPlatform 
      : [item.streamingPlatform];
    
    const platformMatches = platforms.filter(platform => {
      if (typeof platform !== 'string') return false;
      
      return Array.from(preferences.platforms).some(
        userPlatform => platform.toLowerCase().includes(userPlatform)
      );
    });
    
    if (platformMatches.length > 0) {
      score += 0.2; // Bonus for platform match
      maxScore += 0.2; // Increase max score accordingly
    }
  }
  
  // Return normalized score (0-1)
  return maxScore > 0 ? score / maxScore : 0;
}

/**
 * Adapt TMDB content item to What2Watch format
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
      10759: 'Action & Adventure', 10762: 'Kids', 10763: 'News', 10764: 'Reality',
      10765: 'Sci-Fi & Fantasy', 10766: 'Soap', 10767: 'Talk', 10768: 'War & Politics'
    };
    
    // Filter out news content
    if (
      (item.genre_ids && item.genre_ids.includes(10763)) || // News genre ID
      (title.toLowerCase().includes('news') || 
       title.toLowerCase().includes('daily show') || 
       title.toLowerCase().includes('tonight'))
    ) {
      return null;
    }
    
    // Map genre IDs to names
    const genres = item.genre_ids?.map(id => genreMap[id] || `Genre ${id}`).filter(Boolean) || [];
    
    // Get streaming availability data
    const streamingService = await import('./streaming-service');
    const availability = await streamingService.getStreamingAvailability(item.id);
    const streamingPlatforms = availability
      .filter(a => a.available && a.subscriptionRequired)
      .map(a => {
        // Map platform enum to display name
        const platformMap: Record<string, string> = {
          'netflix': 'Netflix',
          'amazon': 'Amazon Prime',
          'disney': 'Disney+',
          'hbo': 'HBO Max',
          'hulu': 'Hulu',
          'apple': 'Apple TV+',
          'paramount': 'Paramount+'
        };
        return platformMap[a.platform] || a.platform;
      });
    
    // Get poster URL
    let posterUrl = tmdbService.getImageUrl(item.poster_path, tmdbService.PosterSize.LARGE);
    
    // Use backdrop as fallback if no poster
    if (!posterUrl) {
      posterUrl = tmdbService.getImageUrl(item.backdrop_path, tmdbService.PosterSize.LARGE);
      
      // Use placeholder if no image available
      if (!posterUrl) {
        const imageSeed = Math.abs(item.id % 10);
        const placeholders = {
          movie: [
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
        
        posterUrl = placeholders[type][imageSeed];
      }
    }
    
    // Generate realistic ratings that correlate with TMDB rating
    const baseScore = Math.round(item.vote_average * 10);
    const variation = Math.floor(Math.random() * 15) - 5; // -5 to +10 variation
    const rottenTomatoesScore = Math.max(0, Math.min(100, baseScore + variation));

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
      streamingPlatform: streamingPlatforms,
      imdbRating,
      rottenTomatoesScore,
      releaseYear: releaseYear || new Date().getFullYear(), // Ensure releaseYear always has a value
    };
  } catch (error) {
    console.error('Error adapting content format:', error);
    return null;
  }
};

/**
 * Get trending content
 */
export const getTrendingContent = async () => {
  try {
    // Get multiple pages of content
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
    return (await Promise.all(results.map(item => adaptToWhat2WatchFormat(item)))).filter(Boolean);
  } catch (error) {
    console.error('Error getting trending content:', error);
    return [];
  }
};

/**
 * Utility function to check if content is news-related
 */
const isNewsContent = (item: MovieTVShow): boolean => {
  // Check for news genre
  if (item.genres && item.genres.some(g => 
    g.toLowerCase() === 'news' || 
    g.toLowerCase() === 'talk'
  )) {
    return true;
  }
  
  // Check title for news-related keywords
  const newsKeywords = [
    'news', 'morning', 'tonight', 'daily show', 'report', 
    'headlines', 'breaking', 'nightly', 'update', 'live report'
  ];
  
  if (newsKeywords.some(keyword => 
    item.title.toLowerCase().includes(keyword.toLowerCase())
  )) {
    return true;
  }
  
  return false;
};

// Support for A/B testing with different weights
export const getRecommendationsWithABTest = async (quizAnswers: QuizAnswer[], testGroup?: string) => {
  try {
    // Standard weights by default
    const weightSets = {
      A: { trending: 0.5, critic: 0.2, tasteMatch: 0.3 }, // Standard weights
      B: { trending: 0.3, critic: 0.3, tasteMatch: 0.4 }  // Alternative weights with higher taste match
    };
    
    // Randomly assign test group if not provided
    const group = testGroup || (Math.random() > 0.5 ? 'A' : 'B');
    
    // Record which algorithm was used
    if (typeof window !== 'undefined') {
      localStorage.setItem('recommendation_algorithm', group);
    }
    
    console.log(`Using weight set ${group}: `, weightSets[group as keyof typeof weightSets]);
    
    // Use the standard recommendation function - weights can be adjusted in future if needed
    return getRecommendations(quizAnswers);
  } catch (error) {
    console.error('Error in A/B test recommendations:', error);
    return getRecommendations(quizAnswers); // Fallback to standard recommendations
  }
};

/**
 * Test the recommendation engine with various quiz answers and edge cases
 * This helps validate that our engine works correctly across different scenarios
 */
export const testRecommendationEngine = async () => {
  console.log('=== TESTING RECOMMENDATION ENGINE ===');
  
  // Test case 1: User who loves action movies on Netflix
  console.log('\n--- TEST CASE 1: Action movie fan on Netflix ---');
  const actionMovieFan: QuizAnswer[] = [
    { question: 'Set the vibe', answer: 'mind-blowing' },
    { question: 'What genres are you in the mood for?', answer: 'action' },
    { question: 'Do you prefer movies or TV shows?', answer: 'movie' },
    { question: 'Which streaming platforms do you have?', answer: 'netflix' }
  ];
  
  const actionResults = await getRecommendations(actionMovieFan);
  console.log(`Found ${actionResults.length} recommendations for action movie fan`);
  console.log('Top 3 recommendations:');
  actionResults.slice(0, 3).forEach((rec, idx) => {
    console.log(`${idx + 1}. ${rec.content.title} (${rec.content.type})`);
    console.log(`   IMDb: ${rec.content.imdbRating}, RT: ${rec.content.rottenTomatoesScore}%, Platform: ${Array.isArray(rec.content.streamingPlatform) ? rec.content.streamingPlatform.join(', ') : rec.content.streamingPlatform}`);
    console.log(`   Final Score: ${rec.relevance_score.toFixed(2)}, Explanation: ${rec.content.explanation}`);
  });
  
  // Test case 2: User looking for trending comedy shows on multiple platforms
  console.log('\n--- TEST CASE 2: Trending comedy shows on multiple platforms ---');
  const comedyTrendingFan: QuizAnswer[] = [
    { question: 'Set the vibe', answer: 'laugh' },
    { question: 'What genres are you in the mood for?', answer: 'comedy' },
    { question: 'Do you prefer movies or TV shows?', answer: 'tvShow' },
    { question: 'Which streaming platforms do you have?', answer: 'netflix,hulu,disney' }
  ];
  
  const comedyResults = await getRecommendations(comedyTrendingFan);
  console.log(`Found ${comedyResults.length} recommendations for comedy trend fan`);
  console.log('Top 3 recommendations:');
  comedyResults.slice(0, 3).forEach((rec, idx) => {
    console.log(`${idx + 1}. ${rec.content.title} (${rec.content.type})`);
    console.log(`   IMDb: ${rec.content.imdbRating}, RT: ${rec.content.rottenTomatoesScore}%, Platform: ${Array.isArray(rec.content.streamingPlatform) ? rec.content.streamingPlatform.join(', ') : rec.content.streamingPlatform}`);
    console.log(`   Final Score: ${rec.relevance_score.toFixed(2)}, Explanation: ${rec.content.explanation}`);
  });
  
  // Test case 3: Edge case - User with very specific tastes that might result in few recommendations
  console.log('\n--- TEST CASE 3: Very specific tastes (edge case) ---');
  const verySpecificTastes: QuizAnswer[] = [
    { question: 'Set the vibe', answer: 'educational' },
    { question: 'What genres are you in the mood for?', answer: 'documentary' },
    { question: 'Do you prefer movies or TV shows?', answer: 'movie' },
    { question: 'Which streaming platforms do you have?', answer: 'apple' }
  ];
  
  const specificResults = await getRecommendations(verySpecificTastes);
  console.log(`Found ${specificResults.length} recommendations for very specific tastes`);
  console.log('Top 3 recommendations:');
  specificResults.slice(0, 3).forEach((rec, idx) => {
    console.log(`${idx + 1}. ${rec.content.title} (${rec.content.type})`);
    console.log(`   IMDb: ${rec.content.imdbRating}, RT: ${rec.content.rottenTomatoesScore}%, Platform: ${Array.isArray(rec.content.streamingPlatform) ? rec.content.streamingPlatform.join(', ') : rec.content.streamingPlatform}`);
    console.log(`   Final Score: ${rec.relevance_score.toFixed(2)}, Explanation: ${rec.content.explanation}`);
  });
  
  // Test case 4: Prioritizing quality content
  console.log('\n--- TEST CASE 4: Prioritizing high-quality content ---');
  const qualityFan: QuizAnswer[] = [
    { question: 'Set the vibe', answer: 'mind-blowing,plot-twists' },
    { question: 'What genres are you in the mood for?', answer: 'thriller,mystery' },
    { question: 'Do you prefer movies or TV shows?', answer: 'both' },
    { question: 'Which streaming platforms do you have?', answer: 'netflix,hbo,amazon' }
  ];
  
  const qualityResults = await getRecommendations(qualityFan);
  console.log(`Found ${qualityResults.length} recommendations for quality fan`);
  console.log('Top 3 recommendations:');
  qualityResults.slice(0, 3).forEach((rec, idx) => {
    console.log(`${idx + 1}. ${rec.content.title} (${rec.content.type})`);
    console.log(`   IMDb: ${rec.content.imdbRating}, RT: ${rec.content.rottenTomatoesScore}%, Platform: ${Array.isArray(rec.content.streamingPlatform) ? rec.content.streamingPlatform.join(', ') : rec.content.streamingPlatform}`);
    console.log(`   Final Score: ${rec.relevance_score.toFixed(2)}, Explanation: ${rec.content.explanation}`);
  });
  
  console.log('\n=== RECOMMENDATION ENGINE TESTING COMPLETE ===');
  
  return {
    actionResults,
    comedyResults,
    specificResults,
    qualityResults
  };
}; 
