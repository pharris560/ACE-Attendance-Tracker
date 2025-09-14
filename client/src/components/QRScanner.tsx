import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Camera, CameraOff, CheckCircle, XCircle } from "lucide-react";
import Webcam from "react-webcam";
import QrScanner from "qr-scanner";

interface QRScannerProps {
  onScanSuccess?: (result: string) => void;
  onScanError?: (error: string) => void;
}

export default function QRScanner({ onScanSuccess, onScanError }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const webcamRef = useRef<Webcam>(null);
  const scannerRef = useRef<QrScanner | null>(null);

  useEffect(() => {
    // Check camera permission
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(() => setHasPermission(true))
      .catch(() => setHasPermission(false));

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop();
      }
    };
  }, []);

  const startScanning = async () => {
    if (!webcamRef.current?.video) return;
    
    try {
      setIsScanning(true);
      setError(null);
      
      const video = webcamRef.current.video;
      
      if (scannerRef.current) {
        scannerRef.current.stop();
      }
      
      scannerRef.current = new QrScanner(
        video,
        (result) => {
          console.log('QR Code scanned:', result.data);
          setLastResult(result.data);
          onScanSuccess?.(result.data);
          setIsScanning(false);
        },
        {
          onDecodeError: (error) => {
            // Silently handle decode errors as they're common during scanning
          },
          highlightScanRegion: true,
          highlightCodeOutline: true,
        }
      );
      
      await scannerRef.current.start();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to start camera';
      setError(errorMsg);
      onScanError?.(errorMsg);
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    if (scannerRef.current) {
      scannerRef.current.stop();
    }
    setIsScanning(false);
  };

  if (hasPermission === false) {
    return (
      <Card data-testid="qr-scanner-no-permission">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CameraOff className="h-5 w-5" />
            Camera Permission Required
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              Camera access is required to scan QR codes. Please enable camera permissions in your browser settings.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto" data-testid="qr-scanner">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          QR Code Scanner
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
          {hasPermission && (
            <Webcam
              ref={webcamRef}
              audio={false}
              className="w-full h-full object-cover"
              videoConstraints={{
                width: 300,
                height: 300,
                facingMode: "environment"
              }}
              data-testid="webcam-video"
            />
          )}
          
          {isScanning && (
            <div className="absolute inset-0 border-2 border-primary animate-pulse">
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="w-32 h-32 border-2 border-primary border-dashed rounded-lg"></div>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          {!isScanning ? (
            <Button 
              onClick={startScanning} 
              className="flex-1"
              data-testid="button-start-scan"
              disabled={!hasPermission}
            >
              <Camera className="h-4 w-4 mr-2" />
              Start Scanning
            </Button>
          ) : (
            <Button 
              onClick={stopScanning} 
              variant="outline" 
              className="flex-1"
              data-testid="button-stop-scan"
            >
              <CameraOff className="h-4 w-4 mr-2" />
              Stop Scanning
            </Button>
          )}
        </div>

        {error && (
          <Alert variant="destructive" data-testid="qr-scanner-error">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {lastResult && (
          <Alert data-testid="qr-scanner-result">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-medium">Scanned successfully!</div>
              <div className="text-sm mt-1 font-mono break-all">{lastResult}</div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}