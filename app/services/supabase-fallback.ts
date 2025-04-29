// This is a fallback implementation to prevent runtime errors when Supabase isn't connecting properly

// Mock types that match our database schema
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

// Mock services
export const authService = {
  // Sign up
  async signUp() {
    console.warn('Using fallback Supabase implementation - signUp');
    return { user: null, error: new Error('Using fallback implementation') };
  },

  // Sign in
  async signIn() {
    console.warn('Using fallback Supabase implementation - signIn');
    return { user: null, error: new Error('Using fallback implementation') };
  },

  // Sign out
  async signOut() {
    console.warn('Using fallback Supabase implementation - signOut');
    return { error: null };
  },

  // Get current user
  async getCurrentUser() {
    console.warn('Using fallback Supabase implementation - getCurrentUser');
    return null;
  }
};

// Mock quiz service
export const quizService = {
  // Get all quiz questions with options
  async getQuestions() {
    console.warn('Using fallback Supabase implementation - getQuestions');
    return [];
  },

  // Start a new quiz session
  async startQuizSession() {
    console.warn('Using fallback Supabase implementation - startQuizSession');
    return null;
  },

  // Save quiz answer
  async saveQuizAnswer() {
    console.warn('Using fallback Supabase implementation - saveQuizAnswer');
    return false;
  },

  // Complete quiz session
  async completeQuizSession() {
    console.warn('Using fallback Supabase implementation - completeQuizSession');
    return false;
  }
};

// Mock content service
export const contentService = {
  // Get recommendations
  async getRecommendations() {
    console.warn('Using fallback Supabase implementation - getRecommendations');
    return [];
  },

  // Add to watchlist
  async addToWatchlist() {
    console.warn('Using fallback Supabase implementation - addToWatchlist');
    return false;
  },

  // Remove from watchlist
  async removeFromWatchlist() {
    console.warn('Using fallback Supabase implementation - removeFromWatchlist');
    return false;
  },

  // Mark as watched
  async markAsWatched() {
    console.warn('Using fallback Supabase implementation - markAsWatched');
    return false;
  },

  // Unmark as watched
  async unmarkAsWatched() {
    console.warn('Using fallback Supabase implementation - unmarkAsWatched');
    return false;
  },

  // Get watchlist
  async getWatchlist() {
    console.warn('Using fallback Supabase implementation - getWatchlist');
    return [];
  },

  // Get watched content
  async getWatchedContent() {
    console.warn('Using fallback Supabase implementation - getWatchedContent');
    return [];
  }
};

export default {
  auth: authService,
  quiz: quizService,
  content: contentService
}; 