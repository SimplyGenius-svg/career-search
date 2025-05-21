'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast, Toaster } from 'react-hot-toast';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { Search, History, Copy, Star, TrendingUp, Sparkles, ArrowRight, Brain, Lightbulb, Zap } from 'lucide-react';
import { useLocalStorage } from './hooks/useLocalStorage';

type SearchResult = {
  practicalGuides: string[];
  theoreticalInsight: string;
  contradictoryTake: string;
  timestamp: number;
  query: string;
};

type SearchHistoryItem = {
  query: string;
  timestamp: number;
  result: SearchResult;
};

type SearchAnalytics = {
  totalSearches: number;
  lastSearchDate: string | null;
  popularQueries: { [key: string]: number };
};

const HomePage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchResult | null>(null);
  const [searchHistory, setSearchHistory] = useLocalStorage<SearchHistoryItem[]>('searchHistory', []);
  const [analytics, setAnalytics] = useLocalStorage<SearchAnalytics>('searchAnalytics', {
    totalSearches: 0,
    lastSearchDate: null,
    popularQueries: {},
  });
  const [showHistory, setShowHistory] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const { scrollY } = useScroll();
  const headerOpacity = useTransform(scrollY, [0, 100], [1, 0.8]);
  const headerBlur = useTransform(scrollY, [0, 100], [0, 10]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500);
    return () => clearTimeout(timer);
  }, [query]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to focus search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      // Escape to clear search
      if (e.key === 'Escape') {
        setQuery('');
        setResults(null);
      }
      // Cmd/Ctrl + H to toggle history
      if ((e.metaKey || e.ctrlKey) && e.key === 'h') {
        e.preventDefault();
        setShowHistory(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const updateAnalytics = useCallback((searchQuery: string) => {
    setAnalytics((prev: SearchAnalytics) => ({
      totalSearches: prev.totalSearches + 1,
      lastSearchDate: new Date().toISOString(),
      popularQueries: {
        ...prev.popularQueries,
        [searchQuery]: (prev.popularQueries[searchQuery] || 0) + 1,
      },
    }));
  }, [setAnalytics]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    setIsLoading(true);
    setIsFavorite(false);
    
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: query.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const { data, success } = await response.json();
      
      if (!success || !data) {
        throw new Error('Invalid response from server');
      }

      setResults({
        ...data,
        timestamp: Date.now(),
        query: query.trim(),
      });

      setSearchHistory((prev: SearchHistoryItem[]) => [{
        query: query.trim(),
        timestamp: Date.now(),
        result: data,
      }, ...prev].slice(0, 10));
      
      updateAnalytics(query.trim());
      toast.success('Search completed successfully');
    } catch (error) {
      console.error('Search failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Search failed. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  const handleHistoryItemClick = (item: SearchHistoryItem) => {
    setQuery(item.query);
    setResults(item.result);
    setShowHistory(false);
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    toast.success(isFavorite ? 'Removed from favorites' : 'Added to favorites');
  };

  const clearHistory = () => {
    setSearchHistory([]);
    toast.success('Search history cleared');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: 'rgba(17, 24, 39, 0.95)',
            color: '#fff',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          },
        }}
      />
      
      {/* Header */}
      <motion.header 
        style={{ opacity: headerOpacity, backdropFilter: `blur(${headerBlur}px)` }}
        className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 border-b border-gray-200/50 dark:border-gray-800/50"
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-blue-500" />
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500">
                CareerSearch AI
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowHistory(prev => !prev)}
                className="p-2 text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="Search History (⌘H)"
              >
                <History size={20} />
              </button>
              <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <TrendingUp size={16} />
                <span>{analytics.totalSearches} searches</span>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main content */}
      <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        {/* Hero section */}
        {!results && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl sm:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">
              Discover Your Career Path
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Get AI-powered insights, practical guides, and alternative perspectives to help you navigate your career journey.
            </p>
          </motion.div>
        )}

        {/* Search form */}
        <motion.div
          layout
          className="relative mb-8"
        >
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg blur opacity-30 group-hover:opacity-50 transition duration-200"></div>
            <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <form onSubmit={handleSearch} className="flex gap-2 p-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ask anything about your career (e.g., 'How do I transition from engineering to product management?')"
                    className="w-full pl-10 pr-4 py-3 bg-transparent border-0 focus:ring-0 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    disabled={isLoading}
                  />
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-medium hover:from-blue-600 hover:to-purple-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Searching...</span>
                    </>
                  ) : (
                    <>
                      <span>Search</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </motion.button>
              </form>
            </div>
          </div>

          {/* Search suggestions */}
          <AnimatePresence>
            {debouncedQuery && !results && !isLoading && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                <div className="p-2 border-b border-gray-100 dark:border-gray-700">
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400 px-2">Popular searches</div>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {Object.entries(analytics.popularQueries)
                    .sort(([,a]: [string, number], [,b]: [string, number]) => b - a)
                    .slice(0, 5)
                    .map(([suggestion]) => (
                      <button
                        key={suggestion}
                        onClick={() => setQuery(suggestion)}
                        className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 text-sm text-gray-700 dark:text-gray-200 transition-colors flex items-center gap-2"
                      >
                        <TrendingUp size={14} className="text-blue-500" />
                        {suggestion}
                      </button>
                    ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* History panel */}
        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-20"
              onClick={() => setShowHistory(false)}
            >
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden"
                onClick={e => e.stopPropagation()}
              >
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Search History</h2>
                  <button
                    onClick={clearHistory}
                    className="text-sm text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                  >
                    Clear History
                  </button>
                </div>
                <div className="divide-y divide-gray-200 dark:divide-gray-700 overflow-y-auto max-h-[calc(80vh-4rem)]">
                  {searchHistory.map((item: SearchHistoryItem, index: number) => (
                    <motion.button
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleHistoryItemClick(item)}
                      className="w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{item.query}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {new Date(item.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <Star
                          size={16}
                          className={`${isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400 dark:text-gray-500'}`}
                        />
                      </div>
                    </motion.button>
                  ))}
                  {searchHistory.length === 0 && (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                      No search history yet
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading state */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-12"
            >
              <div className="inline-block relative">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Brain className="w-6 h-6 text-blue-500 animate-pulse" />
                </div>
              </div>
              <p className="mt-4 text-gray-600 dark:text-gray-300">Analyzing career insights...</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        <AnimatePresence mode="wait">
          {results && !isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Practical Guides */}
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <Zap className="w-5 h-5 text-blue-500" />
                      Practical Guides
                    </h2>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={toggleFavorite}
                        className="p-2 text-gray-600 dark:text-gray-300 hover:text-yellow-500 dark:hover:text-yellow-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        <Star
                          size={20}
                          className={isFavorite ? 'fill-yellow-400 text-yellow-400' : ''}
                        />
                      </button>
                      <button
                        onClick={() => handleCopy(results.practicalGuides.join('\n\n'))}
                        className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1 transition-colors"
                      >
                        <Copy size={16} />
                        Copy All
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {results.practicalGuides.map((guide, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        <span className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-sm font-medium shrink-0">
                          {index + 1}
                        </span>
                        <div className="flex-1">
                          <p className="text-gray-700 dark:text-gray-200 leading-relaxed">{guide}</p>
                          <button
                            onClick={() => handleCopy(guide)}
                            className="mt-2 text-sm text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 flex items-center gap-1 transition-colors"
                          >
                            <Copy size={14} />
                            Copy
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.section>

              {/* Theoretical Insight */}
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-yellow-500" />
                      Theoretical Insight
                    </h2>
                    <button
                      onClick={() => handleCopy(results.theoreticalInsight)}
                      className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1 transition-colors"
                    >
                      <Copy size={16} />
                      Copy
                    </button>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-gray-700 dark:text-gray-200 leading-relaxed">{results.theoreticalInsight}</p>
                </div>
              </motion.section>

              {/* Contradictory Take */}
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <Brain className="w-5 h-5 text-purple-500" />
                      Contradictory Take
                    </h2>
                    <button
                      onClick={() => handleCopy(results.contradictoryTake)}
                      className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1 transition-colors"
                    >
                      <Copy size={16} />
                      Copy
                    </button>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-gray-700 dark:text-gray-200 leading-relaxed">{results.contradictoryTake}</p>
                </div>
              </motion.section>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Info Section - only shown when no results */}
        {!results && !isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12"
          >
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-all"
            >
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Practical Guides</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Step-by-step actionable advice from industry experts and successful professionals.
              </p>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-all"
            >
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center mb-4">
                <Lightbulb className="w-6 h-6 text-yellow-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Theoretical Insights</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Understand broader frameworks and industry trends that shape career decisions.
              </p>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-all"
            >
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-4">
                <Brain className="w-6 h-6 text-purple-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Contradictory Takes</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Explore alternative viewpoints that challenge conventional wisdom.
              </p>
            </motion.div>
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-12">
        <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Powered by GPT-4 and Next.js • Career Search AI • {new Date().getFullYear()}
            </p>
            <div className="flex items-center gap-6 text-sm">
              <button
                onClick={() => toast('Coming soon!', { icon: '🚀' })}
                className="text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
              >
                Keyboard Shortcuts
              </button>
              <button
                onClick={() => toast('Coming soon!', { icon: '📊' })}
                className="text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
              >
                Analytics
              </button>
              <button
                onClick={() => toast('Coming soon!', { icon: '⚙️' })}
                className="text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
              >
                Settings
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;