
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.0";
import { corsHeaders } from "../_shared/cors.ts";

interface RequestBody {
  documentId: string;
  userId: string;
  accessLevel?: string;
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  
  try {
    const { documentId, userId, accessLevel = 'read' } = await req.json() as RequestBody;
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Log access attempt for audit trail
    await supabase
      .from('access_audit_log')
      .insert({
        document_id: documentId,
        user_id: userId,
        action_type: 'permission_check',
        metadata: {
          requested_access: accessLevel,
          timestamp: new Date().toISOString()
        }
      });
    
    // Check for explicit permissions
    const { data: explicitPermission, error: permissionError } = await supabase
      .from('document_permissions')
      .select('*')
      .eq('document_id', documentId)
      .eq('user_id', userId)
      .is('expires_at', null) // Not expired
      .single();
    
    if (permissionError && permissionError.code !== 'PGRST116') { // PGRST116 is "not found"
      throw permissionError;
    }
    
    // Check for role-based permissions if no explicit permission
    const { data: rolePermission, error: roleError } = await supabase
      .from('document_permissions')
      .select('*')
      .eq('document_id', documentId)
      .is('user_id', null) // Role-based permission doesn't specify user
      .is('expires_at', null) // Not expired
      .single();
    
    if (roleError && roleError.code !== 'PGRST116') {
      throw roleError;
    }
    
    // Check document ownership
    const { data: document, error: documentError } = await supabase
      .from('documents')
      .select('created_by')
      .eq('id', documentId)
      .single();
    
    if (documentError) {
      throw documentError;
    }
    
    // Determine if access is allowed
    const isOwner = document && document.created_by === userId;
    const hasExplicitPermission = explicitPermission && explicitPermission.permission_level === accessLevel;
    const hasRolePermission = rolePermission && rolePermission.permission_level === accessLevel;
    
    const canAccess = isOwner || hasExplicitPermission || hasRolePermission;
    
    // Log the access decision
    await supabase
      .from('access_audit_log')
      .insert({
        document_id: documentId,
        user_id: userId,
        action_type: canAccess ? 'access_granted' : 'access_denied',
        metadata: {
          requested_access: accessLevel,
          is_owner: isOwner,
          has_explicit_permission: !!hasExplicitPermission,
          has_role_permission: !!hasRolePermission,
          timestamp: new Date().toISOString()
        }
      });
    
    return new Response(
      JSON.stringify({
        allowed: canAccess,
        reasons: {
          isOwner,
          hasExplicitPermission,
          hasRolePermission
        }
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
    console.error('Error checking permissions:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
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
