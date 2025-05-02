'use client';

import { useState, useEffect } from 'react';
import { Question, QuizState, MovieTVShow } from '../types';
import { questions } from '../data/questions';
import Recommendations from './Recommendations';
import { FaArrowLeft, FaArrowRight, FaFilm, FaTv, FaSmile, FaRegLightbulb, FaCheck } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [animationDirection, setAnimationDirection] = useState('forward');
  
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

  // Get the question icon based on the question ID
  const getQuestionIcon = (questionId: number) => {
    switch (questionId) {
      case 1:
        return <FaSmile className="text-pink-500 text-2xl mr-3" />; // Mood
      case 2:
        return <FaFilm className="text-pink-500 text-2xl mr-3" />; // Genre
      case 3:
        return <FaTv className="text-pink-500 text-2xl mr-3" />; // Length
      case 4:
        return <FaRegLightbulb className="text-pink-500 text-2xl mr-3" />; // Streaming
      default:
        return null;
    }
  };
  
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
    setAnimationDirection('forward');
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
      setAnimationDirection('backward');
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

  // Animation variants for question transitions
  const variants = {
    enter: (direction: string) => ({
      x: direction === 'forward' ? 100 : -100,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: string) => ({
      x: direction === 'forward' ? -100 : 100,
      opacity: 0,
    }),
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 text-black p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header with back button - improved for mobile */}
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <button 
            onClick={handleBack}
            className="flex items-center text-gray-600 hover:text-pink-500 transition-colors py-2 px-3 md:px-4 rounded-lg"
            disabled={quizState.currentQuestionIndex === 0}
          >
            <FaArrowLeft className="mr-2" />
            <span>Back</span>
          </button>
          
          {/* Mobile-friendly progress text */}
          <span className="text-sm md:text-base font-medium text-pink-500">
            {quizState.currentQuestionIndex + 1}/{questions.length}
          </span>
        </div>
        
        {/* Main title with gradient - improved size scaling for mobile */}
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 md:mb-6 bg-gradient-to-r from-pink-500 via-red-500 to-orange-400 bg-clip-text text-transparent">
          Find What to Watch Next
        </h1>
        
        {/* Enhanced progress indicator - better spacing for mobile */}
        <div className="mb-6 md:mb-8">
          <div className="flex justify-between mb-2">
            <span className="font-medium text-sm md:text-base">Step {quizState.currentQuestionIndex + 1} of {questions.length}</span>
            <span className="text-pink-500 font-medium text-sm md:text-base">{progress}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 h-2 md:h-3 rounded-full overflow-hidden">
            <motion.div 
              className="bg-gradient-to-r from-pink-500 to-orange-400 h-full rounded-full"
              style={{ width: `${progress}%` }}
              initial={{ width: "0%" }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            ></motion.div>
          </div>
          {/* Steps indicators - adjusted for better visibility on mobile */}
          <div className="flex justify-between mt-2">
            {questions.map((_, index) => (
              <div 
                key={index}
                className={`w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                  index < quizState.currentQuestionIndex
                    ? 'bg-pink-500 text-white' 
                    : index === quizState.currentQuestionIndex
                    ? 'bg-gradient-to-r from-pink-500 to-orange-400 text-white ring-2 md:ring-4 ring-pink-100'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {index < quizState.currentQuestionIndex ? <FaCheck className="text-xs" /> : index + 1}
              </div>
            ))}
          </div>
        </div>
        
        {/* Loading indicator */}
        {isLoading && (
          <motion.div 
            className="text-center py-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="w-20 h-20 mx-auto mb-4">
              <svg className="animate-spin w-full h-full" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <circle 
                  className="opacity-25" 
                  cx="50" cy="50" r="45" 
                  stroke="currentColor" 
                  strokeWidth="10" 
                  fill="none" 
                />
                <circle 
                  className="opacity-75" 
                  cx="50" cy="50" r="45" 
                  stroke="url(#gradient)" 
                  strokeWidth="10" 
                  fill="none" 
                  strokeDasharray="283" 
                  strokeDashoffset="100" 
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#ec4899" />
                    <stop offset="100%" stopColor="#f97316" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <p className="text-xl font-medium bg-gradient-to-r from-pink-500 to-orange-400 bg-clip-text text-transparent">
              Creating your personalized recommendations...
            </p>
            <p className="text-gray-600 mt-2">Analyzing your preferences to find the perfect matches</p>
          </motion.div>
        )}
        
        {!isLoading && (
          <AnimatePresence mode="wait" custom={animationDirection}>
            <motion.div
              key={quizState.currentQuestionIndex}
              custom={animationDirection}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 }
              }}
            >
              {/* Question card with enhanced styling for mobile */}
              <div className="bg-white border border-gray-200 rounded-xl md:rounded-2xl p-5 md:p-8 mb-6 md:mb-8 shadow-lg">
                <div className="flex items-start md:items-center mb-4 md:mb-6">
                  <div className="mt-1 md:mt-0">
                    {getQuestionIcon(currentQuestion.id)}
                  </div>
                  <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-pink-500 to-orange-400 bg-clip-text text-transparent">
                    {currentQuestion.text}
                  </h2>
                </div>
                
                {currentQuestion.multiSelect && (
                  <p className="text-gray-600 mb-4 md:mb-6 ml-8 italic text-sm md:text-base">
                    Pick as many as you like!
                  </p>
                )}
                
                {/* Options grid - improved for mobile */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 ml-0 md:ml-8">
                  {currentQuestion.options.map((option) => (
                    <motion.button
                      key={option.id}
                      onClick={() => handleOptionSelect(option.id)}
                      className={`p-4 text-left rounded-xl border-2 transition-all duration-200 transform hover:scale-102 md:hover:scale-105 ${
                        isOptionSelected(option.id) 
                          ? 'border-pink-500 bg-gradient-to-r from-pink-50 to-orange-50 shadow-md' 
                          : 'border-gray-200 hover:border-pink-300 hover:shadow-md'
                      }`}
                      whileHover={{ y: -3 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center">
                        <div className={`min-w-5 w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                          isOptionSelected(option.id)
                            ? 'border-pink-500 bg-pink-500'
                            : 'border-gray-300'
                        }`}>
                          {isOptionSelected(option.id) && <FaCheck className="text-white text-xs" />}
                        </div>
                        <span className={`font-medium text-sm md:text-base ${isOptionSelected(option.id) ? 'text-pink-700' : 'text-gray-700'}`}>
                          {option.text}
                        </span>
                      </div>
                    </motion.button>
                  ))}
                </div>
                
                {/* Show Next button for multi-select questions - enhanced for mobile */}
                {currentQuestion.multiSelect && (
                  <div className="mt-6 md:mt-8 flex justify-center md:justify-end">
                    <motion.button
                      onClick={() => handleNext()}
                      className="bg-gradient-to-r from-pink-500 to-orange-400 text-white px-6 md:px-8 py-2.5 md:py-3 rounded-full flex items-center shadow-md w-full md:w-auto justify-center"
                      disabled={(selectedOptions[currentQuestion.id] || []).length === 0}
                      whileHover={{ scale: 1.03, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)" }}
                      whileTap={{ scale: 0.97 }}
                    >
                      Next <FaArrowRight className="ml-2" />
                    </motion.button>
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        )}
        
        {/* Navigation buttons - improved for mobile */}
        {!isLoading && (
          <div className="flex justify-between mt-4">
            <motion.button
              onClick={handleBack}
              className={`text-gray-600 hover:text-pink-500 px-4 md:px-6 py-2 rounded-full border border-gray-300 flex items-center transition-colors ${
                quizState.currentQuestionIndex === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:border-pink-300'
              }`}
              disabled={quizState.currentQuestionIndex === 0}
              whileHover={{ scale: quizState.currentQuestionIndex === 0 ? 1 : 1.03 }}
              whileTap={{ scale: quizState.currentQuestionIndex === 0 ? 1 : 0.97 }}
            >
              <FaArrowLeft className="mr-2" /> Back
            </motion.button>
            
            {!currentQuestion.multiSelect && (
              <div className="invisible">
                <button className="px-6 py-2">
                  Next
                </button>
              </div>
            )}
          </div>
        )}
        
        {/* Quiz info - adjusted for mobile */}
        {!isLoading && (
          <div className="mt-8 md:mt-12 border-t border-gray-200 pt-4 md:pt-6 text-center">
            <p className="text-xs md:text-sm text-gray-500">
              Your answers help us find the perfect content recommendations for you.
              <br className="hidden sm:block" /> All your preferences are taken into account to deliver personalized results.
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 