
import { useAuth } from "@/components/auth/AuthProvider";
import { UserDataFetcher } from "@/components/admin/users/UserDataFetcher";
import { UserManagementHeader } from "@/components/admin/users/UserManagementHeader";
import { ErrorDisplay } from "@/components/admin/users/ErrorDisplay";
import { UserManagementTabs } from "@/components/admin/users/UserManagementTabs";

const AdminUsers = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <UserDataFetcher user={user}>
        {({ processedUsers, loading, error, handleToggleAdminStatus, handleUpdateProfile, fetchData }) => (
          <>
            <UserManagementHeader loading={loading} onRefresh={fetchData} />
            <ErrorDisplay error={error} />
            <UserManagementTabs 
              processedUsers={processedUsers}
              loading={loading}
              onToggleAdmin={handleToggleAdminStatus}
              onUpdateProfile={handleUpdateProfile}
            />
          </>
        )}
      </UserDataFetcher>
    </div>
  );
};

export default AdminUsers;
