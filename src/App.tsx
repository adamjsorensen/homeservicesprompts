
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./components/auth/AuthProvider";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { PublicOnlyRoute } from "./components/auth/PublicOnlyRoute";
import { Layout } from "./components/layout/Layout";
import Index from "./pages/Index";
import Library from "./pages/Library";
import Business from "./pages/Business";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Admin from "./pages/Admin";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import { GeneratedContent } from "./pages/GeneratedContent";
import { SavedGenerations } from "./pages/SavedGenerations";
import { SavedGeneration } from "./pages/SavedGeneration";
import Chat from "./pages/Chat";

const queryClient = new QueryClient();

const App = () => (
  <BrowserRouter>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
            <Route 
              path="/" 
              element={
                <PublicOnlyRoute>
                  <Index />
                </PublicOnlyRoute>
              } 
            />
            <Route 
              path="/auth" 
              element={
                <PublicOnlyRoute>
                  <Auth />
                </PublicOnlyRoute>
              } 
            />
            {/* Protected routes wrapped in a single Layout */}
            <Route
              element={
                <ProtectedRoute>
                  <Layout>
                    <Routes>
                      <Route path="/chat" element={<Chat />} />
                      <Route path="/library" element={<Library />} />
                      <Route path="/library/:hubArea" element={<Library />} />
                      <Route path="/business" element={<Business />} />
                      <Route path="/profile" element={<Profile />} />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="/admin" element={<Admin />} />
                      <Route path="/generated-content" element={<GeneratedContent />} />
                      <Route path="/saved-generations" element={<SavedGenerations />} />
                      <Route path="/saved-generations/:slug" element={<SavedGeneration />} />
                    </Routes>
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </BrowserRouter>
);

export default App;
