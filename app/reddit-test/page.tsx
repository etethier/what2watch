'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MovieTVShow, SentimentType, EnhancedBuzzType } from '../types';
import { FaArrowLeft, FaReddit, FaSmile, FaMeh, FaFrown } from 'react-icons/fa';
import { 
  estimateRedditBuzz, 
  getRedditBuzzForTitle, 
  batchGetRedditBuzz
} from '../services/reddit-service';

// Sample content for testing
const sampleContent: MovieTVShow[] = [
  {
    id: 1,
    title: "The Last of Us",
    overview: "After a global pandemic destroys civilization, a hardened survivor takes charge of a 14-year-old girl who may be humanity's last hope.",
    posterPath: "https://m.media-amazon.com/images/M/MV5BZGUzYTI3M2EtZmM0Yy00NGUzLWJlYWUtZDhhNmQwNDFmZGJlXkEyXkFqcGdeQXVyNTM0OTY1OQ@@._V1_.jpg",
    type: "tv",
    rating: 8.7,
    releaseYear: 2023,
    genres: ["Drama", "Action", "Sci-Fi"],
    streamingPlatform: "HBO Max",
    imdbRating: 8.7,
    rottenTomatoesScore: 96,
    redditBuzz: "High"
  },
  {
    id: 2,
    title: "The Godfather",
    overview: "The aging patriarch of an organized crime dynasty transfers control of his clandestine empire to his reluctant son.",
    posterPath: "https://m.media-amazon.com/images/M/MV5BM2MyNjYxNmUtYTAwNi00MTYxLWJmNWYtYzZlODY3ZTk3OTFlXkEyXkFqcGdeQXVyNzkwMjQ5NzM@._V1_.jpg",
    type: "movie",
    rating: 9.2,
    releaseYear: 1972,
    genres: ["Crime", "Drama"],
    streamingPlatform: "Paramount+",
    imdbRating: 9.2,
    rottenTomatoesScore: 97,
    redditBuzz: "Medium"
  },
  {
    id: 3,
    title: "Stranger Things",
    overview: "When a young boy disappears, his mother, a police chief, and his friends must confront terrifying supernatural forces in order to get him back.",
    posterPath: "https://m.media-amazon.com/images/M/MV5BMDZkYmVhNjMtNWU4MC00MDQxLWE3MjYtZGMzZWI1ZjhlOWJmXkEyXkFqcGdeQXVyMTkxNjUyNQ@@._V1_.jpg",
    type: "tv",
    rating: 8.7,
    releaseYear: 2016,
    genres: ["Drama", "Fantasy", "Horror"],
    streamingPlatform: "Netflix",
    imdbRating: 8.7,
    rottenTomatoesScore: 96,
    redditBuzz: "High"
  },
  {
    id: 4,
    title: "The Shawshank Redemption",
    overview: "Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.",
    posterPath: "https://m.media-amazon.com/images/M/MV5BMDFkYTc0MGEtZmNhMC00ZDIzLWFmNTEtODM1ZmRlYWMwMWFmXkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_.jpg",
    type: "movie",
    rating: 9.3,
    releaseYear: 1994,
    genres: ["Drama"],
    streamingPlatform: "HBO Max",
    imdbRating: 9.3,
    rottenTomatoesScore: 91,
    redditBuzz: "Medium"
  },
  {
    id: 5,
    title: "Ted Lasso",
    overview: "American football coach Ted Lasso heads to London to manage AFC Richmond, a struggling English Premier League football team.",
    posterPath: "https://m.media-amazon.com/images/M/MV5BMTdmZjBjZjQtY2JiNS00Y2ZlLTg2NzgtMjUzMGY2OTVmOWJiXkEyXkFqcGdeQXVyMDM2NDM2MQ@@._V1_.jpg",
    type: "tv",
    rating: 8.8,
    releaseYear: 2020,
    genres: ["Comedy", "Drama", "Sport"],
    streamingPlatform: "Apple TV+",
    imdbRating: 8.8,
    rottenTomatoesScore: 95,
    redditBuzz: "High"
  },
  {
    id: 6,
    title: "Inception",
    overview: "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.",
    posterPath: "https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_.jpg",
    type: "movie",
    rating: 8.8,
    releaseYear: 2010,
    genres: ["Action", "Adventure", "Sci-Fi"],
    streamingPlatform: "Netflix",
    imdbRating: 8.8,
    rottenTomatoesScore: 87,
    redditBuzz: "High"
  }
];

