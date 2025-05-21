// Save this as app/api/debug/route.ts

import { NextResponse } from 'next/server';
import { getJson } from 'serpapi';

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const testQuery = searchParams.get('query') || 'test query';
  
  console.log('Debug endpoint called with query:', testQuery);
  
  // Check API keys
  const hasOpenAIKey = !!process.env.OPENAI_API_KEY;
  const hasSerpAPIKey = !!process.env.SERP_API_KEY;
  
  // Return environment status without exposing actual keys
  const envStatus = {
    OPENAI_API_KEY: hasOpenAIKey ? '✓ Set' : '✗ Missing',
    SERP_API_KEY: hasSerpAPIKey ? '✓ Set' : '✗ Missing',
  };
  
  // Test SerpAPI if key exists
  let serpApiStatus = null;
  if (hasSerpAPIKey) {
    try {
      console.log('Making test SerpAPI request...');
      const results = await getJson({
        api_key: process.env.SERP_API_KEY,
        q: testQuery,
        num: 1,
        gl: 'us',
        hl: 'en',
        engine: 'google',
      });
      
      const hasResults = results?.organic_results?.length > 0;
      
      serpApiStatus = {
        status: 'success',
        metadata: results.search_metadata,
        hasResults,
        resultCount: results?.organic_results?.length || 0,
        firstResultTitle: hasResults ? results.organic_results[0].title : null
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      serpApiStatus = {
        status: 'error',
        message: errorMessage
      };
    }
  }
  
  return NextResponse.json({
    timestamp: new Date().toISOString(),
    environment: envStatus,
    serpApiTest: serpApiStatus
  });
}