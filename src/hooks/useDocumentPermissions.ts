
import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DocumentPermission } from '@/types/database';
import { useAuth } from '@/components/auth/AuthProvider';

export function useDocumentPermissions() {
  const { user } = useAuth();

  // Get permissions for a document
  const getDocumentPermissions = async (documentId: string): Promise<DocumentPermission[]> => {
    try {
      const { data, error } = await supabase
        .from('document_permissions')
        .select('*')
        .eq('document_id', documentId);
        
      if (error) throw error;
      return data as DocumentPermission[];
    } catch (err) {
      console.error('Error fetching document permissions:', err);
      return [];
    }
  };

  // Check if user has permission for a document
  const checkUserPermission = async (
    documentId: string,
    level = 'read'
  ): Promise<boolean> => {
    if (!user) return false;
    
    try {
      // First call the edge function that handles permission checks and logs access attempts
      const { data: permResult, error: permError } = await supabase.functions.invoke('get-document-permissions', {
        body: {
          documentId,
          userId: user.id,
          permissionLevel: level
        }
      });
      
      if (permError) throw permError;
      return permResult?.hasPermission || false;
      
    } catch (err) {
      console.error('Error checking document permission:', err);
      return false;
    }
  };

  // Add permission for a user
  const addPermission = async (
    permission: Omit<DocumentPermission, 'id' | 'created_at' | 'updated_at'>
  ): Promise<DocumentPermission | null> => {
    try {
      const { data, error } = await supabase
        .from('document_permissions')
        .insert(permission)
        .select()
        .single();
        
      if (error) throw error;
      return data as DocumentPermission;
    } catch (err) {
      console.error('Error adding document permission:', err);
      return null;
    }
  };

  // Update permission
  const updatePermission = async (
    id: string,
    updates: Partial<DocumentPermission>
  ): Promise<DocumentPermission | null> => {
    try {
      const { data, error } = await supabase
        .from('document_permissions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
        
      if (error) throw error;
      return data as DocumentPermission;
    } catch (err) {
      console.error('Error updating document permission:', err);
      return null;
    }
  };

  // Remove permission
  const removePermission = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase.from('document_permissions').delete().eq('id', id);
      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error removing document permission:', err);
      return false;
    }
  };

  return {
    useDocumentPermissions: (documentId: string) => 
      useQuery({
        queryKey: ['documentPermissions', documentId],
        queryFn: () => getDocumentPermissions(documentId),
        enabled: !!documentId,
      }),
    checkPermission: useMutation({
      mutationFn: ({ documentId, level }: { documentId: string; level?: string }) => 
        checkUserPermission(documentId, level),
    }),
    addPermission: useMutation({
      mutationFn: addPermission,
    }),
    updatePermission: useMutation({
      mutationFn: ({ id, updates }: { id: string; updates: Partial<DocumentPermission> }) => 
        updatePermission(id, updates),
    }),
    removePermission: useMutation({
      mutationFn: removePermission,
    }),
  };
}
