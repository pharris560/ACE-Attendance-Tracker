import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import ClassCard from "@/components/ClassCard";
import ImportClassesDialog from "@/components/ImportClassesDialog";
import { Search, Plus, Download, Upload, GraduationCap, Users, BookOpen, RefreshCw } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { type ClassWithStats } from "@shared/schema";

export default function Classes() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [location, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();

  // Fetch classes from backend (allow public access to view classes)
  const { data: classes = [], isLoading: classesLoading, error: classesError } = useQuery<ClassWithStats[]>({
    queryKey: ["/api/classes"],
    // Enable query regardless of authentication status to show classes publicly
  });

  const filteredClasses = classes.filter(classItem => {
    const matchesSearch = classItem.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         classItem.instructor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         classItem.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === "all" || classItem.status === filter;
    return matchesSearch && matchesFilter;
  });

  const activeCount = classes.filter(c => c.status === 'active').length;
  const inactiveCount = classes.filter(c => c.status === 'inactive').length;
  const completedCount = classes.filter(c => c.status === 'completed').length;
  const totalStudents = classes.reduce((sum, c) => sum + c.enrolledCount, 0);

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-80" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    </div>
  );

  // Error state
  if (classesError) {
    return (
      <div className="space-y-6" data-testid="classes-page">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <RefreshCw className="h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error Loading Classes</h3>
            <p className="text-muted-foreground text-center mb-4">
              {classesError instanceof Error ? classesError.message : "Failed to load classes"}
            </p>
            <Button onClick={() => window.location.reload()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading state
  if (classesLoading) {
    return <LoadingSkeleton />;
  }

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

  const handleManageAttendance = (id: string) => {
    // Allow direct access to attendance without login
    setLocation(`/classes/${id}/attendance`);
  };

  const handleAddClass = () => {
    setLocation("/classes/add");
  };

  const handleImportClasses = () => {
    if (!isAuthenticated) {
      setLocation("/login");
      return;
    }
    setIsImportDialogOpen(true);
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
            onClick={isAuthenticated ? handleImportClasses : () => setLocation("/login")}
            data-testid="button-import-classes"
          >
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button
            variant="outline"
            onClick={isAuthenticated ? handleExportClasses : () => setLocation("/login")}
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
            <div className="text-2xl font-bold">{classes.length}</div>
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
              {classes.length > 0 ? Math.round((totalStudents / classes.reduce((sum, c) => sum + c.capacity, 0)) * 100) : 0}%
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
                All ({classes.length})
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              description={classItem.description || undefined}
              location={classItem.location || undefined}
              status={classItem.status as "active" | "inactive" | "completed"}
              onEdit={handleEditClass}
              onDelete={handleDeleteClass}
              onViewDetails={handleViewDetails}
              onManageAttendance={handleManageAttendance}
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
                Showing {filteredClasses.length} of {classes.length} classes
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

      {/* Import Classes Dialog */}
      <ImportClassesDialog 
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
      />
    </div>
  );
}