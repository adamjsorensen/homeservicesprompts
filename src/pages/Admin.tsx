
import { Layout } from "@/components/layout/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PromptParametersAdmin } from "@/components/admin/PromptParametersAdmin";
import { ParameterTweaksAdmin } from "@/components/admin/ParameterTweaksAdmin";
import { PromptsAdmin } from "@/components/admin/PromptsAdmin";
import { PromptGenerationsAdmin } from "@/components/admin/PromptGenerationsAdmin";
import { useNavigate } from "react-router-dom";
import { usePrompts } from "@/hooks/usePrompts";
import { useEffect } from "react";

const Admin = () => {
  const navigate = useNavigate();
  const { isAdmin, isLoading } = usePrompts();

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      navigate("/");
    }
  }, [isAdmin, isLoading, navigate]);

  if (isLoading) {
    return (
      <Layout>
        <div>Loading...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage prompts, parameters, and tweaks
          </p>
        </div>

        <Tabs defaultValue="prompts">
          <TabsList>
            <TabsTrigger value="prompts">Prompts</TabsTrigger>
            <TabsTrigger value="parameters">Parameters</TabsTrigger>
            <TabsTrigger value="tweaks">Tweaks</TabsTrigger>
            <TabsTrigger value="generations">Generations</TabsTrigger>
          </TabsList>
          <TabsContent value="prompts" className="space-y-4">
            <PromptsAdmin />
          </TabsContent>
          <TabsContent value="parameters" className="space-y-4">
            <PromptParametersAdmin />
          </TabsContent>
          <TabsContent value="tweaks" className="space-y-4">
            <ParameterTweaksAdmin />
          </TabsContent>
          <TabsContent value="generations" className="space-y-4">
            <PromptGenerationsAdmin />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Admin;
