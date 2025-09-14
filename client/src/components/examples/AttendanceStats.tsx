import AttendanceStats from '../AttendanceStats';

export default function AttendanceStatsExample() {
  return (
    <div className="p-4">
      <AttendanceStats
        totalUsers={120}
        presentCount={95}
        absentCount={15}
        tardyCount={8}
        excusedCount={2}
        date={new Date()}
      />
    </div>
  );
}