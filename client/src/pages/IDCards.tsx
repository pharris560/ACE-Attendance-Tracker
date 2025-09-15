import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import IDCard from "@/components/IDCard";
import { Search, Download, Printer, IdCard as IdCardIcon, QrCode, RefreshCw } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useQuery } from "@tanstack/react-query";
import type { Student } from "@shared/schema";

export default function IDCards() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const cardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Fetch all students from backend (public endpoint for ID cards)
  const { data: students = [], isLoading } = useQuery<Student[]>({
    queryKey: ["/api/students/all"],
  });

  // For now, treat all students as "student" role since we don't have staff endpoint yet
  const users = students.map(student => ({
    ...student,
    role: 'student' as const,
    department: '' // Students don't have departments, only classes via enrollment
  }));

  const filteredUsers = users.filter(user => {
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    const matchesSearch = fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.studentId?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === "all" || user.role === filter;
    return matchesSearch && matchesFilter;
  });

  const handleDownloadCard = async (userId: string) => {
    const cardElement = cardRefs.current[userId];
    if (!cardElement) return;

    try {
      const canvas = await html2canvas(cardElement, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [85.6, 53.98] // Credit card size
      });

      const imgWidth = 85.6;
      const imgHeight = 53.98;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`id-card-${userId}.pdf`);
      
      console.log(`Downloaded ID card for ${userId}`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  const handlePrintCard = (userId: string) => {
    const cardElement = cardRefs.current[userId];
    if (!cardElement) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>ID Card - ${userId}</title>
          <style>
            body { margin: 0; padding: 20px; font-family: Inter, sans-serif; }
            .print-card { page-break-after: always; }
            @media print {
              body { margin: 0; padding: 0; }
              .print-card { page-break-after: always; }
            }
          </style>
        </head>
        <body>
          <div class="print-card">
            ${cardElement.outerHTML}
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  const handleDownloadAll = async () => {
    console.log('Downloading all ID cards as PDF');
    // Todo: Implement bulk PDF generation
  };

  return (
    <div className="space-y-6" data-testid="id-cards-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">ID Cards</h1>
          <p className="text-muted-foreground">
            Generate and manage digital ID cards with QR codes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleDownloadAll}
            data-testid="button-download-all"
          >
            <Download className="h-4 w-4 mr-2" />
            Download All
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                data-testid="input-search-cards"
              />
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-40" data-testid="select-filter-cards">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="student">Students</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <IdCardIcon className="h-8 w-8 mx-auto mb-2 text-primary" />
            <div className="text-2xl font-bold">{users.length}</div>
            <div className="text-xs text-muted-foreground">Total Cards</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <QrCode className="h-8 w-8 mx-auto mb-2 text-blue-600" />
            <div className="text-2xl font-bold">{students.length}</div>
            <div className="text-xs text-muted-foreground">Student Cards</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <IdCardIcon className="h-8 w-8 mx-auto mb-2 text-green-600" />
            <div className="text-2xl font-bold">0</div>
            <div className="text-xs text-muted-foreground">Staff Cards</div>
          </CardContent>
        </Card>
      </div>

      {/* ID Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {isLoading ? (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 text-muted-foreground animate-spin mb-4" />
              <h3 className="text-lg font-semibold mb-2">Loading ID cards...</h3>
            </CardContent>
          </Card>
        ) : filteredUsers.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <IdCardIcon className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No ID cards found</h3>
              <p className="text-muted-foreground text-center">
                {searchTerm ? "No cards match your search criteria." : "No ID cards have been generated yet."}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredUsers.map((user) => (
            <div key={user.id} className="relative group">
              <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm rounded-md p-1 flex gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => handlePrintCard(user.id)}
                  data-testid={`button-print-${user.id}`}
                >
                  <Printer className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => handleDownloadCard(user.id)}
                  data-testid={`button-download-${user.id}`}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
              <div ref={(el) => cardRefs.current[user.id] = el} className="hover-elevate rounded-lg">
                <IDCard
                  id={user.studentId || user.id}
                  name={`${user.firstName || ''} ${user.lastName || ''}`.trim()}
                  role="student"
                  class=""
                  department=""
                  photo=""
                  qrData={`${user.id}-${user.email || ''}-student`}
                />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Results Summary */}
      {filteredUsers.length > 0 && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Showing {filteredUsers.length} of {users.length} ID cards
              </span>
              <div className="flex items-center gap-4">
                <span>{students.length} Students</span>
                <span>0 Staff</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}