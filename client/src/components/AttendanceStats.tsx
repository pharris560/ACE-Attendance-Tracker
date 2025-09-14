import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Users, UserCheck, UserX, Clock, AlertTriangle } from "lucide-react";

interface AttendanceStatsProps {
  totalUsers: number;
  presentCount: number;
  absentCount: number;
  tardyCount: number;
  excusedCount: number;
  date?: Date;
}

export default function AttendanceStats({
  totalUsers,
  presentCount,
  absentCount,
  tardyCount,
  excusedCount,
  date = new Date()
}: AttendanceStatsProps) {
  const presentPercentage = totalUsers > 0 ? (presentCount / totalUsers) * 100 : 0;
  const absentPercentage = totalUsers > 0 ? (absentCount / totalUsers) * 100 : 0;
  const tardyPercentage = totalUsers > 0 ? (tardyCount / totalUsers) * 100 : 0;

  const stats = [
    {
      title: "Total Users",
      value: totalUsers,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950"
    },
    {
      title: "Present",
      value: presentCount,
      icon: UserCheck,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950",
      percentage: presentPercentage
    },
    {
      title: "Absent",
      value: absentCount,
      icon: UserX,
      color: "text-red-600",
      bgColor: "bg-red-50 dark:bg-red-950",
      percentage: absentPercentage
    },
    {
      title: "Tardy",
      value: tardyCount,
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50 dark:bg-yellow-950",
      percentage: tardyPercentage
    }
  ];

  return (
    <div className="space-y-4" data-testid="attendance-stats">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Attendance Overview</h2>
        <p className="text-sm text-muted-foreground">
          {date.toLocaleDateString()}
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="hover-elevate" data-testid={`stat-card-${stat.title.toLowerCase().replace(' ', '-')}`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <div className={`${stat.bgColor} p-2 rounded-md`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid={`stat-value-${stat.title.toLowerCase().replace(' ', '-')}`}>
                  {stat.value}
                </div>
                {stat.percentage !== undefined && (
                  <div className="mt-2 space-y-1">
                    <div className="text-xs text-muted-foreground">
                      {stat.percentage.toFixed(1)}% of total
                    </div>
                    <Progress 
                      value={stat.percentage} 
                      className="h-1"
                      data-testid={`progress-${stat.title.toLowerCase().replace(' ', '-')}`}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {excusedCount > 0 && (
        <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/50">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertTriangle className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-sm font-medium">Excused Absences</p>
              <p className="text-xs text-muted-foreground">
                {excusedCount} {excusedCount === 1 ? 'person has' : 'people have'} excused absences today
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}