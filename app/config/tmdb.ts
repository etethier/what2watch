export const TMDB_CONFIG = {
  API_URL: 'https://api.themoviedb.org/3',
  IMAGE_BASE_URL: 'https://image.tmdb.org/t/p',
  POSTER_SIZE: 'w500',
  // Note: You'll need to replace this with your actual TMDB API key
  API_KEY: process.env.NEXT_PUBLIC_TMDB_API_KEY || '',
}; 