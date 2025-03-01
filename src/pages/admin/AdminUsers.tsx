
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserTable } from "@/components/admin/UserTable";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

const AdminUsers = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [userProfiles, setUserProfiles] = useState<any[]>([]);
  const [userRoles, setUserRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      // Get user profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('*');
      
      if (profilesError) throw profilesError;

      // Get user roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');
      
      if (rolesError) throw rolesError;

      // Get user auth data
      const { data: userData, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) throw authError;

      // Process and combine the data
      const users = userData?.users || [];
      setUsers(users);
      setUserProfiles(profiles || []);
      setUserRoles(roles || []);
      
      console.log('Fetched data:', { users, profiles, roles });
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast({
        title: "Error fetching data",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const processedUsers = users.map(user => {
    const profile = userProfiles.find(p => p.id === user.id) || {};
    const isAdmin = userRoles.some(r => r.user_id === user.id && r.role === 'admin');
    
    return {
      id: user.id,
      email: user.email,
      firstName: profile.first_name || '',
      lastName: profile.last_name || '',
      company: profile.company || '',
      createdAt: user.created_at,
      lastSignIn: user.last_sign_in_at,
      isAdmin,
    };
  });

  const handleToggleAdminStatus = async (userId: string, currentStatus: boolean) => {
    try {
      if (currentStatus) {
        // Remove admin role
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', 'admin');
        
        if (error) throw error;
        
        toast({
          title: "Admin rights removed",
          description: "User no longer has administrator permissions",
        });
      } else {
        // Add admin role
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: 'admin' });
        
        if (error) throw error;
        
        toast({
          title: "Admin rights granted",
          description: "User now has administrator permissions",
        });
      }
      
      // Refresh data
      fetchData();
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: "Error updating user role",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    }
  };

  const handleUpdateProfile = async (userId: string, profileData: any) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          first_name: profileData.firstName,
          last_name: profileData.lastName,
          company: profileData.company,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);
      
      if (error) throw error;
      
      toast({
        title: "Profile updated",
        description: "User profile has been updated successfully",
      });
      
      // Refresh data
      fetchData();
    } catch (error) {
      console.error('Error updating user profile:', error);
      toast({
        title: "Error updating profile",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">
            View and manage user accounts and permissions
          </p>
        </div>
        <Button 
          onClick={fetchData} 
          variant="outline"
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

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
                onToggleAdmin={handleToggleAdminStatus}
                onUpdateProfile={handleUpdateProfile}
              />
            </TabsContent>
            
            <TabsContent value="admin-users">
              <UserTable 
                users={processedUsers.filter(user => user.isAdmin)} 
                loading={loading}
                onToggleAdmin={handleToggleAdminStatus}
                onUpdateProfile={handleUpdateProfile}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminUsers;
