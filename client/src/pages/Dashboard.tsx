import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AttendanceStats from "@/components/AttendanceStats";
import UserCard from "@/components/UserCard";
import QRScanner from "@/components/QRScanner";
import { 
  Users, 
  UserPlus, 
  QrCode, 
  Calendar, 
  TrendingUp,
  Clock,
  AlertTriangle,
  Camera
} from "lucide-react";

export default function Dashboard() {
  const [showScanner, setShowScanner] = useState(false);
  
  // Todo: Remove mock data - replace with real data from backend
  const mockStats = {
    totalUsers: 120,
    presentCount: 95,
    absentCount: 15,
    tardyCount: 8,
    excusedCount: 2
  };

  const mockRecentUsers = [
    {
      id: "STU001",
      name: "John Doe",
      email: "john.doe@school.edu",
      role: "student" as const,
      class: "Class A",
      status: "present" as const,
      lastSeen: new Date(),
      photo: ""
    },
    {
      id: "STU002",
      name: "Jane Smith", 
      email: "jane.smith@school.edu",
      role: "student" as const,
      class: "Class B", 
      status: "tardy" as const,
      lastSeen: new Date(Date.now() - 1800000),
      photo: ""
    },
    {
      id: "STF001",
      name: "Dr. Wilson",
      email: "wilson@school.edu",
      role: "staff" as const,
      department: "Mathematics",
      status: "present" as const,
      lastSeen: new Date(Date.now() - 3600000),
      photo: ""
    }
  ];

  const handleQRScanSuccess = (result: string) => {
    console.log('QR scan successful:', result);
    // Todo: Process QR code result and mark attendance
    setShowScanner(false);
  };

  const handleMarkAttendance = (id: string, status: string) => {
    console.log(`Marking attendance for ${id} as ${status}`);
    // Todo: Update attendance status in backend
  };

  const handleGenerateQR = (id: string) => {
    console.log(`Generating QR code for user ${id}`);
    // Todo: Generate and show QR code
  };

  return (
    <div className="space-y-6" data-testid="dashboard-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of today's attendance - {new Date().toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={() => setShowScanner(!showScanner)}
            data-testid="button-toggle-scanner"
          >
            <Camera className="h-4 w-4 mr-2" />
            {showScanner ? 'Close Scanner' : 'Quick Scan'}
          </Button>
          <Button variant="outline" data-testid="button-export-today">
            Export Today's Data
          </Button>
        </div>
      </div>

      {/* QR Scanner */}
      {showScanner && (
        <Card>
          <CardHeader>
            <CardTitle>Quick Attendance Scan</CardTitle>
          </CardHeader>
          <CardContent>
            <QRScanner onScanSuccess={handleQRScanSuccess} />
          </CardContent>
        </Card>
      )}

      {/* Stats Overview */}
      <AttendanceStats {...mockStats} />

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover-elevate cursor-pointer" data-testid="quick-action-add-user">
          <CardContent className="flex flex-col items-center justify-center p-6 text-center">
            <UserPlus className="h-8 w-8 text-primary mb-2" />
            <h3 className="font-semibold">Add User</h3>
            <p className="text-xs text-muted-foreground">Register new student or staff</p>
          </CardContent>
        </Card>

        <Card className="hover-elevate cursor-pointer" data-testid="quick-action-view-users">
          <CardContent className="flex flex-col items-center justify-center p-6 text-center">
            <Users className="h-8 w-8 text-blue-600 mb-2" />
            <h3 className="font-semibold">Manage Users</h3>
            <p className="text-xs text-muted-foreground">View and edit user profiles</p>
          </CardContent>
        </Card>

        <Card className="hover-elevate cursor-pointer" data-testid="quick-action-generate-qr">
          <CardContent className="flex flex-col items-center justify-center p-6 text-center">
            <QrCode className="h-8 w-8 text-green-600 mb-2" />
            <h3 className="font-semibold">QR Codes</h3>
            <p className="text-xs text-muted-foreground">Generate ID cards & QR codes</p>
          </CardContent>
        </Card>

        <Card className="hover-elevate cursor-pointer" data-testid="quick-action-reports">
          <CardContent className="flex flex-col items-center justify-center p-6 text-center">
            <TrendingUp className="h-8 w-8 text-purple-600 mb-2" />
            <h3 className="font-semibold">Reports</h3>
            <p className="text-xs text-muted-foreground">View analytics & export data</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Recent Check-ins
              <Badge variant="secondary" className="text-xs">
                {mockRecentUsers.filter(u => u.status === 'present').length} active
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {mockRecentUsers.map((user) => (
              <UserCard
                key={user.id}
                {...user}
                onMarkAttendance={handleMarkAttendance}
                onGenerateQR={handleGenerateQR}
              />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Alerts & Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-l-4 border-l-yellow-500 pl-4 py-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-600" />
                <span className="font-medium text-sm">8 students are tardy</span>
              </div>
              <p className="text-xs text-muted-foreground">
                More than usual tardiness detected today
              </p>
            </div>

            <div className="border-l-4 border-l-red-500 pl-4 py-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span className="font-medium text-sm">15 unexcused absences</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Higher than average absence rate
              </p>
            </div>

            <div className="border-l-4 border-l-blue-500 pl-4 py-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-sm">2 excused absences</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Students with prior notification
              </p>
            </div>

            <Button variant="outline" size="sm" className="w-full mt-4" data-testid="button-view-all-alerts">
              View All Alerts
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}