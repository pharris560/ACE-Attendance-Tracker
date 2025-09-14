import IDCard from '../IDCard';

export default function IDCardExample() {
  return (
    <div className="p-4">
      <IDCard
        id="STU001"
        name="John Doe"
        role="student"
        class="Class A"
        photo=""
        companyName="Mountain View Academy"
        qrData="STU001-john.doe-student"
      />
    </div>
  );
}