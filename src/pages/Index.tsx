
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { ArrowRight, Library } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center text-center space-y-8 px-4">
        <div className="space-y-4 max-w-3xl">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Your AI Assistant for Service Business Success
          </h1>
          <p className="text-xl text-muted-foreground">
            Create, manage, and organize your AI prompts to streamline your service
            business operations and enhance customer communication.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            size="lg"
            onClick={() => navigate("/library")}
            className="gap-2"
          >
            <Library className="w-4 h-4" />
            Explore Prompt Library
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => navigate("/business")}
            className="gap-2"
          >
            Get Started
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
          <div className="p-6 rounded-lg border bg-card">
            <h3 className="text-lg font-semibold mb-2">Smart Templates</h3>
            <p className="text-muted-foreground">
              Pre-built prompts designed specifically for service businesses
            </p>
          </div>
          <div className="p-6 rounded-lg border bg-card">
            <h3 className="text-lg font-semibold mb-2">Business Context</h3>
            <p className="text-muted-foreground">
              Customize prompts with your business details for consistent messaging
            </p>
          </div>
          <div className="p-6 rounded-lg border bg-card">
            <h3 className="text-lg font-semibold mb-2">Easy Integration</h3>
            <p className="text-muted-foreground">
              Quick copy and paste into your favorite AI tools
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Index;
