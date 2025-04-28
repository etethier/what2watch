-- WHAT2WATCH DATABASE SCHEMA
-- This schema defines all tables needed for the What2Watch application

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- USERS
-- Stores user information
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  display_name TEXT,
  avatar_url TEXT,
  last_login TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- GENRES
-- Lookup table for genres
CREATE TABLE genres (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT
);

-- STREAMING PLATFORMS
-- Lookup table for streaming platforms
CREATE TABLE streaming_platforms (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  website_url TEXT
);

-- CONTENT
-- Stores both movies and TV shows
CREATE TABLE content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tmdb_id INTEGER UNIQUE,
  title TEXT NOT NULL,
  overview TEXT,
  poster_path TEXT,
  backdrop_path TEXT,
  type TEXT NOT NULL CHECK (type IN ('movie', 'tv')),
  release_date DATE,
  runtime INTEGER, -- in minutes for movies, per episode for TV
  imdb_rating DECIMAL(3,1),
  rotten_tomatoes_score INTEGER,
  reddit_buzz TEXT CHECK (reddit_buzz IN ('Low', 'Medium', 'High')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CONTENT_GENRES
-- Junction table for content-genre many-to-many relationship
CREATE TABLE content_genres (
  content_id UUID REFERENCES content(id) ON DELETE CASCADE,
  genre_id INTEGER REFERENCES genres(id) ON DELETE CASCADE,
  PRIMARY KEY (content_id, genre_id)
);

-- CONTENT_PLATFORMS
-- Junction table for content-platform many-to-many relationship
CREATE TABLE content_platforms (
  content_id UUID REFERENCES content(id) ON DELETE CASCADE,
  platform_id INTEGER REFERENCES streaming_platforms(id) ON DELETE CASCADE,
  PRIMARY KEY (content_id, platform_id)
);

-- TV SHOW SEASONS
-- Additional details for TV shows
CREATE TABLE tv_seasons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_id UUID REFERENCES content(id) ON DELETE CASCADE,
  season_number INTEGER NOT NULL,
  episode_count INTEGER NOT NULL,
  overview TEXT,
  air_date DATE,
  UNIQUE (content_id, season_number)
);

-- QUIZ QUESTIONS
-- Stores all quiz questions
CREATE TABLE quiz_questions (
  id SERIAL PRIMARY KEY,
  text TEXT NOT NULL,
  multi_select BOOLEAN DEFAULT FALSE,
  sort_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- QUIZ OPTIONS
-- Stores options for quiz questions
CREATE TABLE quiz_options (
  id SERIAL PRIMARY KEY,
  question_id INTEGER REFERENCES quiz_questions(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  value TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- USER QUIZ SESSIONS
-- Tracks each time a user takes the quiz
CREATE TABLE user_quiz_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  -- If null, the user is a guest (not logged in)
  is_guest BOOLEAN DEFAULT FALSE
);

-- USER QUIZ ANSWERS
-- Stores user's answers to the quiz
CREATE TABLE user_quiz_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES user_quiz_sessions(id) ON DELETE CASCADE,
  question_id INTEGER REFERENCES quiz_questions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (session_id, question_id)
);

-- USER QUIZ ANSWER OPTIONS
-- Stores the specific options selected for each answer (supports multi-select)
CREATE TABLE user_quiz_answer_options (
  answer_id UUID REFERENCES user_quiz_answers(id) ON DELETE CASCADE,
  option_id INTEGER REFERENCES quiz_options(id) ON DELETE CASCADE,
  PRIMARY KEY (answer_id, option_id)
);

-- RECOMMENDATIONS
-- Stores the content recommended to users based on their quiz answers
CREATE TABLE recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES user_quiz_sessions(id) ON DELETE CASCADE,
  content_id UUID REFERENCES content(id) ON DELETE CASCADE,
  rank INTEGER NOT NULL, -- Position in the recommendation list
  relevance_score DECIMAL(5,2), -- Algorithm score for how relevant this recommendation is
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (session_id, content_id)
);

-- USER WATCHLIST
-- Tracks content that users have saved to their watchlist
CREATE TABLE user_watchlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content_id UUID REFERENCES content(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, content_id)
);

-- USER WATCHED CONTENT
-- Tracks content that users have marked as watched
CREATE TABLE user_watched_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content_id UUID REFERENCES content(id) ON DELETE CASCADE,
  watched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  review TEXT,
  UNIQUE (user_id, content_id)
);

-- Add indexes to improve query performance
CREATE INDEX idx_content_type ON content(type);
CREATE INDEX idx_content_release_date ON content(release_date);
CREATE INDEX idx_content_ratings ON content(imdb_rating, rotten_tomatoes_score);
CREATE INDEX idx_recommendations_session ON recommendations(session_id);
CREATE INDEX idx_user_quiz_sessions_user ON user_quiz_sessions(user_id);
CREATE INDEX idx_user_watchlist_user ON user_watchlist(user_id);
CREATE INDEX idx_user_watched_content_user ON user_watched_content(user_id);

-- Row Level Security (RLS) policies
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_quiz_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_quiz_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_quiz_answer_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_watched_content ENABLE ROW LEVEL SECURITY;

-- Users can only read and update their own data
CREATE POLICY user_select_own ON users
    FOR SELECT USING (auth.uid() = id);
    
CREATE POLICY user_update_own ON users
    FOR UPDATE USING (auth.uid() = id);

-- Quiz session policies
CREATE POLICY quiz_session_select_own ON user_quiz_sessions
    FOR SELECT USING (auth.uid() = user_id OR is_guest = true);
    
CREATE POLICY quiz_session_insert_own ON user_quiz_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id OR is_guest = true);

