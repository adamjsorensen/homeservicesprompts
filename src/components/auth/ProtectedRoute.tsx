
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  console.log('[Protected Route]', {
    isLoading,
    hasUser: !!user,
    pathname: location.pathname,
    search: location.search,
    timestamp: new Date().toISOString(),
    stackTrace: new Error().stack
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-violet-900"></div>
      </div>
    );
  }

  if (!user) {
    // Save the attempted route
    return (
      <Navigate 
        to={`/auth?returnTo=${encodeURIComponent(location.pathname)}`} 
        replace 
      />
    );
  }

  return <>{children}</>;
};
