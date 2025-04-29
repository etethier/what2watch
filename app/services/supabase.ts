import { createClient } from '@supabase/supabase-js';
import { MovieTVShow, Question, Option } from '../types/index';

// Initialize Supabase client with better error handling
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Log environment variable presence (not values) for debugging
if (typeof window !== 'undefined') {
  console.log('Supabase URL available:', !!supabaseUrl);
  console.log('Supabase Key available:', !!supabaseAnonKey);
}

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Check your .env.local file');
}

// Create client with proper error handling
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});

// Types to match our database schema
export interface User {
  id: string;
  email: string;
  display_name?: string;
  avatar_url?: string;
}

export interface QuizSession {
  id: string;
  user_id?: string;
  started_at: Date;
  completed_at?: Date;
  is_guest: boolean;
}

export interface QuizAnswer {
  session_id: string;
  question_id: number;
  selected_option_ids: number[]; // For both single and multi-select
}

export interface ContentGenre {
  id: number;
  name: string;
}

export interface StreamingPlatform {
  id: number;
  name: string;
  logo_url?: string;
}

export interface Recommendation {
  content: MovieTVShow;
  rank: number;
  relevance_score?: number;
}

// Service functions

// Authentication
export const authService = {
  // Sign up
  async signUp(email: string, password: string): Promise<{ user: User | null; error: Error | null }> {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { user: null, error };
    return { user: data.user as unknown as User, error: null };
  },

  // Sign in
  async signIn(email: string, password: string): Promise<{ user: User | null; error: Error | null }> {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { user: null, error };
    return { user: data.user as unknown as User, error: null };
  },

  // Sign out
  async signOut(): Promise<{ error: Error | null }> {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  // Get current user
  async getCurrentUser(): Promise<User | null> {
    const { data } = await supabase.auth.getUser();
    return data?.user as unknown as User || null;
  }
};

// Quiz service
export const quizService = {
  // Get all quiz questions with options
  async getQuestions(): Promise<Question[]> {
    try {
      const { data: questions, error: questionsError } = await supabase
        .from('quiz_questions')
        .select('*')
        .order('sort_order');

      if (questionsError) {
        console.error('Error fetching questions:', questionsError);
        return [];
      }

      // Get all options for all questions
      const { data: options, error: optionsError } = await supabase
        .from('quiz_options')
        .select('*')
        .order('sort_order');

      if (optionsError) {
        console.error('Error fetching options:', optionsError);
        return [];
      }

      // Map the database questions to our frontend Question type
      return questions.map(q => ({
        id: q.id,
        text: q.text,
        multiSelect: q.multi_select,
        options: options
          .filter(o => o.question_id === q.id)
          .map(o => ({
            id: o.id,
            text: o.text,
            value: o.value
          }))
      }));
    } catch (error) {
      console.error('Unexpected error in getQuestions:', error);
      return [];
    }
  },

  // Start a new quiz session
  async startQuizSession(userId?: string): Promise<QuizSession | null> {
    try {
      const isGuest = !userId;
      
      const { data, error } = await supabase
        .from('user_quiz_sessions')
        .insert({
          user_id: userId,
          is_guest: isGuest
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error starting quiz session:', error);
        return null;
      }

      return data as QuizSession;
    } catch (error) {
      console.error('Unexpected error in startQuizSession:', error);
      return null;
    }
  },

  // Save quiz answer
  async saveQuizAnswer(sessionId: string, questionId: number, selectedOptionIds: number[]): Promise<boolean> {
    try {
      // First insert the answer
      const { data: answerData, error: answerError } = await supabase
        .from('user_quiz_answers')
        .insert({
          session_id: sessionId,
          question_id: questionId
        })
        .select()
        .single();
      
      if (answerError) {
        console.error('Error saving quiz answer:', answerError);
        return false;
      }

      // Then insert all selected options
      const optionInserts = selectedOptionIds.map(optionId => ({
        answer_id: answerData.id,
        option_id: optionId
      }));

      const { error: optionsError } = await supabase
        .from('user_quiz_answer_options')
        .insert(optionInserts);
      
      if (optionsError) {
        console.error('Error saving quiz answer options:', optionsError);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Unexpected error in saveQuizAnswer:', error);
      return false;
    }
  },

  // Complete quiz session
  async completeQuizSession(sessionId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_quiz_sessions')
        .update({ completed_at: new Date() })
        .eq('id', sessionId);
      
      if (error) {
        console.error('Error completing quiz session:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Unexpected error in completeQuizSession:', error);
      return false;
    }
  }
};

// Content and recommendations service
export const contentService = {
  // Get recommendations based on quiz answers
  async getRecommendations(sessionId: string): Promise<Recommendation[]> {
    try {
      // In a production app, this would call your backend recommendation engine
      // For now, we'll simulate by using sample data to avoid database type issues
      
      // Create mock recommendations data
      const mockContent: MovieTVShow[] = [
        {
          id: 1,
          title: "Everything Everywhere All At Once",
          overview: "A wildly imaginative story about a woman who must save the multiverse.",
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
          overview: "Paul Atreides, a brilliant and gifted young man, must travel to the most dangerous planet in the universe.",
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
          overview: "The Roy family is known for controlling the biggest media and entertainment company in the world.",
          posterPath: "/xmNyk766OUW3MvZTqb6hy8aPfiF.jpg",
          type: "tv",
          rating: 8.8,
          genres: ["Drama", "Comedy"],
          streamingPlatform: "HBO Max",
          imdbRating: 8.8,
          rottenTomatoesScore: 94,
          redditBuzz: "High"
        }
      ];
      
      // Convert to recommendations format
      return mockContent.map((content, index) => ({
        content,
        rank: index + 1,
        relevance_score: 100 - index * 5
      }));
    } catch (error) {
      console.error('Unexpected error in getRecommendations:', error);
      return [];
    }
  },

  // Add content to user's watchlist
  async addToWatchlist(userId: string, contentId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_watchlist')
        .insert({
          user_id: userId,
          content_id: contentId
        });
      
      if (error) {
        console.error('Error adding to watchlist:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Unexpected error in addToWatchlist:', error);
      return false;
    }
  },

  // Remove content from user's watchlist
  async removeFromWatchlist(userId: string, contentId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_watchlist')
        .delete()
        .eq('user_id', userId)
        .eq('content_id', contentId);
      
      if (error) {
        console.error('Error removing from watchlist:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Unexpected error in removeFromWatchlist:', error);
      return false;
    }
  },

  // Mark content as watched
  async markAsWatched(userId: string, contentId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_watched_content')
        .insert({
          user_id: userId,
          content_id: contentId
        });
      
      if (error) {
        console.error('Error marking as watched:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Unexpected error in markAsWatched:', error);
      return false;
    }
  },

  // Unmark content as watched
  async unmarkAsWatched(userId: string, contentId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_watched_content')
        .delete()
        .eq('user_id', userId)
        .eq('content_id', contentId);
      
      if (error) {
        console.error('Error unmarking as watched:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Unexpected error in unmarkAsWatched:', error);
      return false;
    }
  },

  // Get user's watchlist
  async getWatchlist(userId: string): Promise<MovieTVShow[]> {
    try {
      // For demo purposes, return mock data to avoid database typing issues
      return [
        {
          id: 1,
          title: "Everything Everywhere All At Once",
          overview: "A wildly imaginative story about a woman who must save the multiverse.",
          posterPath: "/rKvCys0fMIIi1X9rmJBxTPLAtoU.jpg",
          type: "movie",
          rating: 8.1,
          genres: ["Sci-Fi", "Drama", "Comedy", "Action"],
          imdbRating: 8.1,
          rottenTomatoesScore: 95,
          redditBuzz: "High"
        }
      ];
    } catch (error) {
      console.error('Unexpected error in getWatchlist:', error);
      return [];
    }
  },

  // Get user's watched content
  async getWatchedContent(userId: string): Promise<MovieTVShow[]> {
    try {
      // For demo purposes, return mock data to avoid database typing issues
      return [
        {
          id: 2,
          title: "Dune",
          overview: "Paul Atreides, a brilliant and gifted young man, must travel to the most dangerous planet in the universe.",
          posterPath: "/d5NXSklXo0qyIYkgV94XAgMIckC.jpg",
          type: "movie",
          rating: 7.9,
          genres: ["Sci-Fi", "Adventure", "Drama"],
          imdbRating: 8.0,
          rottenTomatoesScore: 83,
          redditBuzz: "High"
        }
      ];
    } catch (error) {
      console.error('Unexpected error in getWatchedContent:', error);
      return [];
    }
  }
};

export default {
  auth: authService,
  quiz: quizService,
  content: contentService
}; 