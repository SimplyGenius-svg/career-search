'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast, Toaster } from 'react-hot-toast';
import { motion, AnimatePresence, useScroll, useTransform, useSpring, useMotionValue } from 'framer-motion';
import { 
  Search, History, Copy, Star, TrendingUp, Sparkles, ArrowRight, Brain, 
  Lightbulb, Zap, Command, X, ChevronDown, ChevronUp, Share2, Bookmark, 
  Settings, HelpCircle, ChevronRight, Link, Check, Users, Briefcase, 
  DollarSign, MapPin, Calendar, Award, Filter, SortDesc, Eye, 
  ExternalLink, Download, BookOpen, Target, Globe, Rocket, 
  BarChart3, Building2, GraduationCap, Clock, Flame, Shield,
  Compass, Navigation, Laptop, Coffee, MessageCircle, Heart
} from 'lucide-react';

// Enhanced types
type JobListing = {
  id: string;
  title: string;
  company: string;
  location: string;
  salary?: string;
  type: 'full-time' | 'part-time' | 'contract' | 'remote' | 'hybrid';
  level: 'entry' | 'mid' | 'senior' | 'executive';
  tags: string[];
  description: string;
  url: string;
  postedDate: string;
  relevanceScore: number;
  matchingSkills: string[];
  benefits?: string[];
};

type CareerPath = {
  title: string;
  description: string;
  requiredSkills: string[];
  averageSalary: string;
  growthRate: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  timeToMaster: string;
  relatedRoles: string[];
};

type SkillAssessment = {
  skill: string;
  currentLevel: number;
  targetLevel: number;
  resources: string[];
  timeToImprove: string;
};

type MarketInsights = {
  demandTrend: 'rising' | 'stable' | 'declining';
  trendPercentage: number;
  averageSalary: string;
  salaryTrend: 'up' | 'down' | 'stable';
  topCompanies: {
    name: string;
    jobCount: number;
    avgSalary?: string;
  }[];
  requiredSkills: {
    skill: string;
    demandScore: number;
    growthRate: string;
  }[];
  jobGrowthRate: string;
  locationInsights: {
    city: string;
    jobCount: number;
    avgSalary: string;
  }[];
  industryBreakdown: {
    industry: string;
    percentage: number;
  }[];
};

type NetworkingOpportunity = {
  title: string;
  type: 'event' | 'community' | 'meetup' | 'conference';
  date?: string;
  location: string;
  url: string;
  relevance: number;
  attendees?: number;
  cost?: string;
  description?: string;
  organizer?: string;
  tags?: string[];
};

type WebsiteRecommendation = {
  title: string;
  url: string;
  description: string;
  category: string;
  relevanceScore: number;
  trustScore: number;
  features: string[];
  isPremium: boolean;
};

type SearchResult = {
  practicalGuides: string[];
  theoreticalInsight: string;
  contradictoryTake: string;
  jobListings: JobListing[];
  careerPaths: CareerPath[];
  skillAssessments: SkillAssessment[];
  marketInsights: MarketInsights;  // Added marketInsights field
  networkingOpportunities: NetworkingOpportunity[];
  recommendedWebsites: WebsiteRecommendation[];
  relatedSearches: string[];
  searchMetadata: {
    totalResults: number;
    searchTime: number;
    cacheHit: boolean;
    apiVersion: string;
  };
  status: {
    phase: 'searching' | 'analyzing' | 'generating' | 'complete';
    message: string;
    progress: number;
  };
  query: string;
  timestamp: number;
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
  searchCategories: { [key: string]: number };
};

type UserProfile = {
  name?: string;
  currentRole?: string;
  experience?: string;
  skills?: string[];
  interests?: string[];
  location?: string;
  salaryRange?: string;
  preferences?: {
    jobType: string[];
    workStyle: string[];
    industries: string[];
  };
};

// Add proper type definitions
type TabType = 'all' | 'jobs' | 'guides' | 'skills' | 'network';
type SortType = 'relevance' | 'date' | 'salary';
type JobFilterType = 'all' | 'full-time' | 'part-time' | 'contract' | 'remote';
type JobLevelType = 'all' | 'entry' | 'mid' | 'senior' | 'executive';

interface JobFilters {
  type: JobFilterType;
  level: JobLevelType;
  location: string;
  salary: string;
}

// Fix useLocalStorage hook
function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setValue];
}

