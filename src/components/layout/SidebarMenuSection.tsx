
import { MenuItem, MenuSection } from "@/config/menuConfig";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarGroupLabel,
  useSidebar,
} from "@/components/ui/sidebar";

interface SidebarMenuSectionProps {
  section: MenuSection;
  currentPath: string;
  onItemClick: (item: MenuItem) => void;
  isHubExpanded?: boolean;
  onHubToggle?: (e: React.MouseEvent) => void;
}

export function SidebarMenuSection({
  section,
  currentPath,
  onItemClick,
  isHubExpanded,
  onHubToggle
}: SidebarMenuSectionProps) {
  const { state } = useSidebar();

  return (
    <>
      {section.title && <SidebarGroupLabel>{section.title}</SidebarGroupLabel>}
      <SidebarMenu>
        {section.items.map((item) => (
          <SidebarMenuItem key={item.title}>
            <div className="relative">
              <SidebarMenuButton
                onClick={() => onItemClick(item)}
                className={cn(
                  "w-full",
                  item.subItems && state !== "collapsed" && "pr-8",
                  currentPath === item.url && "bg-sidebar-accent text-sidebar-accent-foreground",
                  item.subItems && currentPath.startsWith('/library') && "bg-sidebar-accent text-sidebar-accent-foreground"
                )}
                tooltip={state === "collapsed" ? item.title : undefined}
              >
                <div className="flex items-center gap-2">
                  <item.icon className="h-4 w-4" />
                  <span>{item.title}</span>
                </div>
              </SidebarMenuButton>
              {item.subItems && state !== "collapsed" && (
                <button
                  onClick={onHubToggle}
                  className={cn(
                    "absolute right-2 top-1/2 -translate-y-1/2",
                    "p-1.5 rounded-md hover:bg-accent/50",
                    "focus:outline-none focus:ring-2 focus:ring-accent"
                  )}
                >
                  <ChevronDown 
                    className={cn(
                      "h-4 w-4 transition-transform",
                      isHubExpanded ? "rotate-0" : "-rotate-90"
                    )}
                  />
                </button>
              )}
            </div>
            {item.subItems && isHubExpanded && state !== "collapsed" && (
              <SidebarMenuSub>
                {item.subItems.map((subItem) => (
                  <SidebarMenuSubItem key={subItem.title}>
                    <SidebarMenuSubButton
                      onClick={() => onItemClick(subItem)}
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
    </>
  );
}
