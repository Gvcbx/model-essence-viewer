import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Environment, Stats } from '@react-three/drei';
import { Suspense, useState, useRef } from 'react';
import { Mesh, BoxGeometry, SphereGeometry, ConeGeometry } from 'three';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';

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
}

export const ThreeDViewer = ({ modelData, showStats = true }: ThreeDViewerProps) => {
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
            <p className="text-sm text-muted-foreground">تحميل النموذج...</p>
          </div>
        </div>
      )}

      {/* 3D Canvas */}
      <Canvas
        camera={{ 
          position: [8, 6, 8], 
          fov: 50,
          near: 0.1,
          far: 1000
        }}
        className="w-full h-full"
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

          {/* Sample Models - Replace with actual MEF model loader */}
          {sampleModels.map((model, index) => (
            <Model3D
              key={index}
              position={model.position}
              color={model.color}
              geometry={model.geometry}
            />
          ))}

          {/* Performance Stats */}
          {showStats && <Stats />}
        </Suspense>
      </Canvas>
    </Card>
  );
};