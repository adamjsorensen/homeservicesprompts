
import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";

interface PublicOnlyRouteProps {
  children: ReactNode;
}

export const PublicOnlyRoute = ({ children }: PublicOnlyRouteProps) => {
  const { user } = useAuth();
  
  if (user) {
    return <Navigate to="/library" />;
  }

  return <>{children}</>;
};
