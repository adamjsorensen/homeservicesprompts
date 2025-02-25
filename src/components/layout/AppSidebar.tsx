
import {
  Library,
  Building2,
  FileText,
  Settings2,
  LogOut,
  MessageSquare,
  User,
  Layers,
  Building,
  Users,
  Target,
  LineChart,
  Brain,
  Shield,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
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
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useState } from "react";

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

  const hubSubItems = [{
    title: "Marketing",
    url: "/library/marketing",
    icon: Building
  }, {
    title: "Sales",
    url: "/library/sales",
    icon: Building
  }, {
    title: "Production",
    url: "/library/production",
    icon: Layers
  }, {
    title: "Team",
    url: "/library/team",
    icon: Users
  }, {
    title: "Strategy",
    url: "/library/strategy",
    icon: Target
  }, {
    title: "Financials",
    url: "/library/financials",
    icon: LineChart
  }, {
    title: "Personal Leadership",
    url: "/library/leadership",
    icon: Brain
  }];

  const mainItems = [...(user ? [{
    title: "Hub",
    icon: Library,
    url: "/library",
    subItems: hubSubItems
  }, {
    title: "Business",
    icon: Building2,
    url: "/business"
  }, {
    title: "Saved Content",
    icon: FileText,
    url: "/saved-generations"
  }, {
    title: "Chat",
    icon: MessageSquare,
    url: "/chat"
  }] : [])];

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
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {mainItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      onClick={() => item.subItems ? toggleHubExpansion : navigate(item.url)}
                      className={cn(
                        item.subItems && state !== "collapsed" && "flex justify-between items-center",
                        currentPath === item.url && "bg-sidebar-accent text-sidebar-accent-foreground"
                      )}
                      tooltip={state === "collapsed" ? item.title : undefined}
                    >
                      <div className="flex items-center gap-2">
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </div>
                      {item.subItems && state !== "collapsed" && (
                        <ChevronDown 
                          className={cn(
                            "h-4 w-4 transition-transform",
                            isHubExpanded ? "rotate-0" : "-rotate-90"
                          )}
                          onClick={toggleHubExpansion}
                        />
                      )}
                    </SidebarMenuButton>
                    {item.subItems && isHubExpanded && state !== "collapsed" && (
                      <SidebarMenuSub>
                        {item.subItems.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton
                              onClick={() => navigate(subItem.url)}
                              className={cn(
                                currentPath === subItem.url && "bg-sidebar-accent text-sidebar-accent-foreground"
                              )}
                            >
                              <subItem.icon className="h-4 w-4" />
                              <span>{subItem.title}</span>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    )}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {user && (
            <>
              <SidebarGroup>
                <SidebarGroupLabel>Account</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        onClick={() => navigate("/profile")}
                        tooltip={state === "collapsed" ? "Profile" : undefined}
                        className={cn(
                          currentPath === "/profile" && "bg-sidebar-accent text-sidebar-accent-foreground"
                        )}
                      >
                        <User className="h-4 w-4" />
                        <span>Profile</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        onClick={() => navigate("/settings")}
                        tooltip={state === "collapsed" ? "Settings" : undefined}
                        className={cn(
                          currentPath === "/settings" && "bg-sidebar-accent text-sidebar-accent-foreground"
                        )}
                      >
                        <Settings2 className="h-4 w-4" />
                        <span>Settings</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    {isAdmin && (
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          onClick={() => navigate("/admin")}
                          tooltip={state === "collapsed" ? "Admin" : undefined}
                          className={cn(
                            currentPath === "/admin" && "bg-sidebar-accent text-sidebar-accent-foreground"
                          )}
                        >
                          <Shield className="h-4 w-4" />
                          <span>Admin</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )}
                    <SidebarMenuItem>
                      <SidebarMenuButton 
                        onClick={handleSignOut}
                        className="text-red-500 hover:text-red-600"
                        tooltip={state === "collapsed" ? "Sign Out" : undefined}
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Sign Out</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </>
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
