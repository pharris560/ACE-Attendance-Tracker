import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import AttendanceMarker from "@/components/AttendanceMarker";
import { ArrowLeft, Calendar as CalendarIcon, Users, TrendingUp, Save, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { type Class, type StudentWithEnrollment, type AttendanceStatus, type AttendanceRecordWithDetails } from "@shared/schema";

export default function ClassAttendance() {
  const { classId } = useParams<{ classId: string }>();
  const [location, setLocation] = useLocation();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [attendanceMap, setAttendanceMap] = useState<Map<string, AttendanceStatus>>(new Map());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const dateString = format(selectedDate, "yyyy-MM-dd");

  // Fetch class details
  const { data: classData, isLoading: classLoading } = useQuery<Class>({
    queryKey: ["/api/classes", classId],
    enabled: !!classId,
  });

  // Fetch class enrollments (students)
  const { data: students = [], isLoading: studentsLoading } = useQuery<StudentWithEnrollment[]>({
    queryKey: ["/api/classes", classId, "enrollments"],
    enabled: !!classId,
  });

  // Fetch attendance records for the selected date
  const { data: attendanceRecords = [], isLoading: attendanceLoading } = useQuery<AttendanceRecordWithDetails[]>({
    queryKey: ["/api/attendance/class", classId, "date", dateString],
    queryFn: async () => {
      const response = await fetch(`/api/attendance/class/${classId}?date=${dateString}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch attendance: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: !!classId,
  });

  // Fetch attendance statistics
  const { data: attendanceStats } = useQuery({
    queryKey: ["/api/attendance/stats", classId],
    enabled: !!classId,
  });

  // Mark attendance mutation
  const markAttendanceMutation = useMutation({
    mutationFn: async ({ studentId, status, notes }: { studentId: string; status: AttendanceStatus; notes?: string }) => {
      return apiRequest("POST", `/api/attendance`, {
        classId,
        studentId,
        date: dateString,
        status,
        notes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance/class", classId, "date", dateString] });
      queryClient.invalidateQueries({ queryKey: ["/api/attendance/stats", classId] });
      toast({
        title: "Success",
        description: "Attendance marked successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to mark attendance.",
        variant: "destructive",
      });
    },
  });

  // Build attendance map from records
  useEffect(() => {
    const newAttendanceMap = new Map<string, AttendanceStatus>();
    attendanceRecords.forEach((record) => {
      newAttendanceMap.set(record.studentId, record.status as AttendanceStatus);
    });
    setAttendanceMap(newAttendanceMap);
  }, [attendanceRecords]);

  const handleMarkAttendance = async (studentId: string, status: AttendanceStatus, notes?: string) => {
    // Store previous status for potential rollback
    const previousStatus = attendanceMap.get(studentId);
    
    // Optimistic update: immediately update the attendanceMap for instant visual feedback
    setAttendanceMap(prev => {
      const newMap = new Map(prev);
      newMap.set(studentId, status);
      return newMap;
    });

    try {
      await markAttendanceMutation.mutateAsync({ studentId, status, notes });
    } catch (error: any) {
      // Rollback optimistic update on error
      setAttendanceMap(prev => {
        const rollbackMap = new Map(prev);
        if (previousStatus) {
          rollbackMap.set(studentId, previousStatus);
        } else {
          rollbackMap.delete(studentId);
        }
        return rollbackMap;
      });
      
      toast({
        title: "Error",
        description: error.message || "Failed to mark attendance.",
        variant: "destructive",
      });
    }
  };

  const handleBulkMarkAttendance = async (status: AttendanceStatus) => {
    // Store previous attendance map for potential rollback
    const previousAttendanceMap = new Map(attendanceMap);
    
    // Optimistic update: immediately mark all students with the selected status
    setAttendanceMap(prev => {
      const newMap = new Map(prev);
      students.forEach(student => {
        newMap.set(student.id, status);
      });
      return newMap;
    });

    try {
      await apiRequest("POST", `/api/attendance/bulk`, {
        classId,
        date: dateString,
        records: students.map(student => ({
          studentId: student.id,
          status,
        })),
      });

      queryClient.invalidateQueries({ queryKey: ["/api/attendance/class", classId, "date", dateString] });
      queryClient.invalidateQueries({ queryKey: ["/api/attendance/stats", classId] });
      
      toast({
        title: "Success",
        description: `Marked all students as ${status}.`,
      });
    } catch (error: any) {
      // Rollback optimistic update on error
      setAttendanceMap(previousAttendanceMap);
      
      toast({
        title: "Error",
        description: error.message || "Failed to bulk mark attendance.",
        variant: "destructive",
      });
    }
  };

  const getAttendanceCountsByStatus = () => {
    const counts = {
      present: 0,
      absent: 0,
      tardy: 0,
      excused: 0,
      unmarked: 0,
    };

    students.forEach((student) => {
      const status = attendanceMap.get(student.id);
      if (status) {
        counts[status]++;
      } else {
        counts.unmarked++;
      }
    });

    return counts;
  };

  const counts = getAttendanceCountsByStatus();

  if (classLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Class not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="class-attendance-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/classes")}
            data-testid="button-back-to-classes"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Classes
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{classData.name}</h1>
            <p className="text-muted-foreground">
              Attendance Management • {classData.instructor}
            </p>
          </div>
        </div>
      </div>

      {/* Date Selector and Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Date</CardTitle>
          </CardHeader>
          <CardContent>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                  data-testid="button-date-picker"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present</CardTitle>
            <div className="h-4 w-4 bg-green-500 rounded-full" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{counts.present}</div>
            <p className="text-xs text-muted-foreground">
              Students present
            </p>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Absent</CardTitle>
            <div className="h-4 w-4 bg-red-500 rounded-full" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{counts.absent}</div>
            <p className="text-xs text-muted-foreground">
              Students absent
            </p>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.length}</div>
            <p className="text-xs text-muted-foreground">
              Enrolled students
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Bulk Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Bulk Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            <Button
              size="sm"
              onClick={() => handleBulkMarkAttendance("present")}
              data-testid="button-bulk-present"
            >
              Mark All Present
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkMarkAttendance("absent")}
              data-testid="button-bulk-absent"
            >
              Mark All Absent
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkMarkAttendance("excused")}
              data-testid="button-bulk-excused"
            >
              Mark All Excused
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Student Attendance List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Students</CardTitle>
            <Badge variant="outline" data-testid="badge-total-students">
              {students.length} Students
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {studentsLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin" />
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No students enrolled in this class.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {students.map((student) => (
                <AttendanceMarker
                  key={student.id}
                  student={student}
                  classId={classId!}
                  date={dateString}
                  currentStatus={attendanceMap.get(student.id)}
                  onMarkAttendance={handleMarkAttendance}
                  isLoading={markAttendanceMutation.isPending}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}