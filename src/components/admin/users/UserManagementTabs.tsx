
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserTable } from "@/components/admin/UserTable";
import { ProcessedUser } from "./UserDataFetcher";

interface UserManagementTabsProps {
  processedUsers: ProcessedUser[];
  loading: boolean;
  onToggleAdmin: (userId: string, currentStatus: boolean) => Promise<void>;
  onUpdateProfile: (userId: string, profileData: any) => Promise<void>;
}

export const UserManagementTabs = ({
  processedUsers,
  loading,
  onToggleAdmin,
  onUpdateProfile,
}: UserManagementTabsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Users</CardTitle>
        <CardDescription>
          Manage your application users and their permissions
        </CardDescription>
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
            />
          </TabsContent>
          
          <TabsContent value="admin-users">
            <UserTable 
              users={processedUsers.filter(user => user.isAdmin)} 
              loading={loading}
              onToggleAdmin={onToggleAdmin}
              onUpdateProfile={onUpdateProfile}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
