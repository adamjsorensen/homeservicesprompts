
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";

export const PublicOnlyRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-violet-900"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/library" replace />;
  }

  return <>{children}</>;
};
