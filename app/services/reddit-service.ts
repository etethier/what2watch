/**
 * Reddit Service for What2Watch
 * 
 * This service provides functions to interact with Reddit data to enhance
 * movie and TV show recommendations with social media buzz metrics.
 */

import { MovieTVShow, SentimentType, EnhancedBuzzType } from '../types';
import Sentiment from 'sentiment';

// Initialize sentiment analyzer
const sentiment = new Sentiment();

// Simple in-memory cache to avoid excessive API calls
const redditCache: Record<string, { data: any; timestamp: number }> = {};
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Algorithmic estimator for Reddit buzz based on content properties
 * Used as a fallback when API data is not available
 */
export const estimateRedditBuzz = (content: MovieTVShow): 'High' | 'Medium' | 'Low' => {
  // Recent, popular content likely has high buzz
  const isRecent = content.releaseYear 
    ? content.releaseYear >= new Date().getFullYear() - 2 
    : false;
  const isPopular = content.rating >= 7.5;
  
  // Certain genres tend to generate more discussion
  const hasPopularGenres = content.genres?.some(
    g => ['Drama', 'Sci-Fi', 'Action', 'Fantasy', 'Thriller', 'Horror'].includes(g)
  );
  
  // Award winners/nominees tend to get more discussion
  const hasCriticalAcclaim = content.rottenTomatoesScore && content.rottenTomatoesScore >= 85;
  
  // Calculate buzz level
  if ((isRecent && isPopular) || (hasCriticalAcclaim && hasPopularGenres)) {
    return "High";
  } else if (isRecent || (isPopular && content.rating >= 6.5)) {
    return "Medium";
  }
  return "Low";
};

// Types to represent Reddit API results
export interface RedditBuzzResult {
  buzzLevel: 'High' | 'Medium' | 'Low' | 'Unknown';
  sentiment: SentimentType;
  postCount: number;
  totalComments: number;
  totalUpvotes: number;
  sentimentScore: number;
  topSubreddits: Array<{ name: string; count: number }>;
  error?: string;
}

/**
 * Fetch Reddit data for a specific title using our proxy API
 * This avoids CORS issues by using Next.js API route as a proxy
 */
