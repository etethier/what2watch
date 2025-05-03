'use client';

import { useState, useEffect } from 'react';
import { FaFilm, FaTv, FaFilter, FaSearch, FaDatabase, FaCloudDownloadAlt } from 'react-icons/fa';
import { MovieTVShow } from '../types';
import ContentCard from '../components/ContentCard';
import { fetchComprehensiveContent } from '../services/tmdb-service';
import { adaptToWhat2WatchFormat } from '../services/recommendation-service';
import { storeContentInDatabase, getContentFromDatabase } from '../services/recommendation-service';

export default function ContentLibraryPage() {
  const [content, setContent] = useState<MovieTVShow[]>([]);
  const [filteredContent, setFilteredContent] = useState<MovieTVShow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeGenre, setActiveGenre] = useState('all');
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [availableGenres, setAvailableGenres] = useState<string[]>([]);
  const [loadingFromAPI, setLoadingFromAPI] = useState(false);
  const [loadingFromDB, setLoadingFromDB] = useState(false);
  const [visibleCount, setVisibleCount] = useState(12);
  const [totalCount, setTotalCount] = useState(0);

  // Load content from database on component mount
  useEffect(() => {
    const loadContentFromDB = async () => {
      setLoadingFromDB(true);
      try {
        const dbContent = await getContentFromDatabase({ limit: 50 });
        if (dbContent.length > 0) {
          setContent(dbContent);
          setFilteredContent(dbContent);
          setTotalCount(dbContent.length);
          
          // Extract all unique genres
          const genres = new Set<string>();
          dbContent.forEach(item => {
            item.genres.forEach(genre => genres.add(genre));
          });
          setAvailableGenres(Array.from(genres).sort());
        } else {
          // If no content in database, fetch from API
          await fetchContentFromAPI();
        }
      } catch (error) {
        console.error('Error loading content from database:', error);
      } finally {
        setLoadingFromDB(false);
      }
    };
    
    loadContentFromDB();
  }, []);

  // Filter content when filters change
  useEffect(() => {
    let results = [...content];
    
    // Apply search filter
    if (searchQuery) {
      results = results.filter(item => 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.overview.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply type filter
    if (activeFilter !== 'all') {
      results = results.filter(item => item.type === activeFilter);
    }
    
    // Apply genre filter
    if (activeGenre !== 'all') {
      results = results.filter(item => 
        item.genres.some(genre => genre.toLowerCase() === activeGenre.toLowerCase())
      );
    }
    
    setFilteredContent(results);
    setTotalCount(results.length);
  }, [searchQuery, activeFilter, activeGenre, content]);

  // Fetch content from TMDB API
  const fetchContentFromAPI = async () => {
    setLoadingFromAPI(true);
    try {
      // Fetch comprehensive content from TMDB
      const rawContent = await fetchComprehensiveContent('both', 3);
      
      // Convert to What2Watch format
      const adaptedContent = await Promise.all(
        rawContent.map(item => adaptToWhat2WatchFormat(item))
      ) as MovieTVShow[];
      
      // Store in state
      setContent(adaptedContent);
      setFilteredContent(adaptedContent);
      setTotalCount(adaptedContent.length);
      
      // Extract all unique genres
      const genres = new Set<string>();
      adaptedContent.forEach(item => {
        item.genres.forEach(genre => genres.add(genre));
      });
      setAvailableGenres(Array.from(genres).sort());
      
      // Store in database for future use
      await storeContentInDatabase(adaptedContent);
      
    } catch (error) {
      console.error('Error fetching content from API:', error);
    } finally {
      setLoadingFromAPI(false);
    }
  };

  // Load more content
  const loadMore = () => {
    setVisibleCount(prev => prev + 12);
  };

  return (
    <div className="min-h-screen bg-white text-black p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Content Library</h1>
            <p className="text-gray-600">
              Explore our expanded collection of movies and TV shows
            </p>
          </div>
          
          <div className="flex gap-4 mt-4 md:mt-0">
            <button
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className="flex items-center px-4 py-2 bg-gray-100 rounded-lg text-gray-700 hover:bg-gray-200"
            >
              <FaFilter className="mr-2" />
              Filters
            </button>
            
            <button
              onClick={fetchContentFromAPI}
              disabled={loadingFromAPI}
              className="flex items-center px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:bg-pink-300"
            >
              <FaCloudDownloadAlt className="mr-2" />
              {loadingFromAPI ? 'Fetching...' : 'Fetch More Content'}
            </button>
          </div>
        </div>
        
        {/* Status bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center bg-gray-50 p-4 rounded-lg mb-6">
          <div className="text-gray-600 mb-2 sm:mb-0">
            <span className="font-medium">{totalCount}</span> items in library
            {loadingFromDB && ' (Loading...)'}
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1 rounded-full text-sm ${
                activeFilter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveFilter('movie')}
              className={`flex items-center px-3 py-1 rounded-full text-sm ${
                activeFilter === 'movie' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'
              }`}
            >
              <FaFilm className="mr-1" size={12} />
              Movies
            </button>
            <button
              onClick={() => setActiveFilter('tv')}
              className={`flex items-center px-3 py-1 rounded-full text-sm ${
                activeFilter === 'tv' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'
              }`}
            >
              <FaTv className="mr-1" size={12} />
              TV Shows
            </button>
          </div>
        </div>
        
        {/* Filter panel */}
        {showFilterPanel && (
          <div className="bg-gray-50 p-4 rounded-lg mb-6 animate-fadeIn">
            <h3 className="font-medium mb-3">Filters</h3>
            
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <label className="block text-sm text-gray-600 mb-1">Search</label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search titles or descriptions..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg pr-10"
                  />
                  <FaSearch className="absolute right-3 top-3 text-gray-400" />
                </div>
              </div>
              
              {/* Genre filter */}
              <div className="md:w-1/3">
                <label className="block text-sm text-gray-600 mb-1">Genre</label>
                <select
                  value={activeGenre}
                  onChange={(e) => setActiveGenre(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg appearance-none"
                >
                  <option value="all">All Genres</option>
                  {availableGenres.map(genre => (
                    <option key={genre} value={genre}>{genre}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
        
        {/* Loading indicator */}
        {(isLoading || loadingFromAPI || loadingFromDB) && (
          <div className="flex justify-center my-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
          </div>
        )}
        
        {/* Content grid */}
        {filteredContent.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredContent.slice(0, visibleCount).map((item) => (
              <ContentCard 
                key={item.id} 
                content={item}
                className="h-full"
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-600 mb-4">No content found matching your filters</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setActiveFilter('all');
                setActiveGenre('all');
              }}
              className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600"
            >
              Clear Filters
            </button>
          </div>
        )}
        
        {/* Load more button */}
        {filteredContent.length > visibleCount && (
          <div className="flex justify-center mt-8">
            <button
              onClick={loadMore}
              className="px-6 py-2 bg-pink-500 text-white rounded-full hover:bg-pink-600 flex items-center"
            >
              Load More
            </button>
          </div>
        )}
        
        {/* Database status */}
        <div className="mt-12 mb-6 text-center text-sm text-gray-500 flex items-center justify-center">
          <FaDatabase className="mr-2" />
          Content is stored in your database for improved performance
        </div>
      </div>
    </div>
  );
} 