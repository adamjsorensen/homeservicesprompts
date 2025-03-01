
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Create Supabase client with service role key
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    // Get the authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    // Verify the requesting user has admin rights
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      console.error("Authentication error:", authError);
      return new Response(
        JSON.stringify({ error: "Authentication failed" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user has admin role
    const { data: userRoles, error: userRolesError } = await supabaseAdmin
      .from("user_roles")
      .select("*")
      .eq("user_id", user.id)
      .eq("role", "admin");

    if (userRolesError) {
      console.error("Role check error:", userRolesError);
      return new Response(
        JSON.stringify({ error: "Error checking user roles" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!userRoles || userRoles.length === 0) {
      return new Response(
        JSON.stringify({ error: "Not authorized. Admin access required." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle different endpoints based on URL path
    const url = new URL(req.url);
    const endpoint = url.pathname.split("/").pop();

    switch (endpoint) {
      case "list":
        return handleListUsers(req, supabaseAdmin);
      case "toggle-admin":
        return handleToggleAdmin(req, supabaseAdmin);
      case "update-profile":
        return handleUpdateProfile(req, supabaseAdmin);
      default:
        return new Response(
          JSON.stringify({ error: "Unknown endpoint" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error) {
    console.error("Error in admin-users function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function handleListUsers(req: Request, supabaseAdmin: any) {
  // Get users from auth system
  const { data: userData, error: authError } = await supabaseAdmin.auth.admin.listUsers();
  if (authError) {
    console.error("Error fetching auth users:", authError);
    return errorResponse("Error fetching users", 500);
  }

  // Get user profiles
  const { data: profiles, error: profilesError } = await supabaseAdmin
    .from("user_profiles")
    .select("*");
  
  if (profilesError) {
    console.error("Error fetching profiles:", profilesError);
    return errorResponse("Error fetching user profiles", 500);
  }

  // Get user roles
  const { data: roles, error: rolesError } = await supabaseAdmin
    .from("user_roles")
    .select("*");
  
  if (rolesError) {
    console.error("Error fetching roles:", rolesError);
    return errorResponse("Error fetching user roles", 500);
  }

  const users = userData?.users || [];
  const response = {
    users,
    profiles: profiles || [],
    roles: roles || []
  };

  return new Response(
    JSON.stringify(response),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function handleToggleAdmin(req: Request, supabaseAdmin: any) {
  const { userId, currentStatus } = await req.json();

  if (!userId) {
    return errorResponse("User ID is required", 400);
  }

  try {
    if (currentStatus) {
      // Remove admin role
      const { error } = await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", "admin");
      
      if (error) throw error;
      
      return successResponse({ message: "Admin rights removed" });
    } else {
      // Add admin role
      const { error } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: userId, role: "admin" });
      
      if (error) throw error;
      
      return successResponse({ message: "Admin rights granted" });
    }
  } catch (error) {
    console.error("Error toggling admin status:", error);
    return errorResponse(`Error updating user role: ${error.message}`, 500);
  }
}

async function handleUpdateProfile(req: Request, supabaseAdmin: any) {
  const { userId, profileData } = await req.json();

  if (!userId || !profileData) {
    return errorResponse("User ID and profile data are required", 400);
  }

  try {
    const { error } = await supabaseAdmin
      .from("user_profiles")
      .update({
        first_name: profileData.firstName,
        last_name: profileData.lastName,
        company: profileData.company,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);
    
    if (error) throw error;
    
    return successResponse({ message: "Profile updated successfully" });
  } catch (error) {
    console.error("Error updating profile:", error);
    return errorResponse(`Error updating user profile: ${error.message}`, 500);
  }
}

function successResponse(data: any) {
  return new Response(
    JSON.stringify(data),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

function errorResponse(message: string, status: number) {
  return new Response(
    JSON.stringify({ error: message }),
    { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
