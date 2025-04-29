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
          content = tmdbContent.map(item => adaptToWhat2WatchFormat(item));
        }
        
        // If that fails, try popular movies
        if (content.length === 0) {
          const popularMovies = await getPopularMovies();
          if (popularMovies.results.length > 0) {
            content = popularMovies.results.map(item => adaptToWhat2WatchFormat(item));
          }
        }
        
        // If we have content, use it
        if (content.length > 0) {
          console.log('TMDB API success, loaded', content.length, 'items');
          setRecommendations(content);
          setTmdbStatus('TMDB OK');
        } else {
          // Fall back to sample data
          console.log('TMDB API returned no content, using sample data');
          setRecommendations(sampleRecommendations);
          setTmdbStatus('TMDB Error (Using Sample Data)');
        }
      } catch (error) {
        console.error('Error loading TMDB content:', error);
        setRecommendations(sampleRecommendations);
        setTmdbStatus('TMDB Error (Using Sample Data)');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadTrendingContent();
  }, []);

  // Sample recommendations data
  const sampleRecommendations: MovieTVShow[] = [
    {
      id: 1,
      title: "Everything Everywhere All At Once",
      overview: "A wildly imaginative story about a woman who must save the multiverse by connecting with alternate versions of herself.",
      posterPath: "/rKvCys0fMIIi1X9rmJBxTPLAtoU.jpg",
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
      posterPath: "/d5NXSklXo0qyIYkgV94XAgMIckC.jpg",
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
      posterPath: "/xmNyk766OUW3MvZTqb6hy8aPfiF.jpg",
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
      posterPath: "/fmHBjfiMb7cP0dEZBOQBXn7peNN.jpg",
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
      posterPath: "/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg",
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
      posterPath: "/7GsM4mtM0worCtIVeiQt28HieeN.jpg",
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
      posterPath: "/zr33TBVf25rQZpW6PJP08Iu20UP.jpg",
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
      title: "The Social Network",
      overview: "As Harvard student Mark Zuckerberg creates the social networking site that would become known as Facebook, he is sued by the twins who claimed he stole their idea, and by the co-founder who was later squeezed out of the business.",
      posterPath: "/n0ybibhJtQ5icDqTp8eRytcIHJx.jpg",
      type: "movie",
      rating: 7.8,
      genres: ["Biography", "Drama"],
      streamingPlatform: "Netflix",
      imdbRating: 7.8,
      rottenTomatoesScore: 96,
      redditBuzz: "Medium"
    },
    {
      id: 9,
      title: "Parasite",
      overview: "Greed and class discrimination threaten the newly formed symbiotic relationship between the wealthy Park family and the destitute Kim clan.",
      posterPath: "/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg",
      type: "movie",
      rating: 8.6,
      genres: ["Comedy", "Drama", "Thriller"],
      streamingPlatform: "Hulu",
      imdbRating: 8.6,
      rottenTomatoesScore: 98,
      redditBuzz: "High"
    },
    {
      id: 10,
      title: "Stranger Things",
      overview: "When a young boy disappears, his mother, a police chief, and his friends must confront terrifying supernatural forces in order to get him back.",
      posterPath: "/49WJfeN0moxb9IPfGn8AIqMGskD.jpg",
      type: "tv",
      rating: 8.7,
      genres: ["Drama", "Fantasy", "Horror", "Mystery", "Sci-Fi", "Thriller"],
      streamingPlatform: "Netflix",
      imdbRating: 8.7,
      rottenTomatoesScore: 91,
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
      </div>
    );
  }

  // Quiz or Recommendations based on state
  return showQuiz ? (
    <Quiz onComplete={handleQuizComplete} />
  ) : (
    <Recommendations 
      recommendations={recommendations.length > 0 ? recommendations : sampleRecommendations} 
      onRetakeQuiz={handleRetakeQuiz} 
    />
  );
}
