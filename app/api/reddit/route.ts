import { NextResponse } from 'next/server';

/**
 * Reddit API Proxy
 * 
 * This API route proxies requests to Reddit's JSON API to avoid CORS issues in the browser.
 * It can fetch both search results and comments for a given query.
 * 
 * Query parameters:
 * - q: The search query (required)
 * - fetchComments: Set to 'true' to fetch comments for the top posts (optional)
 * - commentsLimit: Number of comments to fetch per post (default: 50)
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const fetchComments = searchParams.get('fetchComments') === 'true';
  const commentsLimit = Number(searchParams.get('commentsLimit')) || 50;
  
  if (!query) {
    return NextResponse.json({ error: 'Missing query parameter' }, { status: 400 });
  }
  
  try {
    // Step 1: Fetch search results
    const searchData = await fetchRedditSearch(query);
    const posts = searchData.data?.children || [];
    
    // If comments not requested or no posts found, return just the search results
    if (!fetchComments || posts.length === 0) {
      return NextResponse.json(searchData);
    }
    
    // Step 2: Fetch comments for top posts
    const commentsData = await fetchCommentsForPosts(posts, commentsLimit);
    
    // Return combined data
    return NextResponse.json({
      ...searchData,
      commentsData
    });
  } catch (error) {
    console.error('Error proxying Reddit request:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch from Reddit' },
      { status: 500 }
    );
  }
}

/**
 * Fetch search results from Reddit
 */
async function fetchRedditSearch(query: string) {
  const redditUrl = `https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&sort=relevance&t=all&limit=50`;
  
  // Add a timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
  
  try {
    // Fetch from Reddit with custom User-Agent
    const response = await fetch(redditUrl, {
      headers: {
        'User-Agent': 'What2Watch/1.0 (Web Application; +https://what2watch.example.com)'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Reddit API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Fetch comments for a list of posts
 */
async function fetchCommentsForPosts(posts: any[], commentsLimit: number) {
  const commentsData = [];
  // Limit to 3 posts to avoid rate limiting
  const postsToFetch = Math.min(3, posts.length);
  
  for (let i = 0; i < postsToFetch; i++) {
    const post = posts[i];
    if (!post?.data?.permalink) continue;
    
    try {
      const commentData = await fetchCommentsForPost(post, commentsLimit);
      if (commentData) {
        commentsData.push(commentData);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      // Continue with other posts even if this one fails
    }
    
    // Small delay to avoid rate limiting
    if (i < postsToFetch - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return commentsData;
}

/**
 * Fetch comments for a single post
 */
async function fetchCommentsForPost(post: any, commentsLimit: number) {
  // Construct comment URL
  const commentUrl = `https://www.reddit.com${post.data.permalink}.json?limit=${commentsLimit}`;
  
  // Add timeout for comment fetch
  const commentController = new AbortController();
  const commentTimeoutId = setTimeout(() => commentController.abort(), 5000); // shorter timeout
  
  try {
    const commentResponse = await fetch(commentUrl, {
      headers: {
        'User-Agent': 'What2Watch/1.0 (Web Application; +https://what2watch.example.com)'
      },
      signal: commentController.signal
    });
    
    clearTimeout(commentTimeoutId);
    
    if (!commentResponse.ok) {
      return null;
    }
    
    const commentJson = await commentResponse.json();
    
    // Return comment data with post info
    return {
      postId: post.data.id,
      postTitle: post.data.title,
      postUrl: post.data.permalink,
      commentsData: commentJson
    };
  } catch (error) {
    clearTimeout(commentTimeoutId);
    throw error;
  }
} 