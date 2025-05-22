import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getJson } from 'serpapi';
import { LRUCache } from 'lru-cache';

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize cache with 100 items max, 1 hour TTL
const searchCache = new LRUCache<string, SearchResponse>({
  max: 100,
  ttl: 1000 * 60 * 60, // 1 hour
});

// Define types for better type safety
type WebsiteRecommendation = {
  title: string;
  url: string;
  description: string;
  category: string;
  relevanceScore: number;
  lastUpdated?: string;
};

type SearchResponse = {
  practicalGuides: string[];
  theoreticalInsight: string;
  contradictoryTake: string;
  recommendedWebsites: WebsiteRecommendation[];
  status: {
    phase: 'searching' | 'analyzing' | 'generating' | 'complete';
    message: string;
    progress: number;
  };
};

// Type for SerpApi organic search results
type SerpApiOrganicResult = {
  title: string;
  link: string;
  snippet: string;
  // Add other properties if needed, based on SerpApi response structure
  // displayed_link?: string;
  // source?: string;
};

// Optimize the website recommendations prompt
const getWebsiteRecommendationsPrompt = (query: string, searchResults: SerpApiOrganicResult[]) => `
Analyze these search results for "${query}":
${searchResults.map(item => `${item.title} | ${item.link} | ${item.snippet}`).join('\n')}

Return a JSON array of top 5 most relevant resources, each with:
- title: string (use original if good)
- url: string
- description: string (1 sentence)
- category: string (one of: Learning Platform, Industry Blog, Professional Network, Course, Community, Job Board, Career Guide)
- relevanceScore: number (0-100, be strict)

Format: {"recommendations": [...]}
`;

// Optimize the insights prompt
const getInsightsPrompt = (query: string) => `
For "${query}", provide concise JSON with:
{
  "practicalGuides": [4 short, actionable steps],
  "theoreticalInsight": "1-2 sentences",
  "contradictoryTake": "1-2 sentences"
}`;

async function getWebsiteRecommendations(query: string): Promise<WebsiteRecommendation[]> {
  try {
    if (!process.env.SERPAPI_KEY) {
      throw new Error('SerpApi key is not configured');
    }

    const searchData = await getJson({
      engine: 'google',
      api_key: process.env.SERPAPI_KEY,
      q: query + ' career guide resources learning',
      num: 10,
    });

    if (!searchData.organic_results?.length) {
      return [];
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a career resource curator. Be selective and concise."
        },
        {
          role: "user",
          content: getWebsiteRecommendationsPrompt(query, searchData.organic_results)
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3, // Lower temperature for more consistent results
    });

    const response = JSON.parse(completion.choices[0].message.content || '{"recommendations": []}');
    return (response.recommendations || []).slice(0, 5);

  } catch (error) {
    console.error('Error getting website recommendations:', error);
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const { query } = await request.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required and must be a string' },
        { status: 400 }
      );
    }

    // Check cache first
    const cacheKey = query.toLowerCase().trim();
    const cachedResult = searchCache.get(cacheKey);
    if (cachedResult) {
      console.log('Cache hit for query:', query);
      return NextResponse.json({
        success: true,
        data: cachedResult,
        cached: true
      });
    }

    console.log('Processing search query:', query);

    // Run API calls in parallel
    const [recommendedWebsites, insightsCompletion] = await Promise.all([
      (async () => {
        console.log('Starting website recommendations...');
        const websites = await getWebsiteRecommendations(query).catch(error => {
          console.error('Failed to get website recommendations:', error);
          return [];
        });
        console.log('Finished website recommendations');
        return websites;
      })(),
      (async () => {
        console.log('Starting insights generation...');
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "You are a career development expert. Be concise and practical."
            },
            {
              role: "user",
              content: getInsightsPrompt(query)
            }
          ],
          response_format: { type: "json_object" },
          temperature: 0.3,
        });
        console.log('Finished insights generation');
        return completion;
      })()
    ]);

    const insights = JSON.parse(insightsCompletion.choices[0].message.content || '{}');

    const response: SearchResponse = {
      ...insights,
      recommendedWebsites,
      status: {
        phase: 'complete',
        message: 'Search completed successfully',
        progress: 100
      }
    };

    // Cache the result
    searchCache.set(cacheKey, response);

    return NextResponse.json({
      success: true,
      data: response,
      cached: false
    });

  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'An error occurred during the search'
      },
      { status: 500 }
    );
  }
}