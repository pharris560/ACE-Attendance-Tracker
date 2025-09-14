import UserCard from '../UserCard';

export default function UserCardExample() {
  const handleMarkAttendance = (id: string, status: string) => {
    console.log(`Marking attendance for ${id} as ${status}`);
  };

  const handleGenerateQR = (id: string) => {
    console.log(`Generating QR code for user ${id}`);
  };

  const handleViewProfile = (id: string) => {
    console.log(`Viewing profile for user ${id}`);
  };

  return (
    <div className="p-4 max-w-sm">
      <UserCard
        id="user-001"
        name="John Doe"
        email="john.doe@example.com"
        phone="+1 (555) 123-4567"
        role="student"
        class="Class A"
        photo=""
        status="present"
        lastSeen={new Date()}
        onMarkAttendance={handleMarkAttendance}
        onGenerateQR={handleGenerateQR}
        onViewProfile={handleViewProfile}
      />
    </div>
  );
}