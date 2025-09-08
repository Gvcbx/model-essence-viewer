import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Environment, Stats } from '@react-three/drei';
import { Suspense, useState, useRef, useEffect } from 'react';
import { Mesh, BoxGeometry, SphereGeometry, ConeGeometry } from 'three';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, RotateCcw, AlertTriangle, Monitor } from 'lucide-react';
import { MEFModel } from '@/components/MEFModel';

interface Model3DProps {
  position: [number, number, number];
  color: string;
  geometry: 'box' | 'sphere' | 'cone';
}

const Model3D = ({ position, color, geometry }: Model3DProps) => {
  const meshRef = useRef<Mesh>(null);

  let geometryComponent;
  switch (geometry) {
    case 'sphere':
      geometryComponent = <sphereGeometry args={[1, 32, 32]} />;
      break;
    case 'cone':
      geometryComponent = <coneGeometry args={[1, 2, 32]} />;
      break;
    default:
      geometryComponent = <boxGeometry args={[1, 1, 1]} />;
  }

  return (
    <mesh ref={meshRef} position={position}>
      {geometryComponent}
      <meshStandardMaterial color={color} />
    </mesh>
  );
};

interface ThreeDViewerProps {
  modelData?: any;
  showStats?: boolean;
  showGrid?: boolean;
  autoRotate?: boolean;
  wireframe?: boolean;
}

// Enhanced WebGL detection with fallback options
const detectWebGLWithThreeJS = async (): Promise<boolean> => {
  try {
    // Check basic WebGL support first
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) {
      console.log('WebGL context not available');
      return false;
    }

    // Test THREE.js WebGLRenderer
    const THREE = await import('three');
    
    canvas.width = 2;
    canvas.height = 2;
    canvas.style.display = 'none';
    document.body.appendChild(canvas);
    
    try {
      // Try multiple renderer configurations
      let renderer;
      const configs = [
        { alpha: true, antialias: true, powerPreference: 'default' as const },
        { alpha: false, antialias: false, powerPreference: 'high-performance' as const },
        { alpha: false, antialias: false, powerPreference: 'low-power' as const }
      ];

      for (const config of configs) {
        try {
          renderer = new THREE.WebGLRenderer({ canvas, ...config });
          break;
        } catch (e) {
          console.log('Failed config:', config, e);
        }
      }

      if (!renderer) {
        throw new Error('All renderer configurations failed');
      }
      
      // Test basic rendering
      renderer.setSize(2, 2);
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
      
      // Add a simple test geometry
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
      const cube = new THREE.Mesh(geometry, material);
      scene.add(cube);
      
      renderer.render(scene, camera);
      
      // Check for WebGL errors
      const error = renderer.getContext().getError();
      if (error !== renderer.getContext().NO_ERROR) {
        throw new Error(`WebGL error: ${error}`);
      }
      
      // Clean up
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      document.body.removeChild(canvas);
      
      return true;
    } catch (rendererError) {
      console.log('THREE.js WebGLRenderer test failed:', rendererError);
      document.body.removeChild(canvas);
      return false;
    }
  } catch (error) {
    console.log('THREE.js WebGL detection failed:', error);
    return false;
  }
};

// WebGL Fallback Component - Arabic Support
const WebGLFallback = () => (
  <div className="h-full flex items-center justify-center p-8">
    <Alert className="max-w-lg border-destructive/50 bg-destructive/10">
      <AlertTriangle className="h-4 w-4 text-destructive" />
      <AlertTitle className="text-destructive">WebGL غير متاح</AlertTitle>
      <AlertDescription className="mt-2 space-y-2" dir="rtl">
        <p>يتطلب عارض النماذج ثلاثية الأبعاد دعم WebGL لعرض النماذج.</p>
        <div className="text-sm space-y-1 mt-4">
          <p className="font-medium">الحلول المقترحة:</p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground text-right">
            <li>تأكد من أن متصفحك يدعم WebGL</li>
            <li>فعّل تسريع الأجهزة في إعدادات المتصفح</li>
            <li>حدّث تعريفات كرت الرسوميات</li>
            <li>جرب متصفح آخر (Chrome, Firefox, Edge)</li>
            <li>استخدم النسخة المكتبية للحصول على أفضل أداء</li>
          </ul>
        </div>
        <div className="flex gap-2 mt-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => window.location.reload()} 
          >
            <Monitor className="h-4 w-4 mr-2" />
            إعادة تحميل الصفحة
          </Button>
          <Button 
            variant="default" 
            size="sm" 
            onClick={() => console.log('Download desktop app')} 
          >
            تحميل النسخة المكتبية
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  </div>
);

