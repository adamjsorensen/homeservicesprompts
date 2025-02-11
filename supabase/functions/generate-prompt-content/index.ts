
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { customPromptId, userId } = await req.json();

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch the custom prompt and its related data
    const { data: customPrompt, error: promptError } = await supabaseClient
      .from('custom_prompts')
      .select(`
        *,
        base_prompt:prompts(*),
        customizations:prompt_customizations(
          parameter_tweak:parameter_tweaks(*)
        )
      `)
      .eq('id', customPromptId)
      .single();

    if (promptError) throw promptError;

    // Construct the complete prompt
    let finalPrompt = customPrompt.base_prompt.prompt;
    for (const customization of customPrompt.customizations) {
      finalPrompt += "\n" + customization.parameter_tweak.sub_prompt;
    }

    // Get business profile if available
    const { data: profiles } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profiles?.business_profile) {
      finalPrompt += "\n\nBusiness Context:\n" + JSON.stringify(profiles.business_profile, null, 2);
    }

    // Generate content using OpenAI
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OpenAI (OpenRouter)')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a helpful assistant that generates content based on custom prompts.' },
          { role: 'user', content: finalPrompt }
        ],
      }),
    });

    if (!openAIResponse.ok) {
      throw new Error(`OpenAI API error: ${await openAIResponse.text()}`);
    }

    const openAIData = await openAIResponse.json();
    const generatedContent = openAIData.choices[0].message.content;

    // Save the generated content
    const { error: saveError } = await supabaseClient
      .from('prompt_generations')
      .insert({
        custom_prompt_id: customPromptId,
        generated_content: generatedContent,
        created_by: userId,
      });

    if (saveError) throw saveError;

    return new Response(
      JSON.stringify({ generatedContent }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-prompt-content:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
