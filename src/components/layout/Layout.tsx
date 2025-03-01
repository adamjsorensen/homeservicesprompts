
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { useAuth } from "@/components/auth/AuthProvider";
import { useLocation, Outlet } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export const Layout = () => {
  const { user } = useAuth();
  const location = useLocation();

  console.log('[Layout]', {
    hasUser: !!user,
    pathname: location.pathname,
    isNested: !!location.pathname.split('/')[2],
    timestamp: new Date().toISOString(),
    renderCount: Math.random(),
    stackTrace: new Error().stack
  });

  if (!user) {
    return null;
  }

  return (
    <ErrorBoundary>
      <SidebarProvider defaultOpen={true}>
        <div className="min-h-screen flex w-full">
          <ErrorBoundary>
            <AppSidebar />
          </ErrorBoundary>
          <main className="flex-1">
            <div className="container py-4">
              <ErrorBoundary>
                <Outlet />
              </ErrorBoundary>
            </div>
          </main>
        </div>
      </SidebarProvider>
    </ErrorBoundary>
  );
};
