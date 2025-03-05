
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import { corsHeaders } from '../_shared/cors.ts';

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
    
    // Create response headers
    const headers = {
      ...corsHeaders,
      'Content-Type': streaming ? 'text/event-stream' : 'application/json',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
    };
    
    if (streaming) {
      // Handle streaming response directly
      console.log('Initiating streaming request to OpenRouter');
      
      const openRouterResponse = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'https://yourapplication.com', // Replace with your actual domain
          'X-Title': 'Your Application Name' // Replace with your app name
        },
        body: JSON.stringify({
          messages,
          model: model || 'openai/gpt-4o-mini', // Default model
          stream: true
        })
      });
      
      console.log('OpenRouter response received:', {
        status: openRouterResponse.status,
        statusText: openRouterResponse.statusText,
        headers: Object.fromEntries([...openRouterResponse.headers.entries()]),
        bodyType: openRouterResponse.body ? 'ReadableStream' : 'null',
        bodyHasGetReader: openRouterResponse.body && typeof openRouterResponse.body.getReader === 'function'
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
      
      // Check if we have a readable stream
      if (!openRouterResponse.body) {
        throw new Error('OpenRouter response body is null or undefined');
      }
      
      // Pass through the streaming response
      const stream = new ReadableStream({
        async start(controller) {
          // Process the response body as a stream
          const reader = openRouterResponse.body?.getReader();
          if (!reader) {
            console.error('Failed to get reader from response body');
            controller.close();
            return;
          }
          
          console.log('Successfully obtained reader from OpenRouter response');
          
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) {
                console.log('Stream complete');
                break;
              }
              
              // Log a sample of the chunk (first 100 bytes)
              const sampleChunk = new TextDecoder().decode(value.slice(0, Math.min(100, value.length)));
              console.log(`Received chunk (${value.length} bytes): ${sampleChunk}${value.length > 100 ? '...' : ''}`);
              
              // Forward the chunks
              controller.enqueue(value);
            }
          } catch (error) {
            console.error('Error in stream processing:', error);
            controller.error(error);
          } finally {
            reader.releaseLock();
            controller.close();
          }
        }
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
      
      console.log('Returning stream to client');
      return new Response(stream, { headers });
    } else {
      // Non-streaming mode
      console.log('Initiating non-streaming request to OpenRouter');
      
      const openRouterResponse = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'https://yourapplication.com', // Replace with your actual domain
          'X-Title': 'Your Application Name' // Replace with your app name
        },
        body: JSON.stringify({
          messages,
          model: model || 'openai/gpt-4o-mini', // Default model
          stream: false
        })
      });
      
      const data = await openRouterResponse.json();
      console.log('OpenRouter non-streaming response:', {
        status: openRouterResponse.status,
        hasChoices: !!data.choices,
        firstChoice: data.choices?.[0] ? 'present' : 'missing'
      });
      
      return new Response(JSON.stringify(data), {
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