// Add a typed interface for the reddit data used in the component
interface RedditDataItem {
  buzzLevel: 'High' | 'Medium' | 'Low' | 'Unknown';
  sentiment: SentimentType;
  postCount: number;
  totalComments: number;
  totalUpvotes: number;
  sentimentScore: number;
  topSubreddits: Array<{ name: string; count: number }>;
  trendingTopics?: Array<{
    term: string;
    count: number;
    sentiment: SentimentType;
    sentimentScore: number;
  }>;
  commentSentiment?: {
    totalComments: number;
    analyzedComments: number;
    averageSentiment: number;
    sentimentType: SentimentType;
    positiveComments: number;
    negativeComments: number;
    neutralComments: number;
    keywords: Array<{ term: string; count: number }>;
  };
  error?: string;
}

export default function RedditTestPage() {
  const [content, setContent] = useState<MovieTVShow[]>(sampleContent);
  const [redditData, setRedditData] = useState<Record<number, RedditDataItem>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'mock' | 'algorithm' | 'api'>('mock');
  const [error, setError] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<'idle' | 'success' | 'error'>('idle');
  
  const testRedditAPI = async () => {
    setIsLoading(true);
    setError(null);
    setApiStatus('idle');
    
    try {
      // Use the batch function from our service with comment analysis
      const results = await batchGetRedditBuzz(content, true);
      setRedditData(results);
      
      // Check if we have any successful results
      const hasSuccessfulResults = Object.values(results).some(
        (result: any) => !result.error && result.buzzLevel !== 'Unknown'
      );
      
      setApiStatus(hasSuccessfulResults ? 'success' : 'error');
      
      if (!hasSuccessfulResults) {
        setError('Could not retrieve data from Reddit. Using algorithmic fallback instead.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred fetching Reddit data');
      setApiStatus('error');
      console.error('Error fetching Reddit data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const compareRedditBuzz = (contentItem: MovieTVShow) => {
    // Compare the existing redditBuzz with our algorithm's estimation
    const mockBuzz = contentItem.redditBuzz || 'Unknown';
    const algorithmBuzz = estimateRedditBuzz(contentItem);
    const apiBuzz = redditData[contentItem.id]?.buzzLevel || 'Unknown';
    const sentiment = redditData[contentItem.id]?.sentiment || 'Unknown';
    const sentimentScore = redditData[contentItem.id]?.sentimentScore || 0;
    const enhancedBuzz = getEnhancedBuzzType(apiBuzz, sentiment);
    
    return { mockBuzz, algorithmBuzz, apiBuzz, sentiment, sentimentScore, enhancedBuzz };
  };

  // Helper to get enhanced buzz type from components
  const getEnhancedBuzzType = (buzzLevel: string, sentiment: string): EnhancedBuzzType => {
    if (buzzLevel === 'Unknown') return 'Low Buzz';
    
    if (buzzLevel === 'High') {
      if (sentiment === 'Positive') return 'Trending Positive';
      if (sentiment === 'Negative') return 'Trending Negative';
      return 'Popular Discussion';
    } else if (buzzLevel === 'Medium') {
      if (sentiment === 'Positive') return 'Trending Positive';
      if (sentiment === 'Negative') return 'Trending Negative';
      return 'Niche Interest';
    }
    
    return 'Low Buzz';
  };

  // Color coding for buzz levels
  const getBuzzColor = (level: string) => {
    switch(level) {
      case 'High': return 'text-green-600 font-semibold';
      case 'Medium': return 'text-yellow-600 font-semibold';
      case 'Low': return 'text-red-600 font-semibold';
      default: return 'text-gray-600';
    }
  };

  // Get color for enhanced buzz types
  const getEnhancedBuzzColor = (buzzType: string) => {
    switch(buzzType) {
      case 'Trending Positive': return 'text-green-600 font-semibold';
      case 'Trending Negative': return 'text-red-600 font-semibold';
      case 'Trending Mixed': return 'text-orange-500 font-semibold';
      case 'Popular Discussion': return 'text-blue-600 font-semibold';
      case 'Controversial': return 'text-purple-600 font-semibold';
      case 'Niche Interest': return 'text-yellow-600 font-semibold';
      case 'Low Buzz': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  // Get color and icon for sentiment
  const getSentimentDisplay = (sentiment: SentimentType, score: number) => {
    switch(sentiment) {
      case 'Positive': 
        return {
          icon: <FaSmile className="inline mr-1 text-green-500" />,
          text: 'text-green-600',
          label: `Positive (${score.toFixed(2)})`
        };
      case 'Negative': 
        return {
          icon: <FaFrown className="inline mr-1 text-red-500" />,
          text: 'text-red-600',
          label: `Negative (${score.toFixed(2)})`
        };
      case 'Neutral': 
        return {
          icon: <FaMeh className="inline mr-1 text-yellow-500" />,
          text: 'text-yellow-600',
          label: `Neutral (${score.toFixed(2)})`
        };
      default: 
        return {
          icon: null,
          text: 'text-gray-600',
          label: 'Unknown'
        };
    }
  };

  // Helper component for rendering trending topics
  const TrendingTopics = ({ topics }: { topics: RedditDataItem['trendingTopics'] }) => {
    if (!topics || topics.length === 0) return null;
    
    return (
      <div className="mt-3">
        <p className="text-gray-600 font-semibold">Trending Topics:</p>
        <div className="mt-1 flex flex-wrap gap-1">
          {topics.map((topic, i) => {
            let topicColor = "bg-gray-200 text-gray-800";
            if (topic.sentiment === 'Positive') topicColor = "bg-green-100 text-green-800";
            if (topic.sentiment === 'Negative') topicColor = "bg-red-100 text-red-800";
            
            return (
              <span 
                key={i} 
                className={`${topicColor} text-xs px-2 py-1 rounded flex items-center`}
                title={`Sentiment: ${topic.sentiment} (${topic.sentimentScore.toFixed(2)})`}
              >
                {topic.term} ({topic.count})
              </span>
            );
          })}
        </div>
      </div>
    );
  };
  
  // Helper component for rendering comment sentiment analysis
  const CommentAnalysis = ({ sentiment }: { sentiment: RedditDataItem['commentSentiment'] }) => {
    if (!sentiment || sentiment.totalComments === 0) return null;
    
    return (
      <div className="mt-3 border-t pt-2">
        <p className="text-gray-600 font-semibold">Comment Analysis:</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1 text-xs">
          <div className="bg-gray-100 p-1 rounded">
            <span className="text-gray-500">Comments:</span>
            <div>{sentiment.totalComments}</div>
          </div>
          
          <div className="bg-green-50 p-1 rounded">
            <span className="text-gray-500">Positive:</span>
            <div>{sentiment.positiveComments}</div>
          </div>
          
          <div className="bg-red-50 p-1 rounded">
            <span className="text-gray-500">Negative:</span>
            <div>{sentiment.negativeComments}</div>
          </div>
          
          <div className="bg-yellow-50 p-1 rounded">
            <span className="text-gray-500">Neutral:</span>
            <div>{sentiment.neutralComments}</div>
          </div>
        </div>
        
        {sentiment.keywords?.length > 0 && (
          <div className="mt-2">
            <p className="text-gray-500 text-xs">Comment Keywords:</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {sentiment.keywords.slice(0, 8).map((kw, i) => (
                <span key={i} className="bg-blue-50 text-blue-800 text-xs px-1.5 py-0.5 rounded">
                  {kw.term} ({kw.count})
                </span>
              ))}
            </div>
          </div>
        )}
        
        <div className="mt-2 text-xs text-gray-500">
          Overall comment sentiment: 
          <span className={
            sentiment.sentimentType === 'Positive' ? 'text-green-600 font-semibold ml-1' : 
            sentiment.sentimentType === 'Negative' ? 'text-red-600 font-semibold ml-1' : 
            'text-yellow-600 font-semibold ml-1'
          }>
            {sentiment.sentimentType} (
            {sentiment.averageSentiment.toFixed(2)})
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center mb-6">
        <Link href="/" className="mr-4 text-blue-500 hover:underline flex items-center">
          <FaArrowLeft className="mr-1" /> Back to Home
        </Link>
        <h1 className="text-3xl font-bold flex items-center">
          <FaReddit className="mr-2 text-orange-600" /> Reddit Recommendation Test
        </h1>
      </div>
      
      <div className="bg-gray-100 p-4 rounded mb-6">
        <p>This page tests different methods for determining Reddit buzz levels for content:</p>
        <ul className="list-disc ml-6 mt-2">
          <li><strong>Mock Data:</strong> Hardcoded values in our sample data</li>
          <li><strong>Algorithm:</strong> Estimated values based on content properties (release year, rating, genres)</li>
          <li><strong>API:</strong> Live data from Reddit's JSON API via our proxy (with fallback to algorithm)</li>
        </ul>
        <p className="text-sm text-gray-600 mt-2">
          Note: Reddit API calls are made through a Next.js API route that proxies requests to Reddit to avoid CORS issues.
          If you see "Unknown" values, the proxy might be experiencing rate limiting or connectivity issues.
        </p>
      </div>
      
      <div className="mb-6">
        <div className="flex border-b">
          <button 
            className={`px-4 py-2 font-medium ${activeTab === 'mock' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
            onClick={() => setActiveTab('mock')}
          >
            Mock Data
          </button>
          <button 
            className={`px-4 py-2 font-medium ${activeTab === 'algorithm' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
            onClick={() => setActiveTab('algorithm')}
          >
            Algorithm
          </button>
          <button 
            className={`px-4 py-2 font-medium ${activeTab === 'api' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
            onClick={() => {
              setActiveTab('api');
              if (Object.keys(redditData).length === 0) {
                testRedditAPI();
              }
            }}
          >
            Live API
          </button>
        </div>
      </div>
      
      {isLoading && (
        <div className="text-center py-6">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Fetching Reddit data...</p>
        </div>
      )}
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}
      
      {activeTab === 'api' && apiStatus === 'error' && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">API Status: Using Fallback</p>
          <p>The Reddit API data couldn't be retrieved successfully. The app is using the algorithmic fallback instead.</p>
          <p className="mt-2 text-sm">
            This is normal behavior for the app - when the API is unavailable, the algorithm provides estimated Reddit buzz values
            based on content properties like release year, ratings, and genres.
          </p>
        </div>
      )}
      
      {activeTab === 'api' && apiStatus === 'success' && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">API Status: Connected</p>
          <p>Successfully retrieved data from Reddit via our proxy API.</p>
        </div>
      )}
      
      {!isLoading && (
        <div className="grid grid-cols-1 gap-6">
          {content.map(item => {
            const { 
              mockBuzz, 
              algorithmBuzz, 
              apiBuzz, 
              sentiment, 
              sentimentScore, 
              enhancedBuzz 
            } = compareRedditBuzz(item);
            
            const sentimentDisplay = getSentimentDisplay(sentiment as SentimentType, sentimentScore);
            
            return (
              <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="flex flex-col md:flex-row">
                  <div className="w-full md:w-1/4">
                    {item.posterPath && (
                      <img 
                        src={item.posterPath} 
                        alt={item.title}
                        className="w-full h-64 md:h-full object-cover" 
                      />
                    )}
                  </div>
                  <div className="p-4 w-full md:w-3/4">
                    <h2 className="text-xl font-bold">{item.title}</h2>
                    <div className="text-sm text-gray-600 mb-2">
                      {item.releaseYear} &middot; {item.type.toUpperCase()} &middot; {item.rating.toFixed(1)}/10
                    </div>
                    <p className="text-gray-700 mb-4 line-clamp-2">{item.overview}</p>
                    
                    <h3 className="font-semibold mb-2">Reddit Buzz Comparison:</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 border rounded p-3 bg-gray-50">
                      <div>
                        <p className="text-sm text-gray-600">Mock:</p>
                        <p className={getBuzzColor(mockBuzz)}>{mockBuzz}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Algorithm:</p>
                        <p className={getBuzzColor(algorithmBuzz)}>{algorithmBuzz}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">API Buzz:</p>
                        <p className={getBuzzColor(apiBuzz)}>{apiBuzz}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Sentiment:</p>
                        <p className={sentimentDisplay.text}>
                          {sentimentDisplay.icon} {sentimentDisplay.label}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-3 border rounded p-3 bg-blue-50">
                      <p className="text-sm text-gray-600 mb-1">Enhanced Classification:</p>
                      <p className={getEnhancedBuzzColor(enhancedBuzz)}>
                        {enhancedBuzz}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        This classification combines volume metrics with sentiment analysis for a more nuanced view.
                      </p>
                    </div>
                    
                    {activeTab === 'api' && redditData[item.id] && !redditData[item.id].error && (
                      <div className="mt-3 border-t pt-3">
                        <h4 className="font-semibold mb-1">API Details:</h4>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div>
                            <p className="text-gray-600">Posts:</p>
                            <p>{redditData[item.id].postCount}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Comments:</p>
                            <p>{redditData[item.id].totalComments}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Upvotes:</p>
                            <p>{redditData[item.id].totalUpvotes}</p>
                          </div>
                        </div>
                        
                        {redditData[item.id].topSubreddits?.length > 0 && (
                          <div className="mt-2">
                            <p className="text-gray-600">Top subreddits:</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {redditData[item.id].topSubreddits.map((sub, i) => (
                                <span key={i} className="bg-gray-200 text-gray-800 text-xs px-2 py-1 rounded">
                                  r/{sub.name} ({sub.count})
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        <TrendingTopics topics={redditData[item.id].trendingTopics} />
                        <CommentAnalysis sentiment={redditData[item.id].commentSentiment} />
                      </div>
                    )}
                    
                    {activeTab === 'api' && redditData[item.id]?.error && (
                      <div className="mt-3 text-sm text-red-600">
                        Error: {redditData[item.id].error}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Add a Reddit link button */}
                <div className="bg-gray-100 p-2 text-center">
                  <a 
                    href={`https://www.reddit.com/search?q=${encodeURIComponent(item.title)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline inline-flex items-center text-sm"
                  >
                    <FaReddit className="mr-1" /> View discussions on Reddit
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      <div className="mt-6 text-center">
        {activeTab === 'api' && (
          <button
            onClick={testRedditAPI}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Refresh Reddit Data'}
          </button>
        )}
      </div>
    </div>
  );
} 