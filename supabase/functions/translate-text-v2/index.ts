import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';
import { findTranslation } from './matcher.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const { text, source_language, target_language } = await req.json();

    if (!text || !source_language || !target_language) {
      throw new Error('Missing required fields: text, source_language, target_language');
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Find translation using enhanced algorithm
    const result = await findTranslation(
      supabaseClient,
      text,
      source_language,
      target_language
    );

    const responseTime = Date.now() - startTime;

    // Log analytics (non-blocking)
    const authHeader = req.headers.get('Authorization');
    let userId = null;
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabaseClient.auth.getUser(token);
      userId = user?.id;
    }

    supabaseClient
      .from('translation_analytics')
      .insert({
        query_text: text,
        source_language,
        target_language,
        result_method: result.method,
        confidence_score: result.confidence_score,
        response_time_ms: responseTime,
        user_id: userId,
        cached: result.metadata?.cached || false
      })
      .then(() => console.log('Analytics logged'))
      .catch(err => console.error('Failed to log analytics:', err));

    return new Response(
      JSON.stringify({
        ...result,
        response_time_ms: responseTime
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Translation error:', error);
    
    return new Response(
      JSON.stringify({
        error: error.message || 'Translation failed',
        details: error.toString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
