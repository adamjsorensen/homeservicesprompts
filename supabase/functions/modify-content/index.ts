
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Use the correct secret name as it appears in Supabase
const openAIApiKey = Deno.env.get('OpenAI (OpenRouter)');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, modification } = await req.json();

    if (!content || !modification) {
      console.error('Missing required fields:', { hasContent: !!content, hasModification: !!modification });
      throw new Error('Content and modification are required');
    }

    if (!openAIApiKey) {
      console.error('OpenAI API key is not configured');
      throw new Error('OpenAI API key is not configured');
    }

    console.log('Calling OpenAI API with:', { contentLength: content.length, modification });

    // Call OpenAI API to modify the content
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert content editor. Modify the provided content based on the user\'s request while maintaining the original context and format. Return only the modified content without any additional comments or explanations.'
          },
          {
            role: 'user',
            content: `Original content:\n${content}\n\nModification request: ${modification}`
          }
        ],
      }),
    });

    // Handle API response
    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', { status: response.status, error: errorText });
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('OpenAI response data structure:', Object.keys(data));
    
    if (!data.choices || data.choices.length === 0) {
      console.error('Unexpected response format - no choices array or empty choices array', data);
      throw new Error('Unexpected response format from OpenAI API - no choices returned');
    }
    
    if (!data.choices[0].message) {
      console.error('Unexpected response format - no message in first choice', data.choices[0]);
      throw new Error('Unexpected response format from OpenAI API - no message in response');
    }
    
    const modifiedContent = data.choices[0].message.content;
    console.log('Successfully modified content, returning response');

    return new Response(
      JSON.stringify({ modifiedContent }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
