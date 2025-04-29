# YouTube API Integration for What2Watch

This document describes how the YouTube API has been integrated into the What2Watch application to enable users to watch movie and TV show trailers.

## Overview

The YouTube API integration allows users to:

1. Watch trailers for movies and TV shows directly in the application
2. Search for trailers using a test page
3. See multiple trailer options for a single movie or TV show

## Implementation Details

The integration consists of the following components:

### 1. YouTube Service (`app/services/youtube-service.ts`)

This service handles all interactions with the YouTube API, including:

- Searching for trailers based on a movie or TV show title
- Fetching a single best-match trailer
- Fetching multiple trailers for a given title
- Generating embedded player URLs

### 2. Trailer Modal Component (`app/components/TrailerModal.tsx`)

A reusable modal component that displays a trailer for a movie or TV show, with:

- Loading state management
- Error handling
- Responsive iframe for the YouTube player

### 3. Trailer Button Component (`app/components/TrailerButton.tsx`)

A button component that triggers the trailer modal, with:

- Multiple visual variants (primary, secondary, icon)
- Customizable styling

### 4. Content Card Component (`app/components/ContentCard.tsx`)

An enhanced card component for displaying movie and TV show information, with:

- Trailer button integration
- Release year display
- Genre tags
- Rating badge

### 5. Test Page (`app/youtube-test/page.tsx`)

A page for testing the YouTube API integration, allowing users to:

- Search for trailers by title
- View trailers directly in the browser
- Test if the YouTube API key is working correctly

## Usage

### Adding a Trailer Button to a Movie/TV Show

```typescript
import TrailerButton from '../components/TrailerButton';

// Basic usage
<TrailerButton 
  title="Inception" 
  year={2010} 
  type="movie" 
/>

// Icon-only variant
<TrailerButton 
  title="Stranger Things" 
  year={2016} 
  type="tv" 
  variant="icon" 
/>

// Secondary style with custom class
<TrailerButton 
  title="The Dark Knight" 
  year={2008} 
  type="movie" 
  variant="secondary"
  className="w-full" 
/>
```

### Using the Content Card with Trailers

```typescript
import ContentCard from '../components/ContentCard';

// Basic usage
<ContentCard content={movieObject} />

// With custom class
<ContentCard 
  content={movieObject} 
  className="border-2 border-yellow-400" 
/>
```

## Configuration

The YouTube API requires an API key, which should be added to the `.env.local` file:

```
NEXT_PUBLIC_YOUTUBE_API_KEY=your_youtube_api_key_here
```

To obtain a YouTube API key:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to "APIs & Services" > "Library"
4. Search for "YouTube Data API v3" and enable it
5. Go to "Credentials" and create an API key
6. (Optional but recommended) Restrict the API key to only the YouTube Data API

## Limitations and Considerations

1. **API Quota**: The YouTube Data API has usage quotas. For a free account, the default quota is 10,000 units per day. Each search request costs 100 units, so be mindful of usage.

2. **Content Availability**: Not all movies or TV shows will have official trailers on YouTube. The service will return the best match based on the search query.

3. **Performance**: To optimize performance, consider implementing caching for trailer data, especially for popular content.

4. **Error Handling**: The implementation includes error handling to gracefully handle cases where trailers are not found or the API returns an error.

## Future Enhancements

1. **Caching**: Implement client-side or server-side caching to reduce API calls.

2. **Analytics**: Track which trailers users watch most frequently.

3. **Alternative Sources**: Add fallback trailer sources from other providers.

4. **Customization**: Allow users to choose their preferred trailer from multiple options.

5. **Auto-play Controls**: Add user settings for auto-play behavior.

## Testing

To test the YouTube API integration:

1. Make sure your YouTube API key is set in the `.env.local` file
2. Run the development server: `npm run dev`
3. Navigate to `/youtube-test` to test searching for trailers
4. Navigate to the home page and check the trailer buttons on the movie/TV show cards

## Troubleshooting

If trailers are not loading:

1. Check the browser console for errors
2. Verify your YouTube API key is correct in `.env.local`
3. Ensure the YouTube Data API v3 is enabled in your Google Cloud Console
4. Check your daily quota usage in the Google Cloud Console 