
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { PromptParameter } from "@/hooks/usePromptParameters";
import { useParameterForm } from "@/hooks/useParameterForm";
import { ParameterFormFields } from "./ParameterFormFields";

interface ParameterDialogProps {
  parameter: PromptParameter | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ParameterDialog({
  parameter,
  open,
  onOpenChange,
}: ParameterDialogProps) {
  const { form, onSubmit } = useParameterForm(parameter, open, onOpenChange);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {parameter ? "Edit Parameter" : "Create Parameter"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <ParameterFormFields form={form} />

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                {parameter ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
