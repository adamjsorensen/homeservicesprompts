
import { withRetry } from "./retry.ts";

// Embedding generation from OpenAI
export async function generateEmbedding(content: string): Promise<number[]> {
  const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') || '';
  
  return withRetry(async () => {
    console.log(`Generating embedding for text of length: ${content.length}`);
    
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        input: content,
        model: 'text-embedding-3-small',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenAI API error: ${response.status} ${JSON.stringify(errorData)}`);
    }

    const result = await response.json();
    return result.data[0].embedding;
  }, {
    maxRetries: 3,
    retryCondition: (error) => {
      // Retry on network errors or OpenAI rate limits
      return error.message.includes('429') || 
             error.message.includes('500') || 
             error.message.includes('502') || 
             error.message.includes('503') ||
             error.message.includes('network');
    }
  });
}
