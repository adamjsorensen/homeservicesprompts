
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

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
      throw new Error('Content and modification are required');
    }

    if (!openAIApiKey) {
      throw new Error('OpenAI API key is not configured');
    }

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

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Unexpected response format from OpenAI API');
    }
    
    const modifiedContent = data.choices[0].message.content;

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
