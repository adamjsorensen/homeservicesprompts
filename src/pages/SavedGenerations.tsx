
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye, FileText } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export function SavedGenerations() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: generations, isLoading, error } = useQuery({
    queryKey: ["saved-generations"],
    queryFn: async () => {
      console.log("Fetching saved generations...");
      const { data, error } = await supabase
        .from("saved_generations")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching saved generations:", error);
        toast({
          title: "Error",
          description: "Failed to load saved content. Please try again.",
          variant: "destructive",
        });
        throw error;
      }

      console.log("Fetched generations:", data);
      return data;
    },
  });

  console.log('[SavedGenerations] Rendering', {
    isLoading,
    hasError: !!error,
    pathname: window.location.pathname,
    renderCount: Math.random()
  });

  if (error) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Error loading saved content</h1>
          <p className="text-red-500">Something went wrong. Please try refreshing the page.</p>
        </div>
      </Layout>
    );
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Loading saved content...</h1>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Saved Generations</h1>
        </div>

        {generations && generations.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {generations.map((generation) => (
                <TableRow key={generation.id}>
                  <TableCell className="font-medium">{generation.title}</TableCell>
                  <TableCell>
                    {new Date(generation.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => navigate(`/saved-generations/${generation.slug}`)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-semibold text-gray-900">No saved content</h3>
            <p className="mt-1 text-sm text-gray-500">
              Start by saving some generated content.
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}

