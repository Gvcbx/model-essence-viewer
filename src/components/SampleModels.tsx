import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  Eye, 
  Layers, 
  Triangle,
  User,
  Zap,
  Shield
} from 'lucide-react';
import { toast } from 'sonner';

interface SampleModel {
  id: string;
  name: string;
  description: string;
  category: 'character' | 'weapon' | 'vehicle' | 'environment';
  triangles: number;
  vertices: number;
  size: string;
  preview: string;
  downloadUrl?: string;
}

interface SampleModelsProps {
  onModelSelect: (model: SampleModel) => void;
}

export const SampleModels = ({ onModelSelect }: SampleModelsProps) => {
  const sampleModels: SampleModel[] = [
    {
      id: 'soldier-01',
      name: 'جندي IGI2',
      description: 'النموذج الأساسي للجندي في اللعبة',
      category: 'character',
      triangles: 15420,
      vertices: 8932,
      size: '2.4 MB',
      preview: '/api/placeholder/200/150'
    },
    {
      id: 'ak47-weapon',
      name: 'بندقية AK-47',
      description: 'نموذج سلاح AK-47 مفصل',
      category: 'weapon',
      triangles: 8250,
      vertices: 4650,
      size: '1.2 MB',
      preview: '/api/placeholder/200/150'
    },
    {
      id: 'military-jeep',
      name: 'جيب عسكري',
      description: 'مركبة عسكرية قتالية',
      category: 'vehicle',
      triangles: 25680,
      vertices: 14230,
      size: '4.1 MB',
      preview: '/api/placeholder/200/150'
    },
    {
      id: 'base-building',
      name: 'مبنى القاعدة',
      description: 'هيكل المباني في المهام',
      category: 'environment',
      triangles: 42150,
      vertices: 28940,
      size: '6.8 MB',
      preview: '/api/placeholder/200/150'
    }
  ];

  const getCategoryInfo = (category: string) => {
    const categoryMap = {
      character: { label: 'شخصية', icon: User, color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
      weapon: { label: 'سلاح', icon: Zap, color: 'bg-orange-500/10 text-orange-400 border-orange-500/30' },
      vehicle: { label: 'مركبة', icon: Shield, color: 'bg-green-500/10 text-green-400 border-green-500/30' },
      environment: { label: 'بيئة', icon: Layers, color: 'bg-purple-500/10 text-purple-400 border-purple-500/30' }
    };
    return categoryMap[category as keyof typeof categoryMap] || categoryMap.character;
  };

  const handleModelSelect = (model: SampleModel) => {
    onModelSelect(model);
    toast.success(`تم تحديد النموذج: ${model.name}`);
  };

  const handlePreview = (model: SampleModel) => {
    toast(`معاينة ${model.name} قريباً...`);
  };

  const handleDownload = (model: SampleModel, e: React.MouseEvent) => {
    e.stopPropagation();
    toast(`تحميل ${model.name} قريباً...`);
  };

  return (
    <div className="h-full">
      <Card className="h-full bg-viewer-panel border-border/50 shadow-panel">
        <div className="p-4 border-b border-border/50">
          <h3 className="text-lg font-semibold mb-2">نماذج IGI2 الجاهزة</h3>
          <p className="text-sm text-muted-foreground">
            مجموعة مختارة من نماذج اللعبة للاستكشاف والتجريب
          </p>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(100%-5rem)]">
          {sampleModels.map((model) => {
            const categoryInfo = getCategoryInfo(model.category);
            const IconComponent = categoryInfo.icon;

            return (
              <Card
                key={model.id}
                className="p-4 bg-viewer-control/30 border-border/30 hover:border-primary/30 transition-colors cursor-pointer group"
                onClick={() => handleModelSelect(model)}
              >
                <div className="flex items-start gap-3">
                  {/* Model Preview */}
                  <div className="w-16 h-12 bg-viewer-bg rounded-lg border border-border/50 flex items-center justify-center shrink-0">
                    <Layers className="h-5 w-5 text-muted-foreground" />
                  </div>

                  {/* Model Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-medium text-sm mb-1">{model.name}</h4>
                        <p className="text-xs text-muted-foreground">{model.description}</p>
                      </div>
                      <Badge className={categoryInfo.color}>
                        <IconComponent className="h-3 w-3 mr-1" />
                        {categoryInfo.label}
                      </Badge>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground mb-3">
                      <div className="flex items-center gap-1">
                        <Triangle className="h-3 w-3" />
                        {model.triangles.toLocaleString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <Layers className="h-3 w-3" />
                        {model.vertices.toLocaleString()}
                      </div>
                      <div className="text-right">
                        {model.size}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePreview(model);
                        }}
                        className="flex-1 bg-primary/10 text-primary border-primary/30 hover:bg-primary/20"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        عرض
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => handleDownload(model, e)}
                        className="bg-viewer-control/30 border-border/50 hover:bg-viewer-control"
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}

          {/* Coming Soon */}
          <Card className="p-6 bg-viewer-control/20 border-dashed border-border/30 text-center">
            <div className="text-muted-foreground">
              <Layers className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-medium mb-1">المزيد من النماذج قريباً</p>
              <p className="text-xs">سنضيف المزيد من النماذج من اللعبة</p>
            </div>
          </Card>
        </div>
      </Card>
    </div>
  );
};