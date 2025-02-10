
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
import { useState } from "react";

interface BusinessProfile {
  name: string;
  description: string;
  industry: string;
  targetAudience: string;
  brandVoice: string;
  values: string;
}

const Business = () => {
  const { toast } = useToast();
  const [profile, setProfile] = useState<BusinessProfile>({
    name: "",
    description: "",
    industry: "",
    targetAudience: "",
    brandVoice: "",
    values: "",
  });

  const handleSave = () => {
    // In a real app, this would save to a backend
    localStorage.setItem("businessProfile", JSON.stringify(profile));
    toast({
      title: "Profile saved",
      description: "Your business profile has been updated successfully.",
    });
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
                name="name"
                value={profile.name}
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
                name="targetAudience"
                value={profile.targetAudience}
                onChange={handleChange}
                placeholder="Describe your ideal customers"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Brand Voice</label>
              <Textarea
                name="brandVoice"
                value={profile.brandVoice}
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
          <Button onClick={handleSave} size="lg">
            Save Profile
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default Business;
