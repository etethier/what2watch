/**
 * Reddit Service for What2Watch
 * 
 * This service provides functions to interact with Reddit data to enhance
 * movie and TV show recommendations with social media buzz metrics.
 */

import { MovieTVShow, SentimentType, EnhancedBuzzType, TrendingTopic, CommentSentimentAnalysis } from '../types';
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
  trendingTopics?: TrendingTopic[];
  commentSentiment?: CommentSentimentAnalysis;
  error?: string;
}

// Stop words to filter out from trending topics
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'if', 'because', 'as', 'what', 'which',
  'this', 'that', 'these', 'those', 'then', 'just', 'so', 'than', 'such', 'both',
  'through', 'about', 'for', 'is', 'of', 'while', 'during', 'to', 'from', 'in',
  'movie', 'show', 'film', 'tv', 'episode', 'series', 'season', 'character',
  'scene', 'watch', 'watching', 'watched', 'seen', 'see', 'look', 'think',
  'thought', 'feel', 'feels', 'felt', 'like', 'liked', 'loves', 'loved', 'hate',
  'hated', 'hates', 'good', 'great', 'bad', 'best', 'worst', 'better', 'worse',
  'awesome', 'terrible', 'amazing', 'poor', 'excellent', 'favorite', 'least',
  'must', 'should', 'could', 'would', 'will', 'ever', 'never', 'always',
  'actually', 'really'
]);

/**
 * Extract trending topics from text using simple NLP techniques
 * @param texts Array of text strings to analyze
 * @returns Array of trending topics with counts and sentiment
 */
export const extractTrendingTopics = (texts: string[]): TrendingTopic[] => {
  // Word frequency counter
  const wordCounts: Record<string, { count: number, sentimentSum: number, occurrences: number }> = {};
  
  // Process each text
  texts.forEach(text => {
    if (!text || typeof text !== 'string') return;
    
    // Analyze sentiment for this text
    const textSentiment = sentiment.analyze(text);
    
    // Normalize and tokenize text
    const words = text.toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ') // Replace non-alphanumeric with spaces
      .split(/\s+/)                  // Split on whitespace
      .filter(w => w.length > 3)     // Only words longer than 3 chars
      .filter(w => !STOP_WORDS.has(w)); // Remove stop words
    
    // Count unique words in this text (avoid counting repeated words multiple times in same text)
    const uniqueWords = Array.from(new Set(words));
    
    // Update word counts
    uniqueWords.forEach(word => {
      if (!wordCounts[word]) {
        wordCounts[word] = { count: 0, sentimentSum: 0, occurrences: 0 };
      }
      wordCounts[word].count++;
      wordCounts[word].sentimentSum += textSentiment.comparative;
      wordCounts[word].occurrences++;
    });
  });
  
  // Convert to array and sort by frequency
  const topWords = Object.entries(wordCounts)
    .map(([term, data]) => ({
      term,
      count: data.count,
      sentimentScore: data.occurrences > 0 ? data.sentimentSum / data.occurrences : 0,
      sentiment: getSentimentType(data.occurrences > 0 ? data.sentimentSum / data.occurrences : 0)
    }))
    .filter(topic => topic.count > 1) // Only include topics mentioned multiple times
    .sort((a, b) => b.count - a.count)
    .slice(0, 10); // Get top 10 topics
  
  return topWords;
};

/**
 * Determine sentiment type from sentiment score
 */
const getSentimentType = (score: number): SentimentType => {
  if (score >= 0.2) return 'Positive';
  if (score <= -0.2) return 'Negative';
  return 'Neutral';
};

/**
 * Analyze sentiment from Reddit comments
 * @param comments Array of comment objects from Reddit API
 * @returns Comment sentiment analysis results
 */
export const analyzeCommentSentiment = (comments: any[]): CommentSentimentAnalysis => {
  // Default result structure
  const result: CommentSentimentAnalysis = {
    totalComments: 0,
    analyzedComments: 0,
    averageSentiment: 0,
    sentimentType: 'Neutral',
    positiveComments: 0,
    negativeComments: 0,
    neutralComments: 0,
    keywords: []
  };
  
  if (!comments || !Array.isArray(comments) || comments.length === 0) {
    return result;
  }
  
  // Collect comment texts (recursive function to navigate comment tree)
  const commentTexts: string[] = [];
  const extractCommentText = (commentData: any) => {
    if (!commentData) return;
    
    // Handle different comment structures
    if (commentData.body) {
      // Direct comment object
      commentTexts.push(commentData.body);
    } else if (commentData.data?.body) {
      // Nested comment object
      commentTexts.push(commentData.data.body);
    }
    
    // Process replies if they exist
    const replies = commentData.replies || commentData.data?.replies;
    if (replies?.data?.children) {
      replies.data.children.forEach((reply: any) => extractCommentText(reply));
    }
  };
  
  // Process each comment
  comments.forEach(comment => extractCommentText(comment));
  
  result.totalComments = commentTexts.length;
  
  // Skip empty comment sets
  if (commentTexts.length === 0) {
    return result;
  }
  
  // Analyze sentiment for each comment
  let sentimentSum = 0;
  
  commentTexts.forEach(text => {
    try {
      if (text && typeof text === 'string') {
        const commentSentiment = sentiment.analyze(text);
        const score = commentSentiment.comparative;
        
        sentimentSum += score;
        result.analyzedComments++;
        
        // Count comment sentiment types
        if (score >= 0.2) {
          result.positiveComments++;
        } else if (score <= -0.2) {
          result.negativeComments++;
        } else {
          result.neutralComments++;
        }
      }
    } catch (e) {
      console.error('Error analyzing comment sentiment:', e);
    }
  });
  
  // Calculate average sentiment
  result.averageSentiment = result.analyzedComments > 0 ? sentimentSum / result.analyzedComments : 0;
  
  // Determine overall sentiment type
  result.sentimentType = getSentimentType(result.averageSentiment);
  
  // Extract trending keywords from comments
  result.keywords = extractTrendingTopics(commentTexts)
    .map(topic => ({ term: topic.term, count: topic.count }));
  
  return result;
};

