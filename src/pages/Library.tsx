
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Copy, Filter } from "lucide-react";
import { useState } from "react";

interface Prompt {
  id: string;
  title: string;
  description: string;
  category: string;
  prompt: string;
  tags: string[];
}

const SAMPLE_PROMPTS: Prompt[] = [
  {
    id: "1",
    title: "Client Onboarding Email",
    description: "Welcome email template for new clients",
    category: "Email",
    prompt: "Write a warm welcome email for a new client who just signed up for our [service]. Include next steps and what they can expect.",
    tags: ["email", "onboarding", "welcome"],
  },
  {
    id: "2",
    title: "Service Description",
    description: "Professional service description for website",
    category: "Marketing",
    prompt: "Create a compelling service description for [service name] that highlights its unique benefits and appeals to [target audience].",
    tags: ["marketing", "website", "copy"],
  },
];

const Library = () => {
  const [prompts, setPrompts] = useState<Prompt[]>(SAMPLE_PROMPTS);
  const [filter, setFilter] = useState("all");

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Prompt Library</h2>
            <p className="text-muted-foreground mt-2">
              Manage and organize your AI prompts
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Input
              placeholder="Search prompts..."
              className="w-[200px] md:w-[300px]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {prompts.map((prompt) => (
            <Card key={prompt.id} className="group">
              <CardHeader className="space-y-1">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{prompt.title}</CardTitle>
                    <CardDescription className="mt-2">
                      {prompt.description}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyToClipboard(prompt.prompt)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {prompt.prompt}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {prompt.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Library;
