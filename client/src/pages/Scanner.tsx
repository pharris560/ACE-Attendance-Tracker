import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import QRScanner from "@/components/QRScanner";
import { QrCode, CheckCircle, XCircle, Clock, User, MapPin } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Scanner() {
  const [scanHistory, setScanHistory] = useState<Array<{
    id: string;
    result: string;
    timestamp: Date;
    status: 'success' | 'error';
    userName?: string;
    location?: {
      latitude: number;
      longitude: number;
      accuracy: number;
    };
  }>>([]);
  const { toast } = useToast();

  const markAttendanceMutation = useMutation({
    mutationFn: async (data: {
      studentId: string;
      classId?: string;
      status: 'present' | 'absent' | 'tardy' | 'excused';
      location?: any;
    }) => {
      // Get current date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];
      
      // For now, use a default class ID if not provided
      const classId = data.classId || 'default-class';
      
      return apiRequest('/api/attendance', {
        method: 'POST',
        body: {
          studentId: data.studentId,
          classId: classId,
          date: today,
          status: data.status,
          notes: 'Marked via QR code scanner',
          ...(data.location && {
            latitude: data.location.latitude,
            longitude: data.location.longitude,
            locationAccuracy: data.location.accuracy,
            checkInTime: new Date().toISOString(),
          }),
        },
      });
    },
    onSuccess: (data, variables) => {
      toast({
        title: "Attendance Marked",
        description: `Successfully checked in ${variables.studentId}`,
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to mark attendance",
        description: error.message || "Please try again",
      });
    },
  });

  const handleScanSuccess = async (result: string, location?: any) => {
    console.log('QR scan successful:', result, 'Location:', location);
    
    // Parse QR code data (format: studentId-email-role)
    const parts = result.split('-');
    const studentId = parts[0] || result;
    const email = parts[1];
    const role = parts[2];
    
    // Mark attendance in backend
    try {
      await markAttendanceMutation.mutateAsync({
        studentId,
        status: 'present',
        location,
      });
      
      setScanHistory(prev => [{
        id: Date.now().toString(),
        result,
        timestamp: new Date(),
        status: 'success',
        userName: email || studentId,
        location,
      }, ...prev.slice(0, 9)]); // Keep last 10 scans
    } catch (error) {
      console.error('Failed to mark attendance:', error);
      setScanHistory(prev => [{
        id: Date.now().toString(),
        result,
        timestamp: new Date(),
        status: 'error',
        userName: email || studentId,
      }, ...prev.slice(0, 9)]);
    }
  };

  const handleScanError = (error: string) => {
    console.log('QR scan error:', error);
    
    setScanHistory(prev => [{
      id: Date.now().toString(),
      result: error,
      timestamp: new Date(),
      status: 'error'
    }, ...prev.slice(0, 9)]);
  };

  return (
    <div className="space-y-6" data-testid="scanner-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">QR Code Scanner</h1>
          <p className="text-muted-foreground">
            Scan QR codes to quickly mark attendance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {scanHistory.filter(s => s.status === 'success').length} successful scans today
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scanner Section */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                Live Scanner
              </CardTitle>
            </CardHeader>
            <CardContent>
              <QRScanner
                onScanSuccess={handleScanSuccess}
                onScanError={handleScanError}
                captureLocation={true}
              />
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>How to Use</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                  1
                </div>
                <div>
                  <h4 className="font-medium text-sm">Start Scanner</h4>
                  <p className="text-xs text-muted-foreground">
                    Click "Start Scanning" to activate your camera
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                  2
                </div>
                <div>
                  <h4 className="font-medium text-sm">Align QR Code</h4>
                  <p className="text-xs text-muted-foreground">
                    Point your camera at the QR code on the ID card
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                  3
                </div>
                <div>
                  <h4 className="font-medium text-sm">Automatic Detection</h4>
                  <p className="text-xs text-muted-foreground">
                    Attendance will be marked automatically upon successful scan
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Scan History */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Scans
              </CardTitle>
            </CardHeader>
            <CardContent>
              {scanHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <QrCode className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No scans yet</p>
                  <p className="text-xs">Scan a QR code to see results here</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {scanHistory.map((scan) => (
                    <div
                      key={scan.id}
                      className="flex items-start gap-3 p-3 border rounded-lg hover-elevate"
                      data-testid={`scan-result-${scan.id}`}
                    >
                      <div className="mt-1">
                        {scan.status === 'success' ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {scan.userName && (
                              <User className="h-3 w-3 text-muted-foreground" />
                            )}
                            <span className="font-medium text-sm">
                              {scan.userName || 'Unknown User'}
                            </span>
                          </div>
                          <Badge
                            variant={scan.status === 'success' ? 'default' : 'destructive'}
                            className="text-xs"
                          >
                            {scan.status}
                          </Badge>
                        </div>
                        
                        <div className="text-xs text-muted-foreground mt-1">
                          <div className="font-mono break-all">{scan.result}</div>
                          <div className="mt-1">
                            {scan.timestamp.toLocaleString()}
                          </div>
                          {scan.location && (
                            <div className="mt-1 flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              <span>Location: ±{Math.round(scan.location.accuracy)}m</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {scanHistory.filter(s => s.status === 'success').length}
                </div>
                <div className="text-xs text-muted-foreground">Successful</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-600">
                  {scanHistory.filter(s => s.status === 'error').length}
                </div>
                <div className="text-xs text-muted-foreground">Failed</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Tips */}
      <Alert>
        <QrCode className="h-4 w-4" />
        <AlertDescription>
          <strong>Tips for better scanning:</strong> Ensure good lighting, hold the device steady, 
          and make sure the QR code is clearly visible and not damaged.
        </AlertDescription>
      </Alert>
    </div>
  );
}