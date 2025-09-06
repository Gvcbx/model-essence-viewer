import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Box, 
  Github, 
  Download, 
  HelpCircle, 
  Settings,
  FileText,
  Monitor,
  Smartphone
} from 'lucide-react';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';

export const Header = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      console.log('BeforeInstallPrompt fired');
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      console.log('App was installed');
      setIsInstalled(true);
      setIsInstallable(false);
      toast.success('تم تثبيت الأداة بنجاح! يمكنك الآن الوصول إليها من سطح المكتب');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches || 
        (window.navigator as any).standalone === true) {
      setIsInstalled(true);
      setIsInstallable(false);
    }

    // For browsers that don't support beforeinstallprompt
    if (!('serviceWorker' in navigator)) {
      console.log('Service Worker not supported');
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallApp = async () => {
    console.log('Install button clicked. Deferred prompt:', !!deferredPrompt);
    
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log('User choice:', outcome);
        
        if (outcome === 'accepted') {
          toast.success('جاري تثبيت الأداة...');
          setIsInstallable(false);
        } else {
          toast.info('تم إلغاء التثبيت');
        }
        setDeferredPrompt(null);
      } catch (error) {
        console.error('Installation failed:', error);
        toast.error('فشل في تثبيت الأداة. جرب من خلال قائمة المتصفح');
      }
    } else {
      // Fallback instructions for manual installation
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isAndroid = /Android/.test(navigator.userAgent);
      const isChrome = /Chrome/.test(navigator.userAgent);
      
      if (isIOS) {
        toast.info('لتثبيت الأداة على iOS: اضغط على زر المشاركة ثم "إضافة إلى الشاشة الرئيسية"');
      } else if (isAndroid || isChrome) {
        toast.info('لتثبيت الأداة: اضغط على القائمة (⋮) في المتصفح واختر "تثبيت التطبيق" أو "إضافة إلى الشاشة الرئيسية"');
      } else {
        toast.info('الأداة متاحة للتثبيت من خلال قائمة المتصفح');
      }
    }
  };

  const handleAction = (action: string) => {
    toast(`${action} coming soon...`);
  };

  return (
    <header className="bg-viewer-toolbar/95 backdrop-blur-sm border-b border-border/50 shadow-elegant">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-primary rounded-lg shadow-glow">
                <Box className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                  IGI2 Model Viewer
                </h1>
                <p className="text-sm text-muted-foreground">
                  MEF File Viewer - Project IGI 2: Covert Strike
                </p>
              </div>
            </div>
            
            <Badge variant="secondary" className="bg-accent/20 text-accent border-accent/30">
              v1.0.0
            </Badge>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleAction('Help')}
              className="text-muted-foreground hover:text-foreground"
            >
              <HelpCircle className="h-4 w-4 mr-2" />
              Help
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleAction('Documentation')}
              className="text-muted-foreground hover:text-foreground"
            >
              <FileText className="h-4 w-4 mr-2" />
              Docs
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open('https://github.com/coreynguyen/cpp_igi2_mefview', '_blank')}
              className="text-muted-foreground hover:text-foreground"
            >
              <Github className="h-4 w-4 mr-2" />
              Source
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleInstallApp}
              className={`${
                isInstalled
                  ? 'bg-green-500/10 border-green-500/30 text-green-500 hover:bg-green-500/20'
                  : isInstallable 
                    ? 'bg-primary/10 border-primary/30 text-primary hover:bg-primary/20' 
                    : 'bg-muted/50 border-muted text-muted-foreground hover:bg-muted'
              }`}
              disabled={isInstalled}
            >
              <Download className="h-4 w-4 mr-2" />
              {isInstalled ? 'مُثبت ✓' : isInstallable ? 'تثبيت الأداة' : 'تثبيت الأداة'}
            </Button>

            <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    إعدادات التطبيق
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-sm">معلومات التثبيت</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2">
                          <Monitor className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">حالة التثبيت على سطح المكتب</span>
                        </div>
                        <Badge variant={isInstalled ? "default" : "secondary"}>
                          {isInstalled ? "مُثبت" : "غير مُثبت"}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2">
                          <Smartphone className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">دعم PWA</span>
                        </div>
                        <Badge variant={isInstallable || isInstalled ? "default" : "secondary"}>
                          {isInstallable || isInstalled ? "مدعوم" : "غير مدعوم"}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-sm">معلومات التطبيق</h3>
                    <div className="text-sm text-muted-foreground space-y-2">
                      <p>• عارض ملفات MEF من لعبة IGI2</p>
                      <p>• يدعم عرض النماذج ثلاثية الأبعاد</p>
                      <p>• يمكن تثبيته كتطبيق سطح مكتب</p>
                      <p>• يعمل بدون اتصال إنترنت بعد التثبيت</p>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </header>
  );
};