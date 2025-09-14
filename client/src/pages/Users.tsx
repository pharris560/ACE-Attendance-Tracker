import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UserCard from "@/components/UserCard";
import { Search, Plus, Download, Upload, Users as UsersIcon, GraduationCap, Briefcase } from "lucide-react";

export default function Users() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");

  // Todo: Remove mock data - replace with real data from backend
  const mockUsers = [
    {
      id: "STU001",
      name: "John Doe",
      email: "john.doe@school.edu",
      phone: "+1 (555) 123-4567",
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
      phone: "+1 (555) 234-5678",
      role: "student" as const,
      class: "Class B",
      status: "absent" as const,
      lastSeen: new Date(Date.now() - 86400000),
      photo: ""
    },
    {
      id: "STF001",
      name: "Dr. Wilson",
      email: "wilson@school.edu",
      phone: "+1 (555) 345-6789",
      role: "staff" as const,
      department: "Mathematics",
      status: "present" as const,
      lastSeen: new Date(Date.now() - 3600000),
      photo: ""
    },
    {
      id: "STU003",
      name: "Mike Johnson",
      email: "mike.johnson@school.edu",
      phone: "+1 (555) 456-7890",
      role: "student" as const,
      class: "Class A",
      status: "tardy" as const,
      lastSeen: new Date(Date.now() - 1800000),
      photo: ""
    },
    {
      id: "STF002",
      name: "Prof. Martinez",
      email: "martinez@school.edu",
      phone: "+1 (555) 567-8901",
      role: "staff" as const,
      department: "Science",
      status: "present" as const,
      lastSeen: new Date(Date.now() - 2400000),
      photo: ""
    }
  ];

  const filteredUsers = mockUsers.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === "all" || user.role === filter;
    return matchesSearch && matchesFilter;
  });

  const studentCount = mockUsers.filter(u => u.role === 'student').length;
  const staffCount = mockUsers.filter(u => u.role === 'staff').length;

  const handleMarkAttendance = (id: string, status: string) => {
    console.log(`Marking attendance for ${id} as ${status}`);
    // Todo: Update attendance status in backend
  };

  const handleGenerateQR = (id: string) => {
    console.log(`Generating QR code for user ${id}`);
    // Todo: Generate and display QR code
  };

  const handleAddUser = () => {
    console.log('Adding new user');
    // Todo: Navigate to add user form
  };

  const handleImportUsers = () => {
    console.log('Importing users from CSV');
    // Todo: Show import dialog
  };

  const handleExportUsers = () => {
    console.log('Exporting users data');
    // Todo: Export users to CSV
  };

  return (
    <div className="space-y-6" data-testid="users-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-muted-foreground">
            Manage students and staff profiles
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleImportUsers}
            data-testid="button-import-users"
          >
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button
            variant="outline"
            onClick={handleExportUsers}
            data-testid="button-export-users"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button
            onClick={handleAddUser}
            data-testid="button-add-user"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <UsersIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockUsers.length}</div>
            <p className="text-xs text-muted-foreground">
              Active users in system
            </p>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Students</CardTitle>
            <GraduationCap className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{studentCount}</div>
            <p className="text-xs text-muted-foreground">
              Enrolled students
            </p>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Staff</CardTitle>
            <Briefcase className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{staffCount}</div>
            <p className="text-xs text-muted-foreground">
              Faculty & staff members
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                data-testid="input-search-users"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("all")}
                data-testid="filter-all"
              >
                All ({mockUsers.length})
              </Button>
              <Button
                variant={filter === "student" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("student")}
                data-testid="filter-students"
              >
                Students ({studentCount})
              </Button>
              <Button
                variant={filter === "staff" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("staff")}
                data-testid="filter-staff"
              >
                Staff ({staffCount})
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUsers.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <UsersIcon className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No users found</h3>
              <p className="text-muted-foreground text-center mb-4">
                {searchTerm ? "No users match your search criteria." : "No users have been added yet."}
              </p>
              <Button onClick={handleAddUser}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First User
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredUsers.map((user) => (
            <UserCard
              key={user.id}
              {...user}
              onMarkAttendance={handleMarkAttendance}
              onGenerateQR={handleGenerateQR}
            />
          ))
        )}
      </div>

      {/* Results Summary */}
      {filteredUsers.length > 0 && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Showing {filteredUsers.length} of {mockUsers.length} users
              </span>
              <div className="flex items-center gap-4">
                <Badge variant="outline" className="text-xs">
                  {filteredUsers.filter(u => u.status === 'present').length} Present
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {filteredUsers.filter(u => u.status === 'absent').length} Absent
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {filteredUsers.filter(u => u.status === 'tardy').length} Tardy
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}