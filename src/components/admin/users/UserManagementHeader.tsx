
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface UserManagementHeaderProps {
  loading: boolean;
  onRefresh: () => void;
}

export const UserManagementHeader = ({
  loading,
  onRefresh,
}: UserManagementHeaderProps) => {
  return (
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground">
          View and manage user accounts and permissions
        </p>
      </div>
      <Button 
        onClick={onRefresh} 
        variant="outline"
        disabled={loading}
        className="flex items-center gap-2"
      >
        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        Refresh
      </Button>
    </div>
  );
};
