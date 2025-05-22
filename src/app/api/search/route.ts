import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import axios from 'axios';

// Initialize OpenAI with better configuration
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 30000, // 30 seconds
  maxRetries: 3,
});

// Initialize SerpAPI client
const SERP_API_KEY = process.env.SERP_API_KEY;
const SERP_API_URL = 'https://serpapi.com/search';

// Define types for better type safety
type WebsiteRecommendation = {
  title: string;
  url: string;
  description: string;
  category: string;
  relevanceScore: number;
  trustScore: number;
  lastUpdated?: string;
  features?: string[];
  isPremium?: boolean;
};

type SearchResponse = {
  practicalGuides: string[];
  theoreticalInsight: string;
  contradictoryTake: string;
  jobListings: JobListing[];
  careerPaths: CareerPath[];
  skillAssessments: SkillAssessment[];
  marketInsights: MarketInsights;
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
};

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
  companySize?: string;
  industry?: string;
  requirements?: string[];
  remote?: boolean;
  sponsored?: boolean;
};

type CareerPath = {
  title: string;
  description: string;
  requiredSkills: string[];
  averageSalary: string;
  salaryRange: {
    min: number;
    max: number;
  };
  growthRate: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  timeToMaster: string;
  relatedRoles: string[];
  educationRequirements: string[];
  certifications: string[];
};

type SkillAssessment = {
  skill: string;
  currentLevel: number;
  targetLevel: number;
  marketDemand: 'high' | 'medium' | 'low';
  resources: {
    title: string;
    type: 'course' | 'book' | 'practice' | 'certification';
    url?: string;
    duration?: string;
    cost?: string;
  }[];
  timeToImprove: string;
  relatedSkills: string[];
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
  type: 'event' | 'community' | 'meetup' | 'conference' | 'webinar';
  date?: string;
  location: string;
  url: string;
  relevance: number;
  attendees?: number;
  cost?: string;
  description: string;
  organizer?: string;
  tags: string[];
};

// Add type for SerpAPI response
type SerpAPIResponse = {
  jobListings: JobListing[];
  websiteRecommendations: WebsiteRecommendation[];
  searchMetadata: {
    totalResults: number;
    searchTime: number;
    cacheHit: boolean;
    apiVersion: string;
  };
};

// Add types for SerpAPI response data
type SerpAPIOrganicResult = {
  position?: number;
  title: string;
  link: string;
  snippet: string;
};

type SerpAPIJobResult = {
  job_id?: string;
  title: string;
  company_name: string;
  location: string;
  salary?: string;
  job_type?: string;
  description?: string;
  link: string;
  posted_at?: string;
  related_links?: Array<{ text: string }>;
};

type SerpAPISearchInformation = {
  total_results?: number;
  time_taken_displayed?: number;
  cache_hit?: boolean;
};

type SerpAPIRawResponse = {
  organic_results?: SerpAPIOrganicResult[];
  jobs_results?: SerpAPIJobResult[];
  search_information?: SerpAPISearchInformation;
};

// Re-introduce relevant AI prompt functions
const getMarketInsightsPrompt = (query: string) => `
Generate market insights for "${query}":

Return JSON with:
- demandTrend: rising/stable/declining
- trendPercentage: numeric change percentage
- averageSalary: salary string
- salaryTrend: up/down/stable
- topCompanies: array with name, jobCount, avgSalary
- requiredSkills: array with skill, demandScore, growthRate
- jobGrowthRate: percentage string
- locationInsights: array with city, jobCount, avgSalary
- industryBreakdown: array with industry, percentage

Make data realistic and current.
`;

const getInsightsPrompt = (query: string, userProfile: any) => `
Generate career insights for "${query}" considering user profile: ${JSON.stringify(userProfile)}

Return JSON with:
- practicalGuides: array of 4-6 specific, actionable steps
- theoreticalInsight: 2-3 sentence strategic insight
- contradictoryTake: 2-3 sentence alternative perspective
- relatedSearches: array of 4-6 related search suggestions

Make insights practical, specific, and valuable.
`;

// Re-introduce relevant AI service functions
async function getMarketInsights(query: string): Promise<MarketInsights> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a market research analyst. Generate accurate, current market insights based on real trends."
        },
        {
          role: "user",
          content: getMarketInsightsPrompt(query)
        }
      ],
      temperature: 0.3,
    });

    const response = JSON.parse(completion.choices[0].message.content || '{}');
    return response as MarketInsights;
  } catch (error) {
    console.error('Error getting market insights:', error);
    return { // Provide a fallback structure
      demandTrend: 'stable',
      trendPercentage: 0,
      averageSalary: 'Not available',
      salaryTrend: 'stable',
      topCompanies: [],
      requiredSkills: [],
      jobGrowthRate: 'N/A',
      locationInsights: [],
      industryBreakdown: []
    };
  }
}

