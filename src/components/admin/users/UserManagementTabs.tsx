
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserTable } from "@/components/admin/UserTable";
import { AddUserDialog } from "./AddUserDialog";
import { ProcessedUser } from "./UserDataFetcher";
import { UserPlus } from "lucide-react";

interface UserManagementTabsProps {
  processedUsers: ProcessedUser[];
  loading: boolean;
  onToggleAdmin: (userId: string, currentStatus: boolean) => Promise<void>;
  onUpdateProfile: (userId: string, profileData: any) => Promise<void>;
  onRefreshUsers: () => Promise<void>;
}

export const UserManagementTabs = ({
  processedUsers,
  loading,
  onToggleAdmin,
  onUpdateProfile,
  onRefreshUsers
}: UserManagementTabsProps) => {
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Users</CardTitle>
          <CardDescription>
            Manage your application users and their permissions
          </CardDescription>
        </div>
        <Button onClick={() => setAddUserDialogOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all-users">
          <TabsList className="mb-4">
            <TabsTrigger value="all-users">All Users</TabsTrigger>
            <TabsTrigger value="admin-users">Administrators</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all-users">
            <UserTable 
              users={processedUsers} 
              loading={loading}
              onToggleAdmin={onToggleAdmin}
              onUpdateProfile={onUpdateProfile}
              onDeleteUser={onRefreshUsers}
            />
          </TabsContent>
          
          <TabsContent value="admin-users">
            <UserTable 
              users={processedUsers.filter(user => user.isAdmin)} 
              loading={loading}
              onToggleAdmin={onToggleAdmin}
              onUpdateProfile={onUpdateProfile}
              onDeleteUser={onRefreshUsers}
            />
          </TabsContent>
        </Tabs>

        <AddUserDialog 
          open={addUserDialogOpen} 
          onOpenChange={setAddUserDialogOpen} 
          onUserAdded={onRefreshUsers}
        />
      </CardContent>
    </Card>
  );
};
