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
import { Check, X, Clock, AlertCircle, User, Edit3, MapPin } from "lucide-react";
import { type StudentWithEnrollment, type AttendanceStatus } from "@shared/schema";

interface AttendanceMarkerProps {
  student: StudentWithEnrollment;
  classId: string;
  date: string;
  currentStatus?: AttendanceStatus;
  locationData?: {
    latitude?: string;
    longitude?: string;
    locationAccuracy?: string;
    locationAddress?: string;
  };
  onMarkAttendance: (studentId: string, status: AttendanceStatus, notes?: string) => Promise<void>;
  isLoading?: boolean;
}

export default function AttendanceMarker({
  student,
  classId,
  date,
  currentStatus,
  locationData,
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

  const openNotesDialog = () => {
    // Pre-select current status if one exists
    if (currentStatus) {
      setSelectedStatus(currentStatus);
    }
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
          <div className="flex flex-col items-end gap-1">
            {currentStatus && (
              <Badge
                className={getStatusColor(currentStatus)}
                data-testid={`badge-status-${student.id}`}
              >
                {getStatusIcon(currentStatus)}
                <span className="ml-1 capitalize">{currentStatus}</span>
              </Badge>
            )}
            {locationData && (locationData.latitude || locationData.longitude) && (
              <div className="flex items-center gap-1">
                {(() => {
                  const accuracy = locationData.locationAccuracy ? parseFloat(locationData.locationAccuracy) : null;
                  const isOnsite = accuracy !== null && accuracy <= 100; // Within 100m is considered onsite
                  const accuracyLevel = accuracy === null ? 'unknown' : 
                    accuracy <= 35 ? 'excellent' :
                    accuracy <= 100 ? 'good' :
                    accuracy <= 500 ? 'fair' : 'poor';
                  
                  const mapPinColor = 
                    accuracyLevel === 'excellent' ? 'text-green-500' :
                    accuracyLevel === 'good' ? 'text-green-400' :
                    accuracyLevel === 'fair' ? 'text-yellow-500' :
                    accuracyLevel === 'poor' ? 'text-red-500' :
                    'text-gray-400';
                  
                  return (
                    <>
                      <MapPin className={`h-4 w-4 ${mapPinColor}`} />
                      <div className="flex flex-col">
                        <span className={`text-xs font-medium ${
                          isOnsite ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'
                        }`}>
                          {isOnsite ? 'ONSITE' : 'REMOTE'}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {accuracy !== null ? `±${Math.round(accuracy)}m` : 'Location tracked'}
                        </span>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </div>
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
            className={`flex items-center gap-1 transition-all duration-200 hover:scale-105 active:scale-95 ${
              currentStatus === "present" 
                ? "bg-green-500 text-white border-green-500 hover:bg-green-600" 
                : "hover:bg-green-500 hover:text-white hover:border-green-500"
            }`}
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
            className={`flex items-center gap-1 transition-all duration-200 hover:scale-105 active:scale-95 ${
              currentStatus === "absent" 
                ? "bg-red-400 text-white border-red-400 hover:bg-red-500" 
                : "hover:bg-red-400 hover:text-white hover:border-red-400"
            }`}
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
            className={`flex items-center gap-1 transition-all duration-200 hover:scale-105 active:scale-95 ${
              currentStatus === "tardy" 
                ? "bg-yellow-400 text-gray-900 border-yellow-400 hover:bg-yellow-500" 
                : "hover:bg-yellow-400 hover:text-gray-900 hover:border-yellow-400"
            }`}
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
            className={`flex items-center gap-1 transition-all duration-200 hover:scale-105 active:scale-95 ${
              currentStatus === "excused" 
                ? "bg-blue-400 text-white border-blue-400 hover:bg-blue-500" 
                : "hover:bg-blue-400 hover:text-white hover:border-blue-400"
            }`}
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
                <Label>Attendance Status *</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Select an attendance status to enable saving
                </p>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {["present", "absent", "tardy", "excused"].map((status) => {
                    const getButtonStyling = (btnStatus: string, isSelected: boolean) => {
                      const baseClasses = "flex items-center gap-1 transition-all duration-200 hover:scale-105 active:scale-95";
                      
                      switch (btnStatus) {
                        case "present":
                          return `${baseClasses} ${isSelected 
                            ? "bg-green-500 text-white border-green-500 hover:bg-green-600" 
                            : "hover:bg-green-500 hover:text-white hover:border-green-500"}`;
                        case "absent":
                          return `${baseClasses} ${isSelected 
                            ? "bg-red-400 text-white border-red-400 hover:bg-red-500" 
                            : "hover:bg-red-400 hover:text-white hover:border-red-400"}`;
                        case "tardy":
                          return `${baseClasses} ${isSelected 
                            ? "bg-yellow-400 text-gray-900 border-yellow-400 hover:bg-yellow-500" 
                            : "hover:bg-yellow-400 hover:text-gray-900 hover:border-yellow-400"}`;
                        case "excused":
                          return `${baseClasses} ${isSelected 
                            ? "bg-blue-400 text-white border-blue-400 hover:bg-blue-500" 
                            : "hover:bg-blue-400 hover:text-white hover:border-blue-400"}`;
                        default:
                          return `${baseClasses}`;
                      }
                    };
                    
                    return (
                    <Button
                      key={status}
                      size="sm"
                      variant={selectedStatus === status ? "default" : "outline"}
                      onClick={() => setSelectedStatus(status as AttendanceStatus)}
                      className={getButtonStyling(status, selectedStatus === status)}
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
                  className={!selectedStatus ? "opacity-50 cursor-not-allowed" : ""}
                >
                  {isLoading ? "Saving..." : !selectedStatus ? "Select Status to Save" : "Save Attendance"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}