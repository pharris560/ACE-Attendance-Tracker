import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { UserCheck, QrCode, Mail, Phone } from "lucide-react";

interface UserCardProps {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: "student" | "staff";
  class?: string;
  department?: string;
  photo?: string;
  status: "present" | "absent" | "tardy" | "excused" | "other";
  lastSeen?: Date;
  onMarkAttendance?: (id: string, status: string) => void;
  onGenerateQR?: (id: string) => void;
  onViewProfile?: (id: string) => void;
}

export default function UserCard({
  id,
  name,
  email,
  phone,
  role,
  class: userClass,
  department,
  photo,
  status,
  lastSeen,
  onMarkAttendance,
  onGenerateQR,
  onViewProfile
}: UserCardProps) {
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

  return (
    <Card className="hover-elevate transition-all duration-200" data-testid={`card-user-${id}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={photo} alt={name} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {getInitials(name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm truncate" data-testid={`text-name-${id}`}>
                {name}
              </h3>
              <p className="text-xs text-muted-foreground truncate">
                {role === "student" ? userClass : department}
              </p>
            </div>
          </div>
          <Badge className={`text-xs ${getStatusColor(status)}`} data-testid={`status-${status}-${id}`}>
            {status}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Mail className="h-3 w-3" />
            <span className="truncate">{email}</span>
          </div>
          {phone && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Phone className="h-3 w-3" />
              <span>{phone}</span>
            </div>
          )}
          {lastSeen && (
            <div className="text-xs text-muted-foreground">
              Last seen: {lastSeen.toLocaleDateString()}
            </div>
          )}
        </div>
        
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-xs"
            onClick={() => onMarkAttendance?.(id, "present")}
            data-testid={`button-mark-present-${id}`}
          >
            <UserCheck className="h-3 w-3 mr-1" />
            Mark Present
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onGenerateQR?.(id)}
            data-testid={`button-generate-qr-${id}`}
          >
            <QrCode className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}