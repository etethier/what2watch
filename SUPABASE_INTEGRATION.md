# What2Watch Supabase Integration

This document provides an overview of how the What2Watch application integrates with Supabase for backend functionality.

## Database Schema

The application uses the following tables in Supabase:

1. **Users** - Stores user information and authentication details
2. **Content** - Stores movies and TV shows (title, overview, ratings, etc.)
3. **Genres** and **Streaming Platforms** - Lookup tables for categorization
4. **Quiz Questions and Options** - Stores the quiz structure
5. **User Quiz Sessions** - Tracks each time a user takes the quiz
6. **User Quiz Answers** - Records user's responses to quiz questions
7. **Recommendations** - Stores content recommendations for users
8. **User Watchlist and Watched Content** - Tracks user engagement with content

The complete database schema can be found in `supabase/schema.sql`.

## Authentication Flow

The application uses Supabase Auth for user authentication:

1. **Sign Up**: Users can create accounts with email/password
2. **Sign In**: Returning users can log in with credentials
3. **Session Management**: Auth status is managed through the AuthContext provider
4. **Guest Mode**: Users can take the quiz and get recommendations without an account

## Quiz Process

1. **Session Creation**: When a user starts the quiz, a new session is created in Supabase
2. **Answer Recording**: Each answer is saved to the database as the user progresses
3. **Recommendation Generation**: At the end of the quiz, answers are analyzed to generate personalized recommendations

## User Interactions

1. **Watchlist**: Users can save content to their watchlist for later viewing
2. **Watched Content**: Users can mark content as watched
3. **Personalization**: All user interactions are stored to improve future recommendations

## API Services

The application uses typed services to interact with Supabase:

1. **authService** - Handles authentication and user management
2. **quizService** - Manages quiz sessions and answers
3. **contentService** - Handles content recommendations and user interactions with content

## Recommendation Algorithm

In a production environment, the recommendation system would:

1. Analyze user quiz answers
2. Consider genre, mood, and platform preferences
3. Take into account ratings from IMDb, Rotten Tomatoes, and Reddit buzz
4. Filter based on content length and rating preferences
5. Consider social context (who the user is watching with)

## Security

The database uses Row Level Security (RLS) policies to ensure that:

1. Users can only access their own data
2. Quiz sessions are protected
3. Recommendations are only visible to the user who took the quiz

## Implementation Details

The integration is built with the following components:

1. **Supabase Client**: Initialized in `app/services/supabase.ts`
2. **Auth Context**: Provides authentication state to the application in `app/contexts/AuthContext.tsx`
3. **Service Functions**: Type-safe API functions for database interactions
4. **UI Components**: Updated to work with Supabase for data persistence

## Local Development Setup

1. Create a Supabase project
2. Run the database schema script (`supabase/schema.sql`)
3. Add your Supabase URL and anon key to `.env.local`
4. Install dependencies and start the development server

## Next Steps

To fully implement the Supabase integration:

1. Complete the recommendation algorithm based on user preferences
2. Add social features like sharing recommendations
3. Implement user profiles with viewing history and preferences
4. Add content importing from TMDB or other movie/TV APIs
5. Create an admin dashboard for content management 