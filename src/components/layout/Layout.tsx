
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { useAuth } from "@/components/auth/AuthProvider";

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();

  console.log('[Layout] Rendering Layout component', {
    hasUser: !!user,
    pathname: window.location.pathname,
    renderCount: Math.random(),
    stackTrace: new Error().stack // This will help identify where Layout is being called from
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

