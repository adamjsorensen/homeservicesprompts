
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

    // Fetch additional context if it exists
    const { data: additionalContextData, error: contextError } = await supabaseClient
      .from('prompt_additional_context')
      .select('context_text')
      .eq('custom_prompt_id', customPromptId)
      .single();

    if (contextError && contextError.code !== 'PGRST116') { // Ignore "no rows returned" error
      throw contextError;
    }

    // Construct the complete prompt
    let finalPrompt = customPrompt.base_prompt.prompt;
    
    // Add customizations
    for (const customization of customPrompt.customizations) {
      finalPrompt += "\n" + customization.parameter_tweak.sub_prompt;
    }

    // Add additional context if it exists
    if (additionalContextData?.context_text) {
      finalPrompt += "\n\nAdditional Context:\n" + additionalContextData.context_text;
    }

    // Get business profile if available
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('business_name, description, industry, target_audience, brand_voice, values')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Error fetching business profile:', profileError);
    } else if (profile && Object.values(profile).some(value => value)) {
      // Only add business context if at least one field has a value
      finalPrompt += "\n\nBusiness Context:\n" + JSON.stringify(profile, null, 2);
    }

    // Generate content using OpenRouter
    const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OpenAI (OpenRouter)')}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://zdspjopumyunfkkqoabx.supabase.co',
        'X-Title': 'Lovable Prompt Generator',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a helpful assistant that generates content based on custom prompts.' },
          { role: 'user', content: finalPrompt }
        ],
      }),
    });

    if (!openRouterResponse.ok) {
      const errorText = await openRouterResponse.text();
      console.error('OpenRouter API error:', errorText);
      throw new Error(`OpenRouter API error: ${errorText}`);
    }

    const openRouterData = await openRouterResponse.json();
    const generatedContent = openRouterData.choices[0].message.content;

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
