
import { useState, useEffect, ReactNode } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface User {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string;
}

interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  company: string;
}

interface UserRole {
  user_id: string;
  role: string;
}

interface FetchedData {
  users: User[];
  userProfiles: UserProfile[];
  userRoles: UserRole[];
  processedUsers: ProcessedUser[];
  loading: boolean;
  error: string | null;
}

export interface ProcessedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  company: string;
  createdAt: string;
  lastSignIn: string;
  isAdmin: boolean;
}

interface UserDataFetcherProps {
  user: any;
  children: (data: FetchedData & {
    handleToggleAdminStatus: (userId: string, currentStatus: boolean) => Promise<void>;
    handleUpdateProfile: (userId: string, profileData: any) => Promise<void>;
    fetchData: () => Promise<void>;
  }) => ReactNode;
}

export const UserDataFetcher = ({ user, children }: UserDataFetcherProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

      console.log("Fetching user data from admin-users-list function...");
      
      // Call the admin-users-list function to get user data
      const { data, error } = await supabase.functions.invoke("admin-users-list", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      
      if (error) {
        console.error("Error invoking admin-users-list:", error);
        throw error;
      }
      
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

  const handleToggleAdminStatus = async (userId: string, currentStatus: boolean) => {
    try {
      // Get the current session token
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      
      if (!accessToken) {
        throw new Error("Not authenticated");
      }

      console.log(`Toggling admin status for user ${userId}. Current status: ${currentStatus}`);
      setLoading(true);

      // Call the edge function to toggle admin status
      const { data, error } = await supabase.functions.invoke("admin-users-toggle-admin", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: { userId, currentStatus },
      });
      
      if (error) {
        console.error("Error toggling admin status:", error);
        throw error;
      }
      
      const newRole = data?.newRole || (currentStatus ? 'user' : 'admin');
      console.log(`Role successfully updated to: ${newRole}`);
      
      toast({
        title: currentStatus ? "Admin rights removed" : "Admin rights granted",
        description: currentStatus 
          ? "User no longer has administrator permissions" 
          : "User now has administrator permissions",
      });
      
      // Refresh data
      await fetchData();
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: "Error updating user role",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
      const { data, error } = await supabase.functions.invoke("admin-users-update-profile", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: { userId, profileData },
      });
      
      if (error) {
        console.error("Error updating profile:", error);
        throw error;
      }
      
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

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const processedUsers = users.map(user => {
    // Find the matching profile or use a profile with default empty values
    const profile = userProfiles.find(p => p.id === user.id) || {
      id: user.id,
      first_name: '',
      last_name: '',
      company: ''
    };
    
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

  return (
    <>
      {children({
        users,
        userProfiles,
        userRoles,
        processedUsers,
        loading,
        error,
        handleToggleAdminStatus,
        handleUpdateProfile,
        fetchData,
      })}
    </>
  );
};
