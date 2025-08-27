import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Box, 
  Github, 
  Download, 
  HelpCircle, 
  Settings,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';

export const Header = () => {
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
              onClick={() => handleAction('Download Tool')}
              className="bg-primary/10 border-primary/30 text-primary hover:bg-primary/20"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Tool
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleAction('Settings')}
              className="text-muted-foreground hover:text-foreground"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};