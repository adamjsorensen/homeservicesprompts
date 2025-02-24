
import { Button } from "@/components/ui/button";
import { ArrowRight, Library, PaintBucket, Paintbrush, House } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { LandingHeader } from "@/components/layout/LandingHeader";
import { useAuth } from "@/components/auth/AuthProvider";
import { Navigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Redirect authenticated users to library
  if (user) {
    return <Navigate to="/library" replace />;
  }

  return (
    <>
      <LandingHeader />
      <div className="min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center text-center space-y-8 px-4 mt-14">
        <div className="space-y-4 max-w-3xl">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
            Your AI Assistant for Professional Painting Success
          </h1>
          <p className="text-xl text-muted-foreground">
            Create, manage, and organize your AI prompts to streamline your painting
            business operations and enhance customer communication.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            size="lg"
            onClick={() => navigate("/auth")}
            className="gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <Library className="w-4 h-4" />
            Get Started
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => navigate("/auth")}
            className="gap-2"
          >
            Learn More
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
          <div className="p-6 rounded-lg border bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm">
            <div className="flex justify-center mb-4">
              <PaintBucket className="w-8 h-8 text-blue-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Smart Templates</h3>
            <p className="text-muted-foreground">
              Pre-built prompts designed specifically for painting businesses
            </p>
          </div>
          <div className="p-6 rounded-lg border bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm">
            <div className="flex justify-center mb-4">
              <Paintbrush className="w-8 h-8 text-teal-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Business Context</h3>
            <p className="text-muted-foreground">
              Customize prompts with your painting business details for consistent messaging
            </p>
          </div>
          <div className="p-6 rounded-lg border bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm">
            <div className="flex justify-center mb-4">
              <House className="w-8 h-8 text-blue-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Easy Integration</h3>
            <p className="text-muted-foreground">
              Quick copy and paste into your favorite AI tools
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Index;