export const getRedditBuzzForTitle = async (
  title: string, 
  year?: number, 
  type?: 'movie' | 'tv'
): Promise<RedditBuzzResult> => {
  try {
    // Create a cache key
    const cacheKey = `${title}-${year || ''}-${type || ''}`;
    
    // Check cache first
    if (redditCache[cacheKey] && Date.now() - redditCache[cacheKey].timestamp < CACHE_DURATION) {
      return redditCache[cacheKey].data;
    }
    
    // Construct search query - make it more specific with year and type if available
    let searchQuery = title;
    if (year) searchQuery += ` ${year}`;
    if (type) searchQuery += ` ${type === 'movie' ? 'movie film' : 'tv series show'}`;
    
    // Use our proxy API route instead of calling Reddit directly
    const url = `/api/reddit?q=${encodeURIComponent(searchQuery)}`;
    
    // Fetch with a timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // Longer timeout for proxy
    
    const response = await fetch(url, { 
      signal: controller.signal,
      next: { revalidate: 3600 } // Cache the result for 1 hour on the server
    });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    const posts = data.data?.children || [];
    
    // Process results
    const postCount = posts.length;
    const totalUpvotes = posts.reduce((sum: number, post: any) => sum + (post.data?.ups || 0), 0);
    const totalComments = posts.reduce((sum: number, post: any) => sum + (post.data?.num_comments || 0), 0);
    
    // Count posts by subreddit
    const subredditCounts: Record<string, number> = {};
    posts.forEach((post: any) => {
      const subreddit = post.data?.subreddit;
      if (subreddit) {
        subredditCounts[subreddit] = (subredditCounts[subreddit] || 0) + 1;
      }
    });
    
    // Get top 5 subreddits
    const topSubreddits = Object.entries(subredditCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    // Analyze sentiment from post titles and self text
    let sentimentSum = 0;
    let sentimentItems = 0;
    
    posts.forEach((post: any) => {
      const postData = post.data;
      
      // Analyze post title sentiment
      if (postData.title) {
        const titleSentiment = sentiment.analyze(postData.title);
        sentimentSum += titleSentiment.comparative;
        sentimentItems += 1;
      }
      
      // Analyze post self text if available
      if (postData.selftext && postData.selftext.length > 0) {
        const textSentiment = sentiment.analyze(postData.selftext);
        sentimentSum += textSentiment.comparative;
        sentimentItems += 1;
      }
    });
    
    // Calculate average sentiment score
    const sentimentScore = sentimentItems > 0 ? sentimentSum / sentimentItems : 0;
    
    // Determine sentiment category
    let sentimentType: SentimentType = 'Neutral';
    if (sentimentScore >= 0.2) {
      sentimentType = 'Positive';
    } else if (sentimentScore <= -0.2) {
      sentimentType = 'Negative';
    }
    
    // Determine buzz level
    let buzzLevel: 'High' | 'Medium' | 'Low' = 'Low';
    
    // High buzz: many posts or lots of engagement
    if (postCount >= 20 || totalUpvotes >= 5000 || totalComments >= 1000) {
      buzzLevel = 'High';
    }
    // Medium buzz: moderate activity
    else if (postCount >= 8 || totalUpvotes >= 1000 || totalComments >= 200) {
      buzzLevel = 'Medium';
    }
    
    const result: RedditBuzzResult = {
      buzzLevel,
      sentiment: sentimentType,
      postCount,
      totalComments,
      totalUpvotes,
      sentimentScore,
      topSubreddits
    };
    
    // Cache the result
    redditCache[cacheKey] = {
      data: result,
      timestamp: Date.now()
    };
    
    return result;
  } catch (error) {
    console.error('Error fetching Reddit data:', error);
    
    // Return a default response with error info
    return {
      buzzLevel: 'Unknown',
      sentiment: 'Unknown',
      postCount: 0,
      totalComments: 0,
      totalUpvotes: 0,
      sentimentScore: 0,
      topSubreddits: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Batch process multiple titles to get Reddit buzz data
 * Processes sequentially to avoid rate limiting
 */
export const batchGetRedditBuzz = async (
  contents: MovieTVShow[]
): Promise<Record<number, RedditBuzzResult>> => {
  const results: Record<number, RedditBuzzResult> = {};
  
  for (const content of contents) {
    try {
      // Small delay between requests to avoid rate limiting
      if (Object.keys(results).length > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      const redditData = await getRedditBuzzForTitle(
        content.title,
        content.releaseYear,
        content.type
      );
      
      results[content.id] = redditData;
    } catch (error) {
      console.error(`Error getting Reddit data for ${content.title}:`, error);
      results[content.id] = {
        buzzLevel: 'Unknown',
        sentiment: 'Unknown',
        postCount: 0,
        totalComments: 0,
        totalUpvotes: 0,
        sentimentScore: 0,
        topSubreddits: [],
        error: 'Failed to fetch data'
      };
    }
  }
  
  return results;
};

/**
 * Get Reddit data for a single content item, with fallback to estimation
 * Now with enhanced buzz types that incorporate sentiment
 */
export const getRedditBuzzWithFallback = async (
  content: MovieTVShow
): Promise<EnhancedBuzzType> => {
  try {
    const redditData = await getRedditBuzzForTitle(
      content.title,
      content.releaseYear,
      content.type
    );
    
    if (redditData.error || redditData.buzzLevel === 'Unknown') {
      // Fallback to algorithm if API fails, but we can only estimate quantity
      // not sentiment, so we use basic types
      const basicBuzz = estimateRedditBuzz(content);
      return basicBuzz === 'High' ? 'Popular Discussion' : 
             basicBuzz === 'Medium' ? 'Niche Interest' : 'Low Buzz';
    }
    
    // Combine buzz level with sentiment for more nuanced categories
    if (redditData.buzzLevel === 'High') {
      if (redditData.sentiment === 'Positive') return 'Trending Positive';
      if (redditData.sentiment === 'Negative') return 'Trending Negative';
      if (Math.abs(redditData.sentimentScore) < 0.2) return 'Popular Discussion';
      return 'Controversial';
    } else if (redditData.buzzLevel === 'Medium') {
      if (redditData.sentiment === 'Positive') return 'Trending Positive';
      if (redditData.sentiment === 'Negative') return 'Trending Negative';
      return 'Niche Interest';
    }
    
    return 'Low Buzz';
  } catch (error) {
    console.error(`Error in getRedditBuzzWithFallback for ${content.title}:`, error);
    // Default to algorithmic estimation in case of error
    const basicBuzz = estimateRedditBuzz(content);
    return basicBuzz === 'High' ? 'Popular Discussion' : 
           basicBuzz === 'Medium' ? 'Niche Interest' : 'Low Buzz';
  }
}; 