import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { type DocumentChunk } from '@/hooks/useDocumentContext';

interface CustomPromptWizardProps {
  basePrompt?: {
    id?: string;
    title: string;
    description: string;
    content: string;
    category_id?: string;
    hub_area?: string;
  };
  isOpen: boolean;
  onClose: () => void;
}

export const useCustomPromptWizard = ({ basePrompt, isOpen, onClose }: CustomPromptWizardProps) => {
  const { toast } = useToast();
  const [title, setTitle] = useState(basePrompt?.title || '');
  const [description, setDescription] = useState(basePrompt?.description || '');
  const [content, setContent] = useState(basePrompt?.content || '');
  const [category, setCategory] = useState(basePrompt?.category_id || '');
  const [hubArea, setHubArea] = useState(basePrompt?.hub_area || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSavePrompt = async () => {
    setIsSubmitting(true);
    try {
      if (!title || !description || !content) {
        toast({
          variant: 'destructive',
          description: 'Please fill in all fields.'
        });
        return;
      }

      const promptData = {
        title,
        description,
        content,
        category_id: category,
        hub_area: hubArea
      };

      let res;

      if (basePrompt?.id) {
        res = await supabase
          .from('prompts')
          .update(promptData)
          .eq('id', basePrompt.id);
      } else {
        res = await supabase
          .from('prompts')
          .insert(promptData);
      }

      if (res.error) throw res.error;

      toast({
        description: basePrompt?.id ? 'Prompt updated successfully!' : 'Prompt saved successfully!'
      });
      onClose();
    } catch (error: any) {
      console.error('Error saving prompt:', error);
      toast({
        variant: 'destructive',
        description: error.message || 'Failed to save prompt. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setTitle(basePrompt?.title || '');
    setDescription(basePrompt?.description || '');
    setContent(basePrompt?.content || '');
    setCategory(basePrompt?.category_id || '');
    setHubArea(basePrompt?.hub_area || '');
    onClose();
  };

  return {
    title,
    setTitle,
    description,
    setDescription,
    content,
    setContent,
    category,
    setCategory,
    hubArea,
    setHubArea,
    isSubmitting,
    handleSavePrompt,
    handleClose
  };
};
