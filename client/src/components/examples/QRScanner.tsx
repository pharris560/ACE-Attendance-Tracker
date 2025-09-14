import QRScanner from '../QRScanner';

export default function QRScannerExample() {
  const handleScanSuccess = (result: string) => {
    console.log('QR Code scanned successfully:', result);
  };

  const handleScanError = (error: string) => {
    console.log('QR scan error:', error);
  };

  return (
    <div className="p-4">
      <QRScanner
        onScanSuccess={handleScanSuccess}
        onScanError={handleScanError}
      />
    </div>
  );
}