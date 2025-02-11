
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function SavedGeneration() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const { data: generation, isLoading } = useQuery({
    queryKey: ["saved-generation", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("saved_generations")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error("Generation not found");
      return data;
    },
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Loading content...</h1>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <Button
          variant="outline"
          onClick={() => navigate("/saved-generations")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Saved Generations
        </Button>

        {generation && (
          <Card>
            <CardHeader>
              <CardTitle>{generation.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <p className="whitespace-pre-wrap">{generation.content}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
