
import { LucideIcon, Library, Building2, FileText, MessageSquare, User, Settings2, Shield, Building, Layers, Users, Target, LineChart, Brain } from "lucide-react";

export type MenuItem = {
  title: string;
  icon: LucideIcon;
  url: string;
  subItems?: MenuItem[];
};

export type MenuSection = {
  title?: string;
  items: MenuItem[];
};

export const hubSubItems: MenuItem[] = [
  {
    title: "Marketing",
    url: "/library/marketing",
    icon: Building
  },
  {
    title: "Sales",
    url: "/library/sales",
    icon: Building
  },
  {
    title: "Production",
    url: "/library/production",
    icon: Layers
  },
  {
    title: "Team",
    url: "/library/team",
    icon: Users
  },
  {
    title: "Strategy",
    url: "/library/strategy",
    icon: Target
  },
  {
    title: "Financials",
    url: "/library/financials",
    icon: LineChart
  },
  {
    title: "Personal Leadership",
    url: "/library/leadership",
    icon: Brain
  }
];

export const getMenuSections = (isAdmin: boolean): MenuSection[] => [
  {
    items: [
      {
        title: "Hub",
        icon: Library,
        url: "/library",
        subItems: hubSubItems
      },
      {
        title: "Business",
        icon: Building2,
        url: "/business"
      },
      {
        title: "Saved Content",
        icon: FileText,
        url: "/saved-generations"
      },
      {
        title: "Chat",
        icon: MessageSquare,
        url: "/chat"
      }
    ]
  },
  {
    title: "Account",
    items: [
      {
        title: "Profile",
        icon: User,
        url: "/profile"
      },
      {
        title: "Settings",
        icon: Settings2,
        url: "/settings"
      },
      ...(isAdmin ? [{
        title: "Admin",
        icon: Shield,
        url: "/admin"
      }] : [])
    ]
  }
];
