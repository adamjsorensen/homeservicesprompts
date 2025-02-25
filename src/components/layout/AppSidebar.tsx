
import { ChevronRight } from "lucide-react";
import { useAuth } from "../auth/AuthProvider";
import { useNavigate } from "react-router-dom";
import { usePrompts } from "@/hooks/usePrompts";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { getMenuSections, MenuItem } from "@/config/menuConfig";
import { SidebarMenuSection } from "./SidebarMenuSection";
import { LogOut } from "lucide-react";

export function AppSidebar() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin } = usePrompts();
  const { toast } = useToast();
  const { state } = useSidebar();
  const [isHubExpanded, setIsHubExpanded] = useState(true);

  const currentPath = window.location.pathname;

  console.log('[Sidebar] Rendering AppSidebar', {
    sidebarState: state,
    pathname: currentPath,
    renderCount: Math.random()
  });

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } else {
      navigate("/");
    }
  };

  const toggleHubExpansion = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsHubExpanded(!isHubExpanded);
  };

  const handleItemClick = (item: MenuItem) => {
    if (item.subItems) {
      setIsHubExpanded(!isHubExpanded);
    } else {
      navigate(item.url);
    }
  };

  const menuSections = user ? getMenuSections(isAdmin) : [];

  return (
    <div className="relative">
      <Sidebar variant="sidebar" collapsible="icon">
        <SidebarHeader className="px-4 py-4">
          <div 
            className="flex items-center gap-2 cursor-pointer" 
            onClick={() => navigate("/")}
          >
            <img 
              src="/lovable-uploads/bcb8494a-3402-46b5-8b33-dd45d3103ebf.png" 
              alt="PropaintAI Logo"
              className="h-8 w-auto"
            />
            <span 
              className={`font-semibold text-lg transition-opacity duration-200 ${
                state === "collapsed" ? "opacity-0 hidden" : "opacity-100"
              }`}
            >
              PropaintAI
            </span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          {menuSections.map((section, index) => (
            <SidebarGroup key={section.title || index}>
              <SidebarGroupContent>
                <SidebarMenuSection
                  section={section}
                  currentPath={currentPath}
                  onItemClick={handleItemClick}
                  isHubExpanded={isHubExpanded}
                  onHubToggle={toggleHubExpansion}
                />
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
          {user && (
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenuSection
                  section={{
                    items: [{
                      title: "Sign Out",
                      icon: LogOut,
                      url: "#signout"
                    }]
                  }}
                  currentPath={currentPath}
                  onItemClick={() => handleSignOut()}
                />
              </SidebarGroupContent>
            </SidebarGroup>
          )}
        </SidebarContent>
      </Sidebar>
      <div 
        className={cn(
          "absolute top-16 -right-4 z-[100]",
          state === "collapsed" ? "-rotate-180" : "",
          "transition-transform duration-200"
        )}
      >
        <SidebarTrigger 
          className="h-8 w-8 rounded-full border bg-background shadow-md flex items-center justify-center hover:bg-accent text-violet-900 font-bold"
          aria-label={state === "collapsed" ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronRight className="h-4 w-4" />
        </SidebarTrigger>
      </div>
    </div>
  );
}
