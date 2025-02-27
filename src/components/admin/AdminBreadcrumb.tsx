
import { ChevronRight } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const ADMIN_ROUTES: Record<string, string> = {
  "/admin": "Admin",
  "/admin/hubs": "Hubs",
  "/admin/parameters": "Parameters",
  "/admin/prompts": "Prompts",
  "/admin/generations": "Generations",
  "/admin/analytics": "Analytics",
};

export function AdminBreadcrumb() {
  const location = useLocation();
  const currentPath = location.pathname;
  
  const isSubPage = currentPath !== "/admin";

  if (!isSubPage) return null;

  return (
    <Breadcrumb className="mb-6">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink as={Link} to="/admin">
            Admin
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator>
          <ChevronRight className="h-4 w-4" />
        </BreadcrumbSeparator>
        <BreadcrumbItem>
          <BreadcrumbPage>{ADMIN_ROUTES[currentPath]}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
