
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/use-toast";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";

export default function Settings() {
  const { user } = useAuth();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadPreferences() {
      if (!user?.id) return;
      
      try {
        const { data, error } = await supabase
          .from('preferences')
          .select('email_notifications, marketing_emails')
          .eq('id', user.id)
          .maybeSingle();

        if (error) throw error;
        
        if (data) {
          setEmailNotifications(data.email_notifications);
          setMarketingEmails(data.marketing_emails);
        }
      } catch (error) {
        console.error('Error loading preferences:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load preferences.",
        });
      }
    }

    loadPreferences();
  }, [user?.id]);

  const handleSave = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('preferences')
        .update({
          email_notifications: emailNotifications,
          marketing_emails: marketingEmails,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Settings saved",
        description: "Your preferences have been updated successfully.",
      });
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update preferences.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-3xl py-8 space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground mt-2">
          Manage your account settings and preferences.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>
            Configure how you receive notifications.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="email-notifications" className="flex flex-col space-y-1">
              <span>Email notifications</span>
              <span className="text-sm text-muted-foreground">
                Receive updates about your account activity.
              </span>
            </Label>
            <Switch
              id="email-notifications"
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
            />
          </div>
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="marketing-emails" className="flex flex-col space-y-1">
              <span>Marketing emails</span>
              <span className="text-sm text-muted-foreground">
                Receive emails about new features and promotions.
              </span>
            </Label>
            <Switch
              id="marketing-emails"
              checked={marketingEmails}
              onCheckedChange={setMarketingEmails}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={loading}>
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
