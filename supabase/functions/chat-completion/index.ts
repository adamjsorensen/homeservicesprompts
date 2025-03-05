
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
    
    // Create response headers for streaming
    const headers = {
      ...corsHeaders,
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    };
    
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
          'HTTP-Referer': 'https://yourapplication.com', // Replace with your actual domain
          'X-Title': 'Your Application Name' // Replace with your app name
        },
        body: JSON.stringify({
          messages,
          model: model || 'openai/gpt-4o-mini', // Default model
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
      
      // Create a TransformStream to forward the SSE data
      const { readable, writable } = new TransformStream();
      const writer = writable.getWriter();
      
      // Process the response body as a stream in the background
      (async () => {
        try {
          const reader = openRouterResponse.body?.getReader();
          if (!reader) {
            console.error('Failed to get reader from response body');
            writer.close();
            return;
          }
          
          console.log('Successfully obtained reader from OpenRouter response');
          
          const encoder = new TextEncoder();
          const decoder = new TextDecoder();
          let buffer = '';
          
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              console.log('Stream complete');
              break;
            }
            
            // Decode the chunk and append to buffer
            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;
            
            console.log('Processing chunk:', {
              chunkSize: value?.length,
              bufferContent: buffer.slice(0, 50) + '...',
              bufferLength: buffer.length
            });
            
            // Process complete lines from buffer
            let lineEnd;
            while ((lineEnd = buffer.indexOf('\n')) !== -1) {
              const line = buffer.slice(0, lineEnd).trim();
              buffer = buffer.slice(lineEnd + 1);
              
              console.log('Processing line:', {
                line: line.slice(0, 50) + (line.length > 50 ? '...' : ''),
                lineLength: line.length
              });
              
              if (line === '') continue;
              
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                
                // Handle the "[DONE]" message
                if (data === '[DONE]') {
                  console.log('Received [DONE] message');
                  await writer.write(encoder.encode(`data: [DONE]\n\n`));
                  continue;
                }
                
                try {
                  // Parse the JSON data
                  const parsed = JSON.parse(data);
                  console.log('Parsed SSE data:', { 
                    id: parsed.id?.slice(0, 8) + '...',
                    hasChoices: !!parsed.choices,
                    firstChoice: parsed.choices?.[0] ? 'present' : 'missing',
                    deltaContent: parsed.choices?.[0]?.delta?.content ? 'present' : 'missing',
                    deltaContentValue: parsed.choices?.[0]?.delta?.content?.slice(0, 20) + '...'
                  });
                  
                  // Forward the parsed data
                  console.log('Forwarding data to client');
                  await writer.write(encoder.encode(`data: ${data}\n\n`));
                  console.log('Data forwarded successfully');
                } catch (e) {
                  console.error('Error parsing SSE data:', e, 'Line:', line);
                }
              } else if (line.startsWith(':')) {
                // Handle comment lines (OpenRouter processing messages)
                console.log('OpenRouter comment:', line);
                // Forward comments as well
                await writer.write(encoder.encode(`${line}\n\n`));
              } else {
                console.log('Unknown line format:', line);
              }
            }
          }
        } catch (error) {
          console.error('Error in stream processing:', error);
          if (error.name !== 'AbortError') {
            const errorMessage = JSON.stringify({ error: error.message });
            await writer.write(new TextEncoder().encode(`data: ${errorMessage}\n\n`));
          }
        } finally {
          console.log('Closing stream writer');
          writer.close();
        }
      })();
      
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
      return new Response(readable, { headers });
    } else {
      // Non-streaming mode
      console.log('Initiating non-streaming request to OpenRouter');
      
      const response = await withRetry(async () => {
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