async function generateInsights(query: string, userProfile: any): Promise<{
  practicalGuides: string[];
  theoreticalInsight: string;
  contradictoryTake: string;
  relatedSearches: string[];
}> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are a senior career strategist. Provide practical, actionable career advice with strategic insights." },
        { role: "user", content: getInsightsPrompt(query, userProfile) }
      ],
      temperature: 0.5,
    });

    const response = JSON.parse(completion.choices[0].message.content || '{}');
    return {
      practicalGuides: response.practicalGuides || [],
      theoreticalInsight: response.theoreticalInsight || '',
      contradictoryTake: response.contradictoryTake || '',
      relatedSearches: response.relatedSearches || []
    };
  } catch (error) {
    console.error('Error generating insights:', error);
    return { // Provide a fallback structure
      practicalGuides: [],
      theoreticalInsight: '',
      contradictoryTake: '',
      relatedSearches: []
    };
  }
}

// New function to get real search results from SerpAPI
async function getSerpResults(query: string, filters: any = {}): Promise<SerpAPIResponse> {
  try {
    // Determine if the query is likely a job search
    const isJobSearch = query.toLowerCase().includes('job') || 
                        query.toLowerCase().includes('career') ||
                        query.toLowerCase().includes('hiring') ||
                        query.toLowerCase().includes('position');

    // Always use both engines to get comprehensive results
    const [jobsResponse, organicResponse] = await Promise.all([
      // Get job results
      isJobSearch ? axios.get<SerpAPIRawResponse>(SERP_API_URL, {
        params: {
          api_key: SERP_API_KEY,
          q: query,
          engine: 'google_jobs',
          google_domain: 'google.com',
          gl: 'us',
          hl: 'en',
          num: 10
        }
      }) : Promise.resolve({ data: { jobs_results: [] } }),

      // Get organic results for articles and resources
      axios.get<SerpAPIRawResponse>(SERP_API_URL, {
        params: {
          api_key: SERP_API_KEY,
          q: query,
          engine: 'google',
          google_domain: 'google.com',
          gl: 'us',
          hl: 'en',
          num: 10,
          ...filters
        }
      })
    ]);

    const jobListings: JobListing[] = [];
    const websiteRecommendations: WebsiteRecommendation[] = [];

    // Process job results
    if (jobsResponse.data.jobs_results) {
      jobsResponse.data.jobs_results.forEach((job: any) => {
        jobListings.push({
          id: job.job_id || Math.random().toString(),
          title: job.title || '',
          company: job.company_name || '',
          location: job.location || '',
          salary: job.salary || '',
          type: job.detected_extensions?.job_type?.toLowerCase() || 'full-time',
          level: job.detected_extensions?.schedule_type?.toLowerCase() || 'mid',
          tags: [],
          description: job.description || job.snippet || '',
          url: job.link || job.url || '',
          postedDate: job.posted_at || new Date().toISOString().split('T')[0],
          relevanceScore: 70,
          matchingSkills: []
        });
      });
    }

    // Process organic results for articles and resources
    if (organicResponse.data.organic_results) {
      organicResponse.data.organic_results.forEach((result: SerpAPIOrganicResult) => {
        // Skip job listings that might appear in organic results
        if (result.link?.includes('linkedin.com/jobs') || 
            result.link?.includes('indeed.com') ||
            result.link?.includes('glassdoor.com/Job')) {
          return;
        }

        // Determine category based on domain and content
        let category = 'Resource';
        if (result.link?.includes('medium.com') || result.link?.includes('dev.to')) {
          category = 'Tech Blog';
        } else if (result.link?.includes('github.com')) {
          category = 'Code Repository';
        } else if (result.link?.includes('stackoverflow.com')) {
          category = 'Q&A Forum';
        } else if (result.link?.includes('coursera.org') || result.link?.includes('udemy.com')) {
          category = 'Learning Platform';
        } else if (result.link?.includes('wikipedia.org')) {
          category = 'Reference';
        }

        // Calculate relevance score based on position and content
        const relevanceScore = Math.max(100 - (result.position || 0) * 5, 50);
        
        // Calculate trust score based on domain authority
        let trustScore = 70; // Default trust score
        if (result.link?.includes('github.com') || 
            result.link?.includes('stackoverflow.com') ||
            result.link?.includes('wikipedia.org')) {
          trustScore = 90;
        } else if (result.link?.includes('medium.com') || 
                  result.link?.includes('dev.to') ||
                  result.link?.includes('coursera.org')) {
          trustScore = 80;
        }

        // Extract features from the snippet
        const features: string[] = [];
        if (result.snippet?.toLowerCase().includes('guide')) features.push('Guide');
        if (result.snippet?.toLowerCase().includes('tutorial')) features.push('Tutorial');
        if (result.snippet?.toLowerCase().includes('course')) features.push('Course');
        if (result.snippet?.toLowerCase().includes('article')) features.push('Article');
        if (result.snippet?.toLowerCase().includes('documentation')) features.push('Documentation');

        websiteRecommendations.push({
          title: result.title || '',
          url: result.link || '',
          description: result.snippet || '',
          category,
          relevanceScore,
          trustScore,
          features,
          isPremium: result.link?.includes('medium.com') || 
                     result.link?.includes('udemy.com') ||
                     result.link?.includes('coursera.org'),
          lastUpdated: new Date().toISOString().split('T')[0] // We don't have actual last updated date
        });
      });
    }

    // Sort website recommendations by relevance score
    websiteRecommendations.sort((a, b) => b.relevanceScore - a.relevanceScore);

    return {
      jobListings,
      websiteRecommendations: websiteRecommendations.slice(0, 6), // Limit to top 6 recommendations
      searchMetadata: {
        totalResults: organicResponse.data.search_information?.total_results || 0,
        searchTime: organicResponse.data.search_information?.time_taken_displayed || 0,
        cacheHit: organicResponse.data.search_information?.cache_hit || false,
        apiVersion: '1.0.0'
      }
    };
  } catch (error) {
    console.error('Error fetching from SerpAPI:', error);
    throw error;
  }
}

