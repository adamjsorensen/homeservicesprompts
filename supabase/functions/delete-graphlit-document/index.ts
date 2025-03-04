
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

interface RequestBody {
  graphlitDocId: string;
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const graphlitApiKey = Deno.env.get("GRAPHLIT_TESTING_API_KEY");
    if (!graphlitApiKey) {
      throw new Error("GRAPHLIT_TESTING_API_KEY environment variable is not set");
    }

    const { graphlitDocId } = await req.json() as RequestBody;
    
    if (!graphlitDocId) {
      throw new Error("Graphlit document ID is required");
    }

    console.log(`Deleting document from Graphlit: ${graphlitDocId}`);

    // Call Graphlit API to delete the document
    const response = await fetch(`https://api.graphlit.dev/v1/documents/${graphlitDocId}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${graphlitApiKey}`,
        "X-Graphlit-Org-Id": "52f95f04-8470-4f51-9819-5fd4c8b3bc8b",
        ...corsHeaders
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Graphlit API error:", {
        status: response.status,
        error: errorText
      });
      throw new Error(`Graphlit API error: ${response.status} - ${errorText}`);
    }

    console.log(`Document successfully deleted from Graphlit: ${graphlitDocId}`);

    return new Response(
      JSON.stringify({
        success: true,
        graphlitDocId
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
    console.error("Error deleting document from Graphlit:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
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
