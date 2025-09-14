import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import ClassCard from "@/components/ClassCard";
import { Search, Plus, Download, Upload, GraduationCap, Users, BookOpen } from "lucide-react";
import { useLocation } from "wouter";

export default function Classes() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [location, setLocation] = useLocation();

  // Todo: Remove mock data - replace with real data from backend
  const mockClasses = [
    {
      id: "CLS001",
      name: "Mathematics 101",
      description: "Introduction to basic mathematical concepts including algebra, geometry, and statistics.",
      capacity: 30,
      enrolledCount: 28,
      schedule: "Mon, Wed, Fri 9:00-10:00 AM",
      instructor: "Dr. Sarah Wilson",
      location: "Room A-101",
      status: "active" as const,
    },
    {
      id: "CLS002",
      name: "Physics 201",
      description: "Advanced physics course covering mechanics, thermodynamics, and electromagnetism.",
      capacity: 25,
      enrolledCount: 18,
      schedule: "Tue, Thu 11:00 AM-12:30 PM",
      instructor: "Prof. Michael Chen",
      location: "Lab B-204",
      status: "active" as const,
    },
    {
      id: "CLS003",
      name: "Chemistry 150",
      description: "General chemistry fundamentals with laboratory experiments.",
      capacity: 20,
      enrolledCount: 20,
      schedule: "Mon, Wed 2:00-3:30 PM",
      instructor: "Dr. Emily Rodriguez",
      location: "Lab C-105",
      status: "active" as const,
    },
    {
      id: "CLS004",
      name: "Biology 101",
      description: "Introduction to biological sciences and life processes.",
      capacity: 35,
      enrolledCount: 12,
      schedule: "Tue, Thu, Fri 10:00-11:00 AM",
      instructor: "Prof. David Park",
      location: "Room D-201",
      status: "inactive" as const,
    },
    {
      id: "CLS005",
      name: "History 300",
      description: "Modern world history from 1800 to present day.",
      capacity: 40,
      enrolledCount: 35,
      schedule: "Mon, Wed 1:00-2:30 PM",
      instructor: "Dr. Lisa Thompson",
      location: "Room E-301",
      status: "completed" as const,
    }
  ];

  const filteredClasses = mockClasses.filter(classItem => {
    const matchesSearch = classItem.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         classItem.instructor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         classItem.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === "all" || classItem.status === filter;
    return matchesSearch && matchesFilter;
  });

  const activeCount = mockClasses.filter(c => c.status === 'active').length;
  const inactiveCount = mockClasses.filter(c => c.status === 'inactive').length;
  const completedCount = mockClasses.filter(c => c.status === 'completed').length;
  const totalStudents = mockClasses.reduce((sum, c) => sum + c.enrolledCount, 0);

  const handleEditClass = (id: string) => {
    console.log(`Editing class ${id}`);
    // Todo: Navigate to edit class form
  };

  const handleDeleteClass = (id: string) => {
    console.log(`Deleting class ${id}`);
    // Todo: Show confirmation dialog and delete class
  };

  const handleViewDetails = (id: string) => {
    console.log(`Viewing details for class ${id}`);
    // Todo: Navigate to class details page
  };

  const handleAddClass = () => {
    setLocation("/classes/add");
  };

  const handleImportClasses = () => {
    console.log('Importing classes from CSV');
    // Todo: Show import dialog
  };

  const handleExportClasses = () => {
    console.log('Exporting classes data');
    // Todo: Export classes to CSV
  };

  return (
    <div className="space-y-6" data-testid="classes-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Class Management</h1>
          <p className="text-muted-foreground">
            Manage classes, schedules, and enrollment
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleImportClasses}
            data-testid="button-import-classes"
          >
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button
            variant="outline"
            onClick={handleExportClasses}
            data-testid="button-export-classes"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button
            onClick={handleAddClass}
            data-testid="button-add-class"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Class
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockClasses.length}</div>
            <p className="text-xs text-muted-foreground">
              Classes in system
            </p>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Classes</CardTitle>
            <GraduationCap className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeCount}</div>
            <p className="text-xs text-muted-foreground">
              Currently running
            </p>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Enrollment</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              Students enrolled
            </p>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Capacity</CardTitle>
            <BookOpen className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {Math.round((totalStudents / mockClasses.reduce((sum, c) => sum + c.capacity, 0)) * 100)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Overall utilization
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
                placeholder="Search classes by name, instructor, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                data-testid="input-search-classes"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("all")}
                data-testid="filter-all"
              >
                All ({mockClasses.length})
              </Button>
              <Button
                variant={filter === "active" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("active")}
                data-testid="filter-active"
              >
                Active ({activeCount})
              </Button>
              <Button
                variant={filter === "inactive" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("inactive")}
                data-testid="filter-inactive"
              >
                Inactive ({inactiveCount})
              </Button>
              <Button
                variant={filter === "completed" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("completed")}
                data-testid="filter-completed"
              >
                Completed ({completedCount})
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Classes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClasses.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No classes found</h3>
              <p className="text-muted-foreground text-center mb-4">
                {searchTerm ? "No classes match your search criteria." : "No classes have been created yet."}
              </p>
              <Button onClick={handleAddClass}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Class
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredClasses.map((classItem) => (
            <ClassCard
              key={classItem.id}
              {...classItem}
              onEdit={handleEditClass}
              onDelete={handleDeleteClass}
              onViewDetails={handleViewDetails}
            />
          ))
        )}
      </div>

      {/* Results Summary */}
      {filteredClasses.length > 0 && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Showing {filteredClasses.length} of {mockClasses.length} classes
              </span>
              <div className="flex items-center gap-4">
                <Badge variant="outline" className="text-xs">
                  {filteredClasses.filter(c => c.status === 'active').length} Active
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {filteredClasses.filter(c => c.status === 'inactive').length} Inactive
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {filteredClasses.filter(c => c.status === 'completed').length} Completed
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}