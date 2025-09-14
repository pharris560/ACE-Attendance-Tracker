import AttendanceTable from '../AttendanceTable';

export default function AttendanceTableExample() {
  // Mock data for demonstration
  const mockRecords = [
    {
      id: "STU001",
      name: "John Doe",
      email: "john.doe@school.edu",
      role: "student" as const,
      class: "Class A",
      status: "present" as const,
      checkInTime: new Date(),
      photo: ""
    },
    {
      id: "STU002", 
      name: "Jane Smith",
      email: "jane.smith@school.edu",
      role: "student" as const,
      class: "Class B",
      status: "absent" as const,
      photo: ""
    },
    {
      id: "STF001",
      name: "Dr. Wilson",
      email: "wilson@school.edu", 
      role: "staff" as const,
      department: "Mathematics",
      status: "present" as const,
      checkInTime: new Date(Date.now() - 3600000),
      photo: ""
    },
    {
      id: "STU003",
      name: "Mike Johnson",
      email: "mike.johnson@school.edu",
      role: "student" as const, 
      class: "Class A",
      status: "tardy" as const,
      checkInTime: new Date(Date.now() - 1800000),
      photo: ""
    }
  ];

  const handleStatusChange = (id: string, status: string) => {
    console.log(`Changing status for ${id} to ${status}`);
  };

  const handleGenerateQR = (id: string) => {
    console.log(`Generating QR code for ${id}`);
  };

  const handleExportData = () => {
    console.log('Exporting attendance data');
  };

  return (
    <div className="p-4">
      <AttendanceTable
        records={mockRecords}
        onStatusChange={handleStatusChange}
        onGenerateQR={handleGenerateQR}
        onExportData={handleExportData}
      />
    </div>
  );
}