
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { useAuth } from "@/components/auth/AuthProvider";
import { useLocation } from "react-router-dom";

export const Layout = ({ children }: { children: React.ReactNode }) => {
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
    return <>{children}</>;
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1">
          <div className="container py-4">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};
