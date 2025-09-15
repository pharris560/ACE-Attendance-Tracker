import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'student' | 'staff';
  class?: string;
  department?: string;
  status: 'present' | 'absent' | 'tardy' | 'excused';
  lastSeen: Date;
}

interface ExportUsersButtonProps {
  users: User[];
}

export default function ExportUsersButton({ users }: ExportUsersButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const exportToCSV = async () => {
    setIsExporting(true);
    try {
      // Create CSV content
      const headers = [
        'ID',
        'Name', 
        'Email',
        'Phone',
        'Role',
        'Class',
        'Department',
        'Status',
        'Last Seen'
      ];

      const csvContent = [
        headers.join(','), // Header row
        ...users.map(user => [
          user.id,
          `"${user.name}"`, // Wrap in quotes to handle commas in names
          user.email,
          user.phone,
          user.role,
          user.class || '',
          user.department || '',
          user.status,
          user.lastSeen.toISOString().split('T')[0] // Format as YYYY-MM-DD
        ].join(','))
      ].join('\n');

      // Create and download the file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `users_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }

      toast({
        title: "Export Successful",
        description: `Exported ${users.length} users to CSV file.`,
      });

    } catch (error: any) {
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export users.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={exportToCSV}
      disabled={isExporting || users.length === 0}
      data-testid="button-export-users"
    >
      <Download className="h-4 w-4 mr-2" />
      {isExporting ? "Exporting..." : "Export"}
    </Button>
  );
}