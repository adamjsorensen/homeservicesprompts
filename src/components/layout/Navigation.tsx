
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { Search, Building2, Library, Home, LogOut, PaintBucket, Settings2, FileText } from "lucide-react";
import { useAuth } from "../auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { usePrompts } from "@/hooks/usePrompts";

export const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const { isAdmin } = usePrompts();

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
          <div 
            onClick={() => navigate("/")} 
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
          >
            <PaintBucket className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-semibold">ProPaint AI</h1>
          </div>
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
                <Button
                  variant={isActive("/saved-generations") ? "secondary" : "ghost"}
                  onClick={() => navigate("/saved-generations")}
                  className="flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Saved Content
                </Button>
                {isAdmin && (
                  <Button
                    variant={isActive("/admin") ? "secondary" : "ghost"}
                    onClick={() => navigate("/admin")}
                    className="flex items-center gap-2"
                  >
                    <Settings2 className="w-4 h-4" />
                    Admin
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-4">
          {user ? (
            <Button
              variant="ghost"
              onClick={handleSignOut}
              className="flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
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
}