/**
 * Fetch Reddit data for a specific title using our proxy API
 * This avoids CORS issues by using Next.js API route as a proxy
 */
export const getRedditBuzzForTitle = async (
  title: string, 
  year?: number, 
  type?: 'movie' | 'tv',
  includeComments: boolean = true
): Promise<RedditBuzzResult> => {
  try {
    // Create a cache key
    const cacheKey = `${title}-${year || ''}-${type || ''}-${includeComments ? 'with-comments' : 'no-comments'}`;
    
    // Check cache first
    if (redditCache[cacheKey] && Date.now() - redditCache[cacheKey].timestamp < CACHE_DURATION) {
      return redditCache[cacheKey].data;
    }
    
    // Construct search query - make it more specific with year and type if available
    let searchQuery = title;
    if (year) searchQuery += ` ${year}`;
    if (type) searchQuery += ` ${type === 'movie' ? 'movie film' : 'tv series show'}`;
    
    // Use our proxy API route instead of calling Reddit directly
    const url = `/api/reddit?q=${encodeURIComponent(searchQuery)}${includeComments ? '&fetchComments=true' : ''}`;
    
    // Fetch with a timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // Longer timeout for comment fetching
    
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
    
    // Extract all text content for sentiment analysis
    const textContent: string[] = [];
    
    // Add post titles and self text
    posts.forEach((post: any) => {
      const postData = post.data;
      if (postData?.title) textContent.push(postData.title);
      if (postData?.selftext) textContent.push(postData.selftext);
    });
    
    // Analyze sentiment from post titles and self text
    let sentimentSum = 0;
    let sentimentItems = 0;
    
    textContent.forEach(text => {
      try {
        const textSentiment = sentiment.analyze(text);
        sentimentSum += textSentiment.comparative;
        sentimentItems += 1;
      } catch (e) {
        console.error('Error analyzing text sentiment:', e);
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
    
    // Build basic result
    const result: RedditBuzzResult = {
      buzzLevel,
      sentiment: sentimentType,
      postCount,
      totalComments,
      totalUpvotes,
      sentimentScore,
      topSubreddits
    };
    
    // Extract trending topics from post content
    if (textContent.length > 0) {
      result.trendingTopics = extractTrendingTopics(textContent);
    }
    
    // Process comment data if available
    if (includeComments && data.commentsData && data.commentsData.length > 0) {
      // Extract all comments from the comment data
      const allComments: any[] = [];
      
      data.commentsData.forEach((postComments: any) => {
        if (postComments.commentsData && Array.isArray(postComments.commentsData) && postComments.commentsData.length > 1) {
          // The second element typically contains the comments
          const commentListing = postComments.commentsData[1];
          if (commentListing && commentListing.data && commentListing.data.children) {
            allComments.push(...commentListing.data.children);
          }
        }
      });
      
      // Analyze comment sentiment
      if (allComments.length > 0) {
        result.commentSentiment = analyzeCommentSentiment(allComments);
      }
    }
    
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
  contents: MovieTVShow[],
  includeComments: boolean = true
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
        content.type,
        includeComments
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
  content: MovieTVShow,
  includeComments: boolean = true
): Promise<EnhancedBuzzType> => {
  try {
    const redditData = await getRedditBuzzForTitle(
      content.title,
      content.releaseYear,
      content.type,
      includeComments
    );
    
    if (redditData.error || redditData.buzzLevel === 'Unknown') {
      // Fallback to algorithm if API fails, but we can only estimate quantity
      // not sentiment, so we use basic types
      const basicBuzz = estimateRedditBuzz(content);
      return basicBuzz === 'High' ? 'Popular Discussion' : 
             basicBuzz === 'Medium' ? 'Niche Interest' : 'Low Buzz';
    }
    
    // If we have comment sentiment data, use it to refine our classification
    if (redditData.commentSentiment && redditData.commentSentiment.analyzedComments > 5) {
      const commentSentiment = redditData.commentSentiment.sentimentType;
      
      // Combine buzz level with comment sentiment for more nuanced categories
      if (redditData.buzzLevel === 'High') {
        if (commentSentiment === 'Positive') return 'Trending Positive';
        if (commentSentiment === 'Negative') return 'Trending Negative';
        return 'Popular Discussion';
      } else if (redditData.buzzLevel === 'Medium') {
        if (commentSentiment === 'Positive') return 'Trending Positive';
        if (commentSentiment === 'Negative') return 'Trending Negative';
        return 'Niche Interest';
      }
      return 'Low Buzz';
    } else {
      // Fallback to post sentiment if comment data is not available
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
    }
  } catch (error) {
    console.error(`Error in getRedditBuzzWithFallback for ${content.title}:`, error);
    // Default to algorithmic estimation in case of error
    const basicBuzz = estimateRedditBuzz(content);
    return basicBuzz === 'High' ? 'Popular Discussion' : 
           basicBuzz === 'Medium' ? 'Niche Interest' : 'Low Buzz';
  }
}; 