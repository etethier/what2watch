'use client';

import { useState, useEffect } from 'react';
import Quiz from './components/Quiz';
import Recommendations from './components/Recommendations';
import { MovieTVShow } from './types';
import { FaArrowRight } from 'react-icons/fa';
import supabaseServices from './services/supabase-wrapper';
import { getPopularMovies } from './services/tmdb-service';
import { getTrendingContent, adaptToWhat2WatchFormat } from './services/recommendation-service';

export default function Home() {
  const [showQuiz, setShowQuiz] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('');
  const [tmdbStatus, setTmdbStatus] = useState('');
  const [recommendations, setRecommendations] = useState<MovieTVShow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [usingSampleData, setUsingSampleData] = useState(false);
  
  // Test Supabase connection on load
  useEffect(() => {
    const testConnection = async () => {
      try {
        const user = await supabaseServices.auth.getCurrentUser();
        console.log('Supabase connection test:', user ? 'Connected with user' : 'Connected without user');
        setConnectionStatus('Supabase OK');
      } catch (error) {
        console.error('Supabase connection test failed:', error);
        setConnectionStatus('Supabase Error');
      }
    };
    
    testConnection();
  }, []);
  
  // Load trending content from TMDB
  useEffect(() => {
    const loadTrendingContent = async () => {
      try {
        setIsLoading(true);
        
        // Try to get trending content
        let tmdbContent = await getTrendingContent();
        
        // Convert TMDB format to our app format
        let content: MovieTVShow[] = [];
        if (tmdbContent.length > 0) {
          content = tmdbContent;
        }
        
        // If that fails, try popular movies
        if (content.length === 0) {
          // Try to get multiple pages of popular movies for more content
          try {
            const popularMoviesPage1 = await getPopularMovies(1);
            const popularMoviesPage2 = await getPopularMovies(2);
            const popularMoviesPage3 = await getPopularMovies(3);
            const combinedResults = [
              ...popularMoviesPage1.results,
              ...popularMoviesPage2.results,
              ...popularMoviesPage3.results
            ];
            
            if (combinedResults.length > 0) {
              // Explicitly cast the result to MovieTVShow[] to satisfy TypeScript
              const adaptedContent = await Promise.all(combinedResults.map(item => 
                adaptToWhat2WatchFormat({...item, media_type: 'movie' as const})
              ));
              content = adaptedContent as MovieTVShow[];
            }
          } catch (error) {
            console.error('Error fetching multiple pages:', error);
            const popularMovies = await getPopularMovies();
            if (popularMovies.results.length > 0) {
              // Explicitly cast the result to MovieTVShow[] to satisfy TypeScript
              const adaptedContent = await Promise.all(popularMovies.results.map(item => 
                adaptToWhat2WatchFormat({...item, media_type: 'movie' as const})
              ));
              content = adaptedContent as MovieTVShow[];
            }
          }
        }
        
        // If we have content, use it
        if (content.length > 0) {
          console.log('TMDB API success, loaded', content.length, 'items');
          
          // Randomize the order slightly for variety
          content.sort(() => Math.random() - 0.5);
          
          setRecommendations(content);
          setTmdbStatus('TMDB OK');
          setUsingSampleData(false);
        } else {
          // Fall back to sample data
          console.log('TMDB API returned no content, using sample data');
          const allSampleData = [...sampleRecommendations, ...generateMoreSampleRecommendations()];
          setRecommendations(allSampleData);
          setTmdbStatus('TMDB Error (Using Sample Data)');
          setUsingSampleData(true);
        }
      } catch (error) {
        console.error('Error loading TMDB content:', error);
        const allSampleData = [...sampleRecommendations, ...generateMoreSampleRecommendations()];
        setRecommendations(allSampleData);
        setTmdbStatus('TMDB Error (Using Sample Data)');
        setUsingSampleData(true);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadTrendingContent();
  }, []);

  // Generate more sample recommendations
  const generateMoreSampleRecommendations = (): MovieTVShow[] => {
    // Create more sample recommendations by modifying existing ones
    return sampleRecommendations.map((item, index) => ({
      ...item,
      id: item.id + 100, // Ensure unique IDs
      title: `${item.title} (More Like This)`,
      rating: Math.min(10, item.rating + Math.random()),
      rottenTomatoesScore: Math.min(100, item.rottenTomatoesScore ? item.rottenTomatoesScore + Math.floor(Math.random() * 5) : 80)
    }));
  };

  // Sample recommendations data
  const sampleRecommendations: MovieTVShow[] = [
    {
      id: 1,
      title: "Everything Everywhere All At Once",
      overview: "A wildly imaginative story about a woman who must save the multiverse by connecting with alternate versions of herself.",
      posterPath: "https://m.media-amazon.com/images/M/MV5BYTdiOTIyZTQtNmQ1OS00NjZlLWIyMTgtYzk5Y2M3ZDVmMDk1XkEyXkFqcGdeQXVyMTAzMDg4NzU0._V1_.jpg",
      type: "movie",
      rating: 8.1,
      genres: ["Sci-Fi", "Drama", "Comedy", "Action"],
      streamingPlatform: "Netflix",
      imdbRating: 8.1,
      rottenTomatoesScore: 95,
      redditBuzz: "High"
    },
    {
      id: 2,
      title: "Dune",
      overview: "Paul Atreides, a brilliant and gifted young man born into a great destiny beyond his understanding, must travel to the most dangerous planet in the universe to ensure the future of his family and his people.",
      posterPath: "https://m.media-amazon.com/images/M/MV5BN2FjNmEyNWMtYzM0ZS00NjIyLTg5YzYtYThlMGVjNzE1OGViXkEyXkFqcGdeQXVyMTkxNjUyNQ@@._V1_FMjpg_UX1000_.jpg",
      type: "movie",
      rating: 7.9,
      genres: ["Sci-Fi", "Adventure", "Drama"],
      streamingPlatform: "HBO Max",
      imdbRating: 8.0,
      rottenTomatoesScore: 83,
      redditBuzz: "High"
    },
    {
      id: 3,
      title: "Succession",
      overview: "The Roy family is known for controlling the biggest media and entertainment company in the world. However, their world changes when their father steps down from the company.",
      posterPath: "https://m.media-amazon.com/images/M/MV5BZTY0YjU0NTUtMGRmNS00NDMyLWI2MzYtNjM2MmM2Y2VmODliXkEyXkFqcGdeQXVyNjY1MTg4Mzc@._V1_.jpg",
      type: "tv",
      rating: 8.8,
      genres: ["Drama", "Comedy"],
      streamingPlatform: "HBO Max",
      imdbRating: 8.8,
      rottenTomatoesScore: 94,
      redditBuzz: "High"
    },
    {
      id: 4,
      title: "Nomadland",
      overview: "A woman in her sixties, after losing everything in the Great Recession, embarks on a journey through the American West, living as a van-dwelling modern-day nomad.",
      posterPath: "https://m.media-amazon.com/images/M/MV5BMDRiZWUxNmItNDU5Yy00ODNmLTk0M2ItZjQzZTA5OTJkZjkyXkEyXkFqcGdeQXVyMTkxNjUyNQ@@._V1_.jpg",
      type: "movie",
      rating: 7.4,
      genres: ["Drama"],
      streamingPlatform: "Hulu",
      imdbRating: 7.4,
      rottenTomatoesScore: 93,
      redditBuzz: "Medium"
    },
    {
      id: 5,
      title: "The Shawshank Redemption",
      overview: "Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.",
      posterPath: "https://m.media-amazon.com/images/M/MV5BNDE3ODcxYzMtY2YzZC00NmNlLWJiNDMtZDViZWM2MzIxZDYwXkEyXkFqcGdeQXVyNjAwNDUxODI@._V1_.jpg",
      type: "movie",
      rating: 9.3,
      genres: ["Drama", "Crime"],
      streamingPlatform: "Netflix, Prime Video",
      imdbRating: 9.3,
      rottenTomatoesScore: 91,
      redditBuzz: "High"
    },
    {
      id: 6,
      title: "Jojo Rabbit",
      overview: "A young boy in Hitler's army finds out his mother is hiding a Jewish girl in their home.",
      posterPath: "https://m.media-amazon.com/images/M/MV5BZjU0Yzk2MzEtMjAzYy00MzY0LTg2YmItM2RkNzdkY2ZhN2JkXkEyXkFqcGdeQXVyNDg4NjY5OTQ@._V1_.jpg",
      type: "movie",
      rating: 7.9,
      genres: ["Comedy", "Drama", "War"],
      streamingPlatform: "Disney+",
      imdbRating: 7.9,
      rottenTomatoesScore: 80,
      redditBuzz: "Medium"
    },
    {
      id: 7,
      title: "The Witch",
      overview: "A family in 1630s New England is torn apart by the forces of witchcraft, black magic, and possession.",
      posterPath: "https://m.media-amazon.com/images/M/MV5BMTUyNzkwMzAxOF5BMl5BanBnXkFtZTgwMzc1OTk1NjE@._V1_.jpg",
      type: "movie",
      rating: 6.9,
      genres: ["Drama", "Fantasy", "Horror", "Mystery"],
      streamingPlatform: "Netflix",
      imdbRating: 6.9,
      rottenTomatoesScore: 90,
      redditBuzz: "Medium"
    },
    {
      id: 8,
      title: "The Last of Us",
      overview: "Twenty years after modern civilization has been destroyed, Joel, a hardened survivor, is hired to smuggle Ellie, a 14-year-old girl, out of an oppressive quarantine zone.",
      posterPath: "https://m.media-amazon.com/images/M/MV5BZGUzYTI3M2EtZmM0Yy00NGUzLWJlYWUtZDhhNmQwNDFmZGJlXkEyXkFqcGdeQXVyNTM0OTY1OQ@@._V1_.jpg",
      type: "tv",
      rating: 8.6,
      genres: ["Action", "Adventure", "Drama"],
      streamingPlatform: "HBO Max",
      imdbRating: 8.6,
      rottenTomatoesScore: 96,
      redditBuzz: "High"
    },
    {
      id: 9,
      title: "Atlanta",
      overview: "Earn and his cousin Alfred try to make their way in the Atlanta music scene in order to better their lives and the lives of their families.",
      posterPath: "https://m.media-amazon.com/images/M/MV5BZGU5YTVlZTktNzgzMS00MGVlLTgyMGMtNWJjNWYyYTllYTZiXkEyXkFqcGdeQXVyMTUzMTg2ODkz._V1_.jpg",
      type: "tv",
      rating: 8.6,
      genres: ["Comedy", "Drama", "Music"],
      streamingPlatform: "Hulu",
      imdbRating: 8.6,
      rottenTomatoesScore: 98,
      redditBuzz: "High"
    },
    {
      id: 10,
      title: "Parasite",
      overview: "Greed and class discrimination threaten the newly formed symbiotic relationship between the wealthy Park family and the destitute Kim clan.",
      posterPath: "https://m.media-amazon.com/images/M/MV5BYWZjMjk3ZTItODQ2ZC00NTY5LWE0ZDYtZTI3MjcwN2Q5NTVkXkEyXkFqcGdeQXVyODk4OTc3MTY@._V1_.jpg",
      type: "movie",
      rating: 8.5,
      genres: ["Drama", "Thriller"],
      streamingPlatform: "Hulu",
      imdbRating: 8.5,
      rottenTomatoesScore: 99,
      redditBuzz: "High"
    }
  ];

  const handleRetakeQuiz = () => {
    setShowRecommendations(false);
    setShowQuiz(true);
  };

  const handleQuizComplete = () => {
    setShowQuiz(false);
    setShowRecommendations(true);
  };

  const startQuiz = () => {
    setShowQuiz(true);
  };

  // Platform data
  const streamingPlatforms = [
    { name: "Netflix" },
    { name: "Prime" },
    { name: "Hulu" },
    { name: "Disney+" },
    { name: "HBO Max" },
    { name: "Apple TV+" },
  ];

  // Landing page - clean, minimal design matching the inspiration exactly
  if (!showQuiz && !showRecommendations) {
    return (
      <div className="bg-white">
        {/* Hero Section */}
        <section className="min-h-screen flex flex-col items-center justify-center text-center px-4 py-16">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold mb-5 tracking-tight text-black">
              Tired of endlessly scrolling?
            </h1>
            
            <h2 className="text-4xl md:text-6xl font-bold mb-8">
              <span style={{
                background: 'linear-gradient(90deg, #ec4899 0%, #f87171 50%, #f97316 100%)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
                display: 'inline-block'
              }}>
                Find your next watch <span className="mx-2">—</span> instantly<span className="text-orange-400">.</span>
              </span>
            </h2>
            
            <p className="text-xl text-gray-600 mb-16 max-w-3xl mx-auto">
              Personalized recommendations powered by Reddit buzz, critic <br className="hidden md:block" />
              scores, and your mood.
            </p>
            
            <div className="flex justify-center">
              <button 
                onClick={startQuiz}
                style={{
                  background: 'linear-gradient(to right, #ec4899, #f87171, #f97316)',
                  color: 'white',
                  fontSize: '1.25rem',
                  fontWeight: '500',
                  padding: '0.75rem 2rem',
                  borderRadius: '9999px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  transition: 'all 300ms',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                }}
                onMouseOver={(e) => e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'}
                onMouseOut={(e) => e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'}
              >
                Get My Show <FaArrowRight className="ml-1" />
              </button>
            </div>
            
            {/* Connection status indicators */}
            <div className="mt-4 text-sm text-gray-500 space-y-1">
              {connectionStatus && (
                <div>
                  {connectionStatus === 'Supabase OK' ? 
                    <span className="text-green-500">✓ {connectionStatus}</span> : 
                    <span className="text-red-500">✗ {connectionStatus}</span>}
                </div>
              )}
              
              {tmdbStatus && (
                <div>
                  {tmdbStatus === 'TMDB OK' ? 
                    <span className="text-green-500">✓ {tmdbStatus}</span> : 
                    <span className="text-yellow-500">⚠ {tmdbStatus}</span>}
                </div>
              )}
              
              {isLoading && (
                <div className="text-blue-500">Loading content...</div>
              )}
              
              <div className="text-sm mt-1">
                <a href="/tmdb-test" className="text-blue-500 underline">Test TMDB Connection</a>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-20 px-4 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-16">How It Works</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Step 1 */}
              <div className="bg-white rounded-lg p-8 text-center flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-pink-100 flex items-center justify-center text-pink-500 font-bold text-2xl mb-6">
                  1
                </div>
                <h3 className="text-xl font-bold mb-3">Take Quiz</h3>
                <p className="text-gray-600">
                  Answer a few quick questions about your mood and preferences.
                </p>
              </div>
              
              {/* Step 2 */}
              <div className="bg-white rounded-lg p-8 text-center flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-pink-100 flex items-center justify-center text-pink-500 font-bold text-2xl mb-6">
                  2
                </div>
                <h3 className="text-xl font-bold mb-3">Get Recommendations</h3>
                <p className="text-gray-600">
                  Receive personalized movie and show recommendations.
                </p>
              </div>
              
              {/* Step 3 */}
              <div className="bg-white rounded-lg p-8 text-center flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-pink-100 flex items-center justify-center text-pink-500 font-bold text-2xl mb-6">
                  3
                </div>
                <h3 className="text-xl font-bold mb-3">Start Watching</h3>
                <p className="text-gray-600">
                  Enjoy your perfect match and save favorites for later.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Platforms Section */}
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-16">Available on all your favorite platforms</h2>
            
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
              {streamingPlatforms.map((platform, index) => (
                <div key={index} className="bg-gray-50 py-4 px-2 rounded-md">
                  <p className="font-medium text-gray-700">{platform.name}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section style={{
          background: 'linear-gradient(to right, #ec4899, #f97316)',
          padding: '4rem 1rem',
          color: 'white'
        }}>
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">Ready to find your next favorite show?</h2>
            
            <button 
              onClick={startQuiz}
              style={{
                background: 'white',
                color: '#ec4899',
                fontWeight: '500',
                padding: '0.75rem 1.5rem',
                borderRadius: '9999px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                margin: '0 auto'
              }}
            >
              Get My Show <FaArrowRight />
            </button>
          </div>
        </section>

        {/* Menu Items */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4 md:gap-6 mt-8">
          <a 
            onClick={startQuiz}
            className="bg-white rounded-lg shadow-sm p-6 text-center cursor-pointer transition-all hover:shadow-md border border-gray-200"
          >
            <h3 className="font-bold text-xl mb-2 text-pink-600">Take the Quiz</h3>
            <p className="text-gray-600 text-sm mb-4">Find your perfect watch recommendation by answering a few quick questions</p>
            <button className="inline-flex items-center bg-pink-500 text-white rounded-full px-4 py-2 text-sm">
              Start Now
              <FaArrowRight className="ml-2" />
            </button>
          </a>
          
          <a
            href="/recommendation-analytics"
            className="bg-white rounded-lg shadow-sm p-6 text-center cursor-pointer transition-all hover:shadow-md border border-gray-200"
          >
            <h3 className="font-bold text-xl mb-2 text-pink-600">View Analytics</h3>
            <p className="text-gray-600 text-sm mb-4">See how well our recommendations perform based on user feedback</p>
            <button className="inline-flex items-center bg-pink-500 text-white rounded-full px-4 py-2 text-sm">
              View Analytics
              <FaArrowRight className="ml-2" />
            </button>
          </a>
          
          <a
            href="/user-testing"
            className="bg-white rounded-lg shadow-sm p-6 text-center cursor-pointer transition-all hover:shadow-md border border-gray-200"
          >
            <h3 className="font-bold text-xl mb-2 text-pink-600">Help Us Improve</h3>
            <p className="text-gray-600 text-sm mb-4">Take a 3-minute test to help improve our recommendation algorithms</p>
            <button className="inline-flex items-center bg-pink-500 text-white rounded-full px-4 py-2 text-sm">
              Start Testing
              <FaArrowRight className="ml-2" />
            </button>
          </a>
          
          <a
            href="/content-library"
            className="bg-white rounded-lg shadow-sm p-6 text-center cursor-pointer transition-all hover:shadow-md border border-gray-200"
          >
            <h3 className="font-bold text-xl mb-2 text-pink-600">Content Library</h3>
            <p className="text-gray-600 text-sm mb-4">Explore our expanded collection of movies and TV shows from multiple sources</p>
            <button className="inline-flex items-center bg-pink-500 text-white rounded-full px-4 py-2 text-sm">
              Browse Library
              <FaArrowRight className="ml-2" />
            </button>
          </a>
        </div>

        {usingSampleData && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 max-w-3xl mx-auto mt-4">
            <p className="text-yellow-800">
              <strong>Note:</strong> We're currently showing sample recommendations due to an issue connecting to our movie database. 
              For personalized recommendations, please try the quiz.
            </p>
          </div>
        )}
      </div>
    );
  }

  // Quiz or Recommendations based on state
  return showQuiz ? (
    <Quiz onComplete={handleQuizComplete} />
  ) : (
    showRecommendations ? (
      <Recommendations 
        recommendations={recommendations} 
        onRetakeQuiz={handleRetakeQuiz} 
      />
    ) : (
      // Landing page UI code remains unchanged
      <div className="bg-white">
        {/* ... existing landing page code ... */}
        
        {usingSampleData && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 max-w-3xl mx-auto mt-4">
            <p className="text-yellow-800">
              <strong>Note:</strong> We're currently showing sample recommendations due to an issue connecting to our movie database. 
              For personalized recommendations, please try the quiz.
            </p>
          </div>
        )}
        
        {/* ... rest of the existing landing page code ... */}
      </div>
    )
  );
}
