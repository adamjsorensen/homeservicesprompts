
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { Search, Building2, Library, Home, LogOut, PaintBucket, Settings2, FileText, Menu } from "lucide-react";
import { useAuth } from "../auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { usePrompts } from "@/hooks/usePrompts";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

export const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const { isAdmin } = usePrompts();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const NavItems = () => (
    <>
      <Button
        variant={isActive("/") ? "secondary" : "ghost"}
        onClick={() => {
          navigate("/");
          setMobileMenuOpen(false);
        }}
        className="flex items-center gap-2 w-full justify-start"
      >
        <Home className="w-4 h-4" />
        Home
      </Button>
      {user && (
        <>
          <Button
            variant={isActive("/library") ? "secondary" : "ghost"}
            onClick={() => {
              navigate("/library");
              setMobileMenuOpen(false);
            }}
            className="flex items-center gap-2 w-full justify-start"
          >
            <Library className="w-4 h-4" />
            Library
          </Button>
          <Button
            variant={isActive("/business") ? "secondary" : "ghost"}
            onClick={() => {
              navigate("/business");
              setMobileMenuOpen(false);
            }}
            className="flex items-center gap-2 w-full justify-start"
          >
            <Building2 className="w-4 h-4" />
            Business
          </Button>
          <Button
            variant={isActive("/saved-generations") ? "secondary" : "ghost"}
            onClick={() => {
              navigate("/saved-generations");
              setMobileMenuOpen(false);
            }}
            className="flex items-center gap-2 w-full justify-start"
          >
            <FileText className="w-4 h-4" />
            Saved Content
          </Button>
          {isAdmin && (
            <Button
              variant={isActive("/admin") ? "secondary" : "ghost"}
              onClick={() => {
                navigate("/admin");
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-2 w-full justify-start"
            >
              <Settings2 className="w-4 h-4" />
              Admin
            </Button>
          )}
        </>
      )}
    </>
  );

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
            <NavItems />
          </div>
        </div>
        <div className="flex items-center space-x-4">
          {user ? (
            <>
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild className="md:hidden">
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[240px] sm:w-[280px]">
                  <div className="px-1 py-4 flex flex-col gap-2">
                    <NavItems />
                    <Button
                      variant="ghost"
                      onClick={() => {
                        handleSignOut();
                        setMobileMenuOpen(false);
                      }}
                      className="flex items-center gap-2 w-full justify-start"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
              <Button
                variant="ghost"
                onClick={handleSignOut}
                className="hidden md:flex items-center gap-2"
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
