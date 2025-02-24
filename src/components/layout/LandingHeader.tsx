
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const LandingHeader = () => {
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center gap-2">
          <img 
            src="/lovable-uploads/bcb8494a-3402-46b5-8b33-dd45d3103ebf.png" 
            alt="PropaintAI Logo"
            className="h-8 w-auto"
          />
          <span className="font-semibold text-lg">PropaintAI</span>
        </div>
        <Button 
          onClick={() => navigate("/auth")}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Login / Sign Up
        </Button>
      </div>
    </header>
  );
};
