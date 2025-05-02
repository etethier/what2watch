import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const fetchComments = searchParams.get('fetchComments') === 'true';
  const commentsLimit = Number(searchParams.get('commentsLimit')) || 50;
  
  if (!query) {
    return NextResponse.json({ error: 'Missing query parameter' }, { status: 400 });
  }
  
  try {
    // Construct the Reddit search URL
    const redditUrl = `https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&sort=relevance&t=all&limit=50`;
    
    // Add a timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
    
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
    
    // Get the search response as JSON
    const searchData = await response.json();
    const posts = searchData.data?.children || [];
    
    // If we don't need comments, return just the search results
    if (!fetchComments || posts.length === 0) {
      return NextResponse.json(searchData);
    }
    
    // Fetch comments for top posts (limit to 3 posts to avoid rate limiting)
    const commentsData = [];
    const postsToFetch = Math.min(3, posts.length);
    
    for (let i = 0; i < postsToFetch; i++) {
      const post = posts[i];
      if (!post?.data?.permalink) continue;
      
      try {
        // Construct comment URL - remove the /r/subreddit/comments/ prefix
        const commentUrl = `https://www.reddit.com${post.data.permalink}.json?limit=${commentsLimit}`;
        
        // Add timeout for comment fetch
        const commentController = new AbortController();
        const commentTimeoutId = setTimeout(() => commentController.abort(), 5000); // shorter timeout
        
        const commentResponse = await fetch(commentUrl, {
          headers: {
            'User-Agent': 'What2Watch/1.0 (Web Application; +https://what2watch.example.com)'
          },
          signal: commentController.signal
        });
        
        clearTimeout(commentTimeoutId);
        
        if (commentResponse.ok) {
          const commentJson = await commentResponse.json();
          
          // Add post info to comments data
          commentsData.push({
            postId: post.data.id,
            postTitle: post.data.title,
            postUrl: post.data.permalink,
            commentsData: commentJson
          });
        }
      } catch (commentError) {
        console.error('Error fetching comments:', commentError);
        // Continue with other posts even if this one fails
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
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