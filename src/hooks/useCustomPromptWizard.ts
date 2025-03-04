
import { useState } from 'react';
import { Prompt } from '@/hooks/usePrompts';
import { DocumentContext } from '@/hooks/useDocumentContext';

export type WizardStep = 'prompt' | 'parameters' | 'context' | 'preview';

export interface UseCustomPromptWizardProps {
  initialStep?: WizardStep;
  basePrompt?: Prompt | null;
  onClose?: () => void;
}

export function useCustomPromptWizard(props?: UseCustomPromptWizardProps) {
  const { initialStep = 'prompt', basePrompt = null, onClose } = props || {};
  
  const [step, setStep] = useState<WizardStep>(initialStep);
  const [customPrompt, setCustomPrompt] = useState<string>(basePrompt?.prompt || '');
  const [parametersData, setParametersData] = useState<Record<string, any>>({});
  const [selectedContext, setSelectedContext] = useState<DocumentContext[]>([]);

  const handleNext = () => {
    switch (step) {
      case 'prompt':
        setStep('parameters');
        break;
      case 'parameters':
        setStep('context');
        break;
      case 'context':
        setStep('preview');
        break;
      case 'preview':
        handleClose();
        break;
    }
  };

  const handleBack = () => {
    switch (step) {
      case 'parameters':
        setStep('prompt');
        break;
      case 'context':
        setStep('parameters');
        break;
      case 'preview':
        setStep('context');
        break;
    }
  };

  const handleSkip = () => {
    if (step === 'context') {
      setStep('preview');
    }
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  const updateCustomPrompt = (prompt: string) => {
    setCustomPrompt(prompt);
  };

  const updateParametersData = (data: Record<string, any>) => {
    setParametersData(data);
  };

  const updateSelectedContext = (context: DocumentContext[]) => {
    setSelectedContext(context);
  };

  return {
    step,
    customPrompt,
    parametersData,
    selectedContext,
    setStep,
    handleNext,
    handleBack,
    handleSkip,
    handleClose,
    updateCustomPrompt,
    updateParametersData,
    updateSelectedContext
  };
}