const HomePage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchHistory, setSearchHistory] = useLocalStorage<SearchHistoryItem[]>('searchHistory', []);
  const [analytics, setAnalytics] = useLocalStorage<SearchAnalytics>('searchAnalytics', {
    totalSearches: 0,
    lastSearchDate: null,
    popularQueries: {},
    searchCategories: {},
  });
  const [userProfile, setUserProfile] = useLocalStorage<UserProfile>('userProfile', {});
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [jobFilters, setJobFilters] = useState<JobFilters>({
    type: 'all',
    level: 'all',
    location: 'all',
    salary: 'all'
  });
  const [sortBy, setSortBy] = useState<SortType>('relevance');
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const scrollY = useMotionValue(0);
  const smoothScrollY = useSpring(scrollY, { damping: 20, stiffness: 100 });
  const headerOpacity = useTransform(smoothScrollY, [0, 100], [1, 0.9]);
  const searchScale = useMotionValue(1);
  const searchSpring = useSpring(searchScale, { damping: 15, stiffness: 200 });
  const [savedGuides, setSavedGuides] = useLocalStorage<SearchResult[]>('savedGuides', []);
  const [searchStatus, setSearchStatus] = useState<SearchResult['status']>({
    phase: 'complete',
    message: '',
    progress: 0
  });

  // Clear history from localStorage on mount (for development/debugging)
  useEffect(() => {
    console.log('Clearing search history from localStorage...');
    setSearchHistory([]);
  }, []); // Run only once on mount

  // Update mock data to match new SearchResult type
  const mockSearchResult: SearchResult = {
    practicalGuides: [
      "Build a compelling portfolio showcasing 3-5 diverse projects that demonstrate your problem-solving skills and technical proficiency.",
      "Network strategically by attending industry meetups, joining professional communities, and engaging with thought leaders on LinkedIn.",
      "Tailor your resume for each application, highlighting relevant experience and using keywords from the job description.",
      "Practice behavioral interviews using the STAR method (Situation, Task, Action, Result) to structure your responses.",
      "Continuously upskill by learning in-demand technologies and earning relevant certifications in your field."
    ],
    theoreticalInsight: "Career development in tech follows a predictable pattern of skill acquisition, network building, and strategic positioning. The most successful professionals combine technical excellence with strong communication skills and business acumen. They understand that career growth is not just about climbing the ladder within one company, but about building transferable skills and relationships that create opportunities across the industry.",
    contradictoryTake: "While conventional wisdom suggests specialization leads to higher pay, the most resilient careers are built on versatility. In an era of rapid technological change, T-shaped professionals who have deep expertise in one area plus broad knowledge across multiple domains are more valuable than narrow specialists. The future belongs to those who can adapt, not just execute.",
    jobListings: [
      {
        id: '1',
        title: 'Senior Software Engineer',
        company: 'TechCorp',
        location: 'San Francisco, CA',
        salary: '$150,000 - $200,000',
        type: 'full-time',
        level: 'senior',
        tags: ['React', 'Node.js', 'AWS', 'Docker'],
        description: 'Join our team to build scalable web applications...',
        url: 'https://example.com/job1',
        postedDate: '2024-01-15',
        relevanceScore: 95,
        matchingSkills: ['React', 'Node.js'],
        benefits: ['Health Insurance', 'Stock Options', 'Remote Work']
      },
      {
        id: '2',
        title: 'Product Manager',
        company: 'StartupXYZ',
        location: 'Remote',
        salary: '$120,000 - $160,000',
        type: 'remote',
        level: 'mid',
        tags: ['Product Strategy', 'Analytics', 'Agile'],
        description: 'Lead product development for our SaaS platform...',
        url: 'https://example.com/job2',
        postedDate: '2024-01-14',
        relevanceScore: 88,
        matchingSkills: ['Product Strategy'],
        benefits: ['Flexible Hours', 'Learning Budget', 'Equity']
      }
    ],
    careerPaths: [
      {
        title: 'Software Engineering',
        description: 'Build and maintain software systems that power modern applications',
        requiredSkills: ['Programming', 'System Design', 'Problem Solving', 'Version Control'],
        averageSalary: '$95,000 - $180,000',
        growthRate: '22%',
        difficulty: 'intermediate',
        timeToMaster: '2-4 years',
        relatedRoles: ['DevOps Engineer', 'Technical Lead', 'Software Architect']
      },
      {
        title: 'Product Management',
        description: 'Drive product strategy and execution from conception to launch',
        requiredSkills: ['Strategy', 'Analytics', 'Communication', 'User Research'],
        averageSalary: '$110,000 - $200,000',
        growthRate: '15%',
        difficulty: 'advanced',
        timeToMaster: '3-5 years',
        relatedRoles: ['Product Owner', 'Strategy Consultant', 'VP of Product']
      }
    ],
    skillAssessments: [
      {
        skill: 'React Development',
        currentLevel: 3,
        targetLevel: 5,
        resources: ['Advanced React Patterns Course', 'React Testing Library Guide'],
        timeToImprove: '3-6 months'
      },
      {
        skill: 'System Design',
        currentLevel: 2,
        targetLevel: 4,
        resources: ['Designing Data-Intensive Applications', 'System Design Primer'],
        timeToImprove: '6-12 months'
      }
    ],
    marketInsights: {
      demandTrend: 'rising',
      trendPercentage: 10,
      averageSalary: '$120,000',
      salaryTrend: 'up',
      topCompanies: [
        { name: 'TechCorp', jobCount: 100, avgSalary: '$150,000' },
        { name: 'StartupXYZ', jobCount: 80, avgSalary: '$130,000' },
        { name: 'InnovativeTech', jobCount: 70, avgSalary: '$140,000' },
        { name: 'EnterpriseSolutions', jobCount: 60, avgSalary: '$160,000' },
        { name: 'FreelanceDeveloper', jobCount: 50, avgSalary: '$120,000' }
      ],
      requiredSkills: [
        { skill: 'React', demandScore: 90, growthRate: '25%' },
        { skill: 'Node.js', demandScore: 85, growthRate: '20%' },
        { skill: 'AWS', demandScore: 80, growthRate: '15%' },
        { skill: 'Docker', demandScore: 75, growthRate: '10%' }
      ],
      jobGrowthRate: '18%',
      locationInsights: [
        { city: 'San Francisco', jobCount: 100, avgSalary: '$150,000' },
        { city: 'New York', jobCount: 80, avgSalary: '$140,000' },
        { city: 'London', jobCount: 70, avgSalary: '$130,000' },
        { city: 'Berlin', jobCount: 60, avgSalary: '$120,000' },
        { city: 'Tokyo', jobCount: 50, avgSalary: '$110,000' }
      ],
      industryBreakdown: [
        { industry: 'Software Development', percentage: 70 },
        { industry: 'Product Management', percentage: 20 },
        { industry: 'Data Science', percentage: 10 }
      ]
    },
    networkingOpportunities: [
      {
        title: 'SF Tech Meetup',
        type: 'meetup',
        date: '2024-02-15',
        location: 'San Francisco, CA',
        url: 'https://example.com/meetup1',
        relevance: 92,
        attendees: 150,
        cost: 'Free',
        description: 'Monthly tech meetup for software engineers and developers',
        organizer: 'SF Tech Community',
        tags: ['Software Engineering', 'Networking', 'Career Growth']
      },
      {
        title: 'Product Management Community',
        type: 'community',
        location: 'Online',
        url: 'https://example.com/community1',
        relevance: 85,
        description: 'Active community for product managers to share insights',
        organizer: 'Product Leaders Network',
        tags: ['Product Management', 'Community', 'Learning']
      }
    ],
    recommendedWebsites: [
      {
        title: 'LeetCode',
        url: 'https://leetcode.com',
        description: 'Practice coding problems and prepare for technical interviews',
        category: 'Learning Platform',
        relevanceScore: 95,
        trustScore: 90,
        features: ['Practice Problems', 'Interview Prep', 'Community'],
        isPremium: true
      },
      {
        title: 'Glassdoor',
        url: 'https://glassdoor.com',
        description: 'Research companies, salaries, and interview experiences',
        category: 'Job Board',
        relevanceScore: 90,
        trustScore: 85,
        features: ['Company Reviews', 'Salary Data', 'Interview Prep'],
        isPremium: false
      }
    ],
    relatedSearches: [
      'software engineering career path',
      'tech job market trends',
      'coding interview preparation',
      'tech industry salary guide'
    ],
    searchMetadata: {
      totalResults: 15,
      searchTime: 1200,
      cacheHit: false,
      apiVersion: '2.0.0'
    },
    status: {
      phase: 'complete',
      message: 'Search completed successfully',
      progress: 100
    },
    query: '',
    timestamp: Date.now()
  };

  // Enhanced debounce effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Scroll effect
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
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        if (showKeyboardShortcuts || isHistoryOpen || isProfileOpen) {
          setShowKeyboardShortcuts(false);
          setIsHistoryOpen(false);
          setIsProfileOpen(false);
        } else if (query) {
          setQuery('');
          setResults(null);
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'h') {
        e.preventDefault();
        setIsHistoryOpen(prev => !prev);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'p') {
        e.preventDefault();
        setIsProfileOpen(prev => !prev);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        setShowKeyboardShortcuts(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [query, showKeyboardShortcuts, isHistoryOpen, isProfileOpen]);

  const handleSearchFocus = () => {
    setIsSearchFocused(true);
    searchSpring.set(1.02);
  };

  const handleSearchBlur = () => {
    setIsSearchFocused(false);
    searchSpring.set(1);
  };

  const updateAnalytics = useCallback((searchQuery: string) => {
    const category = searchQuery.toLowerCase().includes('job') ? 'jobs' : 
                    searchQuery.toLowerCase().includes('skill') ? 'skills' : 'general';
    
    setAnalytics((prev: SearchAnalytics) => ({
      totalSearches: prev.totalSearches + 1,
      lastSearchDate: new Date().toISOString(),
      popularQueries: {
        ...prev.popularQueries,
        [searchQuery]: (prev.popularQueries[searchQuery] || 0) + 1,
      },
      searchCategories: {
        ...prev.searchCategories,
        [category]: (prev.searchCategories[category] || 0) + 1,
      }
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
    setSearchStatus({
      phase: 'searching',
      message: 'Searching career database...',
      progress: 20
    });

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query.trim(),
          filters: {
            location: jobFilters.location !== 'all' ? jobFilters.location : undefined,
            salaryRange: jobFilters.salary !== 'all' ? jobFilters.salary : undefined,
            jobType: jobFilters.type !== 'all' ? jobFilters.type : undefined,
            experienceLevel: jobFilters.level !== 'all' ? jobFilters.level : undefined,
          },
          userProfile: {
            skills: userProfile.skills,
            experience: userProfile.experience,
            location: userProfile.location,
            currentRole: userProfile.currentRole,
          }
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Search failed');
      }

      const { success, data, warnings } = await response.json();

      if (!success) {
        throw new Error('Search failed');
      }

      if (warnings) {
        toast.custom((t) => (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded">
            <p>{warnings}</p>
          </div>
        ));
      }

      const searchResult: SearchResult = {
        ...data,
        query: query.trim(),
        timestamp: Date.now()
      };

      setResults(searchResult);
      setSearchHistory(prev => [{
        query: query.trim(),
        timestamp: Date.now(),
        result: data,
      }, ...prev].slice(0, 20));
      
      updateAnalytics(query.trim());
      toast.success('Search completed successfully');

    } catch (error) {
      console.error('Search failed:', error);
      toast.error(error instanceof Error ? error.message : 'Search failed. Please try again.');
    } finally {
      setIsLoading(false);
      setSearchStatus({
        phase: 'complete',
        message: '',
        progress: 100
      });
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
    console.log('Loading history item:', item);
    console.log('History item result data:', item.result);
    setQuery(item.query);
    setResults(item.result);
    setIsHistoryOpen(false);
  };

  const toggleFavorite = () => {
    if (!results) return;
    
    const isCurrentlySaved = savedGuides.some(guide => 
      guide.query === results.query && guide.timestamp === results.timestamp
    );

    if (isCurrentlySaved) {
      setSavedGuides(savedGuides.filter(guide => 
        !(guide.query === results.query && guide.timestamp === results.timestamp)
      ));
      setIsFavorite(false);
      toast.success('Guide removed from saved');
    } else {
      setSavedGuides([...savedGuides, results]);
      setIsFavorite(true);
      toast.success('Guide saved');
    }
  };

  useEffect(() => {
    if (results) {
      const isCurrentlySaved = savedGuides.some(guide => 
        guide.query === results.query && guide.timestamp === results.timestamp
      );
      setIsFavorite(isCurrentlySaved);
    } else {
      setIsFavorite(false);
    }
  }, [results, savedGuides]);

  const filteredJobs = results?.jobListings?.filter(job => {
    if (jobFilters.type !== 'all' && job.type !== jobFilters.type) return false;
    if (jobFilters.level !== 'all' && job.level !== jobFilters.level) return false;
    return true;
  }) || [];

  const sortedJobs = [...filteredJobs].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime();
      case 'salary':
        return b.relevanceScore - a.relevanceScore; // Simplified
      default:
        return b.relevanceScore - a.relevanceScore;
    }
  });

  const handleJobTypeChange = (type: JobFilterType) => {
    setJobFilters(prev => ({
      ...prev,
      type
    }));
  };

  const handleJobLevelChange = (level: JobLevelType) => {
    setJobFilters(prev => ({
      ...prev,
      level
    }));
  };

  // Update the loading states to match API phases
  useEffect(() => {
    if (isLoading && results?.status) {
      setSearchStatus(results.status);
    }
  }, [isLoading, results?.status]);

  const handleShare = async () => {
    if (!results) return;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Career Search: ${results.query}`,
          text: `Check out these career insights for "${results.query}"`,
          url: window.location.href
        });
        toast.success('Shared successfully');
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      toast.error('Failed to share');
    }
  };

  // Update the tab content rendering
  const renderTabContent = () => {
    if (!results) return null;

    switch (activeTab) {
      case 'jobs':
        return (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {/* Job Filters and Listings */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-white/50 shadow-sm">
              <div className="flex flex-wrap items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Filters:</span>
                </div>
                <select
                  value={jobFilters.type}
                  onChange={(e) => handleJobTypeChange(e.target.value as JobFilterType)}
                  className="px-3 py-1 rounded-lg border border-gray-200 text-sm"
                >
                  <option value="all">All Types</option>
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                  <option value="contract">Contract</option>
                  <option value="remote">Remote</option>
                </select>
                <select
                  value={jobFilters.level}
                  onChange={(e) => handleJobLevelChange(e.target.value as JobLevelType)}
                  className="px-3 py-1 rounded-lg border border-gray-200 text-sm"
                >
                  <option value="all">All Levels</option>
                  <option value="entry">Entry</option>
                  <option value="mid">Mid</option>
                  <option value="senior">Senior</option>
                  <option value="executive">Executive</option>
                </select>
                <div className="flex items-center gap-2 ml-auto">
                  <SortDesc className="w-4 h-4 text-gray-500" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-3 py-1 rounded-lg border border-gray-200 text-sm"
                  >
                    <option value="relevance">Relevance</option>
                    <option value="date">Date Posted</option>
                    <option value="salary">Salary</option>
                  </select>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Showing {sortedJobs.length} jobs out of {results.jobListings.length} total
              </p>
            </div>
            <div className="grid gap-6">
              {sortedJobs.map((job, index) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02, y: -4 }}
                  className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-white/50 shadow-sm hover:shadow-xl transition-all duration-300"
                >
                  <div className="flex flex-col lg:flex-row justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 mb-1">{job.title}</h3>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Building2 className="w-4 h-4" />
                            <span className="font-medium">{job.company}</span>
                            <span className="text-gray-400">•</span>
                            <MapPin className="w-4 h-4" />
                            <span>{job.location}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                            {job.relevanceScore}% match
                          </div>
                          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                            job.type === 'remote' ? 'bg-green-100 text-green-800' :
                            job.type === 'full-time' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {job.type}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mb-4">
                        {job.salary && (
                          <div className="flex items-center gap-1 text-green-600 font-semibold">
                            <DollarSign className="w-4 h-4" />
                            {job.salary}
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-gray-500">
                          <Calendar className="w-4 h-4" />
                          <span className="text-sm">Posted {new Date(job.postedDate).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <p className="text-gray-700 mb-4 line-clamp-2">{job.description}</p>

                      <div className="flex flex-wrap gap-2 mb-4">
                        {job.tags.map((tag, tagIndex) => (
                          <span
                            key={tagIndex}
                            className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      {job.matchingSkills.length > 0 && (
                        <div className="mb-4">
                          <p className="text-sm font-medium text-gray-700 mb-2">Your matching skills:</p>
                          <div className="flex flex-wrap gap-2">
                            {job.matchingSkills.map((skill, skillIndex) => (
                              <span
                                key={skillIndex}
                                className="px-2 py-1 bg-green-100 text-green-800 rounded-lg text-xs font-medium"
                              >
                                ✓ {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {job.benefits && (
                        <div className="mb-4">
                          <p className="text-sm font-medium text-gray-700 mb-2">Benefits:</p>
                          <div className="flex flex-wrap gap-2">
                            {job.benefits.map((benefit, benefitIndex) => (
                              <span
                                key={benefitIndex}
                                className="px-2 py-1 bg-purple-100 text-purple-800 rounded-lg text-xs"
                              >
                                {benefit}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 lg:w-32">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => window.open(job.url, '_blank')}
                        className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Apply
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleCopy(job.url)}
                        className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <Copy className="w-4 h-4" />
                        Copy Perspective
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>
        );
      case 'guides':
        return (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-6"
          >
            <div className="grid md:grid-cols-2 gap-6">
              {results.practicalGuides.map((guide, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-white/50 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Practical Guide {index + 1}</h4>
                      <p className="text-gray-700">{guide}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>
        );
      case 'skills':
        return (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-6"
          >
            <div className="grid md:grid-cols-2 gap-6">
              {results.skillAssessments.map((skill, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-white/50 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Target className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">{skill.skill}</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Current Level</span>
                          <span className="text-sm font-medium">{skill.currentLevel}/5</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Target Level</span>
                          <span className="text-sm font-medium">{skill.targetLevel}/5</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Time to Improve</span>
                          <span className="text-sm font-medium">{skill.timeToImprove}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>
        );
      case 'network':
        return (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-6"
          >
            <div className="grid md:grid-cols-2 gap-6">
              {results.networkingOpportunities.map((opportunity, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-white/50 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">{opportunity.title}</h4>
                      <p className="text-sm text-gray-600 mb-2">{opportunity.type}</p>
                      <p className="text-gray-700 mb-3">{opportunity.description}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">{opportunity.location}</span>
                        {opportunity.date && (
                          <>
                            <span className="text-gray-400">•</span>
                            <span className="text-sm text-gray-600">{opportunity.date}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>
        );
      default:
        return (
          <>
            {/* Market Insights Dashboard */}
            {/* Removed Market Insights Dashboard */}
            {/*
            {results.marketInsights && (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
              >
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm">Market Trend</p>
                      <p className="text-2xl font-bold capitalize">{results.marketInsights.demandTrend}</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-green-200" />
                  </div>
                </div>
                <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm">Avg Salary</p>
                      <p className="text-2xl font-bold">{results.marketInsights.averageSalary}</p>
                    </div>
                    <DollarSign className="w-8 h-8 text-blue-200" />
                  </div>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm">Job Growth</p>
                      <p className="text-2xl font-bold">{results.marketInsights.jobGrowthRate}</p>
                    </div>
                    <BarChart3 className="w-8 h-8 text-purple-200" />
                  </div>
                </div>
                <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-xl p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-100 text-sm">Hot Skills</p>
                      <p className="text-lg font-bold">{results.marketInsights.requiredSkills.slice(0, 2).map(skill => skill.skill).join(', ')}</p>
                    </div>
                    <Flame className="w-8 h-8 text-orange-200" />
                  </div>
              </div>
            </motion.div>
          )}
*/}
            {/* Job Listings */}
            {results.jobListings && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-6"
              >
                {/* Job Filters */}
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-white/50 shadow-sm">
                  <div className="flex flex-wrap items-center gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <Filter className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">Filters:</span>
                    </div>
                    <select
                      value={jobFilters.type}
                      onChange={(e) => handleJobTypeChange(e.target.value as JobFilterType)}
                      className="px-3 py-1 rounded-lg border border-gray-200 text-sm"
                    >
                      <option value="all">All Types</option>
                      <option value="full-time">Full-time</option>
                      <option value="part-time">Part-time</option>
                      <option value="contract">Contract</option>
                      <option value="remote">Remote</option>
                    </select>
                    <select
                      value={jobFilters.level}
                      onChange={(e) => handleJobLevelChange(e.target.value as JobLevelType)}
                      className="px-3 py-1 rounded-lg border border-gray-200 text-sm"
                    >
                      <option value="all">All Levels</option>
                      <option value="entry">Entry</option>
                      <option value="mid">Mid</option>
                      <option value="senior">Senior</option>
                      <option value="executive">Executive</option>
                    </select>
                    <div className="flex items-center gap-2 ml-auto">
                      <SortDesc className="w-4 h-4 text-gray-500" />
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="px-3 py-1 rounded-lg border border-gray-200 text-sm"
                      >
                        <option value="relevance">Relevance</option>
                        <option value="date">Date Posted</option>
                        <option value="salary">Salary</option>
                      </select>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    Showing {sortedJobs.length} jobs out of {results.jobListings.length} total
                  </p>
                </div>

                {/* Job Cards */}
                <div className="grid gap-6">
                  {sortedJobs.map((job, index) => (
                    <motion.div
                      key={job.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.02, y: -4 }}
                      className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-white/50 shadow-sm hover:shadow-xl transition-all duration-300"
                    >
                      <div className="flex flex-col lg:flex-row justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="text-xl font-bold text-gray-900 mb-1">{job.title}</h3>
                              <div className="flex items-center gap-2 text-gray-600">
                                <Building2 className="w-4 h-4" />
                                <span className="font-medium">{job.company}</span>
                                <span className="text-gray-400">•</span>
                                <MapPin className="w-4 h-4" />
                                <span>{job.location}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                                {job.relevanceScore}% match
                              </div>
                              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                                job.type === 'remote' ? 'bg-green-100 text-green-800' :
                                job.type === 'full-time' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {job.type}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 mb-4">
                            {job.salary && (
                              <div className="flex items-center gap-1 text-green-600 font-semibold">
                                <DollarSign className="w-4 h-4" />
                                {job.salary}
                              </div>
                            )}
                            <div className="flex items-center gap-1 text-gray-500">
                              <Calendar className="w-4 h-4" />
                              <span className="text-sm">Posted {new Date(job.postedDate).toLocaleDateString()}</span>
                            </div>
                          </div>

                          <p className="text-gray-700 mb-4 line-clamp-2">{job.description}</p>

                          <div className="flex flex-wrap gap-2 mb-4">
                            {job.tags.map((tag, tagIndex) => (
                              <span
                                key={tagIndex}
                                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>

                          {job.matchingSkills.length > 0 && (
                            <div className="mb-4">
                              <p className="text-sm font-medium text-gray-700 mb-2">Your matching skills:</p>
                              <div className="flex flex-wrap gap-2">
                                {job.matchingSkills.map((skill, skillIndex) => (
                                  <span
                                    key={skillIndex}
                                    className="px-2 py-1 bg-green-100 text-green-800 rounded-lg text-xs font-medium"
                                  >
                                    ✓ {skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {job.benefits && (
                            <div className="mb-4">
                              <p className="text-sm font-medium text-gray-700 mb-2">Benefits:</p>
                              <div className="flex flex-wrap gap-2">
                                {job.benefits.map((benefit, benefitIndex) => (
                                  <span
                                    key={benefitIndex}
                                    className="px-2 py-1 bg-purple-100 text-purple-800 rounded-lg text-xs"
                                  >
                                    {benefit}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col gap-2 lg:w-32">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => window.open(job.url, '_blank')}
                            className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                          >
                            <ExternalLink className="w-4 h-4" />
                            Apply
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleCopy(job.url)}
                            className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                          >
                            <Copy className="w-4 h-4" />
                            Copy Perspective
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.section>
            )}
          </>
        );
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-start p-4 md:p-6 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 text-gray-800 font-sans overflow-hidden">
      {/* Enhanced Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-10 -right-10 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-10 -left-10 w-96 h-96 bg-gradient-to-tr from-green-400/20 to-cyan-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-pink-400/10 to-orange-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }} />
      </div>

      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'rgba(17, 24, 39, 0.95)',
            color: '#fff',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
          },
          iconTheme: {
            primary: '#3B82F6',
            secondary: '#fff',
          },
        }}
      />
      
      {/* Enhanced Header */}
      <motion.header
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        style={{ opacity: headerOpacity }}
        className="w-full max-w-6xl flex flex-col items-center mb-8 z-10"
      >
        <div className="flex items-center space-x-3 mb-4">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg"
          >
            <Compass className="w-7 h-7 text-white" />
          </motion.div>
          <div className="text-center">
            <motion.h1
              className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              RoleScout
            </motion.h1>
            <motion.p
              className="text-lg md:text-xl text-gray-600 font-medium"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              Your AI-Powered Career Intelligence Platform
            </motion.p>
          </div>
        </div>
        
        {/* Enhanced Action Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="flex items-center gap-4 text-sm text-gray-600"
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span>AI-Powered Insights</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span>10M+ Career Paths</span>
          </div>
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4" />
            <span>Live Job Market</span>
          </div>
        </motion.div>
      </motion.header>

      {/* Enhanced Search Section */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.6 }}
        className="w-full max-w-4xl z-10"
      >
        {/* Enhanced Search Bar */}
        <motion.div
          style={{ scale: searchSpring }}
          className="relative"
        >
          <form onSubmit={handleSearch} className="relative">
            <div className="flex items-center gap-3 px-6 py-4 rounded-2xl shadow-xl border border-white/50 bg-white/80 backdrop-blur-sm focus-within:ring-2 ring-blue-500/30 transition-all duration-300">
              <Search className="h-6 w-6 text-gray-500" />
              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={handleSearchFocus}
                onBlur={handleSearchBlur}
                className="flex-1 text-lg font-medium bg-transparent outline-none placeholder-gray-400"
                placeholder="Ask about careers, skills, jobs, or market trends..."
                style={{ minHeight: '28px' }}
              />
              {query && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={() => setQuery('')}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                  type="button"
                >
                  <X size={18} />
                </motion.button>
              )}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                disabled={isLoading}
                className="bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{searchStatus?.message || 'Searching...'}</span>
                  </>
                ) : (
                  <>
                    <span>Search</span>
                    <Rocket className="w-5 h-5" />
                  </>
                )}
              </motion.button>
            </div>
          </form>

          {/* Progress Bar */}
          {isLoading && searchStatus && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute top-full left-0 right-0 mt-2"
            >
              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 shadow-lg">
                <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                  <span>{searchStatus.message}</span>
                  <span>{searchStatus.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${searchStatus.progress}%` }}
                    transition={{ duration: 0.5 }}
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.0 }}
          className="flex flex-wrap justify-center gap-3 mt-6"
        >
          {[
            { icon: Briefcase, text: 'Find Jobs', query: 'software engineer jobs' },
            { icon: TrendingUp, text: 'Career Growth', query: 'career advancement tips' },
            { icon: GraduationCap, text: 'Skills Gap', query: 'skill assessment' },
            { icon: DollarSign, text: 'Salary Insights', query: 'salary negotiation' },
            { icon: Users, text: 'Network', query: 'networking opportunities' },
            { icon: Target, text: 'Career Switch', query: 'career transition guide' }
          ].map(({ icon: Icon, text, query: suggestedQuery }) => (
            <motion.button
              key={text}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setQuery(suggestedQuery)}
              className="flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-lg border border-white/50 hover:bg-white/80 transition-all duration-300 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              <Icon className="w-4 h-4" />
              {text}
            </motion.button>
          ))}
        </motion.div>
      </motion.div>

      {/* Enhanced Results Section */}
      <AnimatePresence mode="wait">
        {results && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-6xl mt-12 space-y-8"
          >
            {/* Results Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Search Results for "{results.query}"</h2>
                <p className="text-gray-600 mt-1">Found comprehensive career insights and opportunities</p>
              </div>
              <div className="flex items-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={toggleFavorite}
                  className={`px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-all duration-300 flex items-center gap-2 ${
                    isFavorite 
                      ? 'bg-red-500 hover:bg-red-600 text-white' 
                      : 'bg-yellow-500 hover:bg-yellow-600 text-white'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                  {isFavorite ? 'Saved' : 'Save'}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleShare}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium shadow-sm transition-all duration-300 flex items-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </motion.button>
              </div>
            </div>

            {/* Recommended Resources & Articles */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-8"
            >
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-500" />
                Recommended Resources & Articles
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.recommendedWebsites && results.recommendedWebsites.map((website, index) => (
                  <motion.a
                    key={index}
                    href={website.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.02 }}
                    className="flex flex-col p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Link className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 line-clamp-1">{website.title}</h4>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                            {website.category}
                          </span>
                        </div>
                      </div>
                      {website.isPremium && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                          Premium
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">{website.description}</p>
                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Shield className="w-4 h-4" />
                          <span>Trust Score: {website.trustScore}%</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Target className="w-4 h-4" />
                          <span>Relevance: {website.relevanceScore}%</span>
                        </div>
                      </div>
                      {website.features && website.features.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {website.features.slice(0, 2).map((feature, featureIndex) => (
                            <span
                              key={featureIndex}
                              className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs"
                            >
                              {feature}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.a>
                ))}
              </div>
            </motion.div>

            {/* AI-Powered Insights Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Market Insights */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
              >
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Market Insights</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Demand Trend</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      results.marketInsights.demandTrend === 'rising' ? 'bg-green-100 text-green-800' :
                      results.marketInsights.demandTrend === 'stable' ? 'bg-blue-100 text-blue-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {results.marketInsights.demandTrend.charAt(0).toUpperCase() + results.marketInsights.demandTrend.slice(1)}
                      {results.marketInsights.trendPercentage > 0 && ` (+${results.marketInsights.trendPercentage}%)`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Average Salary</span>
                    <span className="font-medium text-gray-900">{results.marketInsights.averageSalary}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Job Growth Rate</span>
                    <span className="font-medium text-gray-900">{results.marketInsights.jobGrowthRate}</span>
                  </div>
                  
                  {/* Top Companies */}
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Top Companies Hiring</h4>
                    <div className="space-y-2">
                      {results.marketInsights.topCompanies.slice(0, 3).map((company, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">{company.name}</span>
                          <span className="text-gray-900">{company.jobCount} jobs</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Required Skills */}
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">In-Demand Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {results.marketInsights.requiredSkills.slice(0, 5).map((skill, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium"
                        >
                          {skill.skill} ({skill.growthRate})
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Practical Guides */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
              >
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Practical Guides</h3>
                <div className="space-y-4">
                  {results.practicalGuides.map((guide, index) => (
                    <div key={index} className="flex gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <p className="text-gray-700">{guide}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Theoretical Insights Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Theoretical Insight */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
              >
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Strategic Insight</h3>
                <p className="text-gray-700 leading-relaxed">{results.theoreticalInsight}</p>
              </motion.div>

              {/* Contradictory Take */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
              >
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Alternative Perspective</h3>
                <p className="text-gray-700 leading-relaxed">{results.contradictoryTake}</p>
              </motion.div>
            </div>

            {/* Related Searches */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-8"
            >
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Related Searches</h3>
              <div className="flex flex-wrap gap-2">
                {results.relatedSearches.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setQuery(search);
                      handleSearch(new Event('submit') as any);
                    }}
                    className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-full text-sm font-medium transition-colors"
                  >
                    {search}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Existing Job Listings Section */}
            {results.jobListings && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-6"
              >
                {/* Job Filters */}
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-white/50 shadow-sm">
                  <div className="flex flex-wrap items-center gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <Filter className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">Filters:</span>
                    </div>
                    <select
                      value={jobFilters.type}
                      onChange={(e) => handleJobTypeChange(e.target.value as JobFilterType)}
                      className="px-3 py-1 rounded-lg border border-gray-200 text-sm"
                    >
                      <option value="all">All Types</option>
                      <option value="full-time">Full-time</option>
                      <option value="part-time">Part-time</option>
                      <option value="contract">Contract</option>
                      <option value="remote">Remote</option>
                    </select>
                    <select
                      value={jobFilters.level}
                      onChange={(e) => handleJobLevelChange(e.target.value as JobLevelType)}
                      className="px-3 py-1 rounded-lg border border-gray-200 text-sm"
                    >
                      <option value="all">All Levels</option>
                      <option value="entry">Entry</option>
                      <option value="mid">Mid</option>
                      <option value="senior">Senior</option>
                      <option value="executive">Executive</option>
                    </select>
                    <div className="flex items-center gap-2 ml-auto">
                      <SortDesc className="w-4 h-4 text-gray-500" />
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="px-3 py-1 rounded-lg border border-gray-200 text-sm"
                      >
                        <option value="relevance">Relevance</option>
                        <option value="date">Date Posted</option>
                        <option value="salary">Salary</option>
                      </select>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    Showing {sortedJobs.length} jobs out of {results.jobListings.length} total
                  </p>
                </div>

                {/* Job Cards */}
                <div className="grid gap-6">
                  {sortedJobs.map((job, index) => (
                    <motion.div
                      key={job.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.02, y: -4 }}
                      className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-white/50 shadow-sm hover:shadow-xl transition-all duration-300"
                    >
                      <div className="flex flex-col lg:flex-row justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="text-xl font-bold text-gray-900 mb-1">{job.title}</h3>
                              <div className="flex items-center gap-2 text-gray-600">
                                <Building2 className="w-4 h-4" />
                                <span className="font-medium">{job.company}</span>
                                <span className="text-gray-400">•</span>
                                <MapPin className="w-4 h-4" />
                                <span>{job.location}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                                {job.relevanceScore}% match
                              </div>
                              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                                job.type === 'remote' ? 'bg-green-100 text-green-800' :
                                job.type === 'full-time' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {job.type}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 mb-4">
                            {job.salary && (
                              <div className="flex items-center gap-1 text-green-600 font-semibold">
                                <DollarSign className="w-4 h-4" />
                                {job.salary}
                              </div>
                            )}
                            <div className="flex items-center gap-1 text-gray-500">
                              <Calendar className="w-4 h-4" />
                              <span className="text-sm">Posted {new Date(job.postedDate).toLocaleDateString()}</span>
                            </div>
                          </div>

                          <p className="text-gray-700 mb-4 line-clamp-2">{job.description}</p>

                          <div className="flex flex-wrap gap-2 mb-4">
                            {job.tags.map((tag, tagIndex) => (
                              <span
                                key={tagIndex}
                                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>

                          {job.matchingSkills.length > 0 && (
                            <div className="mb-4">
                              <p className="text-sm font-medium text-gray-700 mb-2">Your matching skills:</p>
                              <div className="flex flex-wrap gap-2">
                                {job.matchingSkills.map((skill, skillIndex) => (
                                  <span
                                    key={skillIndex}
                                    className="px-2 py-1 bg-green-100 text-green-800 rounded-lg text-xs font-medium"
                                  >
                                    ✓ {skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {job.benefits && (
                            <div className="mb-4">
                              <p className="text-sm font-medium text-gray-700 mb-2">Benefits:</p>
                              <div className="flex flex-wrap gap-2">
                                {job.benefits.map((benefit, benefitIndex) => (
                                  <span
                                    key={benefitIndex}
                                    className="px-2 py-1 bg-purple-100 text-purple-800 rounded-lg text-xs"
                                  >
                                    {benefit}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col gap-2 lg:w-32">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => window.open(job.url, '_blank')}
                            className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                          >
                            <ExternalLink className="w-4 h-4" />
                            Apply
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleCopy(job.url)}
                            className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                          >
                            <Copy className="w-4 h-4" />
                            Copy Perspective
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.section>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Footer */}
      <motion.footer
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1.4 }}
        className="w-full max-w-6xl mt-16 border-t border-white/30 pt-8"
      >
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowKeyboardShortcuts(true)}
              className="hover:text-gray-900 transition-colors flex items-center gap-1 px-3 py-1 rounded-lg hover:bg-gray-100"
            >
              <Command className="w-4 h-4" />
              Shortcuts
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsHistoryOpen(true)}
              className="hover:text-gray-900 transition-colors flex items-center gap-1 px-3 py-1 rounded-lg hover:bg-gray-100"
            >
              <History className="w-4 h-4" />
              History
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsProfileOpen(true)}
              className="hover:text-gray-900 transition-colors flex items-center gap-1 px-3 py-1 rounded-lg hover:bg-gray-100"
            >
              <Settings className="w-4 h-4" />
              Profile
            </motion.button>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              Powered by AI • Made with <Heart className="w-4 h-4 text-red-500 inline fill-current" /> by Gyan
            </div>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Service Online" />
          </div>
        </div>
      </motion.footer>

      {/* Enhanced History Modal */}
      <AnimatePresence>
        {isHistoryOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setIsHistoryOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Search History</h2>
                    <p className="text-gray-600 mt-1">{searchHistory.length} searches saved</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setSearchHistory([]);
                        toast.success('History cleared');
                      }}
                      className="text-sm text-red-500 hover:text-red-600 transition-colors px-3 py-1 rounded-lg hover:bg-red-50"
                    >
                      Clear All
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setIsHistoryOpen(false)}
                      className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <X size={20} />
                    </motion.button>
                  </div>
                </div>
              </div>
              
              <div className="overflow-y-auto max-h-[60vh]">
                {searchHistory.length > 0 ? (
                  <div className="divide-y divide-gray-200">
                    {searchHistory.map((item, index) => (
                      <motion.button
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => {
                          handleHistoryItemClick(item);
                          setIsHistoryOpen(false);
                        }}
                        className="w-full text-left p-6 hover:bg-gray-50 transition-colors group"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Search className="w-4 h-4 text-blue-500" />
                              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                {item.query}
                              </h3>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                              <span>•</span>
                              <span>{item.result.practicalGuides?.length || 0} guides</span>
                              <span>•</span>
                              <span>{item.result.jobListings?.length || 0} jobs</span>
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                        </div>
                      </motion.button>
                    ))}
                  </div>
                ) : (
                  <div className="p-12 text-center text-gray-500">
                    <History className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg">No search history yet</p>
                    <p className="text-sm mt-2">Your searches will appear here for easy access</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Profile Modal */}
      <AnimatePresence>
        {isProfileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setIsProfileOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Career Profile</h2>
                    <p className="text-gray-600 mt-1">Personalize your career search experience</p>
                  </div>
                  <button
                    onClick={() => setIsProfileOpen(false)}
                    className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-6 overflow-y-auto max-h-[60vh]">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                    <input
                      type="text"
                      value={userProfile.name || ''}
                      onChange={(e) => setUserProfile(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Current Role</label>
                    <input
                      type="text"
                      value={userProfile.currentRole || ''}
                      onChange={(e) => setUserProfile(prev => ({ ...prev, currentRole: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Software Engineer"
                    />
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Experience Level</label>
                    <select
                      value={userProfile.experience || ''}
                      onChange={(e) => setUserProfile(prev => ({ ...prev, experience: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select experience</option>
                      <option value="entry">Entry Level (0-2 years)</option>
                      <option value="mid">Mid Level (3-5 years)</option>
                      <option value="senior">Senior Level (5+ years)</option>
                      <option value="executive">Executive Level</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                    <input
                      type="text"
                      value={userProfile.location || ''}
                      onChange={(e) => setUserProfile(prev => ({ ...prev, location: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., San Francisco, CA"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Skills</label>
                  <input
                    type="text"
                    value={userProfile.skills?.join(', ') || ''}
                    onChange={(e) => setUserProfile(prev => ({ 
                      ...prev, 
                      skills: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                    }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., JavaScript, React, Node.js (comma separated)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Salary Range</label>
                  <select
                    value={userProfile.salaryRange || ''}
                    onChange={(e) => setUserProfile(prev => ({ ...prev, salaryRange: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select range</option>
                    <option value="under-50k">Under $50,000</option>
                    <option value="50k-75k">$50,000 - $75,000</option>
                    <option value="75k-100k">$75,000 - $100,000</option>
                    <option value="100k-150k">$100,000 - $150,000</option>
                    <option value="150k-200k">$150,000 - $200,000</option>
                    <option value="200k-plus">$200,000+</option>
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setIsProfileOpen(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setIsProfileOpen(false);
                      toast.success('Profile updated!');
                    }}
                    className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
                  >
                    Save Profile
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Keyboard Shortcuts Modal */}
      <AnimatePresence>
        {showKeyboardShortcuts && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowKeyboardShortcuts(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Keyboard Shortcuts</h2>
                    <p className="text-gray-600 text-sm mt-1">Speed up your workflow</p>
                  </div>
                  <button
                    onClick={() => setShowKeyboardShortcuts(false)}
                    className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                {[
                  { keys: ['⌘', 'K'], description: 'Focus search bar' },
                  { keys: ['⌘', 'H'], description: 'Open search history' },
                  { keys: ['⌘', 'P'], description: 'Open profile settings' },
                  { keys: ['⌘', '/'], description: 'Show keyboard shortcuts' },
                  { keys: ['Esc'], description: 'Close modals or clear search' },
                  { keys: ['⌘', 'Enter'], description: 'Submit search' }
                ].map(({ keys, description }, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <span className="text-gray-700">{description}</span>
                    <div className="flex items-center gap-1">
                      {keys.map((key, keyIndex) => (
                        <span key={keyIndex}>
                          <kbd className="px-2 py-1 text-xs bg-white border border-gray-200 rounded shadow-sm font-mono">
                            {key}
                          </kbd>
                          {keyIndex < keys.length - 1 && <span className="mx-1 text-gray-400">+</span>}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Enhanced TypewriterEffect component
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
            duration: 0.05,
            delay: index * 0.03,
            ease: "easeOut",
          }}
        >
          {letter === ' ' ? '\u00A0' : letter}
        </motion.span>
      ))}
    </>
  );
};

// Enhanced DynamicTypewriter component
const DynamicTypewriter = ({ words }: { words: string[] }) => {
  const [index, setIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(0);
  const [reverse, setReverse] = useState(false);
  const [blink, setBlink] = useState(true);

  useEffect(() => {
    let typingTimeout: NodeJS.Timeout;

    if (subIndex === words[index].length + 1 && !reverse) {
      typingTimeout = setTimeout(() => {
        setReverse(true);
        setSubIndex((prev) => prev - 1);
      }, 1500);
    } else if (subIndex === -1 && reverse) {
      typingTimeout = setTimeout(() => {
        setReverse(false);
        setIndex((prev) => (prev + 1) % words.length);
        setSubIndex(0);
      }, 300);
    } else {
      const speed = reverse ? 30 : 100;
      typingTimeout = setTimeout(() => {
        setSubIndex((prev) => prev + (reverse ? -1 : 1));
      }, speed);
    }

    return () => clearTimeout(typingTimeout);
  }, [subIndex, index, reverse, words]);

  useEffect(() => {
    const cursorTimeout = setTimeout(() => {
      setBlink((prev) => !prev);
    }, 500);
    return () => clearTimeout(cursorTimeout);
  }, [blink]);

  return (
    <span className="inline-flex items-center">
      <span className="text-blue-600 font-semibold">
        {words[index]?.substring(0, subIndex) || ''}
      </span>
      <span className={`ml-1 w-0.5 h-6 bg-blue-600 ${blink ? 'opacity-100' : 'opacity-0'} transition-opacity`} />
    </span>
  );
};

export default HomePage;