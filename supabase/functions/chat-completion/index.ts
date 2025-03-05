
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import { corsHeaders } from '../_shared/cors.ts';
import { withRetry } from '../_shared/retry.ts';

// Get API key from environment variables
const OPENROUTER_API_KEY = Deno.env.get('OpenAI (OpenRouter)') || '';

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = performance.now();
  
  try {
    const { messages, model, userId, streaming = true } = await req.json();
    
    console.log(`Chat completion request:`, { 
      messageCount: messages.length,
      model,
      streaming,
      userId: userId || 'anonymous'
    });
    
    // OpenRouter API endpoint
    const url = 'https://openrouter.ai/api/v1/chat/completions';
    
    if (streaming) {
      console.log('Initiating streaming request to OpenRouter');
      
      // Create a new abort controller for the request
      const controller = new AbortController();
      
      // Log the request details
      console.log('OpenRouter request:', {
        url,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer <redacted>',
          'HTTP-Referer': 'https://yourapplication.com',
          'X-Title': 'Your Application Name'
        },
        body: {
          messages: messages.length,
          model: model || 'openai/gpt-4o-mini',
          stream: true
        }
      });
      
      const openRouterResponse = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'https://yourapplication.com',
          'X-Title': 'Your Application Name'
        },
        body: JSON.stringify({
          messages,
          model: model || 'openai/gpt-4o-mini',
          stream: true
        }),
        signal: controller.signal
      });
      
      console.log('OpenRouter response received:', {
        status: openRouterResponse.status,
        statusText: openRouterResponse.statusText,
        headers: Object.fromEntries([...openRouterResponse.headers.entries()]),
        isReadable: !!openRouterResponse.body?.getReader
      });
      
      if (!openRouterResponse.ok) {
        const errorText = await openRouterResponse.text();
        console.error('OpenRouter error response:', {
          status: openRouterResponse.status,
          statusText: openRouterResponse.statusText,
          error: errorText
        });
        throw new Error(`OpenRouter API error: ${openRouterResponse.status} - ${errorText}`);
      }
      
      // For streaming, we directly return the response from OpenRouter
      // This maintains the original stream without any transformation
      return new Response(openRouterResponse.body, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        }
      });
    } else {
      // Non-streaming mode
      console.log('Initiating non-streaming request to OpenRouter');
      
      const response = await withRetry(async () => {
        const openRouterResponse = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'HTTP-Referer': 'https://yourapplication.com',
            'X-Title': 'Your Application Name'
          },
          body: JSON.stringify({
            messages,
            model: model || 'openai/gpt-4o-mini',
            stream: false
          })
        });
        
        if (!openRouterResponse.ok) {
          const errorText = await openRouterResponse.text();
          throw new Error(`OpenRouter API error: ${openRouterResponse.status} - ${errorText}`);
        }
        
        return await openRouterResponse.json();
      }, {
        maxRetries: 3,
        retryCondition: (error) => {
          // Only retry on network errors or 5xx server errors
          return error.message.includes('network') || 
                 error.message.includes('500') ||
                 error.message.includes('502') ||
                 error.message.includes('503') ||
                 error.message.includes('504');
        }
      });
      
      console.log('OpenRouter non-streaming response:', {
        hasChoices: !!response.choices,
        firstChoice: response.choices?.[0] ? 'present' : 'missing'
      });
      
      // Record usage metrics if user is authenticated
      if (userId) {
        try {
          const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
          );
          
          await supabase.from('chat_usage').insert({
            user_id: userId,
            model: model || 'openai/gpt-4o-mini',
            messages_count: messages.length,
            duration_ms: Math.round(performance.now() - startTime)
          });
        } catch (err) {
          console.error('Error recording usage metrics:', err);
        }
      }
      
      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error('Error in chat completion function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
