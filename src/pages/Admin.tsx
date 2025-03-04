
import { useNavigate } from "react-router-dom";
import { usePrompts } from "@/hooks/usePrompts";
import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, ListPlus, Settings2, Sparkles, LayoutGrid, Users, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

const AdminCard = ({ 
  title, 
  description, 
  icon: Icon, 
  onClick,
  className
}: { 
  title: string;
  description: string;
  icon: any;
  onClick: () => void;
  className?: string;
}) => (
  <Card 
    onClick={onClick}
    className={cn(
      "cursor-pointer transition-all hover:shadow-md hover:scale-[1.02] active:scale-[0.98]",
      className
    )}
  >
    <CardHeader>
      <div className="flex items-start justify-between space-x-4">
        <div>
          <CardTitle className="text-xl group-hover:text-purple-600 transition-colors">
            {title}
          </CardTitle>
          <CardDescription className="text-sm mt-1">
            {description}
          </CardDescription>
        </div>
        <Icon className="w-8 h-8 text-muted-foreground" />
      </div>
    </CardHeader>
  </Card>
);

const Admin = () => {
  const navigate = useNavigate();
  const { isAdmin, isLoading } = usePrompts();

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      navigate("/");
    }
  }, [isAdmin, isLoading, navigate]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const sections = [
    {
      title: "Prompt Hub Management",
      description: "Organize and manage prompts by hub areas",
      icon: LayoutGrid,
      path: "/admin/hubs",
      className: "bg-purple-50 border-purple-200"
    },
    {
      title: "Parameter System",
      description: "Configure parameters and tweaks for prompts",
      icon: Settings2,
      path: "/admin/parameters",
      className: "bg-blue-50 border-blue-200"
    },
    {
      title: "Content Creation",
      description: "Create and edit prompts and templates",
      icon: ListPlus,
      path: "/admin/prompts",
      className: "bg-green-50 border-green-200"
    },
    {
      title: "Document Management",
      description: "Manage documents for context retrieval",
      icon: FileText,
      path: "/admin/documents",
      className: "bg-yellow-50 border-yellow-200"
    },
    {
      title: "Generated Content",
      description: "Review and manage generated content",
      icon: Sparkles,
      path: "/admin/generations",
      className: "bg-orange-50 border-orange-200"
    },
    {
      title: "User Management",
      description: "Manage users and their permissions",
      icon: Users,
      path: "/admin/users",
      className: "bg-indigo-50 border-indigo-200"
    },
    {
      title: "Analytics Dashboard",
      description: "Monitor prompt performance and usage",
      icon: Database,
      path: "/admin/analytics",
      className: "bg-pink-50 border-pink-200"
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Manage your content generation system
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sections.map((section) => (
          <AdminCard
            key={section.title}
            title={section.title}
            description={section.description}
            icon={section.icon}
            onClick={() => navigate(section.path)}
            className={section.className}
          />
        ))}
      </div>

      {/* Coming Soon Notice */}
      <div className="mt-8 p-4 bg-muted/50 rounded-lg">
        <h3 className="font-medium mb-2">Coming Soon</h3>
        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
          <li>A/B Testing for prompts</li>
          <li>Batch operations and bulk editing</li>
          <li>Advanced analytics and insights</li>
          <li>Template library system</li>
          <li>Advanced user management & organization structure</li>
        </ul>
      </div>
    </div>
  );
};

export default Admin;
