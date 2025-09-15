import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Upload, FileSpreadsheet, Check, X, AlertTriangle, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ParsedClass {
  name: string;
  instructor: string;
  capacity: number;
  schedule: { days: string; time: string };
  status: string;
  description?: string;
  location?: string;
}

interface ImportClassesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ImportClassesDialog({ open, onOpenChange }: ImportClassesDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedClass[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState<{ success: number; failed: number } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Download CSV template
  const handleDownloadTemplate = () => {
    const csvContent = [
      "name,instructor,capacity,days,time,status,description,location",
      "Mathematics 101,Dr. Smith,30,monday,9:00 AM,active,Introduction to Algebra,Room 201",
      "Physics Advanced,Prof. Johnson,25,tuesday,2:00 PM,active,Advanced Physics Concepts,Lab 101",
      "English Literature,Ms. Davis,35,wednesday,11:00 AM,active,Classic Literature Analysis,Room 301"
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'class_import_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Parse CSV file
  const parseCSV = (content: string): ParsedClass[] => {
    const lines = content.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const data: ParsedClass[] = [];
    const errors: string[] = [];

    // Check required headers
    const requiredHeaders = ['name', 'instructor', 'capacity', 'days', 'time', 'status'];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    
    if (missingHeaders.length > 0) {
      errors.push(`Missing required headers: ${missingHeaders.join(', ')}`);
      setValidationErrors(errors);
      return [];
    }

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length !== headers.length) {
        errors.push(`Row ${i + 1}: Column count mismatch`);
        continue;
      }

      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index];
      });

      // Validate and parse data
      try {
        const capacity = parseInt(row.capacity);
        if (isNaN(capacity) || capacity <= 0) {
          errors.push(`Row ${i + 1}: Invalid capacity "${row.capacity}"`);
          continue;
        }

        if (!row.name || !row.instructor || !row.days || !row.time) {
          errors.push(`Row ${i + 1}: Missing required fields`);
          continue;
        }

        const validStatuses = ['active', 'inactive', 'completed'];
        if (!validStatuses.includes(row.status)) {
          errors.push(`Row ${i + 1}: Invalid status "${row.status}". Must be one of: ${validStatuses.join(', ')}`);
          continue;
        }

        const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        if (!validDays.includes(row.days.toLowerCase())) {
          errors.push(`Row ${i + 1}: Invalid day "${row.days}". Must be one of: ${validDays.join(', ')}`);
          continue;
        }

        data.push({
          name: row.name,
          instructor: row.instructor,
          capacity,
          schedule: {
            days: row.days.toLowerCase(),
            time: row.time
          },
          status: row.status.toLowerCase(),
          description: row.description || undefined,
          location: row.location || undefined
        });
      } catch (error) {
        errors.push(`Row ${i + 1}: Parsing error - ${error}`);
      }
    }

    setValidationErrors(errors);
    return data;
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
      setValidationErrors(['Please select a CSV file']);
      return;
    }

    setFile(selectedFile);
    setValidationErrors([]);
    setParsedData([]);
    setImportResults(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        const parsed = parseCSV(content);
        setParsedData(parsed);
      }
    };
    reader.readAsText(selectedFile);
  };

  // Import classes mutation
  const importMutation = useMutation({
    mutationFn: async (classes: ParsedClass[]) => {
      const results = { success: 0, failed: 0 };
      
      for (let i = 0; i < classes.length; i++) {
        try {
          const classData = {
            ...classes[i],
            schedule: JSON.stringify(classes[i].schedule)
          };

          const response = await fetch("/api/classes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(classData),
          });

          if (response.ok) {
            results.success++;
          } else {
            results.failed++;
          }
        } catch (error) {
          results.failed++;
        }

        setImportProgress(Math.round(((i + 1) / classes.length) * 100));
      }

      return results;
    },
    onSuccess: (results) => {
      setImportResults(results);
      setIsProcessing(false);
      queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
      
      toast({
        title: "Import Complete",
        description: `Successfully imported ${results.success} classes. ${results.failed} failed.`,
      });
    },
    onError: (error) => {
      setIsProcessing(false);
      toast({
        title: "Import Failed", 
        description: "An error occurred during import. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleImport = async () => {
    if (parsedData.length === 0) return;
    
    setIsProcessing(true);
    setImportProgress(0);
    setImportResults(null);
    
    importMutation.mutate(parsedData);
  };

  const handleClose = () => {
    setFile(null);
    setParsedData([]);
    setValidationErrors([]);
    setImportProgress(0);
    setImportResults(null);
    setIsProcessing(false);
    onOpenChange(false);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col" data-testid="dialog-import-classes">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Import Classes from CSV
          </DialogTitle>
          <DialogDescription>
            Upload a CSV file to bulk create multiple classes at once.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6">
          {/* Download Template */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">CSV Template</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Download the CSV template to see the required format and example data.
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleDownloadTemplate}
                  data-testid="button-download-template"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Template
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* File Upload */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Upload CSV File</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="csv-file">Select CSV File</Label>
                  <Input
                    id="csv-file"
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    ref={fileInputRef}
                    disabled={isProcessing}
                    data-testid="input-csv-file"
                  />
                </div>

                {file && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileSpreadsheet className="h-4 w-4" />
                    <span>Selected: {file.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {(file.size / 1024).toFixed(1)} KB
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">Validation Errors:</p>
                  <ul className="text-sm list-disc list-inside space-y-1">
                    {validationErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Data Preview */}
          {parsedData.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Preview - {parsedData.length} Classes</CardTitle>
                  <Badge variant="outline" className="text-xs">
                    Ready to Import
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="max-h-60 overflow-y-auto border rounded-lg">
                    <div className="grid gap-2 p-4">
                      {parsedData.map((classItem, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 border rounded-md bg-muted/50"
                        >
                          <div>
                            <div className="font-medium">{classItem.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {classItem.instructor} • {classItem.capacity} capacity • {classItem.schedule.days} {classItem.schedule.time}
                            </div>
                          </div>
                          <Badge
                            variant={classItem.status === 'active' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {classItem.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Import Progress */}
          {isProcessing && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Importing Classes...</span>
                    <span className="text-sm text-muted-foreground">{importProgress}%</span>
                  </div>
                  <Progress value={importProgress} className="w-full" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Import Results */}
          {importResults && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-center space-x-8">
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                      <Check className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-green-600">{importResults.success}</div>
                      <div className="text-xs text-muted-foreground">Successful</div>
                    </div>
                  </div>
                  
                  {importResults.failed > 0 && (
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center justify-center w-8 h-8 bg-red-100 rounded-full">
                        <X className="h-4 w-4 text-red-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-red-600">{importResults.failed}</div>
                        <div className="text-xs text-muted-foreground">Failed</div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <Separator />
        
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isProcessing}
            data-testid="button-cancel-import"
          >
            {importResults ? 'Close' : 'Cancel'}
          </Button>
          
          <Button
            onClick={handleImport}
            disabled={parsedData.length === 0 || validationErrors.length > 0 || isProcessing}
            data-testid="button-confirm-import"
          >
            <Upload className="h-4 w-4 mr-2" />
            {isProcessing ? 'Importing...' : `Import ${parsedData.length} Classes`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}