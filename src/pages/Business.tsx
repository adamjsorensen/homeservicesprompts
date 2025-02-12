
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface BusinessProfile {
  business_name: string;
  description: string;
  industry: string;
  target_audience: string;
  brand_voice: string;
  values: string;
}

const Business = () => {
  const { toast } = useToast();
  const [profile, setProfile] = useState<BusinessProfile>({
    business_name: "",
    description: "",
    industry: "",
    target_audience: "",
    brand_voice: "",
    values: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  // Load existing profile data
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) throw error;
        if (data) {
          setProfile({
            business_name: data.business_name || "",
            description: data.description || "",
            industry: data.industry || "",
            target_audience: data.target_audience || "",
            brand_voice: data.brand_voice || "",
            values: data.values || "",
          });
        }
      } catch (error) {
        console.error("Error loading profile:", error);
        toast({
          variant: "destructive",
          description: "Failed to load business profile",
        });
      }
    };

    loadProfile();
  }, []);

  const handleSave = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("profiles")
        .update({
          business_name: profile.business_name,
          description: profile.description,
          industry: profile.industry,
          target_audience: profile.target_audience,
          brand_voice: profile.brand_voice,
          values: profile.values,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "Profile saved",
        description: "Your business profile has been updated successfully.",
      });
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({
        variant: "destructive",
        description: "Failed to save business profile",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setProfile((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Business Profile</h2>
          <p className="text-muted-foreground mt-2">
            Provide information about your business to enhance AI prompt generation
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Tell us about your business and its core offerings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Business Name</label>
              <Input
                name="business_name"
                value={profile.business_name}
                onChange={handleChange}
                placeholder="Enter your business name"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                name="description"
                value={profile.description}
                onChange={handleChange}
                placeholder="Describe what your business does"
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Industry</label>
              <Input
                name="industry"
                value={profile.industry}
                onChange={handleChange}
                placeholder="e.g., Marketing Agency, Consulting"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Brand & Audience</CardTitle>
            <CardDescription>
              Define your target audience and brand voice
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Target Audience</label>
              <Textarea
                name="target_audience"
                value={profile.target_audience}
                onChange={handleChange}
                placeholder="Describe your ideal customers"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Brand Voice</label>
              <Textarea
                name="brand_voice"
                value={profile.brand_voice}
                onChange={handleChange}
                placeholder="Describe your brand's tone and personality"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Core Values</label>
              <Textarea
                name="values"
                value={profile.values}
                onChange={handleChange}
                placeholder="List your business's core values"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave} size="lg" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Profile"}
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default Business;