// Main API handler
export async function POST(request: Request) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const { query, filters = {}, userProfile = {} } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required and must be a string' },
        { status: 400 }
      );
    }

    if (!SERP_API_KEY) {
      return NextResponse.json(
        { error: 'SerpAPI key is not configured' },
        { status: 500 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
       console.warn("OPENAI_API_KEY is not configured. AI enrichment will be skipped.");
    }

    console.log('Processing search query:', query);

    // Get real search results from SerpAPI
    const serpResultsPromise = getSerpResults(query, filters);

    // Conditionally get AI enrichment
    let marketInsightsPromise: Promise<MarketInsights | null> = Promise.resolve(null);
    let insightsPromise: Promise<{
      practicalGuides: string[];
      theoreticalInsight: string;
      contradictoryTake: string;
      relatedSearches: string[];
    } | null> = Promise.resolve(null);

    if (process.env.OPENAI_API_KEY) {
      marketInsightsPromise = getMarketInsights(query).catch(e => { console.error("Error in getMarketInsights:", e); return null; });
      insightsPromise = generateInsights(query, userProfile).catch(e => { console.error("Error in generateInsights:", e); return null; });
    }

    // Wait for all promises to settle
    const [serpResultsSettled, marketInsightsSettled, insightsSettled] = await Promise.allSettled([
        serpResultsPromise,
        marketInsightsPromise,
        insightsPromise
    ]);

    // Handle SerpAPI results
    if (serpResultsSettled.status === 'rejected') {
        console.error("SerpAPI search failed:", serpResultsSettled.reason);
        return NextResponse.json(
            { success: false, error: `SerpAPI search failed: ${serpResultsSettled.reason.message || serpResultsSettled.reason}` },
            { status: 500 }
        );
    }
    const serpResults = serpResultsSettled.value;

    // Handle AI results
    const marketInsights = marketInsightsSettled.status === 'fulfilled' && marketInsightsSettled.value !== null
        ? marketInsightsSettled.value
        : { // Fallback empty MarketInsights structure
            demandTrend: 'stable', trendPercentage: 0, averageSalary: 'Not available', salaryTrend: 'stable',
            topCompanies: [], requiredSkills: [], jobGrowthRate: 'N/A', locationInsights: [], industryBreakdown: []
          } as MarketInsights; // Explicitly cast fallback

    const insights = insightsSettled.status === 'fulfilled' && insightsSettled.value !== null
        ? insightsSettled.value
        : { // Fallback empty Insights structure
            practicalGuides: [], theoreticalInsight: '', contradictoryTake: '', relatedSearches: []
          } as { practicalGuides: string[]; theoreticalInsight: string; contradictoryTake: string; relatedSearches: string[]; }; // Explicitly cast fallback


    const response: SearchResponse = {
      practicalGuides: insights.practicalGuides,
      theoreticalInsight: insights.theoreticalInsight,
      contradictoryTake: insights.contradictoryTake,
      jobListings: serpResults.jobListings,
      careerPaths: [], // Not re-introducing for now
      skillAssessments: [], // Not re-introducing for now
      marketInsights: marketInsights,
      networkingOpportunities: [], // Not re-introducing for now
      recommendedWebsites: serpResults.websiteRecommendations,
      relatedSearches: insights.relatedSearches,
      searchMetadata: serpResults.searchMetadata,
      status: { // Update status to reflect partial AI enrichment
        phase: 'complete', // Changed from partial to complete, message explains AI skip
        message: process.env.OPENAI_API_KEY ? 'Search and analysis complete' : 'Search complete (AI skipped)',
        progress: 100
      }
    };

    return NextResponse.json({
      success: true,
      data: response,
      warnings: !process.env.OPENAI_API_KEY ? "OpenAI API key not configured. AI insights are skipped." : undefined
    });

  } catch (error) {
    console.error('Search error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'An error occurred during the search',
        searchTime: Date.now() - startTime
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    version: '2.0.0',
    timestamp: new Date().toISOString()
  });
}