import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Check, X, Clock, AlertCircle, User, Edit3 } from "lucide-react";
import { type StudentWithEnrollment, type AttendanceStatus } from "@shared/schema";

interface AttendanceMarkerProps {
  student: StudentWithEnrollment;
  classId: string;
  date: string;
  currentStatus?: AttendanceStatus;
  onMarkAttendance: (studentId: string, status: AttendanceStatus, notes?: string) => Promise<void>;
  isLoading?: boolean;
}

export default function AttendanceMarker({
  student,
  classId,
  date,
  currentStatus,
  onMarkAttendance,
  isLoading = false
}: AttendanceMarkerProps) {
  const [notes, setNotes] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<AttendanceStatus | null>(null);

  const getStatusColor = (status: AttendanceStatus) => {
    switch (status) {
      case "present":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "absent":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "tardy":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "excused":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getStatusIcon = (status: AttendanceStatus) => {
    switch (status) {
      case "present":
        return <Check className="h-3 w-3" />;
      case "absent":
        return <X className="h-3 w-3" />;
      case "tardy":
        return <Clock className="h-3 w-3" />;
      case "excused":
        return <AlertCircle className="h-3 w-3" />;
      default:
        return <User className="h-3 w-3" />;
    }
  };

  const handleQuickMark = async (status: AttendanceStatus) => {
    if (isLoading) return;
    await onMarkAttendance(student.id, status);
  };

  const handleMarkWithNotes = async () => {
    if (!selectedStatus || isLoading) return;
    
    await onMarkAttendance(student.id, selectedStatus, notes);
    setDialogOpen(false);
    setNotes("");
    setSelectedStatus(null);
  };

  const openNotesDialog = (status: AttendanceStatus) => {
    setSelectedStatus(status);
    setDialogOpen(true);
  };

  return (
    <Card className="hover-elevate">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-sm font-medium">
                {student.firstName} {student.lastName}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                ID: {student.studentId}
              </p>
            </div>
          </div>
          {currentStatus && (
            <Badge
              className={getStatusColor(currentStatus)}
              data-testid={`badge-status-${student.id}`}
            >
              {getStatusIcon(currentStatus)}
              <span className="ml-1 capitalize">{currentStatus}</span>
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-2">
          {/* Quick action buttons */}
          <Button
            size="sm"
            variant={currentStatus === "present" ? "default" : "outline"}
            onClick={() => handleQuickMark("present")}
            disabled={isLoading}
            className="flex items-center gap-1 transition-all duration-200 hover:bg-green-500 hover:text-white hover:border-green-500 hover:scale-105 active:scale-95"
            data-testid={`button-present-${student.id}`}
          >
            <Check className="h-3 w-3" />
            Present
          </Button>
          
          <Button
            size="sm"
            variant={currentStatus === "absent" ? "default" : "outline"}
            onClick={() => handleQuickMark("absent")}
            disabled={isLoading}
            className="flex items-center gap-1 transition-all duration-200 hover:bg-red-400 hover:text-white hover:border-red-400 hover:scale-105 active:scale-95"
            data-testid={`button-absent-${student.id}`}
          >
            <X className="h-3 w-3" />
            Absent
          </Button>
          
          <Button
            size="sm"
            variant={currentStatus === "tardy" ? "default" : "outline"}
            onClick={() => handleQuickMark("tardy")}
            disabled={isLoading}
            className="flex items-center gap-1 transition-all duration-200 hover:bg-yellow-400 hover:text-gray-900 hover:border-yellow-400 hover:scale-105 active:scale-95"
            data-testid={`button-tardy-${student.id}`}
          >
            <Clock className="h-3 w-3" />
            Tardy
          </Button>
          
          <Button
            size="sm"
            variant={currentStatus === "excused" ? "default" : "outline"}
            onClick={() => handleQuickMark("excused")}
            disabled={isLoading}
            className="flex items-center gap-1 transition-all duration-200 hover:bg-blue-400 hover:text-white hover:border-blue-400 hover:scale-105 active:scale-95"
            data-testid={`button-excused-${student.id}`}
          >
            <AlertCircle className="h-3 w-3" />
            Excused
          </Button>
        </div>
        
        {/* Add notes dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className="w-full mt-2"
              onClick={() => setDialogOpen(true)}
              data-testid={`button-notes-${student.id}`}
            >
              <Edit3 className="h-3 w-3 mr-1" />
              Add Notes
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Mark Attendance for {student.firstName} {student.lastName}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Attendance Status</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {["present", "absent", "tardy", "excused"].map((status) => {
                    const getButtonAnimation = (btnStatus: string) => {
                      switch (btnStatus) {
                        case "present":
                          return "transition-all duration-200 hover:bg-green-500 hover:text-white hover:border-green-500 hover:scale-105 active:scale-95";
                        case "absent":
                          return "transition-all duration-200 hover:bg-red-400 hover:text-white hover:border-red-400 hover:scale-105 active:scale-95";
                        case "tardy":
                          return "transition-all duration-200 hover:bg-yellow-400 hover:text-gray-900 hover:border-yellow-400 hover:scale-105 active:scale-95";
                        case "excused":
                          return "transition-all duration-200 hover:bg-blue-400 hover:text-white hover:border-blue-400 hover:scale-105 active:scale-95";
                        default:
                          return "transition-all duration-200 hover:scale-105 active:scale-95";
                      }
                    };
                    
                    return (
                    <Button
                      key={status}
                      size="sm"
                      variant={selectedStatus === status ? "default" : "outline"}
                      onClick={() => setSelectedStatus(status as AttendanceStatus)}
                      className={`flex items-center gap-1 ${getButtonAnimation(status)}`}
                      data-testid={`dialog-button-${status}`}
                    >
                      {getStatusIcon(status as AttendanceStatus)}
                      <span className="capitalize">{status}</span>
                    </Button>
                    );
                  })}
                </div>
              </div>
              
              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any notes about this attendance record..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-1"
                  data-testid="textarea-notes"
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setDialogOpen(false);
                    setNotes("");
                    setSelectedStatus(null);
                  }}
                  data-testid="button-cancel-notes"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleMarkWithNotes}
                  disabled={!selectedStatus || isLoading}
                  data-testid="button-save-attendance"
                >
                  {isLoading ? "Saving..." : "Save Attendance"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}