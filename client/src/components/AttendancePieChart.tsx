import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface ClassAttendanceData {
  className: string;
  attendanceData: {
    status: 'present' | 'absent' | 'tardy' | 'excused';
    count: number;
    color: string;
  }[];
  totalStudents: number;
}

interface AttendancePieChartProps {
  classData: ClassAttendanceData;
}

const statusLabels = {
  present: 'Present',
  absent: 'Absent', 
  tardy: 'Tardy',
  excused: 'Excused'
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-popover border border-popover-border rounded-md p-3 shadow-md">
        <p className="font-medium">{statusLabels[data.status as keyof typeof statusLabels]}</p>
        <p className="text-sm text-muted-foreground">
          {data.count} students ({((data.count / data.total) * 100).toFixed(1)}%)
        </p>
      </div>
    );
  }
  return null;
};

const CustomLegend = ({ payload }: any) => {
  return (
    <div className="flex flex-wrap justify-center gap-2 mt-4">
      {payload.map((entry: any, index: number) => (
        <Badge
          key={index}
          variant="secondary"
          className="flex items-center gap-1 text-xs"
          data-testid={`legend-${entry.payload.status}`}
        >
          <div 
            className="w-2 h-2 rounded-full" 
            style={{ backgroundColor: entry.color }}
          />
          {statusLabels[entry.payload.status as keyof typeof statusLabels]} ({entry.payload.count})
        </Badge>
      ))}
    </div>
  );
};

export default function AttendancePieChart({ classData }: AttendancePieChartProps) {
  const { className, attendanceData, totalStudents } = classData;

  // Filter out zero counts and add total for percentage calculation
  const chartData = attendanceData
    .filter(item => item.count > 0)
    .map(item => ({
      ...item,
      total: totalStudents
    }));

  const presentCount = attendanceData.find(item => item.status === 'present')?.count || 0;
  const attendanceRate = totalStudents > 0 ? (presentCount / totalStudents) * 100 : 0;

  return (
    <Card className="w-full" data-testid={`pie-chart-${className.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">{className}</CardTitle>
          <Badge 
            variant={attendanceRate >= 90 ? "default" : attendanceRate >= 75 ? "secondary" : "destructive"}
            data-testid={`attendance-rate-${className.toLowerCase().replace(/\s+/g, '-')}`}
          >
            {attendanceRate.toFixed(1)}% Present
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {totalStudents} total students
        </p>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="40%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="count"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend content={<CustomLegend />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <p className="font-medium">No attendance data</p>
              <p className="text-sm">All students are unaccounted for</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}