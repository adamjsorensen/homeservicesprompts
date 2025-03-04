
export async function callLlamaIndex(
  query: string,
  context: Array<{ content: string; metadata: Record<string, any> }>,
  hubArea?: string
): Promise<{
  content: string;
  citations: Array<{ document_id: string; context: string; relevance: number }>;
}> {
  const response = await fetch('https://api.llamaindex.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${Deno.env.get('LLAMAINDEX_API_KEY')}`
    },
    body: JSON.stringify({
      messages: [
        {
          role: 'system',
          content: `You are a helpful assistant. Use the provided context to answer questions. 
                   Always cite your sources using document IDs from the context.
                   ${hubArea ? `Focus on information relevant to the ${hubArea} area.` : ''}`
        },
        {
          role: 'user',
          content: query
        }
      ],
      context: context,
      response_format: {
        type: 'json',
        schema: {
          type: 'object',
          properties: {
            content: { type: 'string' },
            citations: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  document_id: { type: 'string' },
                  context: { type: 'string' },
                  relevance: { type: 'number' }
                }
              }
            }
          }
        }
      }
    })
  })

  if (!response.ok) {
    throw new Error(`LlamaIndex API error: ${response.statusText}`)
  }

  return await response.json()
}
