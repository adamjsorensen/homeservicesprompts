
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.0"
import { corsHeaders } from "../_shared/cors.ts"

interface PermissionCheckRequest {
  documentId: string
  userId: string
  permissionLevel: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { documentId, userId, permissionLevel } = await req.json() as PermissionCheckRequest;
    
    if (!documentId) {
      throw new Error("Document ID is required");
    }
    
    if (!userId) {
      throw new Error("User ID is required");
    }
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    console.log(`Checking permission for user ${userId} on document ${documentId}, level: ${permissionLevel}`);
    
    // First, check if user has direct permission
    const { data: userPermission, error: userPermError } = await supabaseClient
      .from('document_permissions')
      .select('*')
      .eq('document_id', documentId)
      .eq('user_id', userId)
      .single();
    
    let hasPermission = false;
    let permissionSource = 'none';
    
    if (userPermission) {
      // User has explicit permission, check the level
      if (permissionLevel === 'read' && ['read', 'write', 'admin'].includes(userPermission.permission_level)) {
        hasPermission = true;
        permissionSource = 'user_direct';
      } else if (permissionLevel === 'write' && ['write', 'admin'].includes(userPermission.permission_level)) {
        hasPermission = true;
        permissionSource = 'user_direct';
      } else if (permissionLevel === 'admin' && userPermission.permission_level === 'admin') {
        hasPermission = true;
        permissionSource = 'user_direct';
      }
    } else {
      // Check if user has role-based permission
      const { data: userRoles, error: rolesError } = await supabaseClient
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);
      
      if (userRoles && userRoles.length > 0) {
        // Get all roles this user has
        const roles = userRoles.map(r => r.role);
        
        // Check if any of these roles have permission
        const { data: rolePermissions, error: rolePermError } = await supabaseClient
          .from('document_permissions')
          .select('*')
          .eq('document_id', documentId)
          .in('role', roles);
        
        if (rolePermissions && rolePermissions.length > 0) {
          // Find the highest permission level from all roles
          const highestPermission = rolePermissions.reduce((highest, current) => {
            if (current.permission_level === 'admin') return 'admin';
            if (current.permission_level === 'write' && highest !== 'admin') return 'write';
            if (current.permission_level === 'read' && highest !== 'admin' && highest !== 'write') return 'read';
            return highest;
          }, 'none');
          
          // Check if the highest permission is sufficient
          if (permissionLevel === 'read' && ['read', 'write', 'admin'].includes(highestPermission)) {
            hasPermission = true;
            permissionSource = 'role_based';
          } else if (permissionLevel === 'write' && ['write', 'admin'].includes(highestPermission)) {
            hasPermission = true;
            permissionSource = 'role_based';
          } else if (permissionLevel === 'admin' && highestPermission === 'admin') {
            hasPermission = true;
            permissionSource = 'role_based';
          }
        }
      }
      
      // If still no permission, check if there's a public permission (no user_id and no role)
      if (!hasPermission) {
        const { data: publicPermission, error: publicPermError } = await supabaseClient
          .from('document_permissions')
          .select('*')
          .eq('document_id', documentId)
          .is('user_id', null)
          .is('role', null)
          .single();
        
        if (publicPermission) {
          if (permissionLevel === 'read' && ['read', 'write', 'admin'].includes(publicPermission.permission_level)) {
            hasPermission = true;
            permissionSource = 'public';
          } else if (permissionLevel === 'write' && ['write', 'admin'].includes(publicPermission.permission_level)) {
            hasPermission = true;
            permissionSource = 'public';
          } else if (permissionLevel === 'admin' && publicPermission.permission_level === 'admin') {
            hasPermission = true;
            permissionSource = 'public';
          }
        }
      }
    }
    
    // Log the access attempt
    await supabaseClient
      .from('access_audit_log')
      .insert({
        document_id: documentId,
        user_id: userId,
        action_type: hasPermission ? 'access_granted' : 'access_denied',
        metadata: {
          permission_level: permissionLevel,
          permission_source: permissionSource,
          checked_at: new Date().toISOString()
        }
      });
    
    // Return the permission status
    return new Response(
      JSON.stringify({
        hasPermission,
        permissionSource,
        permissionLevel,
        timestamp: new Date().toISOString()
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error checking document permission:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        hasPermission: false
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 400,
      }
    );
  }
});
