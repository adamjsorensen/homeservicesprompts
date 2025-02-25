
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, isLoading: true });

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Handle auth state changes
  useEffect(() => {
    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      handleAuthRedirect(currentUser);
      setIsLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user;
      setUser(currentUser ?? null);
      handleAuthRedirect(currentUser ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []); 

  // Centralized redirect logic
  const handleAuthRedirect = (currentUser: User | null) => {
    const path = location.pathname;
    const returnTo = new URLSearchParams(location.search).get("returnTo");

    console.log('[Auth Redirect]', {
      currentUser: !!currentUser,
      path,
      returnTo,
      timestamp: new Date().toISOString(),
      stackTrace: new Error().stack
    });

    if (currentUser) {
      // User is logged in
      if (path === "/auth") {
        // Redirect to returnTo or default route
        const destination = returnTo || "/library";
        console.log('[Auth Redirect] Navigating to:', destination);
        navigate(destination, { replace: true });
        toast({
          title: "Welcome!",
          description: "Successfully authenticated.",
        });
      } else if (path === "/") {
        // Redirect from landing to main app
        console.log('[Auth Redirect] Redirecting from landing to library');
        navigate("/library", { replace: true });
      }
    } else {
      // User is not logged in
      if (path !== "/" && path !== "/auth") {
        // Save current path and redirect to auth
        const authPath = `/auth?returnTo=${encodeURIComponent(path)}`;
        console.log('[Auth Redirect] Redirecting to auth:', authPath);
        navigate(authPath, { replace: true });
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
