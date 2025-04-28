import { createClient } from '@supabase/supabase-js';
import { MovieTVShow, Question, Option } from '../types';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
  },

  // Start a new quiz session
  async startQuizSession(userId?: string): Promise<QuizSession | null> {
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
  },

  // Save quiz answer
  async saveQuizAnswer(sessionId: string, questionId: number, selectedOptionIds: number[]): Promise<boolean> {
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
  },

  // Complete quiz session
  async completeQuizSession(sessionId: string): Promise<boolean> {
    const { error } = await supabase
      .from('user_quiz_sessions')
      .update({ completed_at: new Date() })
      .eq('id', sessionId);
    
    if (error) {
      console.error('Error completing quiz session:', error);
      return false;
    }

    return true;
  }
};

// Content and recommendations service
export const contentService = {
  // Get recommendations based on quiz answers
  async getRecommendations(sessionId: string): Promise<Recommendation[]> {
    // In a production app, this would call your backend recommendation engine
    // For now, we'll simulate by fetching some random content

    const { data: recommendationData, error: recommendationError } = await supabase
      .from('content')
      .select('*')
      .limit(10);

    if (recommendationError) {
      console.error('Error fetching recommendations:', recommendationError);
      return [];
    }

    // Convert database content to MovieTVShow format
    const recommendations = recommendationData.map((content, index) => {
      return {
        rank: index + 1,
        relevance_score: 100 - index * 5, // Mock score that decreases with rank
        content: {
          id: content.id,
          title: content.title,
          overview: content.overview,
          posterPath: content.poster_path,
          type: content.type as 'movie' | 'tv',
          rating: content.imdb_rating,
          genres: [], // We'll populate these next
          streamingPlatform: '', // We'll populate these next
          imdbRating: content.imdb_rating,
          rottenTomatoesScore: content.rotten_tomatoes_score,
          redditBuzz: content.reddit_buzz as 'Low' | 'Medium' | 'High'
        }
      };
    });

    // For each content item, get its genres
    for (const rec of recommendations) {
      const { data: genreData } = await supabase
        .from('content_genres')
        .select('genres(name)')
        .eq('content_id', rec.content.id);

      rec.content.genres = genreData?.map(g => g.genres.name) || [];

      // Get streaming platforms
      const { data: platformData } = await supabase
        .from('content_platforms')
        .select('streaming_platforms(name)')
        .eq('content_id', rec.content.id);

      rec.content.streamingPlatform = platformData?.map(p => p.streaming_platforms.name).join(', ') || '';
    }

    // Store recommendations in the database
    for (const rec of recommendations) {
      await supabase
        .from('recommendations')
        .insert({
          session_id: sessionId,
          content_id: rec.content.id,
          rank: rec.rank,
          relevance_score: rec.relevance_score
        });
    }

    return recommendations;
  },

  // Add content to user's watchlist
  async addToWatchlist(userId: string, contentId: string): Promise<boolean> {
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
  },

  // Remove content from user's watchlist
  async removeFromWatchlist(userId: string, contentId: string): Promise<boolean> {
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
  },

  // Mark content as watched
  async markAsWatched(userId: string, contentId: string): Promise<boolean> {
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
  },

  // Unmark content as watched
  async unmarkAsWatched(userId: string, contentId: string): Promise<boolean> {
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
  },

  // Get user's watchlist
  async getWatchlist(userId: string): Promise<MovieTVShow[]> {
    const { data, error } = await supabase
      .from('user_watchlist')
      .select('content(*)')
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error fetching watchlist:', error);
      return [];
    }

    // Convert database content to MovieTVShow format
    return data.map(item => {
      const content = item.content;
      return {
        id: content.id,
        title: content.title,
        overview: content.overview,
        posterPath: content.poster_path,
        type: content.type as 'movie' | 'tv',
        rating: content.imdb_rating,
        genres: [], // Would need to fetch separately
        imdbRating: content.imdb_rating,
        rottenTomatoesScore: content.rotten_tomatoes_score,
        redditBuzz: content.reddit_buzz as 'Low' | 'Medium' | 'High'
      };
    });
  },

  // Get user's watched content
  async getWatchedContent(userId: string): Promise<MovieTVShow[]> {
    const { data, error } = await supabase
      .from('user_watched_content')
      .select('content(*)')
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error fetching watched content:', error);
      return [];
    }

    // Convert database content to MovieTVShow format
    return data.map(item => {
      const content = item.content;
      return {
        id: content.id,
        title: content.title,
        overview: content.overview,
        posterPath: content.poster_path,
        type: content.type as 'movie' | 'tv',
        rating: content.imdb_rating,
        genres: [], // Would need to fetch separately
        imdbRating: content.imdb_rating,
        rottenTomatoesScore: content.rotten_tomatoes_score,
        redditBuzz: content.reddit_buzz as 'Low' | 'Medium' | 'High'
      };
    });
  }
};

export default {
  auth: authService,
  quiz: quizService,
  content: contentService
}; 