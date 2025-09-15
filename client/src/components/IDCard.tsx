import { forwardRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import aceLogo from "@assets/ACE Logo_1757967694275.jpeg";

interface IDCardProps {
  id: string;
  name: string;
  role: "student" | "staff";
  class?: string;
  department?: string;
  photo?: string;
  companyName?: string;
  qrData: string;
}

const IDCard = forwardRef<HTMLDivElement, IDCardProps>(({
  id,
  name,
  role,
  class: userClass,
  department,
  photo,
  companyName = "ACE Academy",
  qrData
}, ref) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");

  useEffect(() => {
    const generateQRCode = async () => {
      try {
        const url = await QRCode.toDataURL(qrData, {
          width: 80,
          margin: 1,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        setQrCodeUrl(url);
      } catch (error) {
        console.error('Error generating QR code:', error);
      }
    };

    generateQRCode();
  }, [qrData]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div ref={ref} className="w-full" data-testid={`id-card-${id}`}>
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-background via-background to-primary/5 dark:from-background dark:via-background dark:to-primary/10 print:shadow-none">
        <CardContent className="p-4 space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <img src={aceLogo} alt={companyName} className="h-16 w-16 object-contain rounded" />
            <Badge variant={role === "staff" ? "default" : "secondary"} className="text-xs">
              {role.toUpperCase()}
            </Badge>
          </div>

          {/* Photo and Info Section */}
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16 border-2 border-primary/20 flex-shrink-0">
              <AvatarImage src={photo} alt={name} />
              <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">
                {getInitials(name)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-2">
              <div>
                <h2 className="font-bold text-lg leading-tight" data-testid={`id-name-${id}`}>
                  {name}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {role === "student" ? userClass : department}
                </p>
              </div>
              
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Student ID:</span>
                  <span className="font-mono">{id}</span>
                </div>
                {role === "student" && userClass && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Class:</span>
                    <span>{userClass}</span>
                  </div>
                )}
                {role === "staff" && department && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Dept:</span>
                    <span>{department}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* QR Code Section */}
          <div className="flex items-center justify-between pt-2 border-t border-primary/20">
            <div className="text-xs text-muted-foreground">
              <p>Scan for attendance</p>
              <p className="font-mono text-[10px] opacity-60">#{id}</p>
            </div>
            
            {qrCodeUrl && (
              <div className="bg-white p-1.5 rounded border border-gray-200" data-testid={`qr-code-${id}`}>
                <img src={qrCodeUrl} alt="QR Code" className="w-14 h-14" />
              </div>
            )}
          </div>

        </CardContent>
      </Card>
    </div>
  );
});

IDCard.displayName = "IDCard";

export default IDCard;