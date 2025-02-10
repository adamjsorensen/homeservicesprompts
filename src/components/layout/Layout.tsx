
import { Navigation } from "./Navigation";

export const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container pt-24 pb-16 animate-fade-in">
        {children}
      </main>
    </div>
  );
};
