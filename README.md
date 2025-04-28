# What2Watch

A personalized movie and TV show recommendation app based on your preferences and mood.

## Features

- Interactive quiz to understand your viewing preferences
- Personalized movie and TV show recommendations
- "Watchlist" feature to save shows for later
- "Seen It" feature to mark shows as watched
- Clean, modern UI design

## Tech Stack

- Next.js (React framework)
- TypeScript
- Tailwind CSS (styling)
- Supabase (backend & database)

## Database Setup

This project uses Supabase as its backend. Follow these steps to set up the database:

1. Create a Supabase account at [supabase.com](https://supabase.com) if you don't have one.
2. Create a new project in Supabase.
3. Run the SQL script in `supabase/schema.sql` in the SQL Editor of your Supabase project. This will:
   - Create all necessary tables
   - Set up relationships between them
   - Configure Row Level Security (RLS) policies
   - Add initial quiz questions and options

## Environment Setup

1. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/what2watch.git
   cd what2watch
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

4. Edit `.env.local` and add your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

5. (Optional) If you want to use TMDB for movie/TV data, add your TMDB API key:
   ```
   TMDB_API_KEY=your-tmdb-api-key
   ```

## Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Data Model

The application has the following main data entities:

1. **Users** - People who take the quiz and get recommendations
2. **Quiz Questions & Answers** - The quiz itself and user responses
3. **Content** - Movies and TV shows that can be recommended
4. **Recommendations** - Personalized content recommendations for users
5. **User Actions** - User's watchlist and watched content

## Deployment

Deploy on Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyourusername%2Fwhat2watch)

## License

MIT
