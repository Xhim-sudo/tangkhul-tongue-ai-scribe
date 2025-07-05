
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, source_language, target_language } = await req.json();
    
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);
    
    // Get training data for context
    const { data: trainingData } = await supabase
      .from('training_entries')
      .select('english_text, tangkhul_text')
      .eq('status', 'approved')
      .limit(10);

    let contextExamples = '';
    if (trainingData && trainingData.length > 0) {
      contextExamples = '\n\nHere are some examples of English-Tangkhul translations:\n' +
        trainingData.map(item => `English: "${item.english_text}" -> Tangkhul: "${item.tangkhul_text}"`).join('\n');
    }

    const systemPrompt = `You are an expert translator for the Tangkhul language. Tangkhul is a Tibeto-Burman language spoken in Northeast India. 

Your task is to provide accurate translations between English and Tangkhul. Be culturally sensitive and contextually appropriate.

Important guidelines:
- Maintain the tone and formality level of the original text
- Consider cultural context when translating
- If you're unsure about a translation, provide your best attempt but indicate uncertainty
- For greetings, use appropriate Tangkhul cultural expressions
- Return only the translation, no explanations unless the translation requires cultural context

${contextExamples}`;

    const userPrompt = source_language === 'english' 
      ? `Translate this English text to Tangkhul: "${text}"`
      : `Translate this Tangkhul text to English: "${text}"`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const translatedText = data.choices[0].message.content.trim();

    return new Response(JSON.stringify({ 
      translated_text: translatedText,
      confidence_score: 85,
      source_language,
      target_language 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Translation error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      translated_text: "Translation service temporarily unavailable. Please try again later.",
      confidence_score: 0
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
