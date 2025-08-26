import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  Download, 
  Info, 
  Layers, 
  Triangle, 
  Box, 
  Palette,
  FileText,
  Clock
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface ModelInfo {
  name: string;
  format: string;
  size: number;
  triangles: number;
  vertices: number;
  materials: number;
  bones?: number;
  textures: string[];
  meshes: string[];
  loadTime: number;
}

interface ModelInfoPanelProps {
  modelInfo?: ModelInfo;
  isLoading?: boolean;
}

export const ModelInfoPanel = ({ modelInfo, isLoading = false }: ModelInfoPanelProps) => {
  const [activeTab, setActiveTab] = useState<'info' | 'meshes' | 'materials'>('info');

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleExport = (format: string) => {
    toast.success(`تصدير النموذج بصيغة ${format}...`);
  };

  // Sample data when no model is loaded
  const defaultModelInfo: ModelInfo = {
    name: 'عينة من نماذج IGI2',
    format: 'MEF',
    size: 2458112,
    triangles: 15420,
    vertices: 8932,
    materials: 5,
    bones: 25,
    textures: ['soldier_diffuse.dds', 'soldier_normal.dds', 'weapon_diffuse.dds'],
    meshes: ['Body', 'Head', 'Arms', 'Legs', 'Equipment'],
    loadTime: 245
  };

  const info = modelInfo || defaultModelInfo;

  return (
    <Card className="h-full bg-viewer-panel border-border/50 shadow-panel flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" />
            معلومات النموذج
          </h3>
          <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
            {info.format}
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 pt-4">
        <div className="flex gap-1 bg-viewer-control/30 p-1 rounded-lg">
          {[
            { id: 'info', label: 'معلومات', icon: FileText },
            { id: 'meshes', label: 'الشبكات', icon: Layers },
            { id: 'materials', label: 'المواد', icon: Palette }
          ].map(tab => {
            const IconComponent = tab.icon;
            return (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab(tab.id as any)}
                className={activeTab === tab.id ? 'bg-primary/20 text-primary' : ''}
              >
                <IconComponent className="h-4 w-4 mr-1" />
                {tab.label}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-y-auto">
        {activeTab === 'info' && (
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">معلومات الملف</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">الاسم:</span>
                  <span className="text-sm font-medium">{info.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">الحجم:</span>
                  <span className="text-sm font-medium">{formatFileSize(info.size)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    وقت التحميل:
                  </span>
                  <span className="text-sm font-medium">{info.loadTime}ms</span>
                </div>
              </div>
            </div>

            <Separator className="bg-border/50" />

            <div>
              <h4 className="text-sm font-medium mb-2">الهندسة</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Triangle className="h-3 w-3" />
                    المثلثات:
                  </span>
                  <span className="text-sm font-medium">{info.triangles.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Box className="h-3 w-3" />
                    الرؤوس:
                  </span>
                  <span className="text-sm font-medium">{info.vertices.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">المواد:</span>
                  <span className="text-sm font-medium">{info.materials}</span>
                </div>
                {info.bones && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">العظام:</span>
                    <span className="text-sm font-medium">{info.bones}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Quality Indicator */}
            <div>
              <h4 className="text-sm font-medium mb-2">جودة النموذج</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">التفاصيل</span>
                  <span className="text-xs font-medium">عالية</span>
                </div>
                <Progress value={85} className="h-2" />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'meshes' && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">الشبكات ({info.meshes.length})</h4>
            {info.meshes.map((mesh, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-viewer-control/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{mesh}</span>
                </div>
                <Badge variant="outline">
                  مرئي
                </Badge>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'materials' && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">الخامات والتكسات</h4>
            {info.textures.map((texture, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-viewer-control/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <Palette className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{texture}</span>
                </div>
                <Badge variant="outline">
                  DDS
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Export Actions */}
      <div className="p-4 border-t border-border/50 space-y-2">
        <h4 className="text-sm font-medium mb-2">تصدير النموذج</h4>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('OBJ')}
            className="bg-viewer-control/30 hover:bg-viewer-control"
          >
            <Download className="h-3 w-3 mr-1" />
            OBJ
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('FBX')}
            className="bg-viewer-control/30 hover:bg-viewer-control"
          >
            <Download className="h-3 w-3 mr-1" />
            FBX
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('GLTF')}
            className="bg-viewer-control/30 hover:bg-viewer-control"
          >
            <Download className="h-3 w-3 mr-1" />
            GLTF
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('JSON')}
            className="bg-viewer-control/30 hover:bg-viewer-control"
          >
            <Download className="h-3 w-3 mr-1" />
            JSON
          </Button>
        </div>
      </div>
    </Card>
  );
};