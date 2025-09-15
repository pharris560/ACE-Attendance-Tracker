import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileText, AlertTriangle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { parseCSV, generateCSV, downloadCSV, validateHeaders } from "@/lib/csv-utils";

interface ImportUsersDialogProps {
  onUsersImported?: () => void;
}

interface UserImportData {
  name: string;
  email: string;
  phone?: string;
  role: 'student' | 'staff';
  class?: string;
  department?: string;
}

export default function ImportUsersDialog({ onUsersImported }: ImportUsersDialogProps) {
  const [open, setOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState<{
    success: number;
    errors: string[];
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (file: File) => {
    if (file.type !== "text/csv") {
      toast({
        title: "Invalid File Type",
        description: "Please select a CSV file.",
        variant: "destructive",
      });
      return;
    }

    processCSVFile(file);
  };

  const processCSVFile = async (file: File) => {
    setIsUploading(true);
    setUploadResults(null);

    try {
      const text = await file.text();
      const { headers, data, errors: parseErrors } = parseCSV(text);
      
      if (data.length === 0) {
        throw new Error("CSV file must contain a header row and at least one data row");
      }

      // Check required headers
      const requiredHeaders = ['name', 'email', 'phone', 'role'];
      const missingHeaders = validateHeaders(headers, requiredHeaders);
      
      if (missingHeaders.length > 0) {
        throw new Error(`Missing required columns: ${missingHeaders.join(', ')}`);
      }

      const users: UserImportData[] = [];
      const errors: string[] = [...parseErrors];

      data.forEach((row, index) => {
        // Basic validation
        if (!row.name || !row.email || !row.role) {
          errors.push(`Row ${index + 2}: Missing required fields`);
          return;
        }

        if (!['student', 'staff'].includes(row.role)) {
          errors.push(`Row ${index + 2}: Invalid role (must be 'student' or 'staff')`);
          return;
        }

        // Convert the row to UserImportData with proper types
        const user: UserImportData = {
          name: row.name,
          email: row.email,
          phone: row.phone || undefined,
          role: row.role as 'student' | 'staff',
          class: row.class || undefined,
          department: row.department || undefined,
        };

        users.push(user);
      })

      // TODO: Replace with actual API call to import users
      console.log("Importing users:", users);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      setUploadResults({
        success: users.length,
        errors,
      });

      if (users.length > 0) {
        toast({
          title: "Import Completed",
          description: `Successfully imported ${users.length} user(s).${errors.length > 0 ? ` ${errors.length} error(s) occurred.` : ''}`,
        });
        onUsersImported?.();
      }

    } catch (error: any) {
      toast({
        title: "Import Failed",
        description: error.message || "Failed to import users.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const downloadTemplate = () => {
    const headers = ['name', 'email', 'phone', 'role', 'class', 'department'];
    const sampleData = [
      {
        name: 'John Doe',
        email: 'john.doe@school.edu',
        phone: '+1 (555) 123-4567',
        role: 'student',
        class: 'Mathematics 101',
        department: ''
      },
      {
        name: 'Jane Smith',
        email: 'jane.smith@school.edu',
        phone: '+1 (555) 234-5678',
        role: 'staff',
        class: '',
        department: 'Science'
      }
    ];
    
    const csvContent = generateCSV(headers, sampleData);
    downloadCSV('users_template.csv', csvContent);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" data-testid="button-import-users">
          <Upload className="h-4 w-4 mr-2" />
          Import
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]" data-testid="dialog-import-users">
        <DialogHeader>
          <DialogTitle>Import Users</DialogTitle>
          <DialogDescription>
            Import users from a CSV file. Download the template below for the correct format.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Template Download */}
          <Alert>
            <FileText className="h-4 w-4" />
            <AlertDescription>
              <div className="flex items-center justify-between">
                <span>Need the correct format?</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadTemplate}
                  data-testid="button-download-template"
                >
                  Download Template
                </Button>
              </div>
            </AlertDescription>
          </Alert>

          {/* Upload Results */}
          {uploadResults && (
            <Alert className={uploadResults.errors.length > 0 ? "border-yellow-500" : "border-green-500"}>
              {uploadResults.errors.length > 0 ? (
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
              ) : (
                <CheckCircle className="h-4 w-4 text-green-500" />
              )}
              <AlertDescription>
                <div className="space-y-1">
                  <p>Successfully imported: {uploadResults.success} users</p>
                  {uploadResults.errors.length > 0 && (
                    <div>
                      <p className="text-yellow-600 font-medium">Errors:</p>
                      <ul className="text-sm text-muted-foreground list-disc list-inside">
                        {uploadResults.errors.slice(0, 3).map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                        {uploadResults.errors.length > 3 && (
                          <li>... and {uploadResults.errors.length - 3} more</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* File Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragOver 
                ? "border-primary bg-primary/5" 
                : "border-muted-foreground/25 hover:border-muted-foreground/50"
            }`}
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            data-testid="drop-zone-import"
          >
            <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
            <div className="space-y-2">
              <p className="text-sm font-medium">
                {isUploading ? "Processing file..." : "Drag and drop your CSV file here"}
              </p>
              <p className="text-xs text-muted-foreground">or</p>
              <Button
                variant="outline"
                size="sm"
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()}
                data-testid="button-browse-file"
              >
                Browse Files
              </Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileInputChange}
              className="hidden"
              data-testid="input-file-upload"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              data-testid="button-close-import"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}