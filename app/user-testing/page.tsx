'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FaArrowLeft, FaCheck, FaTimes, FaClipboardCheck } from 'react-icons/fa';
import { MovieTVShow } from '../types';

// Define types for test data
interface TestOption {
  id: string;
  content: {
    id: number;
    title: string;
    overview: string;
    posterPath: string;
    type: string;
    rating: number;
    genres: string[];
  };
}

interface TestItem {
  id: string;
  title: string;
  options: TestOption[];
  algorithm: string;
}

export default function UserTesting() {
  const [currentPage, setCurrentPage] = useState<'intro' | 'test' | 'thanks'>('intro');
  const [currentTestIndex, setCurrentTestIndex] = useState(0);
  const [testItems, setTestItems] = useState<TestItem[]>([]);
  const [answers, setAnswers] = useState<{[key: string]: string}>({});
  const [userId, setUserId] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  
  // Generate a unique user ID when the component mounts
  useEffect(() => {
    const id = `test-user-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    setUserId(id);
    
    // Load test content
    loadTestContent();
  }, []);
  
  // Load recommendation pairs for testing
  const loadTestContent = async () => {
    try {
      // In a full implementation, you would fetch these from the server
      // For now, we'll use sample data
      setTestItems([
        {
          id: 'test-1',
          title: 'Which recommendation better matches "action movies with compelling characters"?',
          options: [
            {
              id: 'option-1a',
              content: {
                id: 101,
                title: 'John Wick',
                overview: 'An ex-hitman comes out of retirement to track down the gangsters who killed his dog and took his car.',
                posterPath: 'https://image.tmdb.org/t/p/w500/fZPSd91yGE9fCcCe6OoQr6E3Pd7.jpg',
                type: 'movie',
                rating: 7.4,
                genres: ['Action', 'Thriller'],
              }
            },
            {
              id: 'option-1b',
              content: {
                id: 102,
                title: 'Mission: Impossible - Fallout',
                overview: 'Ethan Hunt and his IMF team, along with some familiar allies, race against time after a mission gone wrong.',
                posterPath: 'https://image.tmdb.org/t/p/w500/AkJQpZp9WoNdj7pLYSj1L0RcMMN.jpg',
                type: 'movie',
                rating: 7.7,
                genres: ['Action', 'Adventure', 'Thriller'],
              }
            }
          ],
          algorithm: 'Genre matching vs. character depth'
        },
        {
          id: 'test-2',
          title: 'Which recommendation better matches "thought-provoking sci-fi"?',
          options: [
            {
              id: 'option-2a',
              content: {
                id: 201,
                title: 'Interstellar',
                overview: 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity\'s survival.',
                posterPath: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
                type: 'movie',
                rating: 8.6,
                genres: ['Adventure', 'Drama', 'Sci-Fi'],
              }
            },
            {
              id: 'option-2b',
              content: {
                id: 202,
                title: 'Arrival',
                overview: 'A linguist is recruited by the military to communicate with alien lifeforms after twelve mysterious spacecraft appear around the world.',
                posterPath: 'https://image.tmdb.org/t/p/w500/x2FJsf1ElAgr63Y3PNPtJrcmpoe.jpg',
                type: 'movie',
                rating: 7.9,
                genres: ['Drama', 'Sci-Fi'],
              }
            }
          ],
          algorithm: 'Visual spectacle vs. cerebral storytelling'
        },
        {
          id: 'test-3',
          title: 'Which recommendation better matches "gripping drama series"?',
          options: [
            {
              id: 'option-3a',
              content: {
                id: 301,
                title: 'Breaking Bad',
                overview: 'A high school chemistry teacher diagnosed with inoperable lung cancer turns to manufacturing and selling methamphetamine in order to secure his family\'s future.',
                posterPath: 'https://image.tmdb.org/t/p/w500/ggFHVNu6YYI5L9pCfOacjizRGt.jpg',
                type: 'tv',
                rating: 8.5,
                genres: ['Drama', 'Crime', 'Thriller'],
              }
            },
            {
              id: 'option-3b',
              content: {
                id: 302,
                title: 'The Crown',
                overview: 'Follows the political rivalries and romance of Queen Elizabeth II\'s reign and the events that shaped the second half of the twentieth century.',
                posterPath: 'https://image.tmdb.org/t/p/w500/iSxwCUEB7f4AoijU0t3n5hJI3X3.jpg',
                type: 'tv',
                rating: 8.2,
                genres: ['Drama'],
              }
            }
          ],
          algorithm: 'Contemporary vs. historical settings'
        },
        {
          id: 'test-4',
          title: 'Which recommendation better matches "comedy with heart"?',
          options: [
            {
              id: 'option-4a',
              content: {
                id: 401,
                title: 'Ted Lasso',
                overview: 'American football coach Ted Lasso moves to England when he\'s hired to manage a soccer team, despite having no experience with the game.',
                posterPath: 'https://image.tmdb.org/t/p/w500/lJT7r1nprk1Z8t1ywiIa8h9d3rc.jpg',
                type: 'tv',
                rating: 8.8,
                genres: ['Comedy', 'Drama'],
              }
            },
            {
              id: 'option-4b',
              content: {
                id: 402,
                title: 'The Good Place',
                overview: 'Four people and their otherworldly frienemy struggle in the afterlife to define what it means to be good.',
                posterPath: 'https://image.tmdb.org/t/p/w500/oYzOVDIQ0PT8wiLQH8v51HEd1NQ.jpg',
                type: 'tv',
                rating: 8.2,
                genres: ['Comedy', 'Drama', 'Fantasy'],
              }
            }
          ],
          algorithm: 'Character-driven vs. concept-driven comedy'
        },
        {
          id: 'test-5',
          title: 'Which recommendation better matches "thrilling mystery that keeps you guessing"?',
          options: [
            {
              id: 'option-5a',
              content: {
                id: 501,
                title: 'Knives Out',
                overview: 'A detective investigates the death of a patriarch of an eccentric, combative family.',
                posterPath: 'https://image.tmdb.org/t/p/w500/pThyQovXQrw2m0s9x82twj48Jq4.jpg',
                type: 'movie',
                rating: 7.9,
                genres: ['Comedy', 'Crime', 'Drama', 'Mystery', 'Thriller'],
              }
            },
            {
              id: 'option-5b',
              content: {
                id: 502,
                title: 'Gone Girl',
                overview: 'With his wife\'s disappearance having become the focus of an intense media circus, a man sees the spotlight turned on him when it\'s suspected that he may not be innocent.',
                posterPath: 'https://image.tmdb.org/t/p/w500/7iEeCswHfPGMNfA3SDmXZb9iblR.jpg',
                type: 'movie',
                rating: 8.0,
                genres: ['Drama', 'Mystery', 'Thriller'],
              }
            }
          ],
          algorithm: 'Whodunit vs. psychological thriller'
        }
      ]);
    } catch (error) {
      console.error('Error loading test content:', error);
    }
  };
  
  // Start the test
  const startTest = () => {
    setCurrentPage('test');
  };
  
  // Handle selecting an option
  const selectOption = (optionId: string) => {
    setAnswers({
      ...answers,
      [testItems[currentTestIndex].id]: optionId
    });
    
    // Move to the next test after a short delay
    setTimeout(() => {
      if (currentTestIndex < testItems.length - 1) {
        setCurrentTestIndex(currentTestIndex + 1);
      } else {
        // All tests completed
        saveResults();
      }
    }, 800);
  };
  
  // Save test results
  const saveResults = async () => {
    setIsSaving(true);
    
    try {
      // In a real implementation, you would send this data to your server
      const results = {
        userId,
        timestamp: new Date().toISOString(),
        answers: Object.entries(answers).map(([testId, optionId]) => {
          const test = testItems.find(item => item.id === testId) as TestItem | undefined;
          return {
            testId,
            prompt: test?.title || '',
            selectedOption: optionId,
            algorithm: test?.algorithm,
            contentId: test?.options.find((opt: TestOption) => opt.id === optionId)?.content.id
          };
        })
      };
      
      // Log results for now
      console.log('User testing results:', results);
      
      // In a real app, you would send this data to your server:
      // await fetch('/api/user-testing/save', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(results)
      // });
      
      // For now, save to localStorage for demonstration
      const allResults = JSON.parse(localStorage.getItem('user_testing_results') || '[]');
      allResults.push(results);
      localStorage.setItem('user_testing_results', JSON.stringify(allResults));
      
      setCurrentPage('thanks');
    } catch (error) {
      console.error('Error saving results:', error);
      alert('There was an error saving your results. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Render content card for a test option
  const renderContentCard = (content: any) => {
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow">
        <div className="aspect-w-2 aspect-h-3 relative">
          {/* Poster image */}
          <img
            src={content.posterPath?.startsWith('http') 
              ? content.posterPath 
              : `https://image.tmdb.org/t/p/w500${content.posterPath}`}
            alt={content.title}
            className="object-cover w-full h-full"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/500x750?text=No+Image';
            }}
          />
          
          {/* Content Type Badge */}
          <div className="absolute top-2 right-2">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              content.type === 'movie' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
            }`}>
              {content.type === 'movie' ? 'Movie' : 'TV Show'}
            </span>
          </div>
        </div>
        
        <div className="p-4">
          <h3 className="font-bold text-lg mb-1 leading-tight">{content.title}</h3>
          
          {/* Rating */}
          <div className="flex items-center mb-2">
            <div className="flex items-center bg-yellow-100 px-2 py-0.5 rounded-full">
              <svg className="w-4 h-4 text-yellow-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-sm font-medium text-gray-700">{content.rating}</span>
            </div>
          </div>
          
          {/* Genres */}
          <div className="flex flex-wrap gap-1 mb-3">
            {content.genres.slice(0, 3).map((genre: string, idx: number) => (
              <span 
                key={idx}
                className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-800"
              >
                {genre}
              </span>
            ))}
          </div>
          
          {/* Overview - truncated */}
          <p className="text-gray-600 text-sm line-clamp-3">{content.overview}</p>
        </div>
      </div>
    );
  };
  
  // Render the current page
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 text-black p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header with back button */}
        <div className="flex items-center mb-6">
          <Link href="/" className="flex items-center text-gray-600 hover:text-pink-500 transition-colors">
            <FaArrowLeft className="mr-2" />
            <span>Back to Home</span>
          </Link>
        </div>
        
        {/* Introduction Page */}
        {currentPage === 'intro' && (
          <div className="bg-white rounded-lg shadow-md p-8 text-center max-w-2xl mx-auto">
            <div className="text-5xl text-pink-500 mb-4 flex justify-center">
              <FaClipboardCheck />
            </div>
            <h1 className="text-3xl font-bold mb-4">Help Us Improve Our Recommendations</h1>
            <p className="text-gray-600 mb-6">
              We're conducting a quick study to improve our recommendation algorithm. 
              You'll be shown 5 pairs of content recommendations, and for each pair, 
              please select the one that better matches the given description.
            </p>
            <p className="text-gray-600 mb-8">
              This should take less than 3 minutes to complete. Your feedback is valuable and will help us 
              provide better recommendations to all users!
            </p>
            <button 
              onClick={startTest}
              className="bg-gradient-to-r from-pink-500 to-orange-400 text-white px-8 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              Start User Test
            </button>
          </div>
        )}
        
        {/* Testing Page */}
        {currentPage === 'test' && testItems.length > 0 && (
          <div className="max-w-5xl mx-auto">
            {/* Progress indicator */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Progress</span>
                <span>{currentTestIndex + 1} of {testItems.length}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-gradient-to-r from-pink-500 to-orange-400 h-2.5 rounded-full" 
                  style={{ width: `${((currentTestIndex + 1) / testItems.length) * 100}%` }}
                />
              </div>
            </div>
            
            {/* Current test */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-bold mb-6 text-center">
                {testItems[currentTestIndex].title}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {testItems[currentTestIndex].options.map((option: any) => (
                  <div 
                    key={option.id}
                    className={`cursor-pointer relative ${
                      answers[testItems[currentTestIndex].id] === option.id 
                        ? 'ring-4 ring-pink-500 rounded-lg' 
                        : ''
                    }`}
                    onClick={() => selectOption(option.id)}
                  >
                    {renderContentCard(option.content)}
                    
                    {/* Selected indicator */}
                    {answers[testItems[currentTestIndex].id] === option.id && (
                      <div className="absolute -top-4 -right-4 bg-pink-500 text-white rounded-full p-2">
                        <FaCheck className="text-sm" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Thank You Page */}
        {currentPage === 'thanks' && (
          <div className="bg-white rounded-lg shadow-md p-8 text-center max-w-2xl mx-auto">
            <div className="text-5xl text-green-500 mb-4 flex justify-center">
              <FaCheck />
            </div>
            <h1 className="text-3xl font-bold mb-4">Thank You!</h1>
            <p className="text-gray-600 mb-6">
              Your feedback has been successfully recorded. We'll use this information to improve our recommendation algorithm.
            </p>
            <div className="flex justify-center space-x-4">
              <Link href="/" className="bg-pink-500 text-white px-6 py-2 rounded-lg hover:bg-pink-600 transition-colors">
                Return Home
              </Link>
              <button 
                onClick={() => window.location.reload()}
                className="border border-pink-500 text-pink-500 px-6 py-2 rounded-lg hover:bg-pink-50 transition-colors"
              >
                Take Another Test
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 