
import { ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  );
};
