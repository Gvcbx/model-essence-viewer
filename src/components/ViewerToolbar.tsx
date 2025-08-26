import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Move, 
  MousePointer, 
  Eye, 
  EyeOff, 
  Grid3X3, 
  Sun, 
  Moon,
  Settings,
  Maximize,
  Camera,
  Play,
  Pause
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ViewerToolbarProps {
  onToolChange?: (tool: string) => void;
  onViewChange?: (option: string, value: any) => void;
}

export const ViewerToolbar = ({ onToolChange, onViewChange }: ViewerToolbarProps) => {
  const [activeTool, setActiveTool] = useState('select');
  const [showGrid, setShowGrid] = useState(true);
  const [showStats, setShowStats] = useState(true);
  const [autoRotate, setAutoRotate] = useState(false);
  const [lightMode, setLightMode] = useState('studio');

  const handleToolClick = (tool: string) => {
    setActiveTool(tool);
    onToolChange?.(tool);
    
    const toolNames: Record<string, string> = {
      select: 'أداة التحديد',
      move: 'أداة التحريك',
      rotate: 'أداة الدوران',
      zoom: 'أداة التكبير'
    };
    
    toast(`تم تفعيل ${toolNames[tool] || tool}`);
  };

  const handleViewToggle = (option: string) => {
    switch (option) {
      case 'grid':
        setShowGrid(!showGrid);
        onViewChange?.(option, !showGrid);
        toast(`الشبكة ${!showGrid ? 'مفعلة' : 'معطلة'}`);
        break;
      case 'stats':
        setShowStats(!showStats);
        onViewChange?.(option, !showStats);
        toast(`إحصائيات الأداء ${!showStats ? 'مفعلة' : 'معطلة'}`);
        break;
      case 'autoRotate':
        setAutoRotate(!autoRotate);
        onViewChange?.(option, !autoRotate);
        toast(`الدوران التلقائي ${!autoRotate ? 'مفعل' : 'معطل'}`);
        break;
    }
  };

  const handleLightChange = () => {
    const modes = ['studio', 'sunset', 'dawn', 'night'];
    const currentIndex = modes.indexOf(lightMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    setLightMode(nextMode);
    onViewChange?.('lighting', nextMode);
    
    const modeNames: Record<string, string> = {
      studio: 'إضاءة الاستوديو',
      sunset: 'إضاءة الغروب',
      dawn: 'إضاءة الفجر',
      night: 'إضاءة الليل'
    };
    
    toast(`تم التغيير إلى ${modeNames[nextMode]}`);
  };

  const toolButtons = [
    { id: 'select', icon: MousePointer, label: 'تحديد' },
    { id: 'move', icon: Move, label: 'تحريك' },
    { id: 'rotate', icon: RotateCcw, label: 'دوران' },
    { id: 'zoom', icon: ZoomIn, label: 'تكبير' }
  ];

  return (
    <Card className="bg-viewer-toolbar/90 backdrop-blur-sm border-border/50 shadow-panel">
      <div className="p-3">
        <div className="flex items-center gap-2">
          {/* Selection Tools */}
          <div className="flex items-center gap-1">
            {toolButtons.map((tool) => {
              const IconComponent = tool.icon;
              return (
                <Button
                  key={tool.id}
                  variant={activeTool === tool.id ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => handleToolClick(tool.id)}
                  className={cn(
                    "relative",
                    activeTool === tool.id && "bg-primary/20 text-primary border-primary/30"
                  )}
                  title={tool.label}
                >
                  <IconComponent className="h-4 w-4" />
                </Button>
              );
            })}
          </div>

          <Separator orientation="vertical" className="h-8 bg-border/50" />

          {/* View Controls */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleViewToggle('grid')}
              className={cn(
                showGrid && "bg-primary/20 text-primary border-primary/30"
              )}
              title="تبديل الشبكة"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleViewToggle('stats')}
              className={cn(
                showStats && "bg-primary/20 text-primary border-primary/30"
              )}
              title="إحصائيات الأداء"
            >
              {showStats ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleLightChange}
              title="تغيير الإضاءة"
            >
              {lightMode === 'night' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </Button>
          </div>

          <Separator orientation="vertical" className="h-8 bg-border/50" />

          {/* Animation Controls */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleViewToggle('autoRotate')}
              className={cn(
                autoRotate && "bg-primary/20 text-primary border-primary/30"
              )}
              title="الدوران التلقائي"
            >
              {autoRotate ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => onViewChange?.('screenshot', true)}
              title="لقطة شاشة"
            >
              <Camera className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => onViewChange?.('fullscreen', true)}
              title="ملء الشاشة"
            >
              <Maximize className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-8 bg-border/50" />

          {/* Settings */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toast('إعدادات العارض قريباً...')}
            title="الإعدادات"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};