// Safe Canvas Wrapper Component that prevents Canvas rendering when WebGL is not supported
const SafeCanvas = ({ children, fallback, ...props }: any) => {
  const [webglSupported, setWebglSupported] = useState<boolean | null>(null);

  useEffect(() => {
    const checkWebGL = async () => {
      console.log('Starting comprehensive WebGL detection...');
      const isSupported = await detectWebGLWithThreeJS();
      console.log('WebGL detection result:', isSupported);
      setWebglSupported(isSupported);
    };

    checkWebGL();
  }, []);

  // Show loading state while checking WebGL support
  if (webglSupported === null) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-sm text-muted-foreground">Checking WebGL support...</span>
      </div>
    );
  }

  // Show fallback if WebGL is not supported - DO NOT render Canvas at all
  if (!webglSupported) {
    console.log('Rendering WebGL fallback');
    return fallback || <WebGLFallback />;
  }

  // Only render Canvas if WebGL is fully supported
  console.log('Rendering Canvas with WebGL support');
  return (
    <Canvas {...props}>
      {children}
    </Canvas>
  );
};

export const ThreeDViewer = ({ 
  modelData, 
  showStats = true, 
  showGrid = true, 
  autoRotate = false, 
  wireframe = false 
}: ThreeDViewerProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const controlsRef = useRef<any>();

  const handleReset = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  const sampleModels = [
    { position: [0, 0, 0] as [number, number, number], color: '#0ea5e9', geometry: 'box' as const },
    { position: [3, 0, 0] as [number, number, number], color: '#10b981', geometry: 'sphere' as const },
    { position: [-3, 0, 0] as [number, number, number], color: '#f59e0b', geometry: 'cone' as const },
    { position: [0, 0, 3] as [number, number, number], color: '#8b5cf6', geometry: 'box' as const },
    { position: [0, 0, -3] as [number, number, number], color: '#ef4444', geometry: 'sphere' as const },
  ];

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

      {/* 3D Canvas with WebGL Error Handling */}
      <SafeCanvas
        camera={{ 
          position: [8, 6, 8], 
          fov: 50,
          near: 0.1,
          far: 1000
        }}
        className="w-full h-full"
        fallback={<WebGLFallback />}
      >
        <Suspense fallback={null}>
          {/* Environment and Lighting */}
          <Environment preset="studio" />
          <ambientLight intensity={0.4} />
          <directionalLight position={[10, 10, 10]} intensity={1} castShadow />
          <pointLight position={[-10, -10, -10]} intensity={0.5} />

          {/* Controls */}
          <OrbitControls
            ref={controlsRef}
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            dampingFactor={0.05}
            screenSpacePanning={false}
          />

          {/* Grid */}
          <Grid
            args={[10, 10]}
            cellSize={1}
            cellThickness={1}
            cellColor={'#6366f1'}
            sectionSize={3}
            sectionThickness={1.5}
            sectionColor={'#8b5cf6'}
            fadeDistance={25}
            fadeStrength={1}
          />

          {/* Sample Models or MEF Model */}
          {modelData && modelData.meshes ? (
            <MEFModel 
              meshes={modelData.meshes}
              wireframe={wireframe}
              autoRotate={autoRotate}
              color="#00ff88"
            />
          ) : (
            sampleModels.map((model, index) => (
              <Model3D
                key={index}
                position={model.position}
                color={model.color}
                geometry={model.geometry}
              />
            ))
          )}

          {/* Performance Stats */}
          {showStats && <Stats />}
        </Suspense>
      </SafeCanvas>
    </Card>
  );
};