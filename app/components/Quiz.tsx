'use client';

import { useState, useEffect } from 'react';
import { Question, QuizState, MovieTVShow } from '../types';
import { questions } from '../data/questions';
import Recommendations from './Recommendations';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import supabaseService from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';

interface QuizProps {
  onComplete?: () => void;
}

export default function Quiz({ onComplete }: QuizProps) {
  const [quizState, setQuizState] = useState<QuizState>({
    currentQuestionIndex: 0,
    answers: {},
  });
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [recommendations, setRecommendations] = useState<MovieTVShow[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<{[key: number]: number[]}>({}); // Track selected options for multi-select questions
  const [quizSessionId, setQuizSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const { user } = useAuth();
  
  const currentQuestion = questions[quizState.currentQuestionIndex];
  const progress = Math.round(((quizState.currentQuestionIndex + 1) / questions.length) * 100);
  
  // Start a new quiz session when the component is mounted
  useEffect(() => {
    const startSession = async () => {
      try {
        // Start a new session and get the session ID
        const session = await supabaseService.quiz.startQuizSession(user?.id);
        if (session) {
          setQuizSessionId(session.id);
        }
      } catch (error) {
        console.error('Error starting quiz session:', error);
      }
    };
    
    startSession();
  }, [user]);
  
  const handleOptionSelect = (optionId: number) => {
    // For multi-select questions
    if (currentQuestion.multiSelect) {
      setSelectedOptions(prev => {
        const currentSelections = prev[currentQuestion.id] || [];
        
        // If already selected, remove it
        if (currentSelections.includes(optionId)) {
          return {
            ...prev,
            [currentQuestion.id]: currentSelections.filter(id => id !== optionId)
          };
        } 
        // Otherwise add it
        else {
          return {
            ...prev,
            [currentQuestion.id]: [...currentSelections, optionId]
          };
        }
      });
    } 
    // For single-select questions, immediately go to next question
    else {
      const option = currentQuestion.options.find(o => o.id === optionId);
      if (option) {
        handleNext(option.value);
      }
    }
  };

  const isOptionSelected = (optionId: number): boolean => {
    if (!currentQuestion.multiSelect) return false;
    const selections = selectedOptions[currentQuestion.id] || [];
    return selections.includes(optionId);
  };
  
  const handleNext = async (valueOrValues?: string | string[]) => {
    let value: string | string[] = valueOrValues || '';
    let selectedOptionIds: number[] = [];
    
    // For multi-select, collect all selected option values
    if (currentQuestion.multiSelect && !valueOrValues) {
      selectedOptionIds = selectedOptions[currentQuestion.id] || [];
      value = selectedOptionIds.map(id => {
        const option = currentQuestion.options.find(o => o.id === id);
        return option ? option.value : '';
      }).filter(v => v); // Remove empty values
    } else if (!currentQuestion.multiSelect && typeof valueOrValues === 'string') {
      // For single-select, find the option ID
      const option = currentQuestion.options.find(o => o.value === valueOrValues);
      if (option) {
        selectedOptionIds = [option.id];
      }
    }
    
    // Save answer to Supabase if we have a session ID
    if (quizSessionId) {
      try {
        await supabaseService.quiz.saveQuizAnswer(
          quizSessionId, 
          currentQuestion.id, 
          selectedOptionIds
        );
      } catch (error) {
        console.error('Error saving quiz answer:', error);
      }
    }
    
    const newAnswers = {
      ...quizState.answers,
      [currentQuestion.id]: value,
    };

    if (quizState.currentQuestionIndex < questions.length - 1) {
      setQuizState({
        currentQuestionIndex: quizState.currentQuestionIndex + 1,
        answers: newAnswers,
      });
      
      // Reset selections for the next question
      if (currentQuestion.multiSelect) {
        setSelectedOptions(prev => ({...prev}));
      }
    } else {
      // Mark the quiz session as completed
      if (quizSessionId) {
        try {
          await supabaseService.quiz.completeQuizSession(quizSessionId);
        } catch (error) {
          console.error('Error completing quiz session:', error);
        }
      }
      
      setIsLoading(true);
      
      try {
        // Get recommendations from Supabase based on the user's answers
        let recommendationsData: MovieTVShow[] = [];
        
        if (quizSessionId) {
          // In a full implementation, we would call the recommendation engine
          // For now, we'll use the mock data from app/page.tsx
          const mockRecommendations = await supabaseService.content.getRecommendations(quizSessionId);
          recommendationsData = mockRecommendations.map(rec => rec.content);
        } else {
          // Fallback to hardcoded recommendations if no session ID
          recommendationsData = [
            // Copy the same recommendations from the original component
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
            // ...more recommendations
          ];
        }
        
        // If onComplete is provided, call it instead of showing recommendations directly
        if (onComplete) {
          onComplete();
        } else {
          setRecommendations(recommendationsData);
          setShowRecommendations(true);
        }
      } catch (error) {
        console.error('Error getting recommendations:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  const handleBack = () => {
    if (quizState.currentQuestionIndex > 0) {
      setQuizState({
        currentQuestionIndex: quizState.currentQuestionIndex - 1,
        answers: quizState.answers,
      });
    }
  };

  const handleRetakeQuiz = async () => {
    // Start a new quiz session
    try {
      const session = await supabaseService.quiz.startQuizSession(user?.id);
      if (session) {
        setQuizSessionId(session.id);
      }
    } catch (error) {
      console.error('Error starting new quiz session:', error);
    }
    
    // Reset the quiz state
    setQuizState({
      currentQuestionIndex: 0,
      answers: {},
    });
    setShowRecommendations(false);
    setRecommendations([]);
    setSelectedOptions({});
  };

  if (showRecommendations) {
    return (
      <Recommendations 
        recommendations={recommendations} 
        onRetakeQuiz={handleRetakeQuiz}
        sessionId={quizSessionId || undefined}
      />
    );
  }

  return (
    <div className="min-h-screen bg-white text-black p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header with back button */}
        <div className="flex items-center mb-8">
          <button 
            onClick={handleBack}
            className="flex items-center text-gray-600 hover:text-black transition-colors"
            disabled={quizState.currentQuestionIndex === 0}
          >
            <FaArrowLeft className="mr-2" />
            <span>Back to Home</span>
          </button>
        </div>
        
        {/* Main title */}
        <h1 className="text-3xl md:text-4xl font-bold mb-6">Find What to Watch Next</h1>
        
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            <span>Step {quizState.currentQuestionIndex + 1} of {questions.length}</span>
            <span>{progress}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-black h-full rounded-full" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="text-center py-10">
            <p className="text-lg">Getting your personalized recommendations...</p>
          </div>
        )}
        
        {!isLoading && (
          <>
            {/* Question card */}
            <div className="border border-gray-200 rounded-lg p-8 mb-8">
              <h2 className="text-2xl font-bold mb-4">{currentQuestion.text}</h2>
              
              {currentQuestion.multiSelect && (
                <p className="text-gray-600 mb-6">(Pick as many as you like!)</p>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentQuestion.options.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleOptionSelect(option.id)}
                    className={`p-4 text-left rounded-lg border-2 transition-colors duration-200 ${
                      isOptionSelected(option.id) 
                        ? 'border-black bg-gray-100' 
                        : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    {option.text}
                  </button>
                ))}
              </div>
              
              {/* Show Next button for multi-select questions */}
              {currentQuestion.multiSelect && (
                <div className="mt-8 flex justify-end">
                  <button
                    onClick={() => handleNext()}
                    className="bg-gradient-to-r from-pink-500 to-orange-400 text-white px-6 py-2 rounded-full flex items-center"
                    disabled={(selectedOptions[currentQuestion.id] || []).length === 0}
                  >
                    Next <FaArrowRight className="ml-2" />
                  </button>
                </div>
              )}
            </div>
            
            {/* Navigation for single select is handled automatically when clicking an option */}
            <div className="flex justify-between">
              <button
                onClick={handleBack}
                className="text-gray-600 hover:text-black px-6 py-2 rounded-full border border-gray-300 flex items-center"
                disabled={quizState.currentQuestionIndex === 0}
              >
                <FaArrowLeft className="mr-2" /> Back
              </button>
              
              {!currentQuestion.multiSelect && (
                <div className="invisible">
                  <button className="px-6 py-2">
                    Next
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
} 