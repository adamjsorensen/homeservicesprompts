
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
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  useSidebar,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function AppSidebar() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin } = usePrompts();
  const { toast } = useToast();
  const { state } = useSidebar();

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      navigate("/");
    }
  };

  const hubSubItems = [
    { title: "Marketing", url: "/library/marketing", icon: Building },
    { title: "Sales", url: "/library/sales", icon: Building },
    { title: "Production", url: "/library/production", icon: Layers },
    { title: "Team", url: "/library/team", icon: Users },
    { title: "Strategy", url: "/library/strategy", icon: Target },
    { title: "Financials", url: "/library/financials", icon: LineChart },
    { title: "Personal Leadership", url: "/library/leadership", icon: Brain },
  ];

  const mainItems = [
    ...(user
      ? [
          {
            title: "Hub",
            icon: Library,
            url: "/library",
            subItems: hubSubItems,
          },
          {
            title: "Business",
            icon: Building2,
            url: "/business",
          },
          {
            title: "Saved Content",
            icon: FileText,
            url: "/saved-generations",
          },
          {
            title: "Chat",
            icon: MessageSquare,
            url: "/chat",
          },
        ]
      : []),
  ];

  return (
    <div className="relative">
      <Sidebar variant="sidebar" collapsible="icon">
        <SidebarHeader className="h-[60px] px-2 flex items-center">
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
                      onClick={() => item.subItems ? null : navigate(item.url)}
                      className={item.title === "Hub" ? "font-bold" : ""}
                      tooltip={state === "collapsed" ? item.title : undefined}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                    {item.subItems && state !== "collapsed" && (
                      <SidebarMenuSub>
                        {item.subItems.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton
                              onClick={() => navigate(subItem.url)}
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
                      >
                        <User className="h-4 w-4" />
                        <span>Profile</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        onClick={() => navigate("/settings")}
                        tooltip={state === "collapsed" ? "Settings" : undefined}
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
          "absolute top-16 right-0 translate-x-1/2 transition-transform",
          state === "collapsed" ? "rotate-180" : ""
        )}
      >
        <SidebarTrigger 
          className="h-8 w-8 rounded-full border bg-background shadow-md"
        >
          <ChevronRight className="h-4 w-4" />
        </SidebarTrigger>
      </div>
    </div>
  );
}
