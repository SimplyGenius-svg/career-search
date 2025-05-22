'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast, Toaster } from 'react-hot-toast';
import { motion, AnimatePresence, useScroll, useTransform, useSpring, useMotionValue } from 'framer-motion';
import { Search, History, Copy, Star, TrendingUp, Sparkles, ArrowRight, Brain, Lightbulb, Zap, Command, X, ChevronDown, ChevronUp, Share2, Bookmark, Settings, HelpCircle, ChevronRight, Link, Check } from 'lucide-react';
import { useLocalStorage } from './hooks/useLocalStorage';

type SearchResult = {
  practicalGuides: string[];
  theoreticalInsight: string;
  contradictoryTake: string;
  recommendedWebsites: {
    title: string;
    url: string;
    description: string;
    category: string;
    relevanceScore: number;
  }[];
  timestamp: number;
  query: string;
  status?: {
    phase: 'searching' | 'analyzing' | 'generating' | 'complete';
    message: string;
    progress: number;
  };
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
  const [results, setResults] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchHistory, setSearchHistory] = useLocalStorage<SearchHistoryItem[]>('searchHistory', []);
  const [analytics, setAnalytics] = useLocalStorage<SearchAnalytics>('searchAnalytics', {
    totalSearches: 0,
    lastSearchDate: null,
    popularQueries: {},
  });
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const scrollY = useMotionValue(0);
  const smoothScrollY = useSpring(scrollY, { damping: 20, stiffness: 100 });
  const headerOpacity = useTransform(smoothScrollY, [0, 100], [1, 0.8]);
  const headerBlur = useTransform(smoothScrollY, [0, 100], [0, 10]);
  const searchScale = useMotionValue(1);
  const searchSpring = useSpring(searchScale, { damping: 15, stiffness: 200 });
  const [savedGuides, setSavedGuides] = useLocalStorage<SearchResult[]>('savedGuides', []);
  const [searchStatus, setSearchStatus] = useState<SearchResult['status']>(undefined);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500);
    return () => clearTimeout(timer);
  }, [query]);

  // Update scroll value
  useEffect(() => {
    const handleScroll = () => {
      scrollY.set(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrollY]);

  // Enhanced keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to focus search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      // Escape to clear search or close modals
      if (e.key === 'Escape') {
        if (showKeyboardShortcuts || isHistoryOpen) {
          setShowKeyboardShortcuts(false);
          setIsHistoryOpen(false);
        } else if (query) {
          setQuery('');
          setResults(null);
        }
      }
      // Cmd/Ctrl + L to toggle history (changed from H)
      if ((e.metaKey || e.ctrlKey) && e.key === 'l') {
        e.preventDefault();
        setIsHistoryOpen(prev => !prev);
      }
      // Cmd/Ctrl + / to show keyboard shortcuts
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        setShowKeyboardShortcuts(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [query, showKeyboardShortcuts, isHistoryOpen]);

  // Handle search focus effects
  const handleSearchFocus = () => {
    setIsSearchFocused(true);
    searchSpring.set(1.02);
  };

  const handleSearchBlur = () => {
    setIsSearchFocused(false);
    searchSpring.set(1);
  };

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
    setResults(null);
    
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

      const searchResult = {
        ...data,
        recommendedWebsites: data.recommendedWebsites || [],
        timestamp: Date.now(),
        query: query.trim(),
      };

      setResults(searchResult);
      setSearchHistory(prev => [{
        query: query.trim(),
        timestamp: Date.now(),
        result: searchResult,
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
    setIsHistoryOpen(false);
  };

  const toggleFavorite = () => {
    if (!results) {
      toast.error('No results to save');
      return;
    }

    const isCurrentlySaved = savedGuides.some(guide => guide.query === results.query && guide.timestamp === results.timestamp);

    if (isCurrentlySaved) {
      // Remove from saved
      setSavedGuides(savedGuides.filter(guide => !(guide.query === results.query && guide.timestamp === results.timestamp)));
      setIsFavorite(false);
      toast.success('Guide removed from saved');
    } else {
      // Add to saved
      setSavedGuides([...savedGuides, results]);
      setIsFavorite(true);
      toast.success('Guide saved');
    }
  };

  useEffect(() => {
    if (results) {
      const isCurrentlySaved = savedGuides.some(guide => guide.query === results.query && guide.timestamp === results.timestamp);
      setIsFavorite(isCurrentlySaved);
    } else {
      setIsFavorite(false);
    }
  }, [results, savedGuides]);

  const clearHistory = () => {
    setSearchHistory([]);
    toast.success('Search history cleared');
  };

  // Explicitly define handleToggleHistory
  const handleToggleHistory = () => {
    setIsHistoryOpen(prev => !prev);
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center p-6 md:p-12 bg-gray-200 text-gray-800 font-sans overflow-hidden">
      {/* Animated Background Elements - Replaced by ParticleBackground */}
      {/*
      <motion.div
        initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
        animate={{ opacity: 0.4, scale: 1.2, rotate: 0 }}
        transition={{ duration: 15, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
        className="absolute inset-0 z-0 bg-gradient-to-br from-blue-400/40 to-purple-500/40 rounded-full blur-3xl opacity-40"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.8, rotate: 10 }}
        animate={{ opacity: 0.4, scale: 1.2, rotate: 0 }}
        transition={{ duration: 17, repeat: Infinity, repeatType: "mirror", ease: "easeInOut", delay: 3 }}
        className="absolute inset-0 z-0 bg-green-400/40 to-yellow-500/40 rounded-full blur-3xl opacity-40"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.2, scale: 1.8 }}
        transition={{ duration: 13, repeat: Infinity, repeatType: "mirror", ease: "easeInOut", delay: 6 }}
        className="absolute inset-0 z-0 bg-white/20 dark:bg-gray-800/20 rounded-full blur-3xl opacity-20"
      />
      */}

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
          iconTheme: {
            primary: '#3B82F6',
            secondary: '#fff',
          },
        }}
      />
      
      <motion.header
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-3xl flex flex-col items-center mb-8 z-10"
      >
        <div className="flex items-center space-x-2 mb-2">
          {/* App Icon Placeholder */}
          <span className="text-3xl font-bold tracking-tight text-gray-900">{/* Maybe an icon here later */}</span>
          <motion.h1
            className="text-3xl font-bold text-gray-900"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            RoleScout
          </motion.h1>
        </div>
        <motion.p
          className="text-xl text-gray-600"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          Ask me anything in <DynamicTypewriter words={["Venture", "Engineering", "Product Management", " any career"]} />
        </motion.p>
        {/* Add Settings/Help/History buttons here later if desired */}
      </motion.header>

      {/* Main Content Area */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="w-full max-w-5xl z-10 flex flex-col items-center"
      >
        {/* Search Input */}
        <div className="w-full max-w-2xl mt-8">
          <form onSubmit={handleSearch} className="flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg border border-gray-300 bg-white focus-within:ring-2 ring-purple-500 transition-all duration-200"
               style={{ minHeight: '64px' }}>
            <Search className="h-6 w-6 text-gray-500" />
            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={handleSearchFocus}
              onBlur={handleSearchBlur}
              className="flex-1 text-lg font-medium bg-transparent outline-none placeholder-gray-400 focus:outline-none focus:ring-0"
              placeholder="Ask anything about your career..."
              style={{ minHeight: '24px' }}
            />
            {query && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => setQuery('')}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Clear search"
              >
                <X size={16} />
              </motion.button>
            )}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-6 py-2 rounded-lg font-semibold shadow-sm hover:scale-[1.02] transition flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm">{searchStatus?.message || 'Searching...'}</span>
                </>
              ) : (
                'Search →'
              )}
            </motion.button>
          </form>
        </div>

        {/* Simple Loading Indicator */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-8 text-center"
            >
              <div className="flex flex-col items-center gap-4">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-gray-600">Searching...</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search suggestions */}
        <AnimatePresence>
          {debouncedQuery && !results && !isLoading && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden min-h-[50px]"
            >
              <div className="p-2 border-b border-gray-100">
                <div className="text-sm font-medium text-gray-500 px-2">Popular searches</div>
              </div>
              <div className="max-h-60 overflow-y-auto">
                {Object.entries(analytics.popularQueries)
                  .sort(([,a]: [string, number], [,b]: [string, number]) => b - a)
                  .slice(0, 5)
                  .map(([suggestion], index) => (
                    <motion.button
                      key={suggestion}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => setQuery(suggestion)}
                      className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm text-gray-700 transition-colors flex items-center gap-2"
                    >
                      <TrendingUp size={14} className="text-blue-500" />
                      {suggestion}
                    </motion.button>
                  ))}
              </div>
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
              transition={{ duration: 0.3 }}
              className="space-y-8 w-full min-h-[500px]"
            >
              {/* Save this Guide Button */}
              <div className="flex justify-end">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={toggleFavorite}
                  className={`px-4 py-2 text-white rounded-lg text-sm font-medium shadow-sm transition flex items-center gap-1 ${isFavorite ? 'bg-red-500 hover:bg-red-600' : 'bg-yellow-500 hover:bg-yellow-600'}`}
                >
                  {isFavorite ? (
                    <>
                      <Bookmark size={16} fill="white" strokeWidth={1.5} />
                      Remove Saved
                    </>
                  ) : (
                    <>
                      <Bookmark size={16} />
                      Save this Guide
                    </>
                  )}
                </motion.button>
              </div>

              {/* Recommended Websites */}
              <Accordion title="Recommended Resources">
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="rounded-lg shadow-sm border border-gray-200 overflow-hidden bg-white"
                >
                  <div className="p-6 border-b border-gray-200 bg-gray-50">
                    <div className="flex justify-between items-center">
                      <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-green-600" />
                        Recommended Resources
                      </h2>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">
                          {results.recommendedWebsites?.length || 0} resources found
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {results.recommendedWebsites?.length > 0 ? (
                      results.recommendedWebsites.map((website, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          whileHover={{ scale: 1.01, backgroundColor: '#f9fafb' }}
                          className={`p-6 transition-all duration-200 ease-in-out ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:shadow-lg`}
                        >
                          <div className="flex items-start gap-4">
                            <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium shrink-0">
                              <Link size={18} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <a
                                    href={website.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-lg font-medium text-blue-600 hover:underline truncate block"
                                  >
                                    {website.title}
                                  </a>
                                  <div className="mt-1 flex items-center gap-2">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                      {website.category}
                                    </span>
                                    {website.relevanceScore >= 80 && (
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        Highly Relevant
                                      </span>
                                    )}
                                  </div>
                                  <p className="mt-2 text-gray-700 leading-relaxed">{website.description}</p>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                  <div className="flex items-center gap-1 text-sm text-gray-500">
                                    <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                                      <div
                                        className="h-full bg-green-500 rounded-full"
                                        style={{ width: `${website.relevanceScore}%` }}
                                      />
                                    </div>
                                    <span>{website.relevanceScore}%</span>
                                  </div>
                                </div>
                              </div>
                              <div className="mt-3 flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => handleCopy(website.url)}
                                  className="text-sm text-gray-600 hover:text-blue-600 flex items-center gap-1 transition-colors"
                                >
                                  <Copy size={14} />
                                  Copy URL
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => window.open(website.url, '_blank')}
                                  className="text-sm text-gray-600 hover:text-blue-600 flex items-center gap-1 transition-colors"
                                >
                                  <ArrowRight size={14} />
                                  Visit Site
                                </motion.button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="p-6 text-center text-gray-500">
                        No recommended resources available
                      </div>
                    )}
                  </div>
                </motion.section>
              </Accordion>

              {/* Practical Guides */}
              <Accordion title="Practical Guides">
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="rounded-lg shadow-sm border border-gray-200 overflow-hidden bg-gray-50"
                >
                  <div className="p-6 border-b border-gray-200 bg-gray-100">
                    <div className="flex justify-between items-center">
                      <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                        <Zap className="w-5 h-5 text-blue-600" />
                        Practical Guides
                      </h2>
                      <div className="flex items-center gap-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleCopy(results.practicalGuides.join('\n\n'))}
                          className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
                        >
                          <Copy size={16} />
                          Copy All
                        </motion.button>
                      </div>
                    </div>
                  </div>

                  <div className="divide-y divide-gray-200">
                    {results.practicalGuides.map((guide, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.01, backgroundColor: '#f3f4f6' }}
                        className={`p-6 transition-all duration-200 ease-in-out ${index % 2 === 0 ? 'bg-gray-50' : 'bg-gray-100'} hover:shadow-lg`}
                      >
                        <div className="flex items-start gap-4">
                          <span className="w-8 h-8 bg-blue-200 text-blue-700 rounded-full flex items-center justify-center text-sm font-semibold shrink-0">
                            {index + 1}
                          </span>
                          <div className="flex-1">
                            <p className="text-gray-800 leading-relaxed">{guide}</p>
                            <div className="mt-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleCopy(guide)}
                                className="text-sm text-gray-600 hover:text-blue-600 flex items-center gap-1 transition-colors"
                              >
                                <Copy size={14} />
                                Copy
                              </motion.button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.section>
              </Accordion>

              {/* Theoretical Insight */}
              <Accordion title="Theoretical Insight">
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="rounded-lg shadow-sm border border-gray-200 overflow-hidden bg-white"
                >
                  <div className="p-6 border-b border-gray-200 bg-gray-50">
                    <div className="flex justify-between items-center">
                      <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                        <Lightbulb className="w-5 h-5 text-yellow-600" />
                        Theoretical Insight
                      </h2>
                      <div className="flex items-center gap-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleCopy(results.theoreticalInsight)}
                          className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
                        >
                          <Copy size={16} />
                          Copy
                        </motion.button>
                      </div>
                    </div>
                  </div>
                  <div className="p-6 text-gray-800 leading-relaxed">
                    {results.theoreticalInsight}
                  </div>
                </motion.section>
              </Accordion>

              {/* Contradictory Take */}
              <Accordion title="Contradictory Take">
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="rounded-lg shadow-sm border border-gray-200 overflow-hidden bg-gray-50"
                >
                  <div className="p-6 border-b border-gray-200 bg-gray-100">
                    <div className="flex justify-between items-center">
                      <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                        <Brain className="w-5 h-5 text-purple-600" />
                        Contradictory Take
                      </h2>
                      <div className="flex items-center gap-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleCopy(results.contradictoryTake)}
                          className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
                        >
                          <Copy size={16} />
                          Copy
                        </motion.button>
                      </div>
                    </div>
                  </div>
                  <div className="p-6 text-gray-800 leading-relaxed">
                    {results.contradictoryTake}
                  </div>
                </motion.section>
              </Accordion>
            </motion.div>
          )}
        </AnimatePresence>

        {/* No Results Found Message */}
         {!isLoading && !results && query && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center text-gray-600 text-xl mt-8 min-h-[500px]"
              >
                No results found for "{query}".
              </motion.div>
            )}

        {/* Saved Guides Section */}
        <AnimatePresence>
          {savedGuides.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4 w-full mt-8"
            >
              <Accordion title={`Saved Guides (${savedGuides.length})`}>
                <div className="divide-y divide-gray-200">
                  {savedGuides.map((guide, index) => (
                    <motion.div
                      key={`${guide.query}-${guide.timestamp}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-4 hover:bg-gray-50 transition-colors flex justify-between items-center"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{guide.query}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          Saved on: {new Date(guide.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Add View and Remove buttons here */}
                        <button
                          onClick={() => setResults(guide)}
                          className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
                        >
                          View
                        </button>
                        <button
                          onClick={() => setSavedGuides(savedGuides.filter(g => !(g.query === guide.query && g.timestamp === guide.timestamp)) )}
                          className="text-sm text-red-600 hover:text-red-700 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </Accordion>
            </motion.div>
          )}
        </AnimatePresence>

       {/* Footer */}
       <motion.footer
         initial={{ opacity: 0, y: 50 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ duration: 0.5, delay: 1.2 }}
         className="w-full max-w-3xl mt-8 flex justify-between items-center text-gray-500 text-sm z-10"
       >
         <div>
           <button
             onClick={() => setShowKeyboardShortcuts(true)}
             className="hover:text-gray-700 transition-colors focus:outline-none"
           >
             ⌘/ Keyboard Shortcuts
           </button>
           <span className="mx-2">|</span>
           <button
             onClick={handleToggleHistory}
             className="hover:text-gray-700 transition-colors focus:outline-none"
           >
             ⌘L History
           </button>
         </div>
         <div>
           Made with ❤️ by Gyan
         </div>
       </motion.footer>
      </motion.div>{/* Closing tag for Main Content Area */}

      {/* History Panel */}
      <AnimatePresence>
        {isHistoryOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-20"
            onClick={() => setIsHistoryOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">Search History</h2>
                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={clearHistory}
                    className="text-sm text-red-500 hover:text-red-600 transition-colors"
                  >
                    Clear History
                  </motion.button>
                  <button
                    onClick={() => setIsHistoryOpen(false)}
                    className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
              <div className="divide-y divide-gray-200 overflow-y-auto max-h-[calc(80vh-4rem)]">
                {searchHistory.map((item: SearchHistoryItem, index: number) => (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleHistoryItemClick(item)}
                    className="w-full text-left p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">{item.query}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          {new Date(item.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">
                          {item.result.practicalGuides.length} guides
                        </span>
                        <ChevronRight size={16} className="text-gray-400" />
                      </div>
                    </div>
                  </motion.button>
                ))}
                {searchHistory.length === 0 && (
                  <div className="p-8 text-center text-gray-500">
                    No search history yet
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keyboard Shortcuts Modal */}
      <AnimatePresence>
        {showKeyboardShortcuts && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowKeyboardShortcuts(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900">Keyboard Shortcuts</h2>
                  <button
                    onClick={() => setShowKeyboardShortcuts(false)}
                    className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 text-xs bg-gray-100 rounded">⌘K</kbd>
                    <span className="text-gray-600">Focus search</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 text-xs bg-gray-100 rounded">⌘L</kbd>
                    <span className="text-gray-600">Toggle history</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 text-xs bg-gray-100 rounded">⌘/</kbd>
                    <span className="text-gray-600">Show shortcuts</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 text-xs bg-gray-100 rounded">Esc</kbd>
                    <span className="text-gray-600">Clear search / Close modal</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Helper component for typewriter effect
const TypewriterEffect = ({ text }: { text: string }) => {
  const letters = Array.from(text);

  return (
    <>
      {letters.map((letter, index) => (
        <motion.span
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: 0.1,
            delay: index * 0.05,
            ease: "easeOut",
          }}
        >
          {letter === ' ' ? '\u00A0' : letter}
        </motion.span>
      ))}
    </>
  );
};

// New Helper component for dynamic typewriter effect
const DynamicTypewriter = ({ words }: { words: string[] }) => {
  const [index, setIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(0);
  const [reverse, setReverse] = useState(false);
  const [blink, setBlink] = useState(true);

  // Typewriter logic
  useEffect(() => {
    let typingTimeout: NodeJS.Timeout;

    if (subIndex === words[index].length + 1 && !reverse) {
      // Finished typing a word, start deleting after a pause
      typingTimeout = setTimeout(() => {
        setReverse(true);
        setSubIndex((prev) => prev - 1);
      }, 1000); // Pause after typing
    } else if (subIndex === -1 && reverse) {
      // Finished deleting a word, move to the next word after a pause
      typingTimeout = setTimeout(() => {
        setReverse(false);
        setIndex((prev) => (prev + 1) % words.length); // Move to next word, loop back if at the end
        setSubIndex(0);
      }, 500); // Pause after deleting
    } else {
      // Typing or deleting
      const speed = reverse ? 50 : 150; // Deleting speed is faster
      typingTimeout = setTimeout(() => {
        setSubIndex((prev) => prev + (reverse ? -1 : 1));
      }, speed);
    }

    return () => clearTimeout(typingTimeout);
  }, [subIndex, index, reverse, words]); // Effect depends on these states and props

  // Blinking cursor
  useEffect(() => {
    const cursorTimeout = setTimeout(() => {
      setBlink((prev) => !prev);
    }, 500);
    return () => clearTimeout(cursorTimeout);
  }, [blink]);

  return (
    <>
      {`${words[index]?.substring(0, subIndex)}`}{/* Safely access words[index] */}
      <span className={`border-r-2 border-gray-600 ${blink ? 'opacity-100' : 'opacity-0'}`}></span>
    </>
  );
};

const Accordion: React.FC<React.PropsWithChildren<{ title: string }>> = ({ title, children }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        className="flex justify-between items-center w-full p-4 text-left bg-gray-100 hover:bg-gray-200 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="p-4 bg-white">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HomePage;