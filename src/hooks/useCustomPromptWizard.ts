
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/components/ui/use-toast'
import { useAuth } from '@/components/auth/AuthProvider'

type HubAreaType = 'marketing' | 'sales' | 'production' | 'team' | 'strategy' | 'financials' | 'leadership'

export function useCustomPromptWizard() {
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { toast } = useToast()
  const { user } = useAuth()

  const createCustomPrompt = async (params: {
    title: string
    description: string
    content: string
    category: string
    hubArea?: HubAreaType
  }) => {
    try {
      setIsLoading(true)
      
      if (!user) {
        toast({
          variant: "destructive",
          title: "Authentication required",
          description: "You must be logged in to create a prompt",
        })
        return null
      }
      
      // Insert into prompts table
      const { data: promptData, error: promptError } = await supabase
        .from('prompts')
        .insert({
          title: params.title,
          description: params.description,
          prompt: params.content, // Map content to prompt field
          category: params.category, // Use category instead of category_id
          hub_area: params.hubArea // This is now properly typed
        })
        .select('*')
        .single()

      if (promptError) {
        throw promptError
      }

      toast({
        title: "Prompt created",
        description: "Your prompt has been saved successfully",
      })

      return promptData
    } catch (error) {
      console.error('Error creating prompt:', error)
      toast({
        variant: "destructive",
        title: "Failed to create prompt",
        description: "An error occurred while saving your prompt",
      })
      return null
    } finally {
      setIsLoading(false)
    }
  }

  return {
    isLoading,
    createCustomPrompt
  }
}
