import { NextResponse } from 'next/server';
import { getJson } from 'serpapi';
import OpenAI from 'openai';

// Types
interface SerpApiResponse {
  search_metadata: {
    status: string;
  };
  search_parameters: {
    q: string;
  };
  organic_results: Array<{
    link: string;
    title: string;
    snippet: string;
  }>;
}

interface ProcessedResponse {
  practicalGuides: string[];
  theoreticalInsight: string;
  contradictoryTake: string;
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Validate environment variables on startup
if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is not set in environment variables');
}
if (!process.env.SERP_API_KEY) {
  throw new Error('SERP_API_KEY is not set in environment variables');
}

export async function POST(request: Request) {
  try {
    // Add request logging
    console.log('Received search request');
    
    // Parse and validate request body
    const body = await request.json();
    const { query } = body;

    if (!query || typeof query !== 'string' || query.trim() === '') {
      console.error('Invalid query:', query);
      return NextResponse.json(
        { error: 'Query must be a non-empty string' },
        { status: 400 }
      );
    }

    console.log('Processing search query:', query);
    console.log('Using SerpAPI key:', process.env.SERP_API_KEY ? '✓ Key is set' : '✗ Key is missing');

    // Fetch search results from SerpAPI
    let searchResults: SerpApiResponse;
    try {
      // Add more detailed logging for API call
      console.log('Making SerpAPI request...');
      
      const serpApiParams = {
        api_key: process.env.SERP_API_KEY,
        q: query,
        num: 5,
        gl: 'us',
        hl: 'en',
        engine: 'google',
      };
      
      searchResults = await getJson(serpApiParams) as SerpApiResponse;
      
      console.log('SerpAPI response received. Status:', searchResults.search_metadata?.status);
      console.log('Results count:', searchResults.organic_results?.length || 0);

      // Validate search results
      if (!searchResults.organic_results || searchResults.organic_results.length === 0) {
        console.error('No search results found for query:', query);
        return NextResponse.json(
          { error: 'No search results found. Please try a different query.', debug: { query } },
          { status: 404 }
        );
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('SerpAPI error:', errorMessage);
      
      // Return more detailed error information for debugging
      return NextResponse.json(
        { 
          error: 'Failed to fetch search results. Please try again.', 
          debug: { 
            message: errorMessage,
            query 
          } 
        },
        { status: 502 }
      );
    }

    // Extract and validate URLs
    const urls = searchResults.organic_results
      .slice(0, 5)
      .map(result => result.link)
      .filter(url => url && typeof url === 'string');

    // Log the URLs for debugging
    console.log(`Filtered URLs (${urls.length}):`);
    urls.forEach((url, i) => console.log(`  ${i+1}. ${url}`));

    if (urls.length === 0) {
      console.error('No valid URLs found in search results');
      return NextResponse.json(
        { 
          error: 'No valid search results found. Please try again.',
          debug: { rawResults: searchResults.organic_results }
        },
        { status: 500 }
      );
    }

    // For quick testing, return the raw search results if desired
    // Uncomment this line to bypass OpenAI processing and see raw results
    // return NextResponse.json({ success: true, rawResults: searchResults.organic_results, urls });

    console.log('Found URLs:', urls);

    // Prepare prompt for GPT-4
    const prompt = `
      Based on the following search results for the query: "${query}"
      
      URLs:
      ${urls.join('\n')}
      
      Please analyze these results and provide:
      1. Two practical guides (step-by-step actionable advice)
      2. One theoretical insight (broader perspective or framework)
      3. One contradictory or hot take (different or controversial viewpoint)
      
      Format the response as a JSON object with these keys:
      {
        "practicalGuides": ["guide1", "guide2"],
        "theoreticalInsight": "insight",
        "contradictoryTake": "take"
      }
      
      Keep each response concise but informative. Each practical guide should be 2-3 sentences.
      The theoretical insight should be 2-3 sentences.
      The contradictory take should be 2-3 sentences.
    `;

    // Get response from GPT-4
    let completion;
    try {
      console.log('Making OpenAI API request...');
      completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a career advice expert who analyzes search results and provides structured insights. You must respond in valid JSON format with the following structure: { \"practicalGuides\": [\"guide1\", \"guide2\"], \"theoreticalInsight\": \"insight\", \"contradictoryTake\": \"take\" }"
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });
      
      console.log('OpenAI response received');
      
      if (!completion.choices?.[0]?.message?.content) {
        throw new Error('Empty or invalid response from OpenAI API');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('OpenAI API error:', errorMessage);
      
      // For API key issues, provide a more specific error
      if (errorMessage.includes('api_key') || errorMessage.includes('authentication')) {
        return NextResponse.json(
          { 
            error: 'Failed to authenticate with OpenAI. Please check your API key configuration.', 
            debug: { message: errorMessage } 
          },
          { status: 401 }
        );
      }
      
      return NextResponse.json(
        { 
          error: 'Failed to analyze search results. Please try again.', 
          debug: { message: errorMessage } 
        },
        { status: 503 }
      );
    }

    // Parse and validate GPT response
    let response: ProcessedResponse;
    try {
      const rawContent = completion.choices[0].message.content;
      console.log('Raw GPT response:', rawContent);
      
      response = JSON.parse(rawContent);
      
      // Validate response structure thoroughly
      if (!Array.isArray(response.practicalGuides) || 
          response.practicalGuides.length < 2 ||
          typeof response.theoreticalInsight !== 'string' || 
          typeof response.contradictoryTake !== 'string' ||
          !response.theoreticalInsight.trim() ||
          !response.contradictoryTake.trim()) {
        throw new Error('Invalid response structure from GPT');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Failed to parse GPT response:', errorMessage);
      
      // Return more detailed debugging info
      return NextResponse.json(
        { 
          error: 'Failed to process AI response. Please try again.', 
          debug: { 
            message: errorMessage,
            rawResponse: completion?.choices?.[0]?.message?.content 
          } 
        },
        { status: 500 }
      );
    }

    console.log('Successfully processed search query');
    return NextResponse.json({
      success: true,
      data: response,
      query: query
    });

  } catch (error) {
    // Handle any unexpected errors
    console.error('Unexpected error in search route:', error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}