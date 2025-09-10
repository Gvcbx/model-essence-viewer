import { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, RotateCcw } from 'lucide-react';
import { Canvas2DViewer } from '@/components/Canvas2DViewer';
import { ViewerToolbar } from '@/components/ViewerToolbar';
import { MEFParser } from '@/utils/mefParser';

interface ThreeDViewerProps {
  modelData?: any;
  showStats?: boolean;
  showGrid?: boolean;
  autoRotate?: boolean;
  wireframe?: boolean;
}

export const ThreeDViewer = ({ 
  modelData, 
  showStats = true, 
  showGrid = true, 
  autoRotate = false, 
  wireframe = false 
}: ThreeDViewerProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [parsedModelData, setParsedModelData] = useState<any>(null);
  const canvas2DRef = useRef<any>();

  const handleReset = () => {
    if (canvas2DRef.current) {
      canvas2DRef.current.reset();
    }
  };

  const handleZoom = (direction: 'in' | 'out') => {
    // This will be handled by the Canvas2D viewer through mouse wheel
    console.log(`Zoom ${direction} requested`);
  };

  const handleViewChange = (option: string, value: any) => {
    console.log(`View change: ${option} = ${value}`);
  };

  // Parse MEF data when modelData changes
  useState(() => {
    if (modelData && modelData instanceof ArrayBuffer) {
      try {
        const parser = new MEFParser(modelData);
        const parsed = parser.parse();
        setParsedModelData(parsed);
      } catch (error) {
        console.error('Error parsing MEF data:', error);
        setParsedModelData(null);
      }
    } else if (modelData) {
      setParsedModelData(modelData);
    }
  });

  return (
    <div className="h-full flex flex-col">
      {/* Viewer Toolbar */}
      <div className="flex-shrink-0 p-2">
        <ViewerToolbar
          onReset={handleReset}
          onZoom={handleZoom}
          onViewChange={handleViewChange}
        />
      </div>

      {/* Main Viewer */}
      <Card className="relative flex-1 bg-viewer-bg border-border/50 shadow-panel overflow-hidden">
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 z-20 bg-viewer-bg/80 backdrop-blur-sm flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading model...</p>
            </div>
          </div>
        )}

        {/* Canvas2D Viewer - No WebGL Required */}
        <Canvas2DViewer
          ref={canvas2DRef}
          modelData={parsedModelData}
          showGrid={showGrid}
          wireframe={wireframe}
          autoRotate={autoRotate}
          className="w-full h-full"
        />
      </Card>
    </div>
  );
};