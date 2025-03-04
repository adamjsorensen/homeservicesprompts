
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Call OpenAI API to generate a response
async function generateResponse(
  prompt: string, 
  context: Array<{ content: string; document_title: string }>,
  systemPrompt?: string
): Promise<string> {
  const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') || '';
  
  // Format context for inclusion in the prompt
  let contextText = '';
  if (context && context.length > 0) {
    contextText = `\n\nRelevant information from documents:\n\n`;
    context.forEach((item, index) => {
      contextText += `[DOCUMENT ${index + 1}: ${item.document_title}]\n${item.content}\n\n`;
    });
  }
  
  // Default system prompt if none provided
  const defaultSystemPrompt = `You are a helpful assistant that generates responses based on the provided context. 
When relevant information is found in the context, incorporate it and cite the source document. 
If the context doesn't contain relevant information for parts of your response, acknowledge that and provide general guidance instead.
Always be truthful - if you don't have the information, say so rather than making things up.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: systemPrompt || defaultSystemPrompt
        },
        {
          role: 'user',
          content: `${prompt}\n\n${contextText}`
        }
      ],
      temperature: 0.7,
    }),
  });

  const result = await response.json();
  
  if (!result.choices || !result.choices[0] || !result.choices[0].message) {
    console.error('Error generating response:', result);
    throw new Error('Failed to generate response: ' + JSON.stringify(result));
  }
  
  return result.choices[0].message.content;
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  
  try {
    const { 
      prompt,
      contextChunks,
      systemPrompt,
      customPromptId,
      saveReferences = true
    } = await req.json();
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log(`Generating response for prompt: "${prompt.substring(0, 50)}..." with ${contextChunks?.length || 0} context chunks`);
    
    // Generate response incorporating the context
    const generatedContent = await generateResponse(prompt, contextChunks, systemPrompt);
    
    // If customPromptId is provided, save the generation and document references
    let generationId = null;
    if (customPromptId && saveReferences) {
      // Insert the generation into prompt_generations
      const { data: generation, error: generationError } = await supabase
        .from('prompt_generations')
        .insert({
          custom_prompt_id: customPromptId,
          generated_content: generatedContent,
          created_by: 'system' // Use actual user ID in production
        })
        .select('id')
        .single();
      
      if (generationError) {
        console.error('Error saving generation:', generationError);
      } else {
        generationId = generation.id;
        
        // Save document references
        if (contextChunks && contextChunks.length > 0) {
          const documentReferences = contextChunks.map(chunk => ({
            prompt_generation_id: generationId,
            document_id: chunk.document_id,
            citation_context: chunk.citation_context,
            relevance_score: chunk.relevance_score
          }));
          
          const { error: referencesError } = await supabase
            .from('document_references')
            .insert(documentReferences);
          
          if (referencesError) {
            console.error('Error saving document references:', referencesError);
          }
        }
      }
    }
    
    return new Response(
      JSON.stringify({
        generated_content: generatedContent,
        generation_id: generationId
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in generate-response-with-context:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 400,
      }
    );
  }
});
