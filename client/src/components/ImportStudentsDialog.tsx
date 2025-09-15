import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Download, FileSpreadsheet, Upload, Users, X, CheckCircle, AlertCircle, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { parseCSV, generateCSV, downloadCSV, validateHeaders } from "@/lib/csv-utils";

interface ParsedStudent {
  name: string;
  email: string;
  phone?: string;
  studentId?: string;
  department?: string;
}

interface ImportStudentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: string;
  className: string;
}

export default function ImportStudentsDialog({ 
  open, 
  onOpenChange,
  classId,
  className
}: ImportStudentsDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedStudent[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState<{ success: number; failed: number } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Reset state when dialog is closed
  useEffect(() => {
    if (!open) {
      setFile(null);
      setParsedData([]);
      setValidationErrors([]);
      setImportProgress(0);
      setImportResults(null);
      setIsProcessing(false);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [open]);

  // Download CSV template
  const handleDownloadTemplate = () => {
    const headers = ['name', 'email', 'phone', 'studentId', 'department'];
    const sampleData = [
      {
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '555-0101',
        studentId: 'STU001',
        department: 'Computer Science'
      },
      {
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        phone: '555-0102',
        studentId: 'STU002',
        department: 'Mathematics'
      },
      {
        name: 'Robert "Bob" Johnson',
        email: 'rob.j@example.com',
        phone: '555-0103',
        studentId: 'STU003',
        department: 'Physics, Advanced Studies'
      }
    ];
    
    const csvContent = generateCSV(headers, sampleData);
    downloadCSV(`student_import_template_${classId}.csv`, csvContent);
  };

  // Process CSV content
  const processCSVContent = (content: string): ParsedStudent[] => {
    const { headers, data, errors: parseErrors } = parseCSV(content);
    const processedData: ParsedStudent[] = [];
    const allErrors: string[] = [...parseErrors];

    // Check required headers
    const requiredHeaders = ['name', 'email'];
    const missingHeaders = validateHeaders(headers, requiredHeaders);
    
    if (missingHeaders.length > 0) {
      allErrors.push(`Missing required headers: ${missingHeaders.join(', ')}`);
      setValidationErrors(allErrors);
      return [];
    }

    // Process each row
    data.forEach((row, index) => {
      // Validate required fields
      if (!row.name || !row.email) {
        allErrors.push(`Row ${index + 2}: Missing required fields (name or email)`);
        return;
      }

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(row.email)) {
        allErrors.push(`Row ${index + 2}: Invalid email format for ${row.email}`);
        return;
      }

      processedData.push({
        name: row.name,
        email: row.email,
        phone: row.phone || undefined,
        studentId: row.studentId || undefined,
        department: row.department || undefined
      });
    });

    setValidationErrors(allErrors);
    return processedData;
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    
    if (!selectedFile) {
      setFile(null);
      setParsedData([]);
      setValidationErrors([]);
      return;
    }

    if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
      setValidationErrors(['Please select a valid CSV file']);
      return;
    }

    setFile(selectedFile);
    setValidationErrors([]);
    
    // Parse the file
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const parsed = processCSVContent(content);
      setParsedData(parsed);
    };
    reader.readAsText(selectedFile);
  };

  // Import students to the class
  const handleImport = async () => {
    if (parsedData.length === 0) {
      toast({
        title: "No data to import",
        description: "Please select a valid CSV file with student data",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setImportProgress(0);
    setImportResults(null);

    let successCount = 0;
    let failedCount = 0;

    try {
      // Process each student
      for (let i = 0; i < parsedData.length; i++) {
        const student = parsedData[i];
        
        try {
          // Parse name into firstName and lastName
          const nameParts = student.name.trim().split(' ');
          const firstName = nameParts[0] || '';
          const lastName = nameParts.slice(1).join(' ') || '';
          
          // Create student and enroll in class using public import endpoint
          const response = await apiRequest('POST', '/api/students/import', {
            firstName,
            lastName,
            email: student.email || '',
            phone: student.phone || '',
            studentId: student.studentId || `STU${Date.now()}${i}`,
            classId
          });
          
          successCount++;
        } catch (error: any) {
          console.error(`Failed to import student ${student.name}:`, error);
          
          // Check for authentication error
          if (error?.response?.status === 401 || error?.message?.includes('Authentication')) {
            toast({
              title: "Authentication required",
              description: "Please log in to import students",
              variant: "destructive",
            });
            setIsProcessing(false);
            return;
          }
          
          failedCount++;
        }
        
        // Update progress
        setImportProgress(Math.round(((i + 1) / parsedData.length) * 100));
      }

      setImportResults({ success: successCount, failed: failedCount });
      
      // Refresh data
      await queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/classes'] });
      
      toast({
        title: "Import completed",
        description: `Successfully imported ${successCount} students${failedCount > 0 ? `, ${failedCount} failed` : ''}`,
      });

      // Close dialog after successful import
      if (failedCount === 0) {
        setTimeout(() => {
          onOpenChange(false);
        }, 2000);
      }
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Import failed",
        description: "An error occurred while importing students",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Import Students to {className}
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            {/* CSV Template */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">CSV Template</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Download the template to see the required format for importing students.
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleDownloadTemplate}
                    data-testid="button-download-student-template"
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
                      data-testid="input-student-csv-file"
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
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-semibold mb-1">Validation Errors:</div>
                  <ul className="list-disc list-inside text-sm">
                    {validationErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Parsed Data Preview */}
            {parsedData.length > 0 && validationErrors.length === 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span>Preview ({parsedData.length} students)</span>
                    <Badge variant="outline">
                      <Users className="h-3 w-3 mr-1" />
                      Ready to import
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-2">
                      {parsedData.slice(0, 10).map((student, index) => (
                        <div key={index} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                          <div>
                            <div className="font-medium text-sm">{student.name}</div>
                            <div className="text-xs text-muted-foreground">{student.email}</div>
                          </div>
                          {student.studentId && (
                            <Badge variant="outline" className="text-xs">
                              {student.studentId}
                            </Badge>
                          )}
                        </div>
                      ))}
                      {parsedData.length > 10 && (
                        <div className="text-center text-sm text-muted-foreground py-2">
                          and {parsedData.length - 10} more...
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}

            {/* Import Progress */}
            {isProcessing && (
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Importing students...</span>
                      <span>{importProgress}%</span>
                    </div>
                    <Progress value={importProgress} />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Import Results */}
            {importResults && (
              <Alert variant={importResults.failed > 0 ? "destructive" : "default"}>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-semibold">Import Complete</div>
                  <div className="text-sm mt-1">
                    Successfully imported: {importResults.success} students
                    {importResults.failed > 0 && (
                      <div className="text-red-600">Failed: {importResults.failed} students</div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
            data-testid="button-cancel"
          >
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={parsedData.length === 0 || validationErrors.length > 0 || isProcessing}
            data-testid="button-import-students"
          >
            {isProcessing ? (
              <>
                <Upload className="h-4 w-4 mr-2 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Import Students
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}