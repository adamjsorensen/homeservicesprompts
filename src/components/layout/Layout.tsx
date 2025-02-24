
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";

export const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1">
          <div className="sticky top-0 z-30 flex h-16 items-center border-b bg-background px-4">
            <SidebarTrigger />
          </div>
          <div className="container py-4">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};
