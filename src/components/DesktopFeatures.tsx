import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  Monitor, 
  Download, 
  HardDrive, 
  Zap, 
  Shield, 
  Settings,
  ExternalLink,
  Smartphone,
  Globe
} from 'lucide-react';

interface SystemInfo {
  platform: string;
  isElectron: boolean;
  webGL: boolean;
  memory: string;
  cores: number;
}

export const DesktopFeatures = () => {
  const [systemInfo, setSystemInfo] = useState<SystemInfo>({
    platform: 'Web',
    isElectron: false,
    webGL: false,
    memory: 'Unknown',
    cores: 1
  });

  useEffect(() => {
    const detectSystem = async () => {
      // Check if running in Electron
      const isElectron = !!(window as any).electronAPI;
      
      // Detect platform
      let platform = 'Web Browser';
      if (isElectron) {
        platform = (window as any).electronAPI?.platform || 'Desktop';
      } else if (navigator.platform) {
        if (navigator.platform.includes('Win')) platform = 'Windows (Web)';
        else if (navigator.platform.includes('Mac')) platform = 'macOS (Web)';
        else if (navigator.platform.includes('Linux')) platform = 'Linux (Web)';
      }

      // Check WebGL support
      const canvas = document.createElement('canvas');
      const webGL = !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));

      // Get system info
      const memory = (navigator as any).deviceMemory 
        ? `${(navigator as any).deviceMemory}GB` 
        : 'Unknown';
      const cores = navigator.hardwareConcurrency || 1;

      setSystemInfo({
        platform,
        isElectron,
        webGL,
        memory,
        cores
      });
    };

    detectSystem();
  }, []);

  const downloadDesktopApp = () => {
    // This would link to actual download sources
    toast.info('Desktop app download will be available soon!');
    // window.open('https://github.com/your-repo/releases', '_blank');
  };

  const openInBrowser = () => {
    if (systemInfo.isElectron && (window as any).electronAPI?.openExternal) {
      (window as any).electronAPI.openExternal(window.location.href);
    } else {
      window.open(window.location.href, '_blank');
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Monitor className="w-5 h-5" />
          Platform & System Info
        </CardTitle>
        <CardDescription>
          Current platform status and desktop application information
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* System Status */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Platform</span>
                <Badge variant={systemInfo.isElectron ? "default" : "secondary"}>
                  {systemInfo.platform}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">WebGL Support</span>
                <Badge variant={systemInfo.webGL ? "default" : "destructive"}>
                  {systemInfo.webGL ? 'Supported' : 'Not Available'}
                </Badge>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Memory</span>
                <span className="text-sm text-muted-foreground">{systemInfo.memory}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">CPU Cores</span>
                <span className="text-sm text-muted-foreground">{systemInfo.cores}</span>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Desktop App Features */}
        <div className="space-y-4">
          <h4 className="font-semibold flex items-center gap-2">
            <HardDrive className="w-4 h-4" />
            Desktop Application Features
          </h4>
          
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <Zap className="w-4 h-4 mt-0.5 text-primary" />
              <div>
                <p className="font-medium">Better Performance</p>
                <p className="text-muted-foreground">Native hardware acceleration and unlimited memory usage</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Shield className="w-4 h-4 mt-0.5 text-primary" />
              <div>
                <p className="font-medium">Full WebGL Support</p>
                <p className="text-muted-foreground">Guaranteed 3D rendering without browser limitations</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Settings className="w-4 h-4 mt-0.5 text-primary" />
              <div>
                <p className="font-medium">Advanced Features</p>
                <p className="text-muted-foreground">File system access, batch processing, and RES archive management</p>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Action Buttons */}
        <div className="space-y-3">
          {!systemInfo.isElectron ? (
            <div className="space-y-3">
              <Button 
                onClick={downloadDesktopApp}
                className="w-full"
                size="lg"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Desktop Version
              </Button>
              
              <p className="text-xs text-muted-foreground text-center">
                Available for Windows, macOS, and Linux
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-center p-4 bg-primary/10 rounded-lg">
                <Monitor className="w-8 h-8 mx-auto mb-2 text-primary" />
                <p className="font-medium">Desktop App Active</p>
                <p className="text-sm text-muted-foreground">You're using the full desktop version</p>
              </div>
              
              <Button 
                variant="outline"
                onClick={openInBrowser}
                className="w-full"
              >
                <Globe className="w-4 h-4 mr-2" />
                Open in Browser
              </Button>
            </div>
          )}
        </div>

        {/* Download Links */}
        {!systemInfo.isElectron && (
          <div className="space-y-2">
            <h5 className="text-sm font-medium">Download Sources</h5>
            <div className="grid grid-cols-1 gap-2 text-xs">
              <Button variant="ghost" size="sm" className="justify-start h-8">
                <ExternalLink className="w-3 h-3 mr-2" />
                GitHub Releases
              </Button>
              <Button variant="ghost" size="sm" className="justify-start h-8">
                <ExternalLink className="w-3 h-3 mr-2" />
                MediaFire
              </Button>
              <Button variant="ghost" size="sm" className="justify-start h-8">
                <ExternalLink className="w-3 h-3 mr-2" />
                Direct Download
              </Button>
            </div>
          </div>
        )}

        {/* WebGL Warning */}
        {!systemInfo.webGL && !systemInfo.isElectron && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-destructive" />
              <span className="text-sm font-medium text-destructive">WebGL Not Available</span>
            </div>
            <p className="text-xs text-muted-foreground">
              3D model viewing requires WebGL support. Download the desktop version for guaranteed compatibility.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};