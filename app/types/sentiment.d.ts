declare module 'sentiment' {
  interface SentimentAnalysisResult {
    score: number;
    comparative: number;
    calculation: Record<string, number>;
    tokens: string[];
    words: string[];
    positive: string[];
    negative: string[];
  }

  class Sentiment {
    constructor(options?: any);
    analyze(phrase: string, options?: any): SentimentAnalysisResult;
    registerLanguage(language: string, language_data: any): void;
  }

  export default Sentiment;
} 