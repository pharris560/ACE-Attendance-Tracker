import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Copy, Trash2, Key, Clock, ToggleLeft, ToggleRight } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

interface APIKeyCardProps {
  id: string;
  name: string;
  maskedKey: string;
  isActive: boolean;
  createdAt: Date;
  lastUsedAt?: Date | null;
  onCopy?: (id: string, maskedKey: string) => void;
  onToggleActive?: (id: string, isActive: boolean) => void;
  onDelete?: (id: string, name: string) => void;
}

export default function APIKeyCard({
  id,
  name,
  maskedKey,
  isActive,
  createdAt,
  lastUsedAt,
  onCopy,
  onToggleActive,
  onDelete
}: APIKeyCardProps) {
  const { toast } = useToast();

  const handleCopyKey = () => {
    // In a real implementation, this would copy the full key
    // For security, we're only showing the masked key in the UI
    navigator.clipboard.writeText(maskedKey);
    toast({
      title: "Copied to clipboard",
      description: "API key has been copied to your clipboard.",
    });
    onCopy?.(id, maskedKey);
  };

  const getStatusColor = (active: boolean) => {
    return active
      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
  };

  const formatDate = (date: Date) => {
    return format(date, "MMM dd, yyyy");
  };

  const getRelativeTime = (date: Date) => {
    return formatDistanceToNow(date, { addSuffix: true });
  };

  return (
    <Card className="hover-elevate transition-all duration-200" data-testid={`card-api-key-${id}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Key className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm truncate" data-testid={`text-name-${id}`}>
                {name}
              </h3>
              <p className="text-xs text-muted-foreground">
                Created {formatDate(createdAt)}
              </p>
            </div>
          </div>
          <Badge 
            className={`text-xs ${getStatusColor(isActive)}`} 
            data-testid={`status-${isActive ? 'active' : 'inactive'}-${id}`}
          >
            {isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <div className="bg-muted rounded-md p-2 font-mono text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground truncate" data-testid={`text-key-${id}`}>
                {maskedKey}
              </span>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={handleCopyKey}
                data-testid={`button-copy-${id}`}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
          
          <div className="text-xs text-muted-foreground space-y-1">
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3" />
              <span>Created {getRelativeTime(createdAt)}</span>
            </div>
            {lastUsedAt ? (
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3" />
                <span>Last used {getRelativeTime(lastUsedAt)}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3" />
                <span>Never used</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-xs"
            onClick={() => onToggleActive?.(id, !isActive)}
            data-testid={`button-toggle-${id}`}
          >
            {isActive ? (
              <>
                <ToggleRight className="h-3 w-3 mr-1" />
                Deactivate
              </>
            ) : (
              <>
                <ToggleLeft className="h-3 w-3 mr-1" />
                Activate
              </>
            )}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-destructive hover:text-destructive"
            onClick={() => onDelete?.(id, name)}
            data-testid={`button-delete-${id}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}