import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertApiKeySchema } from "@shared/schema";
import { Plus, Copy, Key, AlertTriangle, CheckCircle } from "lucide-react";

const formSchema = insertApiKeySchema.extend({
  name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
});

type FormData = z.infer<typeof formSchema>;

interface CreateAPIKeyDialogProps {
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export default function CreateAPIKeyDialog({ 
  trigger, 
  onSuccess 
}: CreateAPIKeyDialogProps) {
  const [open, setOpen] = useState(false);
  const [newApiKey, setNewApiKey] = useState<string | null>(null);
  const [keyCopied, setKeyCopied] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
  });

  const createKeyMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiRequest("POST", "/api/api-keys", { name: data.name });
      return await response.json();
    },
    onSuccess: (data) => {
      // Show the full API key once
      setNewApiKey(data.key);
      
      // Invalidate and refetch API keys list
      queryClient.invalidateQueries({ queryKey: ["/api/api-keys"] });
      
      toast({
        title: "API Key Created",
        description: "Your new API key has been generated successfully.",
      });
      
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create API key. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: FormData) => {
    createKeyMutation.mutate(data);
  };

  const handleCopyKey = async () => {
    if (newApiKey) {
      await navigator.clipboard.writeText(newApiKey);
      setKeyCopied(true);
      toast({
        title: "Copied!",
        description: "API key has been copied to your clipboard.",
      });
    }
  };

  const handleClose = () => {
    setOpen(false);
    // Reset form and state after a delay to allow smooth closing animation
    setTimeout(() => {
      form.reset();
      setNewApiKey(null);
      setKeyCopied(false);
    }, 300);
  };

  const defaultTrigger = (
    <Button data-testid="button-create-api-key">
      <Plus className="h-4 w-4 mr-2" />
      Create API Key
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" data-testid="dialog-create-api-key">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            {newApiKey ? "API Key Generated" : "Create New API Key"}
          </DialogTitle>
          <DialogDescription>
            {newApiKey 
              ? "Save this API key securely. You won't be able to view it again."
              : "Create a new API key for accessing the attendance system."
            }
          </DialogDescription>
        </DialogHeader>

        {newApiKey ? (
          // Show the generated API key
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This is the only time you'll see this API key. Save it securely.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Your API Key</label>
              <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                <code className="flex-1 text-sm font-mono break-all" data-testid="text-generated-api-key">
                  {newApiKey}
                </code>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCopyKey}
                  data-testid="button-copy-new-key"
                >
                  {keyCopied ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                onClick={handleClose}
                variant={keyCopied ? "default" : "outline"}
                data-testid="button-close-dialog"
              >
                {keyCopied ? "Done" : "Close"}
              </Button>
            </div>
          </div>
        ) : (
          // Show the creation form
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>API Key Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g., Mobile App Integration"
                        data-testid="input-api-key-name"
                      />
                    </FormControl>
                    <FormDescription>
                      Give your API key a descriptive name to help you identify its purpose.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createKeyMutation.isPending}
                  data-testid="button-submit-create"
                >
                  {createKeyMutation.isPending ? "Creating..." : "Create API Key"}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}