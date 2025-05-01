import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  
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
    
    // Get the response as JSON
    const data = await response.json();
    
    // Return the response
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error proxying Reddit request:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch from Reddit' },
      { status: 500 }
    );
  }
} 