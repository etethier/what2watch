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
  const [recommendations, setRecommendations] = useState<(MovieTVShow | null)[]>([]);
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
              // Filter out null values
              content = adaptedContent.filter(Boolean) as MovieTVShow[];
            }
          } catch (error) {
            console.error('Error fetching multiple pages:', error);
            const popularMovies = await getPopularMovies();
            if (popularMovies.results.length > 0) {
              // Explicitly cast the result to MovieTVShow[] to satisfy TypeScript
              const adaptedContent = await Promise.all(popularMovies.results.map(item => 
                adaptToWhat2WatchFormat({...item, media_type: 'movie' as const})
              ));
              // Filter out null values
              content = adaptedContent.filter(Boolean) as MovieTVShow[];
            }
          }
        }
        
        // If we have content, use it
        if (content.length > 0) {
          console.log('TMDB API success, loaded', content.length, 'items');
          
          // Randomize the order slightly for variety
          content.sort(() => Math.random() - 0.5);
          
          // Set recommendations
          setRecommendations(content.map(item => item as MovieTVShow | null));
          setTmdbStatus('TMDB OK');
          setUsingSampleData(false);
        } else {
          // Fall back to sample data
          console.log('TMDB API returned no content, using sample data');
          const allSampleData = [...sampleRecommendations, ...generateMoreSampleRecommendations()];
          setRecommendations(allSampleData.map(item => item as MovieTVShow | null));
          setTmdbStatus('TMDB Error (Using Sample Data)');
          setUsingSampleData(true);
        }
      } catch (error) {
        console.error('Error loading TMDB content:', error);
        const allSampleData = [...sampleRecommendations, ...generateMoreSampleRecommendations()];
        setRecommendations(allSampleData.map(item => item as MovieTVShow | null));
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

  // Sample recommendations
  const sampleRecommendations: MovieTVShow[] = [
    {
      id: 1,
      title: "Severance",
      overview: "Mark leads a team of office workers whose memories have been surgically divided between their work and personal lives.",
      posterPath: "https://m.media-amazon.com/images/M/MV5BMjE2MjI2ODM1OF5BMl5BanBnXkFtZTgwMjQ0NzMzOTE@._V1_.jpg",
      type: "tv",
      rating: 8.1,
      genres: ["Sci-Fi", "Drama", "Comedy", "Action"],
      streamingPlatform: ["Netflix", "Prime Video", "Apple TV+"],
      imdbRating: 8.1,
      rottenTomatoesScore: 95
    },
    {
      id: 2,
      title: "Dune",
      overview: "Paul Atreides, a brilliant and gifted young man born into a great destiny beyond his understanding, must travel to the most dangerous planet in the universe to ensure the future of his family and his people.",
      posterPath: "https://m.media-amazon.com/images/M/MV5BN2FjNmEyNWMtYzM0ZS00NjIyLTg5YzYtYThlMGVjNzE1OGViXkEyXkFqcGdeQXVyMTkxNjUyNQ@@._V1_FMjpg_UX1000_.jpg",
      type: "movie",
      rating: 7.9,
      genres: ["Sci-Fi", "Adventure", "Drama"],
      streamingPlatform: ["HBO Max", "Prime Video"],
      imdbRating: 8.0,
      rottenTomatoesScore: 83
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
      rottenTomatoesScore: 94
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
      rottenTomatoesScore: 93
    },
    {
      id: 5,
      title: "The Shawshank Redemption",
      overview: "Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.",
      posterPath: "https://m.media-amazon.com/images/M/MV5BNDE3ODcxYzMtY2YzZC00NmNlLWJiNDMtZDViZWM2MzIxZDYwXkEyXkFqcGdeQXVyNjAwNDUxODI@._V1_.jpg",
      type: "movie",
      rating: 9.3,
      genres: ["Drama", "Crime"],
      streamingPlatform: ["Netflix", "Prime Video", "HBO Max"],
      imdbRating: 9.3,
      rottenTomatoesScore: 91
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
      rottenTomatoesScore: 80
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
      rottenTomatoesScore: 90
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
      rottenTomatoesScore: 96
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
      rottenTomatoesScore: 98
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
      rottenTomatoesScore: 99
    }
  ];

  const handleRetakeQuiz = () => {
    setShowRecommendations(false);
    setShowQuiz(true);
    
    // Clear the quiz_completed flag when retaking the quiz
    if (typeof window !== 'undefined') {
      localStorage.removeItem('quiz_completed');
    }
  };

  const handleQuizComplete = () => {
    setShowQuiz(false);
    setShowRecommendations(true);
    
    // Set the quiz_completed flag in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('quiz_completed', 'true');
    }
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
        <section className="min-h-screen flex flex-col items-center justify-center text-center px-4 py-12 sm:py-20">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-4 sm:mb-6 tracking-tight text-black">
              Tired of endlessly scrolling?
            </h1>
            
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-4 sm:mb-8">
              <span className="bg-gradient-to-r from-pink-500 to-orange-400 bg-clip-text text-transparent">
                Find your next watch — instantly.
              </span>
            </h2>
            
            <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-8 sm:mb-10 max-w-3xl mx-auto">
              Personalized recommendations powered by AI.
            </p>
            
            <div className="flex justify-center mb-12 sm:mb-16">
              <button 
                onClick={startQuiz}
                className="bg-gradient-to-r from-pink-500 to-orange-400 text-white font-medium text-base sm:text-lg px-6 sm:px-8 py-3 rounded-full flex items-center justify-center gap-2 hover:shadow-lg transition-all duration-300"
              >
                Get My Show <FaArrowRight className="ml-2" />
              </button>
            </div>
            
            {/* How It Works Section */}
            <div className="max-w-6xl mx-auto mt-4 sm:mt-8 mb-8 sm:mb-10">
              <h2 className="text-xl sm:text-2xl font-bold text-center mb-6 sm:mb-8">How It Works</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                {/* Step 1 */}
                <div className="bg-white rounded-lg p-6 shadow-sm text-center flex flex-col items-center border border-gray-100">
                  <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center text-pink-500 font-bold text-lg mb-4">
                    1
                  </div>
                  <h3 className="text-lg font-bold mb-2">Take Quiz</h3>
                  <p className="text-gray-600">
                    Answer a few quick questions about your mood and preferences.
                  </p>
                </div>
                
                {/* Step 2 */}
                <div className="bg-white rounded-lg p-6 shadow-sm text-center flex flex-col items-center border border-gray-100">
                  <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center text-pink-500 font-bold text-lg mb-4">
                    2
                  </div>
                  <h3 className="text-lg font-bold mb-2">Get Recommendations</h3>
                  <p className="text-gray-600">
                    Receive personalized movie and show recommendations.
                  </p>
                </div>
                
                {/* Step 3 */}
                <div className="bg-white rounded-lg p-6 shadow-sm text-center flex flex-col items-center border border-gray-100">
                  <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center text-pink-500 font-bold text-lg mb-4">
                    3
                  </div>
                  <h3 className="text-lg font-bold mb-2">Start Watching</h3>
                  <p className="text-gray-600">
                    Enjoy your perfect match and save favorites for later.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Connection status indicators */}
            <div className="mt-6 text-sm text-gray-500 space-y-1">
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

        {/* Platforms Section */}
        <section className="py-12 px-4 bg-gray-50">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-8">Available on all your favorite platforms</h2>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
              {streamingPlatforms.map((platform, index) => (
                <div key={index} className="bg-white py-3 px-2 rounded-md shadow-sm">
                  <p className="font-medium text-gray-700">{platform.name}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-r from-pink-500 to-orange-400 text-white py-12 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-6">Ready to find your next favorite show?</h2>
            
            <button 
              onClick={startQuiz}
              className="bg-white text-pink-500 font-medium px-6 py-3 rounded-full flex items-center justify-center mx-auto hover:bg-gray-100 transition-colors"
            >
              Get My Show <FaArrowRight className="ml-2" />
            </button>
          </div>
        </section>

        {/* Sample Data Warning - if needed */}
        {usingSampleData && (
          <div className="container mx-auto px-4 py-8">
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 max-w-3xl mx-auto">
              <p className="text-yellow-800">
                <strong>Note:</strong> We're currently showing sample recommendations due to an issue connecting to our movie database. 
                For personalized recommendations, please try the quiz.
              </p>
            </div>
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
        recommendations={recommendations.filter((item): item is MovieTVShow => item !== null)} 
        onRetakeQuiz={handleRetakeQuiz} 
      />
    ) : (
      // Just return the original landing page component instead of duplicating the code
      <div className="bg-white">
        {/* Hero Section */}
        <section className="min-h-screen flex flex-col items-center justify-center text-center px-4 py-12 sm:py-20">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-4 sm:mb-6 tracking-tight text-black">
              Tired of endlessly scrolling?
            </h1>
            
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-4 sm:mb-8">
              <span className="bg-gradient-to-r from-pink-500 to-orange-400 bg-clip-text text-transparent">
                Find your next watch — instantly.
              </span>
            </h2>
            
            <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-8 sm:mb-10 max-w-3xl mx-auto">
              Personalized recommendations powered by AI.
            </p>
            
            <div className="flex justify-center mb-12 sm:mb-16">
              <button 
                onClick={startQuiz}
                className="bg-gradient-to-r from-pink-500 to-orange-400 text-white font-medium text-base sm:text-lg px-6 sm:px-8 py-3 rounded-full flex items-center justify-center gap-2 hover:shadow-lg transition-all duration-300"
              >
                Get My Show <FaArrowRight className="ml-2" />
              </button>
            </div>
            
            {/* Connection status indicators */}
            <div className="mt-6 text-sm text-gray-500 space-y-1">
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
      </div>
    )
  );
}
