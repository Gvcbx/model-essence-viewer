import { useState } from 'react';
import { Header } from '@/components/Header';
import { ThreeDViewer } from '@/components/ThreeDViewer';
import { FileUploader } from '@/components/FileUploader';
import { SampleModels } from '@/components/SampleModels';
import { ModelInfoPanel } from '@/components/ModelInfoPanel';
import { ViewerToolbar } from '@/components/ViewerToolbar';
import { WelcomeScreen } from '@/components/WelcomeScreen';
import { OBJConverter } from '@/components/OBJConverter';
import { RESManager } from '@/components/RESManager';
import { DesktopFeatures } from '@/components/DesktopFeatures';
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
  const [loadedMEFData, setLoadedMEFData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [viewerSettings, setViewerSettings] = useState({
    showGrid: true,
    showStats: true,
    autoRotate: false,
    lighting: 'studio',
    wireframe: false
  });

  // Handle file selection and processing
  const handleFileSelect = async (file: File, parsedMEFData?: any) => {
    const startTime = Date.now();
    setSelectedFile(file);
    setIsLoading(true);
    setShowWelcome(false);

    try {
      if (parsedMEFData) {
        // Real MEF file with parsed data
        const sampleModelData: ModelData = {
          name: file.name,
          format: parsedMEFData.meshes.length > 1 ? 'MEF (Multi-mesh)' : 'MEF',
          size: file.size,
          triangles: parsedMEFData.totalTriangles,
          vertices: parsedMEFData.totalVertices,
          materials: parsedMEFData.meshes.length,
          bones: 0,
          textures: [],
          meshes: parsedMEFData.meshes.map((mesh: any, i: number) => `${mesh.name || `Mesh_${i + 1}`}`),
          loadTime: Date.now() - startTime
        };
        
        setModelData(sampleModelData);
        setLoadedMEFData(parsedMEFData);
        toast.success(`MEF model loaded: ${parsedMEFData.meshes.length} meshes`);
      } else {
        // Simulate processing for other formats
        await new Promise(resolve => setTimeout(resolve, 2000));

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
        setLoadedMEFData(null);
        toast.success('Model loaded successfully!');
      }
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
                  <TabsList className="grid w-full grid-cols-5 bg-viewer-control/30 text-xs">
                    <TabsTrigger value="upload" className="data-[state=active]:bg-primary/20">
                      Upload
                    </TabsTrigger>
                    <TabsTrigger value="convert" className="data-[state=active]:bg-primary/20">
                      Convert
                    </TabsTrigger>
                    <TabsTrigger value="res" className="data-[state=active]:bg-primary/20">
                      RES
                    </TabsTrigger>
                    <TabsTrigger value="library" className="data-[state=active]:bg-primary/20">
                      Library
                    </TabsTrigger>
                    <TabsTrigger value="desktop" className="data-[state=active]:bg-primary/20">
                      Desktop
                    </TabsTrigger>
                  </TabsList>
                  
                  <div className="flex-1 mt-4 min-h-0">
                    <TabsContent value="upload" className="h-full m-0">
                      <FileUploader onFileSelect={handleFileSelect} />
                    </TabsContent>
                    
                    <TabsContent value="convert" className="h-full m-0">
                      <OBJConverter />
                    </TabsContent>
                    
                    <TabsContent value="res" className="h-full m-0">
                      <RESManager onMEFFilesLoaded={(files) => {
                        // Handle multiple MEF files from RES
                        if (files.length > 0) {
                          const firstFile = files[0];
                          const mockFile = new File([firstFile.data], firstFile.name, { type: 'application/octet-stream' });
                          handleFileSelect(mockFile);
                          toast.success(`Loaded ${firstFile.name} from RES archive`);
                        }
                      }} />
                    </TabsContent>
                    
                    <TabsContent value="library" className="h-full m-0">
                      <SampleModels onModelSelect={(model) => {
                        // Handle sample model selection
                        const mockFile = new File([''], model.name + '.mef', { type: 'application/octet-stream' });
                        Object.defineProperty(mockFile, 'size', { value: parseInt(model.size) * 1024 * 1024 });
                        handleFileSelect(mockFile);
                      }} />
                    </TabsContent>
                    
                    <TabsContent value="desktop" className="h-full m-0">
                      <DesktopFeatures />
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
                  modelData={loadedMEFData}
                  showStats={viewerSettings.showStats}
                  showGrid={viewerSettings.showGrid}
                  autoRotate={viewerSettings.autoRotate}
                  wireframe={viewerSettings.wireframe}
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