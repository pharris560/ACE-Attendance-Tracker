import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { Users, Calendar, QrCode, FileSpreadsheet, Settings, LogOut } from "lucide-react";

export default function Home() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">
            Welcome{user?.firstName ? `, ${user.firstName}` : ""}!
          </h1>
          <p className="text-muted-foreground">
            Manage attendance, students, and classes from your dashboard
          </p>
        </div>
        <div className="flex items-center gap-4">
          {user?.profileImageUrl && (
            <img 
              src={user.profileImageUrl} 
              alt="Profile" 
              className="w-10 h-10 rounded-full object-cover"
            />
          )}
          <Button 
            variant="outline" 
            onClick={handleLogout}
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card 
          className="cursor-pointer hover-elevate" 
          onClick={() => setLocation("/classes")}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Classes
            </CardTitle>
            <CardDescription>
              Manage classes and mark attendance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" data-testid="button-go-classes">
              View Classes
            </Button>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover-elevate" 
          onClick={() => setLocation("/students")}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Students
            </CardTitle>
            <CardDescription>
              Manage student profiles and enrollments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" data-testid="button-go-students">
              View Students
            </Button>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover-elevate" 
          onClick={() => setLocation("/scanner")}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              QR Scanner
            </CardTitle>
            <CardDescription>
              Scan QR codes to mark attendance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" data-testid="button-go-scanner">
              Open Scanner
            </Button>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover-elevate" 
          onClick={() => setLocation("/reports")}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Reports
            </CardTitle>
            <CardDescription>
              Generate attendance reports and analytics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" data-testid="button-go-reports">
              View Reports
            </Button>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover-elevate" 
          onClick={() => setLocation("/api-keys")}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              API Keys
            </CardTitle>
            <CardDescription>
              Manage API access for integrations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" data-testid="button-go-api-keys">
              Manage API Keys
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* User Info */}
      {user && (
        <Card>
          <CardHeader>
            <CardTitle>Your Profile</CardTitle>
            <CardDescription>
              Account information from your authentication provider
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <span className="font-semibold">Name:</span>{" "}
                {user.firstName || user.lastName ? 
                  `${user.firstName || ""} ${user.lastName || ""}`.trim() : 
                  "Not provided"}
              </div>
              <div>
                <span className="font-semibold">Email:</span>{" "}
                {user.email || "Not provided"}
              </div>
              <div>
                <span className="font-semibold">Role:</span>{" "}
                {user.role || "Staff"}
              </div>
              <div>
                <span className="font-semibold">Account ID:</span>{" "}
                {user.id}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}