-- Similar RLS policies for other user-related tables
-- (You would expand these based on your application's security needs)

-- Insert starter data for quiz questions
INSERT INTO quiz_questions (id, text, multi_select, sort_order) VALUES
  (1, 'Set the vibe — how do you wanna feel while watching? 🎥', TRUE, 1),
  (2, 'Pick your flavor — what genres are calling your name? 🍿', TRUE, 2),
  (3, 'How big of a watch are you in the mood for? 📏', FALSE, 3),
  (4, 'Where are you ready to stream from? 📺', TRUE, 4),
  (5, 'How fresh do you want it? 🕰️', FALSE, 5),
  (6, 'How spicy can we get with the rating? 🌶️', FALSE, 6),
  (7, 'Who''s joining your movie mission tonight? 🎉', FALSE, 7);

-- Insert options for Question 1
INSERT INTO quiz_options (question_id, text, value, sort_order) VALUES
  (1, 'Make me laugh', 'laugh', 1),
  (1, 'I want to cry', 'cry', 2),
  (1, 'High-stakes drama', 'drama', 3),
  (1, 'Something mind-blowing', 'mind-blowing', 4),
  (1, 'Feel-good & uplifting', 'uplifting', 5),
  (1, 'Wild plot twists', 'plot-twists', 6),
  (1, 'Cozy & comforting', 'cozy', 7),
  (1, 'Dark and intense', 'dark', 8),
  (1, 'Educational or thought-provoking', 'educational', 9),
  (1, 'Background noise / easy watch', 'background', 10);

-- Insert options for Question 2
INSERT INTO quiz_options (question_id, text, value, sort_order) VALUES
  (2, 'Comedy', 'comedy', 1),
  (2, 'Action', 'action', 2),
  (2, 'Thriller / Mystery', 'thriller', 3),
  (2, 'Sci-Fi / Fantasy', 'scifi-fantasy', 4),
  (2, 'Romance', 'romance', 5),
  (2, 'Documentary', 'documentary', 6),
  (2, 'True Crime', 'true-crime', 7),
  (2, 'Animated', 'animated', 8),
  (2, 'Supernatural', 'supernatural', 9),
  (2, 'Historical', 'historical', 10);

-- Insert options for Question 3
INSERT INTO quiz_options (question_id, text, value, sort_order) VALUES
  (3, 'Just a quick movie', 'movie', 1),
  (3, 'A mini-series snack (under 6 episodes)', 'mini-series', 2),
  (3, 'A full season feast', 'season', 3),
  (3, 'A multi-season deep dive', 'multi-season', 4),
  (3, 'I''m flexible, bring it on', 'flexible', 5);

-- Insert options for Question 4
INSERT INTO quiz_options (question_id, text, value, sort_order) VALUES
  (4, 'Netflix', 'netflix', 1),
  (4, 'Amazon Prime', 'prime', 2),
  (4, 'Hulu', 'hulu', 3),
  (4, 'HBO Max / Crave', 'hbo', 4),
  (4, 'Disney+', 'disney', 5),
  (4, 'Apple TV+', 'apple', 6),
  (4, 'Peacock', 'peacock', 7),
  (4, 'Paramount+', 'paramount', 8),
  (4, 'Tubi / Free services', 'free', 9),
  (4, 'All The Above', 'all', 10);

-- Insert options for Question 5
INSERT INTO quiz_options (question_id, text, value, sort_order) VALUES
  (5, 'Doesn''t matter — just make it good', 'any', 1),
  (5, 'Hot off the press (last 1–2 years)', 'newest', 2),
  (5, 'Pretty recent (last 5 years)', 'recent', 3),
  (5, 'I''m down for a modern classic (last 10 years)', 'modern-classic', 4);

-- Insert options for Question 6
INSERT INTO quiz_options (question_id, text, value, sort_order) VALUES
  (6, 'Anything goes!', 'any-rating', 1),
  (6, 'Keep it G/PG — family vibes only', 'family', 2),
  (6, 'PG-13 sounds perfect', 'pg13', 3),
  (6, 'R/Mature — bring it on', 'mature', 4);

-- Insert options for Question 7
INSERT INTO quiz_options (question_id, text, value, sort_order) VALUES
  (7, 'Just me, myself, and I', 'solo', 1),
  (7, 'Movie date vibes', 'date', 2),
  (7, 'Friends night', 'friends', 3),
  (7, 'Family movie night', 'family', 4);

-- Insert initial streaming platforms
INSERT INTO streaming_platforms (name, logo_url) VALUES
  ('Netflix', 'https://www.example.com/logos/netflix.png'),
  ('Amazon Prime', 'https://www.example.com/logos/prime.png'),
  ('Hulu', 'https://www.example.com/logos/hulu.png'),
  ('HBO Max', 'https://www.example.com/logos/hbomax.png'),
  ('Disney+', 'https://www.example.com/logos/disney.png'),
  ('Apple TV+', 'https://www.example.com/logos/appletv.png'),
  ('Peacock', 'https://www.example.com/logos/peacock.png'),
  ('Paramount+', 'https://www.example.com/logos/paramount.png'),
  ('Tubi', 'https://www.example.com/logos/tubi.png');

-- Insert popular genres
INSERT INTO genres (name) VALUES
  ('Action'),
  ('Adventure'),
  ('Animation'),
  ('Comedy'),
  ('Crime'),
  ('Documentary'),
  ('Drama'),
  ('Fantasy'),
  ('Horror'),
  ('Mystery'),
  ('Romance'),
  ('Science Fiction'),
  ('Thriller'),
  ('War'),
  ('Western'),
  ('Biography'),
  ('Family'),
  ('Music'),
  ('History'),
  ('Supernatural');

-- NOTE: In a production environment, you would populate the content table with 
-- data from TMDB or other content API sources. Sample data is not included here. 