export interface Question {
  id: number;
  text: string;
  options: Option[];
  multiSelect?: boolean;
}

export interface Option {
  id: number;
  text: string;
  value: string;
}

export interface QuizState {
  currentQuestionIndex: number;
  answers: Record<number, string | string[]>;
}

// Define sentiment and buzz types
export type SentimentType = 'Positive' | 'Neutral' | 'Negative' | 'Unknown';

export type EnhancedBuzzType = 
  | 'Trending Positive' 
  | 'Trending Negative' 
  | 'Trending Mixed'
  | 'Popular Discussion'
  | 'Controversial'
  | 'Niche Interest'
  | 'Low Buzz';

export interface MovieTVShow {
  id: number;
  title: string;
  overview: string;
  posterPath: string;
  type: 'movie' | 'tv';
  rating: number;
  genres: string[];
  releaseYear?: number;
  streamingPlatform?: string;
  imdbRating?: number;
  rottenTomatoesScore?: number;
  redditBuzz?: 'Low' | 'Medium' | 'High' | EnhancedBuzzType;
  redditSentiment?: SentimentType;
  sentimentScore?: number;
} 