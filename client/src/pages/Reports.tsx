import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Download, FileSpreadsheet, Calendar as CalendarIcon, Users, TrendingUp, MapPin, Clock, BarChart3 } from "lucide-react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from "date-fns";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function Reports() {
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(),
    to: new Date(),
  });
  const [reportType, setReportType] = useState<string>("attendance");
  const { toast } = useToast();

  // Fetch classes
  const { data: classes = [] } = useQuery<any[]>({
    queryKey: ["/api/classes"],
  });

  // Fetch attendance data for the selected period
  const { data: attendanceData, refetch: refetchAttendance } = useQuery({
    queryKey: ["/api/attendance/report", selectedClass, dateRange],
    queryFn: async () => {
      const fromDate = format(dateRange.from, "yyyy-MM-dd");
      const toDate = format(dateRange.to, "yyyy-MM-dd");
      
      // Generate all dates in the range
      const dates: string[] = [];
      const currentDate = new Date(dateRange.from);
      const endDate = new Date(dateRange.to);
      
      while (currentDate <= endDate) {
        dates.push(format(currentDate, "yyyy-MM-dd"));
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      // Fetch attendance for each class and each date
      const classesToQuery = selectedClass === "all" 
        ? classes 
        : classes.filter(cls => cls.id === selectedClass);
      
      const allRecords: any[] = [];
      
      for (const cls of classesToQuery) {
        for (const date of dates) {
          const response = await fetch(`/api/attendance/class/${cls.id}?date=${date}`);
          const records = await response.json();
          
          if (records && records.length > 0) {
            allRecords.push({
              classId: cls.id,
              className: cls.name,
              date: date,
              records: records
            });
          }
        }
      }
      
      return allRecords;
    },
    enabled: classes.length > 0,
  });

  const handleExportReport = (format: "csv" | "pdf") => {
    const reportData = generateReportData();
    
    if (format === "csv") {
      exportToCSV(reportData);
    } else {
      toast({
        title: "PDF Export",
        description: "PDF export will be available soon.",
      });
    }
  };

  const generateReportData = () => {
    if (!attendanceData || attendanceData.length === 0) return [];
    
    // Compile report data based on report type
    const data: any[] = [];
    
    attendanceData.forEach((classData: any) => {
      classData.records.forEach((record: any) => {
        data.push({
          date: classData.date,
          class: classData.className,
          student: `${record.firstName} ${record.lastName}`,
          studentId: record.studentId,
          status: record.status,
          markedAt: record.markedAt ? format(new Date(record.markedAt), "HH:mm:ss") : "N/A",
          location: record.locationAccuracy ? 
            (parseFloat(record.locationAccuracy) <= 100 ? "Onsite" : "Remote") : 
            "Unknown",
          accuracy: record.locationAccuracy ? `±${Math.round(parseFloat(record.locationAccuracy))}m` : "N/A",
        });
      });
    });
    
    return data;
  };

  const exportToCSV = (data: any[]) => {
    if (data.length === 0) {
      toast({
        title: "No Data Available",
        description: "No attendance records found for the selected period. Please mark attendance first by going to Classes and marking attendance for students.",
        variant: "destructive",
      });
      return;
    }

    const headers = Object.keys(data[0]).join(",");
    const rows = data.map(row => Object.values(row).join(",")).join("\n");
    const csv = `${headers}\n${rows}`;
    
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance-report-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    
    toast({
      title: "Export Successful",
      description: "Report has been downloaded.",
    });
  };

  const getAttendanceStats = () => {
    if (!attendanceData || attendanceData.length === 0) return { present: 0, absent: 0, tardy: 0, excused: 0, onsite: 0, remote: 0 };
    
    const stats = {
      present: 0,
      absent: 0,
      tardy: 0,
      excused: 0,
      onsite: 0,
      remote: 0,
    };
    
    attendanceData.forEach((classData: any) => {
      classData.records.forEach((record: any) => {
        if (record.status === "present") stats.present++;
        else if (record.status === "absent") stats.absent++;
        else if (record.status === "tardy") stats.tardy++;
        else if (record.status === "excused") stats.excused++;
        
        if (record.locationAccuracy) {
          const accuracy = parseFloat(record.locationAccuracy);
          if (accuracy <= 100) stats.onsite++;
          else stats.remote++;
        }
      });
    });
    
    return stats;
  };

  const stats = getAttendanceStats();

  return (
    <div className="space-y-6" data-testid="reports-page">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-muted-foreground">
          Generate and export attendance reports
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Report Configuration</CardTitle>
          <CardDescription>
            Select the parameters for your report
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Report Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Report Type</label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger data-testid="select-report-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="attendance">Attendance Report</SelectItem>
                  <SelectItem value="location">Location Analysis</SelectItem>
                  <SelectItem value="summary">Summary Report</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Class Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Class</label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger data-testid="select-class">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {classes.map((cls: any) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateRange && "text-muted-foreground"
                    )}
                    data-testid="button-date-range"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "PPP")} - {format(dateRange.to, "PPP")}
                        </>
                      ) : (
                        format(dateRange.from, "PPP")
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <div className="p-4 space-y-4">
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDateRange({
                          from: startOfWeek(new Date()),
                          to: endOfWeek(new Date()),
                        })}
                      >
                        This Week
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDateRange({
                          from: startOfMonth(new Date()),
                          to: endOfMonth(new Date()),
                        })}
                      >
                        This Month
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Export Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={() => handleExportReport("csv")}
              data-testid="button-export-csv"
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Export as CSV
            </Button>
            <Button
              variant="outline"
              onClick={() => handleExportReport("pdf")}
              data-testid="button-export-pdf"
            >
              <Download className="h-4 w-4 mr-2" />
              Export as PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.present}</div>
            <p className="text-xs text-muted-foreground">Students present</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Absent</CardTitle>
            <Users className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.absent}</div>
            <p className="text-xs text-muted-foreground">Students absent</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tardy</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.tardy}</div>
            <p className="text-xs text-muted-foreground">Students late</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Excused</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.excused}</div>
            <p className="text-xs text-muted-foreground">Excused absences</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Onsite</CardTitle>
            <MapPin className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.onsite}</div>
            <p className="text-xs text-muted-foreground">At location</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Remote</CardTitle>
            <MapPin className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.remote}</div>
            <p className="text-xs text-muted-foreground">Away from location</p>
          </CardContent>
        </Card>
      </div>

      {/* Report Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Report Preview</CardTitle>
          <CardDescription>
            Showing data for {format(dateRange.from, "PPP")} to {format(dateRange.to, "PPP")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            <p>Total Records: {generateReportData().length}</p>
            {generateReportData().length === 0 ? (
              <div className="mt-4 p-4 bg-muted rounded-md">
                <p className="font-medium mb-2">No attendance records found for this period.</p>
                <p>To generate reports, you need to:</p>
                <ol className="list-decimal list-inside mt-2 space-y-1">
                  <li>Go to Classes and select a class</li>
                  <li>Mark attendance for students (Present, Absent, Tardy, or Excused)</li>
                  <li>Return here and select today's date to see the records</li>
                </ol>
                <p className="mt-2 text-xs">You can also use the QR Scanner to mark attendance automatically with location tracking.</p>
              </div>
            ) : (
              <p className="mt-2">
                Report includes attendance status, location tracking, and timestamps for all selected classes and date range.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}