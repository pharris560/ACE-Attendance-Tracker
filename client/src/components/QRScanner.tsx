import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Camera, CameraOff, CheckCircle, XCircle, MapPin } from "lucide-react";
import Webcam from "react-webcam";
import QrScanner from "qr-scanner";

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  address?: string;
}

interface QRScannerProps {
  onScanSuccess?: (result: string, location?: LocationData) => void;
  onScanError?: (error: string) => void;
  captureLocation?: boolean;
}

export default function QRScanner({ onScanSuccess, onScanError, captureLocation = true }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [locationPermission, setLocationPermission] = useState<boolean | null>(null);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const webcamRef = useRef<Webcam>(null);
  const scannerRef = useRef<QrScanner | null>(null);

  useEffect(() => {
    // Don't check permission initially - let the Webcam component handle it
    // The permission will be requested when user clicks "Start Scanning"
    
    // Check and request location permission if needed
    if (captureLocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocationPermission(true);
          setCurrentLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
        },
        () => setLocationPermission(false),
        { enableHighAccuracy: true }
      );
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop();
      }
    };
  }, [captureLocation]);

  const startScanning = async () => {
    console.log('Starting QR scanner...');
    if (!webcamRef.current?.video) {
      console.error('Webcam video element not found');
      setError('Camera not ready');
      return;
    }
    
    try {
      setIsScanning(true);
      setError(null);
      
      const video = webcamRef.current.video;
      console.log('Video element ready:', video);
      
      if (scannerRef.current) {
        scannerRef.current.stop();
      }
      
      scannerRef.current = new QrScanner(
        video,
        async (result) => {
          console.log('QR Code scanned:', result.data);
          setLastResult(result.data);
          
          // Stop the scanner after successful scan
          if (scannerRef.current) {
            scannerRef.current.stop();
          }
          
          // Capture current location if enabled
          if (captureLocation && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                const location: LocationData = {
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                  accuracy: position.coords.accuracy,
                };
                setCurrentLocation(location);
                onScanSuccess?.(result.data, location);
              },
              (error) => {
                console.error('Location error:', error);
                // Still process scan even if location fails
                onScanSuccess?.(result.data);
              },
              { enableHighAccuracy: true, timeout: 5000 }
            );
          } else {
            onScanSuccess?.(result.data);
          }
          
          setIsScanning(false);
        },
        {
          onDecodeError: (error) => {
            // Log decode errors for debugging (common during scanning)
            const errorMsg = typeof error === 'string' ? error : error.message;
            console.debug('QR decode attempt failed:', errorMsg);
          },
          highlightScanRegion: true,
          highlightCodeOutline: true,
        }
      );
      
      await scannerRef.current.start();
      console.log('QR scanner started successfully');
      setHasPermission(true);
    } catch (err) {
      console.error('Error starting QR scanner:', err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to start camera';
      
      // Check if it's a permission error
      if (errorMsg.includes('permission') || errorMsg.includes('denied')) {
        setHasPermission(false);
        setError('Camera permission denied. Please allow camera access and try again.');
      } else {
        setError(errorMsg);
      }
      
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
          <Webcam
            ref={webcamRef}
            audio={false}
            className="w-full h-full object-cover"
            videoConstraints={{
              width: 300,
              height: 300,
              facingMode: "environment"
            }}
            onUserMedia={() => {
              console.log('Camera access granted');
              setHasPermission(true);
            }}
            onUserMediaError={(err) => {
              console.error('Camera access denied:', err);
              setHasPermission(false);
              setError('Camera access denied. Please allow camera access in your browser.');
            }}
            data-testid="webcam-video"
          />
          
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
              {currentLocation && (
                <div className="text-sm mt-2 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  <span>Location captured (±{Math.round(currentLocation.accuracy)}m)</span>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}