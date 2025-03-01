
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserTable } from "@/components/admin/UserTable";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";

const AdminUsers = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [userProfiles, setUserProfiles] = useState<any[]>([]);
  const [userRoles, setUserRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get the current session
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      
      if (!accessToken) {
        throw new Error("Not authenticated");
      }

      // Call the admin-users function to get user data
      const { data, error } = await supabase.functions.invoke("admin-users/list", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      
      if (error) throw error;
      
      // Process the data
      setUsers(data.users || []);
      setUserProfiles(data.profiles || []);
      setUserRoles(data.roles || []);
      
      console.log('Fetched data:', data);
    } catch (error) {
      console.error('Error fetching user data:', error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      setError(errorMessage);
      toast({
        title: "Error fetching data",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

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
      // Get the current session token
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      
      if (!accessToken) {
        throw new Error("Not authenticated");
      }

      // Call the edge function to toggle admin status
      const { data, error } = await supabase.functions.invoke("admin-users/toggle-admin", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: { userId, currentStatus },
      });
      
      if (error) throw error;
      
      toast({
        title: currentStatus ? "Admin rights removed" : "Admin rights granted",
        description: currentStatus 
          ? "User no longer has administrator permissions" 
          : "User now has administrator permissions",
      });
      
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
      // Get the current session token
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      
      if (!accessToken) {
        throw new Error("Not authenticated");
      }

      // Call the edge function to update profile
      const { data, error } = await supabase.functions.invoke("admin-users/update-profile", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: { userId, profileData },
      });
      
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

      {error && (
        <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md mb-4">
          <p className="font-medium">Error loading users</p>
          <p className="text-sm">{error}</p>
          <p className="text-sm mt-2">
            Make sure you have admin privileges to access this page.
          </p>
        </div>
      )}

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
