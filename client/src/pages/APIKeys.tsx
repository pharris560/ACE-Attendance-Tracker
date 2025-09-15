import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import APIKeyCard from "@/components/APIKeyCard";
import CreateAPIKeyDialog from "@/components/CreateAPIKeyDialog";
import { apiRequest } from "@/lib/queryClient";
import { type ApiKeyDisplay } from "@shared/schema";
import { 
  Search, 
  Key, 
  Shield, 
  AlertTriangle, 
  RotateCcw,
  Download,
  Activity,
  LogIn
} from "lucide-react";
import { format } from "date-fns";
import { useLocation } from "wouter";

export default function APIKeys() {
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [keyToDelete, setKeyToDelete] = useState<{ id: string; name: string } | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect to login if not authenticated using useEffect
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation("/login");
    }
  }, [isLoading, isAuthenticated]);

  if (!isLoading && !isAuthenticated) {
    return null;
  }

  // Fetch API keys for authenticated user
  const {
    data: apiKeys = [],
    isLoading: isLoadingKeys,
    error,
    refetch
  } = useQuery<ApiKeyDisplay[]>({
    queryKey: ["/api/api-keys"],
    queryFn: async () => {
      const response = await fetch("/api/api-keys", {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error("Failed to fetch API keys");
      }
      return response.json();
    },
    enabled: isAuthenticated,
  });

  // Delete API key mutation
  const deleteKeyMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/api-keys/${id}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/api-keys"] });
      toast({
        title: "API Key Deleted",
        description: "The API key has been permanently revoked.",
      });
      setDeleteDialogOpen(false);
      setKeyToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete API key. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Toggle API key status mutation
  const toggleKeyMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const response = await apiRequest("PUT", `/api/api-keys/${id}/toggle`, { isActive });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/api-keys"] });
      toast({
        title: "API Key Updated",
        description: "The API key status has been updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update API key. Please try again.",
        variant: "destructive",
      });
    },
  });

  const filteredApiKeys = apiKeys.filter(key => {
    const matchesSearch = key.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleDelete = (id: string, name: string) => {
    setKeyToDelete({ id, name });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (keyToDelete) {
      deleteKeyMutation.mutate(keyToDelete.id);
    }
  };

  const handleToggleActive = (id: string, isActive: boolean) => {
    toggleKeyMutation.mutate({ id, isActive });
  };

  const handleCopy = (id: string, maskedKey: string) => {
    navigator.clipboard.writeText(maskedKey);
    toast({
      title: "Copied",
      description: "API key copied to clipboard",
    });
  };

  const handleExportKeys = () => {
    const csvData = apiKeys.map(key => ({
      name: key.name,
      status: key.isActive ? 'Active' : 'Inactive',
      created: format(new Date(key.createdAt), 'yyyy-MM-dd'),
      lastUsed: key.lastUsedAt ? format(new Date(key.lastUsedAt), 'yyyy-MM-dd') : 'Never'
    }));
    
    // Create CSV content
    const headers = Object.keys(csvData[0] || {}).join(',');
    const rows = csvData.map(row => Object.values(row).join(','));
    const csv = [headers, ...rows].join('\n');
    
    // Download CSV
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'api-keys.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const activeKeys = apiKeys.filter(key => key.isActive).length;
  const recentlyUsedKeys = apiKeys.filter(key => 
    key.lastUsedAt && new Date(key.lastUsedAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  ).length;

  if (isLoadingKeys) {
    return (
      <div className="space-y-6" data-testid="api-keys-page">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">API Keys</h1>
            <p className="text-muted-foreground">Loading your API keys...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="api-keys-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">API Key Management</h1>
          <p className="text-muted-foreground">
            Manage API keys for external integrations and applications
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isLoadingKeys}
            data-testid="button-refresh"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          {apiKeys.length > 0 && (
            <Button
              variant="outline"
              onClick={handleExportKeys}
              data-testid="button-export"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          )}
          <CreateAPIKeyDialog 
            onSuccess={() => {
              // Refresh the list after creating a new key
              refetch();
            }}
          />
        </div>
      </div>

      {/* Error state */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to load API keys. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Keys</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{apiKeys.length}</div>
            <p className="text-xs text-muted-foreground">
              API keys created
            </p>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Keys</CardTitle>
            <Shield className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeKeys}</div>
            <p className="text-xs text-muted-foreground">
              Currently active
            </p>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recently Used</CardTitle>
            <Activity className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{recentlyUsedKeys}</div>
            <p className="text-xs text-muted-foreground">
              Used this week
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      {apiKeys.length > 0 && (
        <Card>
          <CardHeader>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search API keys by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                data-testid="input-search-keys"
              />
            </div>
          </CardHeader>
        </Card>
      )}

      {/* API Keys Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredApiKeys.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Key className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {apiKeys.length === 0 ? "No API keys yet" : "No keys found"}
              </h3>
              <p className="text-muted-foreground text-center mb-4">
                {apiKeys.length === 0 
                  ? "Create your first API key to start integrating with external applications."
                  : "No API keys match your search criteria."
                }
              </p>
              {apiKeys.length === 0 && (
                <CreateAPIKeyDialog 
                  trigger={
                    <Button>
                      <Key className="h-4 w-4 mr-2" />
                      Create Your First API Key
                    </Button>
                  }
                />
              )}
            </CardContent>
          </Card>
        ) : (
          filteredApiKeys.map((apiKey) => (
            <APIKeyCard
              key={apiKey.id}
              id={apiKey.id}
              name={apiKey.name}
              maskedKey={apiKey.maskedKey}
              isActive={apiKey.isActive}
              createdAt={new Date(apiKey.createdAt)}
              lastUsedAt={apiKey.lastUsedAt ? new Date(apiKey.lastUsedAt) : null}
              onCopy={handleCopy}
              onToggleActive={handleToggleActive}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent data-testid="dialog-delete-confirmation">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the API key "{keyToDelete?.name}". 
              This action cannot be undone and any applications using this key will lose access.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteKeyMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {deleteKeyMutation.isPending ? "Deleting..." : "Delete API Key"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}