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

export interface MovieTVShow {
  id: number;
  title: string;
  overview: string;
  posterPath: string;
  type: 'movie' | 'tv';
  rating: number;
  genres: string[];
  streamingPlatform?: string;
  imdbRating?: number;
  rottenTomatoesScore?: number;
  redditBuzz?: 'Low' | 'Medium' | 'High';
} 