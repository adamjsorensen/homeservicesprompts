
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

console.log("Delete User function initialized");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  console.log(`[${new Date().toISOString()}] Request received: ${req.method} ${req.url}`);
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("Handling OPTIONS preflight request");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    console.log("Created admin Supabase client");

    // Get the authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("Missing authorization header");
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the requesting user has admin rights
    const token = authHeader.replace("Bearer ", "");
    console.log("Token received, verifying user...");
    
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      console.error("Authentication error:", authError);
      return new Response(
        JSON.stringify({ error: "Authentication failed", details: authError?.message }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log(`User authenticated: ${user.id}, email: ${user.email}`);

    // Check if user has admin role
    console.log(`Checking if user ${user.id} has admin role...`);
    const { data: userRoles, error: userRolesError } = await supabaseAdmin
      .from("user_roles")
      .select("*")
      .eq("user_id", user.id)
      .eq("role", "admin");

    if (userRolesError) {
      console.error("Role check error:", userRolesError);
      return new Response(
        JSON.stringify({ error: "Error checking user roles", details: userRolesError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!userRoles || userRoles.length === 0) {
      console.error(`User ${user.id} is not an admin`);
      return new Response(
        JSON.stringify({ error: "Not authorized. Admin access required." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`User ${user.id} confirmed as admin, proceeding to delete user...`);

    // Parse request body
    let requestData;
    try {
      requestData = await req.json();
      console.log("Request data:", requestData);
    } catch (e) {
      console.error("Error parsing request body:", e);
      return new Response(
        JSON.stringify({ error: "Invalid request body", details: e.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { userId } = requestData;

    if (!userId) {
      console.error("Missing userId in request");
      return new Response(
        JSON.stringify({ error: "User ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Don't allow deleting yourself
    if (userId === user.id) {
      console.error("User attempted to delete their own account");
      return new Response(
        JSON.stringify({ error: "You cannot delete your own account" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    try {
      // Get user info before deletion for logging
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
      
      if (userError) {
        console.error("Error getting user data:", userError);
        throw userError;
      }
      
      const userEmail = userData?.user?.email || "unknown";
      console.log(`Deleting user with ID: ${userId}, email: ${userEmail}`);
      
      // Delete the user
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
      
      if (deleteError) {
        console.error("Error deleting user:", deleteError);
        throw deleteError;
      }
      
      console.log(`User ${userId} deleted successfully`);
      
      // Log the deletion for audit purposes
      const { error: logError } = await supabaseAdmin
        .from("access_audit_log")
        .insert({
          action_type: "user_deleted",
          user_id: user.id, // The admin who performed the deletion
          metadata: {
            deleted_user_id: userId,
            deleted_user_email: userEmail,
            deleted_at: new Date().toISOString(),
          }
        });
      
      if (logError) {
        console.error("Error logging user deletion:", logError);
        // Don't throw, just log the error
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "User deleted successfully" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (error) {
      console.error("Error deleting user:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Error in admin-users-delete function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
