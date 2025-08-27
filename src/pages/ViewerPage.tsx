import { useState } from 'react';
import { Header } from '@/components/Header';
import { ThreeDViewer } from '@/components/ThreeDViewer';
import { FileUploader } from '@/components/FileUploader';
import { SampleModels } from '@/components/SampleModels';
import { ModelInfoPanel } from '@/components/ModelInfoPanel';
import { ViewerToolbar } from '@/components/ViewerToolbar';
import { WelcomeScreen } from '@/components/WelcomeScreen';
import { Card } from '@/components/ui/card';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

interface ModelData {
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

export const ViewerPage = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [modelData, setModelData] = useState<ModelData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [viewerSettings, setViewerSettings] = useState({
    showGrid: true,
    showStats: true,
    autoRotate: false,
    lighting: 'studio'
  });

  // Handle file selection and processing
  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);
    setIsLoading(true);
    setShowWelcome(false);

    try {
      // Simulate model processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Generate sample model data based on file
      const sampleModelData: ModelData = {
        name: file.name,
        format: file.name.split('.').pop()?.toUpperCase() || 'MEF',
        size: file.size,
        triangles: Math.floor(Math.random() * 50000) + 5000,
        vertices: Math.floor(Math.random() * 30000) + 3000,
        materials: Math.floor(Math.random() * 10) + 1,
        bones: Math.floor(Math.random() * 30) + 5,
        textures: [
          `${file.name}_diffuse.dds`,
          `${file.name}_normal.dds`,
          `${file.name}_specular.dds`
        ],
        meshes: ['Mesh_01', 'Mesh_02', 'Mesh_03', 'Bones', 'Equipment'],
        loadTime: Math.floor(Math.random() * 500) + 100
      };

      setModelData(sampleModelData);
      toast.success('Model loaded successfully!');
    } catch (error) {
      toast.error('Failed to process model file');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetStarted = () => {
    setShowWelcome(false);
  };

  const handleToolChange = (tool: string) => {
    // Handle tool changes in 3D viewer
    console.log('Tool changed:', tool);
  };

  const handleViewChange = (option: string, value: any) => {
    setViewerSettings(prev => ({
      ...prev,
      [option]: value
    }));
  };

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0">
        {showWelcome ? (
          <WelcomeScreen onGetStarted={handleGetStarted} />
        ) : (
          <>
            {/* Toolbar */}
            <div className="p-4 pb-2">
              <ViewerToolbar
                onToolChange={handleToolChange}
                onViewChange={handleViewChange}
              />
            </div>

        {/* Viewer Layout */}
        <div className="flex-1 p-4 pt-2">
          <ResizablePanelGroup direction="horizontal" className="h-full">
            {/* Left Sidebar - File Upload & Controls */}
            <ResizablePanel defaultSize={25} minSize={20} maxSize={35}>
              <div className="h-full pr-2">
                <Tabs defaultValue="upload" className="h-full flex flex-col">
                  <TabsList className="grid w-full grid-cols-2 bg-viewer-control/30">
                    <TabsTrigger value="upload" className="data-[state=active]:bg-primary/20">
                      Upload File
                    </TabsTrigger>
                    <TabsTrigger value="library" className="data-[state=active]:bg-primary/20">
                      Library
                    </TabsTrigger>
                  </TabsList>
                  
                  <div className="flex-1 mt-4 min-h-0">
                    <TabsContent value="upload" className="h-full m-0">
                      <FileUploader onFileSelect={handleFileSelect} />
                    </TabsContent>
                    
                    <TabsContent value="library" className="h-full m-0">
                      <SampleModels onModelSelect={(model) => {
                        // Handle sample model selection
                        const mockFile = new File([''], model.name + '.mef', { type: 'application/octet-stream' });
                        Object.defineProperty(mockFile, 'size', { value: parseInt(model.size) * 1024 * 1024 });
                        handleFileSelect(mockFile);
                      }} />
                    </TabsContent>
                  </div>
                </Tabs>
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Main Viewer */}
            <ResizablePanel defaultSize={50} minSize={40}>
              <div className="h-full px-2">
                <ThreeDViewer
                  modelData={modelData}
                  showStats={viewerSettings.showStats}
                />
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Right Sidebar - Model Info */}
            <ResizablePanel defaultSize={25} minSize={20} maxSize={35}>
              <div className="h-full pl-2">
                <ModelInfoPanel
                  modelInfo={modelData}
                  isLoading={isLoading}
                />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
          </>
        )}
      </div>

      {/* Status Bar */}
      <div className="bg-viewer-toolbar/80 border-t border-border/50 px-4 py-2">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4 text-muted-foreground">
            <span>Status: {selectedFile ? 'Model loaded' : 'No model'}</span>
            {modelData && (
              <>
                <span>•</span>
                <span>Triangles: {modelData.triangles.toLocaleString()}</span>
                <span>•</span>
                <span>Vertices: {modelData.vertices.toLocaleString()}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <span>IGI2 MEF Model Viewer</span>
          </div>
        </div>
      </div>
    </div>
  );
};