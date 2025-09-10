import { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { Card } from '@/components/ui/card';

interface Canvas2DViewerProps {
  modelData?: any;
  showGrid?: boolean;
  wireframe?: boolean;
  autoRotate?: boolean;
  className?: string;
}

interface Canvas2DViewerRef {
  reset: () => void;
}

export const Canvas2DViewer = forwardRef<Canvas2DViewerRef, Canvas2DViewerProps>(
  ({ modelData, showGrid = true, wireframe = false, autoRotate = false, className }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [rotation, setRotation] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });

    useImperativeHandle(ref, () => ({
      reset: () => {
        setRotation({ x: 0, y: 0 });
        setZoom(1);
        setPan({ x: 0, y: 0 });
      }
    }));

    const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      if (!showGrid) return;

      const gridSize = 20 * zoom;
      const centerX = width / 2 + pan.x;
      const centerY = height / 2 + pan.y;

      ctx.strokeStyle = '#333';
      ctx.lineWidth = 0.5;

      // Vertical lines
      for (let x = centerX % gridSize; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      // Horizontal lines
      for (let y = centerY % gridSize; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Center lines
      ctx.strokeStyle = '#555';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(centerX, 0);
      ctx.lineTo(centerX, height);
      ctx.moveTo(0, centerY);
      ctx.lineTo(width, centerY);
      ctx.stroke();
    };

    const drawModel = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      const centerX = width / 2 + pan.x;
      const centerY = height / 2 + pan.y;

      if (modelData && modelData.meshes) {
        // Draw actual MEF model data
        modelData.meshes.forEach((mesh: any, index: number) => {
          const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffa726'];
          const color = colors[index % colors.length];
          
          ctx.fillStyle = wireframe ? 'transparent' : color;
          ctx.strokeStyle = color;
          ctx.lineWidth = 2;

          // Simple mesh representation
          const size = 40 * zoom;
          const offsetY = index * 20 * zoom;
          
          if (wireframe) {
            ctx.strokeRect(
              centerX - size/2 + Math.sin(rotation.y) * 10,
              centerY - size/2 + offsetY + Math.sin(rotation.x) * 5,
              size,
              size
            );
          } else {
            ctx.fillRect(
              centerX - size/2 + Math.sin(rotation.y) * 10,
              centerY - size/2 + offsetY + Math.sin(rotation.x) * 5,
              size,
              size
            );
          }

          // Mesh name
          ctx.fillStyle = '#fff';
          ctx.font = '12px monospace';
          ctx.fillText(
            mesh.name || `Mesh ${index + 1}`,
            centerX - size/2 + 5,
            centerY - size/2 + offsetY - 5
          );
        });
      } else {
        // Draw sample cubes
        const cubes = [
          { x: 0, y: 0, color: '#0ea5e9' },
          { x: 60, y: 0, color: '#10b981' },
          { x: -60, y: 0, color: '#f59e0b' },
          { x: 0, y: 60, color: '#8b5cf6' },
          { x: 0, y: -60, color: '#ef4444' },
        ];

        cubes.forEach((cube, index) => {
          ctx.fillStyle = wireframe ? 'transparent' : cube.color;
          ctx.strokeStyle = cube.color;
          ctx.lineWidth = 2;

          const size = 40 * zoom;
          const x = centerX + cube.x * zoom + Math.sin(rotation.y + index) * 10;
          const y = centerY + cube.y * zoom + Math.sin(rotation.x + index) * 5;

          if (wireframe) {
            ctx.strokeRect(x - size/2, y - size/2, size, size);
          } else {
            ctx.fillRect(x - size/2, y - size/2, size, size);
          }
        });
      }
    };

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const { width, height } = canvas;

      // Clear canvas
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, width, height);

      drawGrid(ctx, width, height);
      drawModel(ctx, width, height);

      // Info text
      ctx.fillStyle = '#666';
      ctx.font = '12px monospace';
      ctx.fillText(`Zoom: ${zoom.toFixed(2)}x`, 10, 20);
      ctx.fillText(`Rotation: ${rotation.x.toFixed(2)}, ${rotation.y.toFixed(2)}`, 10, 35);
      if (modelData?.meshes) {
        ctx.fillText(`Meshes: ${modelData.meshes.length}`, 10, 50);
      }
    };

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const resizeCanvas = () => {
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
        render();
      };

      const observer = new ResizeObserver(resizeCanvas);
      observer.observe(canvas);
      resizeCanvas();

      return () => observer.disconnect();
    }, []);

    useEffect(() => {
      render();
    }, [rotation, zoom, pan, modelData, showGrid, wireframe]);

    useEffect(() => {
      if (!autoRotate) return;

      const interval = setInterval(() => {
        setRotation(prev => ({
          x: prev.x + 0.01,
          y: prev.y + 0.015
        }));
      }, 16);

      return () => clearInterval(interval);
    }, [autoRotate]);

    const handleMouseDown = (e: React.MouseEvent) => {
      setIsDragging(true);
      setLastMousePos({ x: e.clientX, y: e.clientY });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
      if (!isDragging) return;

      const deltaX = e.clientX - lastMousePos.x;
      const deltaY = e.clientY - lastMousePos.y;

      if (e.shiftKey) {
        // Pan
        setPan(prev => ({
          x: prev.x + deltaX,
          y: prev.y + deltaY
        }));
      } else {
        // Rotate
        setRotation(prev => ({
          x: prev.x + deltaY * 0.01,
          y: prev.y + deltaX * 0.01
        }));
      }

      setLastMousePos({ x: e.clientX, y: e.clientY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    const handleWheel = (e: React.WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setZoom(prev => Math.max(0.1, Math.min(5, prev * delta)));
    };

    return (
      <div className={`relative ${className}`}>
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-move"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        />
        <div className="absolute bottom-2 left-2 text-xs text-muted-foreground bg-background/80 p-2 rounded">
          <div>Drag: Rotate | Shift+Drag: Pan | Wheel: Zoom</div>
          <div>Canvas 2D Renderer (No WebGL required)</div>
        </div>
      </div>
    );
  }
);

Canvas2DViewer.displayName = 'Canvas2DViewer';