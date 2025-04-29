// Simple script to test YouTube API key
const https = require('https');

const API_KEY = 'AIzaSyAM4CzOBrczyEtNtmRckzGHe-soLtZ8PyA';
const searchQuery = 'The Dark Knight trailer';

const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=1&q=${encodeURIComponent(searchQuery)}&type=video&key=${API_KEY}`;

https.get(url, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      if (result.items && result.items.length > 0) {
        const video = result.items[0];
        console.log('API TEST SUCCESSFUL!');
        console.log('------------------------');
        console.log(`Search Query: "${searchQuery}"`);
        console.log(`Video Title: "${video.snippet.title}"`);
        console.log(`Video ID: ${video.id.videoId}`);
        console.log(`Channel: ${video.snippet.channelTitle}`);
        console.log(`Link: https://www.youtube.com/watch?v=${video.id.videoId}`);
      } else {
        console.log('No videos found for your search query.');
      }
    } catch (error) {
      console.error('Error parsing response:', error);
      console.error('Response data:', data);
    }
  });
}).on('error', (err) => {
  console.error('Error making request:', err.message);
}); 