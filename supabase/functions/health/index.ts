import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check database connection
    const { data: dbCheck, error: dbError } = await supabaseClient
      .from('training_entries')
      .select('count')
      .limit(1);

    // Check translation cache
    const { data: cacheCheck, error: cacheError } = await supabaseClient
      .from('translation_cache')
      .select('count')
      .limit(1);

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks: {
        database: dbError ? 'unhealthy' : 'healthy',
        cache: cacheError ? 'unhealthy' : 'healthy',
        edge_function: 'healthy'
      },
      version: '1.0.0',
      environment: Deno.env.get('ENVIRONMENT') || 'production'
    };

    const allHealthy = Object.values(health.checks).every(status => status === 'healthy');
    health.status = allHealthy ? 'healthy' : 'degraded';

    return new Response(
      JSON.stringify(health),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: allHealthy ? 200 : 503,
      }
    );

  } catch (error) {
    console.error('Health check error:', error);
    
    return new Response(
      JSON.stringify({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 503,
      }
    );
  }
});
