import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AttendanceTable from "@/components/AttendanceTable";
import AttendanceStats from "@/components/AttendanceStats";
import QRScanner from "@/components/QRScanner";
import { Calendar, Download, Upload, QrCode, BarChart3 } from "lucide-react";

export default function Attendance() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showScanner, setShowScanner] = useState(false);

  // Todo: Remove mock data - replace with real data from backend
  const mockAttendanceRecords = [
    {
      id: "STU001",
      name: "John Doe",
      email: "john.doe@school.edu",
      role: "student" as const,
      class: "Class A",
      status: "present" as const,
      checkInTime: new Date(),
      photo: ""
    },
    {
      id: "STU002",
      name: "Jane Smith",
      email: "jane.smith@school.edu",
      role: "student" as const,
      class: "Class B",
      status: "absent" as const,
      photo: ""
    },
    {
      id: "STF001",
      name: "Dr. Wilson",
      email: "wilson@school.edu",
      role: "staff" as const,
      department: "Mathematics",
      status: "present" as const,
      checkInTime: new Date(Date.now() - 3600000),
      photo: ""
    },
    {
      id: "STU003",
      name: "Mike Johnson",
      email: "mike.johnson@school.edu",
      role: "student" as const,
      class: "Class A",
      status: "tardy" as const,
      checkInTime: new Date(Date.now() - 1800000),
      photo: ""
    },
    {
      id: "STU004",
      name: "Sarah Davis",
      email: "sarah.davis@school.edu",
      role: "student" as const,
      class: "Class C",
      status: "excused" as const,
      photo: ""
    },
    {
      id: "STF002",
      name: "Prof. Martinez",
      email: "martinez@school.edu",
      role: "staff" as const,
      department: "Science",
      status: "present" as const,
      checkInTime: new Date(Date.now() - 2400000),
      photo: ""
    }
  ];

  const mockStats = {
    totalUsers: mockAttendanceRecords.length,
    presentCount: mockAttendanceRecords.filter(r => r.status === 'present').length,
    absentCount: mockAttendanceRecords.filter(r => r.status === 'absent').length,
    tardyCount: mockAttendanceRecords.filter(r => r.status === 'tardy').length,
    excusedCount: mockAttendanceRecords.filter(r => r.status === 'excused').length
  };

  const handleStatusChange = (id: string, status: string) => {
    console.log(`Updating attendance status for ${id} to ${status}`);
    // Todo: Update attendance status in backend
  };

  const handleGenerateQR = (id: string) => {
    console.log(`Generating QR code for user ${id}`);
    // Todo: Generate and display QR code
  };

  const handleExportData = () => {
    console.log('Exporting attendance data for', selectedDate);
    // Todo: Export attendance data to CSV/PDF
  };

  const handleQRScanSuccess = (result: string) => {
    console.log('QR scan successful:', result);
    // Todo: Process QR code and mark attendance
    setShowScanner(false);
  };

  const handleImportData = () => {
    console.log('Importing attendance data');
    // Todo: Show import dialog for CSV upload
  };

  return (
    <div className="space-y-6" data-testid="attendance-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Attendance Management</h1>
          <p className="text-muted-foreground">
            Track and manage daily attendance records
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleImportData}
            data-testid="button-import"
          >
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button
            variant="outline"
            onClick={handleExportData}
            data-testid="button-export"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button
            onClick={() => setShowScanner(!showScanner)}
            data-testid="button-scanner"
          >
            <QrCode className="h-4 w-4 mr-2" />
            {showScanner ? 'Close Scanner' : 'QR Scanner'}
          </Button>
        </div>
      </div>

      {/* Date Selector */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Attendance for {selectedDate.toLocaleDateString()}
            </CardTitle>
            <Badge variant="outline" className="text-xs">
              {mockStats.totalUsers} total users
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* QR Scanner */}
      {showScanner && (
        <Card>
          <CardHeader>
            <CardTitle>Scan QR Code for Quick Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <QRScanner onScanSuccess={handleQRScanSuccess} />
          </CardContent>
        </Card>
      )}

      {/* Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="records" data-testid="tab-records">Records</TabsTrigger>
          <TabsTrigger value="analytics" data-testid="tab-analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <AttendanceStats {...mockStats} date={selectedDate} />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Check-ins</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockAttendanceRecords
                    .filter(r => r.status === 'present' && r.checkInTime)
                    .slice(0, 5)
                    .map((record) => (
                      <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium text-sm">{record.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {record.role} • {record.role === 'student' ? record.class : record.department}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {record.checkInTime?.toLocaleTimeString()}
                          </div>
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs">
                            Present
                          </Badge>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Attention Required</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockAttendanceRecords
                    .filter(r => r.status === 'absent' || r.status === 'tardy')
                    .map((record) => (
                      <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium text-sm">{record.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {record.role} • {record.role === 'student' ? record.class : record.department}
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge 
                            className={
                              record.status === 'absent' 
                                ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" 
                                : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                            }
                          >
                            {record.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="records">
          <AttendanceTable
            records={mockAttendanceRecords}
            onStatusChange={handleStatusChange}
            onGenerateQR={handleGenerateQR}
            onExportData={handleExportData}
          />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <AttendanceStats {...mockStats} date={selectedDate} />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Weekly attendance trends chart</p>
                  <p className="text-xs">Charts will be implemented in full version</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Class Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Class A</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-muted rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{width: '85%'}}></div>
                      </div>
                      <span className="text-xs text-muted-foreground">85%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Class B</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-muted rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{width: '92%'}}></div>
                      </div>
                      <span className="text-xs text-muted-foreground">92%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Class C</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-muted rounded-full h-2">
                        <div className="bg-yellow-500 h-2 rounded-full" style={{width: '78%'}}></div>
                      </div>
                      <span className="text-xs text-muted-foreground">78%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}