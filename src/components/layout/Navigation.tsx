
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { Search, Plus, Building2, Library } from "lucide-react";

export const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b">
      <div className="container flex items-center justify-between h-16">
        <div className="flex items-center space-x-8">
          <h1 className="text-xl font-semibold">Promptopia</h1>
          <div className="hidden md:flex items-center space-x-6">
            <Button
              variant={isActive("/") ? "secondary" : "ghost"}
              onClick={() => navigate("/")}
              className="flex items-center gap-2"
            >
              <Library className="w-4 h-4" />
              Library
            </Button>
            <Button
              variant={isActive("/business") ? "secondary" : "ghost"}
              onClick={() => navigate("/business")}
              className="flex items-center gap-2"
            >
              <Building2 className="w-4 h-4" />
              Business
            </Button>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <Button
            onClick={() => navigate("/create")}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Prompt
          </Button>
        </div>
      </div>
    </nav>
  );
};
