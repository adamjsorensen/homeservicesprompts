
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

const AdminGenerations = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Generated Content</h1>
          <p className="text-muted-foreground">
            Review and manage generated content
          </p>
        </div>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export Data
        </Button>
      </div>

      <div className="p-8 text-center text-muted-foreground">
        <p>Generation history and analytics coming soon...</p>
      </div>
    </div>
  );
};

export default AdminGenerations;
