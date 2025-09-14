import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Filter, Download, QrCode, UserCheck, UserX, Clock, AlertCircle } from "lucide-react";

interface AttendanceRecord {
  id: string;
  name: string;
  email: string;
  role: "student" | "staff";
  class?: string;
  department?: string;
  status: "present" | "absent" | "tardy" | "excused" | "other";
  checkInTime?: Date;
  photo?: string;
}

interface AttendanceTableProps {
  records: AttendanceRecord[];
  onStatusChange?: (id: string, status: string) => void;
  onGenerateQR?: (id: string) => void;
  onExportData?: () => void;
}

export default function AttendanceTable({ 
  records, 
  onStatusChange, 
  onGenerateQR,
  onExportData
}: AttendanceTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "present":
        return <UserCheck className="h-4 w-4 text-green-600" />;
      case "absent":
        return <UserX className="h-4 w-4 text-red-600" />;
      case "tardy":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "excused":
        return <AlertCircle className="h-4 w-4 text-blue-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
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

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const filteredRecords = records.filter((record) => {
    const matchesSearch = record.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || record.status === statusFilter;
    const matchesRole = roleFilter === "all" || record.role === roleFilter;
    
    return matchesSearch && matchesStatus && matchesRole;
  });

  return (
    <Card data-testid="attendance-table">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Attendance Records</CardTitle>
          <Button onClick={onExportData} variant="outline" size="sm" data-testid="button-export">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
              data-testid="input-search"
            />
          </div>
          
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32" data-testid="select-status-filter">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="present">Present</SelectItem>
                <SelectItem value="absent">Absent</SelectItem>
                <SelectItem value="tardy">Tardy</SelectItem>
                <SelectItem value="excused">Excused</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-32" data-testid="select-role-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="student">Students</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role & Group</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Check-in Time</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No records found
                  </TableCell>
                </TableRow>
              ) : (
                filteredRecords.map((record) => (
                  <TableRow key={record.id} data-testid={`row-user-${record.id}`} className="hover-elevate">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={record.photo} alt={record.name} />
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {getInitials(record.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-sm" data-testid={`text-name-${record.id}`}>
                            {record.name}
                          </div>
                          <div className="text-xs text-muted-foreground">{record.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="capitalize">{record.role}</div>
                        <div className="text-xs text-muted-foreground">
                          {record.role === "student" ? record.class : record.department}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getStatusColor(record.status)} flex items-center gap-1 w-fit`}>
                        {getStatusIcon(record.status)}
                        {record.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {record.checkInTime ? (
                          <>
                            <div>{record.checkInTime.toLocaleTimeString()}</div>
                            <div className="text-xs text-muted-foreground">
                              {record.checkInTime.toLocaleDateString()}
                            </div>
                          </>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Select 
                          value={record.status} 
                          onValueChange={(value) => onStatusChange?.(record.id, value)}
                        >
                          <SelectTrigger className="w-24 h-8 text-xs" data-testid={`select-status-${record.id}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="present">Present</SelectItem>
                            <SelectItem value="absent">Absent</SelectItem>
                            <SelectItem value="tardy">Tardy</SelectItem>
                            <SelectItem value="excused">Excused</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onGenerateQR?.(record.id)}
                          data-testid={`button-qr-${record.id}`}
                        >
                          <QrCode className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        {filteredRecords.length > 0 && (
          <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
            <div>
              Showing {filteredRecords.length} of {records.length} records
            </div>
            <div>
              {filteredRecords.filter(r => r.status === "present").length} present • {" "}
              {filteredRecords.filter(r => r.status === "absent").length} absent • {" "}
              {filteredRecords.filter(r => r.status === "tardy").length} tardy
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}