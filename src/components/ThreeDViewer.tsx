import { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, RotateCcw } from 'lucide-react';
import { Canvas2DViewer } from '@/components/Canvas2DViewer';

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
  const canvas2DRef = useRef<any>();

  const handleReset = () => {
    if (canvas2DRef.current) {
      canvas2DRef.current.reset();
    }
  };

  return (
    <Card className="relative h-full bg-viewer-bg border-border/50 shadow-panel overflow-hidden">
      {/* Viewer Controls */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={handleReset}
          className="bg-viewer-toolbar/80 backdrop-blur-sm border-border/30 hover:bg-viewer-control"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

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
        modelData={modelData}
        showGrid={showGrid}
        wireframe={wireframe}
        autoRotate={autoRotate}
        className="w-full h-full"
      />
    </Card>
  );
};