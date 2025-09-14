import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Users, Clock, Edit, Trash2, BookOpen } from "lucide-react";

interface ClassCardProps {
  id: string;
  name: string;
  description?: string;
  capacity: number;
  enrolledCount: number;
  schedule: string;
  instructor?: string;
  location?: string;
  status: "active" | "inactive" | "completed";
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onViewDetails?: (id: string) => void;
}

export default function ClassCard({
  id,
  name,
  description,
  capacity,
  enrolledCount,
  schedule,
  instructor,
  location,
  status,
  onEdit,
  onDelete,
  onViewDetails
}: ClassCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "inactive":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      case "completed":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getCapacityColor = () => {
    const percentage = (enrolledCount / capacity) * 100;
    if (percentage >= 90) return "text-red-600";
    if (percentage >= 75) return "text-yellow-600";
    return "text-green-600";
  };

  return (
    <Card className="hover-elevate transition-all duration-200" data-testid={`card-class-${id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base truncate" data-testid={`text-name-${id}`}>
                {name}
              </h3>
              {instructor && (
                <p className="text-sm text-muted-foreground truncate">
                  {instructor}
                </p>
              )}
            </div>
          </div>
          <Badge className={`text-xs ${getStatusColor(status)}`} data-testid={`status-${status}-${id}`}>
            {status}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {description}
          </p>
        )}
        
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className={getCapacityColor()}>
              {enrolledCount}/{capacity} students
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{schedule}</span>
          </div>
          
          {location && (
            <div className="text-sm text-muted-foreground">
              Location: {location}
            </div>
          )}
        </div>
        
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${Math.min((enrolledCount / capacity) * 100, 100)}%` }}
          />
        </div>
        
        <div className="flex gap-2 pt-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-xs"
            onClick={() => onViewDetails?.(id)}
            data-testid={`button-view-details-${id}`}
          >
            View Details
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onEdit?.(id)}
            data-testid={`button-edit-${id}`}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete?.(id)}
            data-testid={`button-delete-${id}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}