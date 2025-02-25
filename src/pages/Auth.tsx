import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Separator } from "@/components/ui/separator";
import { Chrome } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (isSignUp) {
        const {
          error
        } = await supabase.auth.signUp({
          email,
          password
        });
        if (error) throw error;
        toast({
          title: "Account created!",
          description: "Check your email for the verification link."
        });
      } else {
        const {
          error
        } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
        toast({
          title: "Welcome back!",
          description: "Successfully signed in."
        });
        navigate("/library");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  const handleGoogleSignIn = async () => {
    try {
      const {
        error
      } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          queryParams: {
            access_type: "offline",
            prompt: "consent"
          }
        }
      });
      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  return <Layout>
      <div className="container relative h-[800px] flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
        <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
          <div className="absolute inset-0 bg-zinc-900" />
          
          <div className="relative z-20 mt-auto flex flex-col items-center">
            <img src="/lovable-uploads/8701bbec-385d-4921-afea-acfe67bc6ae0.png" alt="PainterGrowth.com" className="mb-8 w-64" />
            <blockquote className="space-y-2">
              
              
            </blockquote>
          </div>
        </div>
        <div className="lg:p-8">
          <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
            <Card>
              <CardHeader>
                <CardTitle>{isSignUp ? "Create Account" : "Welcome Back"}</CardTitle>
                <CardDescription>
                  {isSignUp ? "Sign up to access our prompt library" : "Sign in to your account"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAuth} className="space-y-4">
                  <div className="space-y-2">
                    <Input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Loading..." : isSignUp ? "Create Account" : "Sign In"}
                  </Button>
                </form>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Or continue with
                    </span>
                  </div>
                </div>

                <Button variant="outline" type="button" className="w-full" onClick={handleGoogleSignIn} disabled={isLoading}>
                  <Chrome className="mr-2 h-4 w-4" />
                  Google
                </Button>

                <Button type="button" variant="link" className="w-full mt-4" onClick={() => setIsSignUp(!isSignUp)}>
                  {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>;
};
export default Auth;