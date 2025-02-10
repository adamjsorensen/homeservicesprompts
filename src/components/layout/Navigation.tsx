
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { Search, Plus, Building2, Library, Home, LogOut } from "lucide-react";
import { useAuth } from "../auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      navigate("/");
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b">
      <div className="container flex items-center justify-between h-16">
        <div className="flex items-center space-x-8">
          <h1 
            onClick={() => navigate("/")} 
            className="text-xl font-semibold cursor-pointer hover:opacity-80 transition-opacity"
          >
            Promptopia
          </h1>
          <div className="hidden md:flex items-center space-x-6">
            <Button
              variant={isActive("/") ? "secondary" : "ghost"}
              onClick={() => navigate("/")}
              className="flex items-center gap-2"
            >
              <Home className="w-4 h-4" />
              Home
            </Button>
            {user && (
              <>
                <Button
                  variant={isActive("/library") ? "secondary" : "ghost"}
                  onClick={() => navigate("/library")}
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
              </>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-4">
          {user ? (
            <>
              <Button
                onClick={() => navigate("/create")}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                New Prompt
              </Button>
              <Button
                variant="ghost"
                onClick={handleSignOut}
                className="flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            </>
          ) : (
            <Button
              onClick={() => navigate("/auth")}
              className="flex items-center gap-2"
            >
              Sign In
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
};
