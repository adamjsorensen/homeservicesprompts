
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";

export const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1">
          <div className="container py-4">
            <SidebarTrigger className="mb-4 lg:hidden" />
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};
