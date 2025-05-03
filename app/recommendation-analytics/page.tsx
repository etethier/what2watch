'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FaArrowLeft, FaThumbsUp, FaThumbsDown, FaChartBar, FaCheck, FaTimes, FaFlask } from 'react-icons/fa';

interface FeedbackItem {
  contentId: number;
  title: string;
  type: 'liked' | 'disliked';
  rank: number;
  timestamp: string;
  genres: string[];
  algorithm?: string; // 'A' or 'B' for tracking which algorithm was used
}

export default function RecommendationAnalytics() {
  const [feedbackData, setFeedbackData] = useState<FeedbackItem[]>([]);
  const [stats, setStats] = useState({
    totalFeedback: 0,
    likedCount: 0,
    dislikedCount: 0,
    accuracyRate: 0,
    topPickAccuracyRate: 0,
    genreData: {} as Record<string, { liked: number, disliked: number, total: number }>,
    // A/B testing stats
    algorithmA: {
      total: 0,
      liked: 0,
      accuracy: 0,
      topPickAccuracy: 0,
    },
    algorithmB: {
      total: 0,
      liked: 0,
      accuracy: 0,
      topPickAccuracy: 0,
    }
  });
  
  useEffect(() => {
    // Load feedback data from localStorage
    if (typeof window !== 'undefined') {
      const storedData = localStorage.getItem('recommendation_feedback');
      if (storedData) {
        const parsedData = JSON.parse(storedData) as FeedbackItem[];
        setFeedbackData(parsedData);
        
        // Calculate statistics
        calculateStats(parsedData);
      }
    }
  }, []);
  
  const calculateStats = (data: FeedbackItem[]) => {
    const likedCount = data.filter(item => item.type === 'liked').length;
    const topPicksData = data.filter(item => item.rank > 0 && item.rank <= 3);
    const topPicksLiked = topPicksData.filter(item => item.type === 'liked').length;
    
    // Process genre data
    const genreData: Record<string, { liked: number, disliked: number, total: number }> = {};
    
    // Collect all genres
    data.forEach(item => {
      item.genres.forEach(genre => {
        if (!genreData[genre]) {
          genreData[genre] = { liked: 0, disliked: 0, total: 0 };
        }
        
        genreData[genre][item.type === 'liked' ? 'liked' : 'disliked']++;
        genreData[genre].total++;
      });
    });
    
    // A/B Testing statistics
    const algorithmAData = data.filter(item => item.algorithm === 'A');
    const algorithmBData = data.filter(item => item.algorithm === 'B');
    
    const algorithmALiked = algorithmAData.filter(item => item.type === 'liked').length;
    const algorithmBLiked = algorithmBData.filter(item => item.type === 'liked').length;
    
    const algorithmATopPicks = algorithmAData.filter(item => item.rank > 0 && item.rank <= 3);
    const algorithmBTopPicks = algorithmBData.filter(item => item.rank > 0 && item.rank <= 3);
    
    const algorithmATopLiked = algorithmATopPicks.filter(item => item.type === 'liked').length;
    const algorithmBTopLiked = algorithmBTopPicks.filter(item => item.type === 'liked').length;
    
    setStats({
      totalFeedback: data.length,
      likedCount,
      dislikedCount: data.length - likedCount,
      accuracyRate: data.length > 0 ? (likedCount / data.length) * 100 : 0,
      topPickAccuracyRate: topPicksData.length > 0 ? (topPicksLiked / topPicksData.length) * 100 : 0,
      genreData,
      algorithmA: {
        total: algorithmAData.length,
        liked: algorithmALiked,
        accuracy: algorithmAData.length > 0 ? (algorithmALiked / algorithmAData.length) * 100 : 0,
        topPickAccuracy: algorithmATopPicks.length > 0 ? (algorithmATopLiked / algorithmATopPicks.length) * 100 : 0,
      },
      algorithmB: {
        total: algorithmBData.length,
        liked: algorithmBLiked,
        accuracy: algorithmBData.length > 0 ? (algorithmBLiked / algorithmBData.length) * 100 : 0,
        topPickAccuracy: algorithmBTopPicks.length > 0 ? (algorithmBTopLiked / algorithmBTopPicks.length) * 100 : 0,
      }
    });
  };
  
  const clearFeedbackData = () => {
    if (typeof window !== 'undefined') {
      if (confirm('Are you sure you want to clear all feedback data? This cannot be undone.')) {
        localStorage.removeItem('recommendation_feedback');
        setFeedbackData([]);
        setStats({
          totalFeedback: 0,
          likedCount: 0,
          dislikedCount: 0,
          accuracyRate: 0,
          topPickAccuracyRate: 0,
          genreData: {},
          algorithmA: {
            total: 0,
            liked: 0,
            accuracy: 0,
            topPickAccuracy: 0,
          },
          algorithmB: {
            total: 0,
            liked: 0,
            accuracy: 0,
            topPickAccuracy: 0,
          }
        });
      }
    }
  };
  
  const exportFeedbackData = () => {
    if (typeof window !== 'undefined') {
      const dataStr = JSON.stringify(feedbackData, null, 2);
      const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
      
      const exportFileDefaultName = `recommendation_feedback_${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 text-black p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header with back button */}
        <div className="flex items-center mb-6">
          <Link href="/" className="flex items-center text-gray-600 hover:text-pink-500 transition-colors">
            <FaArrowLeft className="mr-2" />
            <span>Back to Home</span>
          </Link>
        </div>
        
        {/* Page Title */}
        <h1 className="text-3xl md:text-4xl font-bold mb-3 bg-gradient-to-r from-pink-500 via-red-500 to-orange-400 bg-clip-text text-transparent flex items-center">
          <FaChartBar className="mr-3 text-pink-500" />
          Recommendation Accuracy Analytics
        </h1>
        <p className="text-gray-600 mb-8">
          Track and analyze how accurate your recommendations are based on user feedback
        </p>
        
        {feedbackData.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <p className="text-gray-600 text-lg mb-4">No feedback data available</p>
            <p className="text-gray-500">
              User feedback on recommendations will appear here when users provide feedback on recommended content.
            </p>
          </div>
        ) : (
          <>
            {/* Statistics Panel */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
              <h2 className="text-xl font-bold mb-4">Recommendation Accuracy Stats</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Overall Accuracy</h3>
                  <div className="flex items-center">
                    <div className="text-3xl font-bold text-pink-600">{stats.accuracyRate.toFixed(1)}%</div>
                    <div className="ml-3 text-sm text-gray-500">
                      {stats.likedCount} liked / {stats.totalFeedback} total
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Top 3 Picks Accuracy</h3>
                  <div className="text-3xl font-bold text-pink-600">{stats.topPickAccuracyRate.toFixed(1)}%</div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Feedback</h3>
                  <div className="text-3xl font-bold text-gray-700">{stats.totalFeedback}</div>
                </div>
              </div>

              {/* A/B Testing Panel */}
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-100 mb-6">
                <h3 className="text-lg font-semibold text-purple-700 mb-3 flex items-center">
                  <FaFlask className="mr-2" />
                  A/B Testing Results
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Algorithm A */}
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <h4 className="font-semibold text-gray-700 mb-2">Algorithm A (Original)</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Sample Size:</span> 
                        <span className="font-medium">{stats.algorithmA.total} recommendations</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Overall Accuracy:</span> 
                        <span className={`font-medium ${stats.algorithmA.accuracy > stats.algorithmB.accuracy ? 'text-green-600' : ''}`}>
                          {stats.algorithmA.accuracy.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Top 3 Accuracy:</span> 
                        <span className={`font-medium ${stats.algorithmA.topPickAccuracy > stats.algorithmB.topPickAccuracy ? 'text-green-600' : ''}`}>
                          {stats.algorithmA.topPickAccuracy.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Algorithm B */}
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <h4 className="font-semibold text-gray-700 mb-2">Algorithm B (Alternative)</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Sample Size:</span> 
                        <span className="font-medium">{stats.algorithmB.total} recommendations</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Overall Accuracy:</span> 
                        <span className={`font-medium ${stats.algorithmB.accuracy > stats.algorithmA.accuracy ? 'text-green-600' : ''}`}>
                          {stats.algorithmB.accuracy.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Top 3 Accuracy:</span> 
                        <span className={`font-medium ${stats.algorithmB.topPickAccuracy > stats.algorithmA.topPickAccuracy ? 'text-green-600' : ''}`}>
                          {stats.algorithmB.topPickAccuracy.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Comparison Summary */}
                {(stats.algorithmA.total > 0 && stats.algorithmB.total > 0) && (
                  <div className="mt-4 p-3 bg-white rounded border border-purple-100">
                    <h4 className="font-medium text-purple-700 mb-1">Summary Insights:</h4>
                    <p className="text-sm text-gray-700">
                      {stats.algorithmB.accuracy > stats.algorithmA.accuracy 
                        ? `Algorithm B is performing better with ${(stats.algorithmB.accuracy - stats.algorithmA.accuracy).toFixed(1)}% higher accuracy.`
                        : stats.algorithmA.accuracy > stats.algorithmB.accuracy
                          ? `Algorithm A is performing better with ${(stats.algorithmA.accuracy - stats.algorithmB.accuracy).toFixed(1)}% higher accuracy.`
                          : 'Both algorithms are performing equally well.'}
                      {' '}
                      {stats.algorithmA.total < 50 || stats.algorithmB.total < 50 
                        ? 'More data is needed for conclusive results.' 
                        : 'Sample size is sufficient for analysis.'}
                    </p>
                  </div>
                )}
              </div>
              
              {/* Genre Performance */}
              <h3 className="font-semibold text-gray-700 mb-2">Accuracy by Genre</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
                {Object.entries(stats.genreData)
                  .sort((a, b) => b[1].total - a[1].total)
                  .slice(0, 9)
                  .map(([genre, data]) => (
                    <div key={genre} className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                      <span className="text-gray-700 font-medium">{genre}</span>
                      <div className="flex items-center">
                        <div 
                          className="w-16 h-6 bg-gray-200 rounded-full overflow-hidden"
                          title={`${(data.liked / data.total * 100).toFixed(1)}% accurate`}
                        >
                          <div 
                            className="h-full bg-green-500" 
                            style={{ width: `${(data.liked / data.total) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs ml-2 text-gray-500">{data.total} ratings</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
            
            {/* Recent Feedback List */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Recent Feedback</h2>
                <div className="flex space-x-2">
                  <button 
                    onClick={exportFeedbackData}
                    className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                  >
                    Export Data
                  </button>
                  <button 
                    onClick={clearFeedbackData}
                    className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                  >
                    Clear Data
                  </button>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Accurate?</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Algorithm</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Genres</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {feedbackData
                      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                      .slice(0, 10)
                      .map((item) => (
                        <tr key={`${item.contentId}-${item.timestamp}`}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{item.title}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {item.type === 'liked' ? (
                              <FaCheck className="text-green-500" title="Accurate" />
                            ) : (
                              <FaTimes className="text-red-500" title="Inaccurate" />
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {item.rank > 0 ? `#${item.rank}` : '-'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {item.algorithm ? (
                              <span className={`px-2 py-0.5 rounded-full text-xs ${
                                item.algorithm === 'A' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                              }`}>
                                {item.algorithm}
                              </span>
                            ) : (
                              <span className="text-gray-400 text-sm">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1">
                              {item.genres.slice(0, 2).map((genre, idx) => (
                                <span 
                                  key={idx}
                                  className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-800"
                                >
                                  {genre}
                                </span>
                              ))}
                              {item.genres.length > 2 && (
                                <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-800">
                                  +{item.genres.length - 2}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(item.timestamp).toLocaleDateString()}
                          </td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
        
        {/* Help text */}
        <div className="bg-blue-50 rounded-lg p-4 text-blue-800 text-sm">
          <h3 className="font-semibold mb-1">How to Use This Data</h3>
          <p className="mb-2">
            This analytics page helps you assess how well your recommendation algorithm is working based on user feedback.
            Use this data to:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Identify which genres are being recommended accurately</li>
            <li>Find patterns in recommendations users find inaccurate</li>
            <li>Track the accuracy of your top recommendations vs. others</li>
            <li>Compare the performance of different recommendation algorithms (A/B testing)</li>
            <li>Adjust your algorithm based on this feedback</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 