import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface MEFMesh {
  name: string;
  vertices: Float32Array;
  indices: Uint16Array;
  vertexCount: number;
  triangleCount: number;
}

interface MEFModelProps {
  meshes: MEFMesh[];
  wireframe?: boolean;
  autoRotate?: boolean;
  color?: string;
}

export const MEFModel = ({ 
  meshes, 
  wireframe = false, 
  autoRotate = false,
  color = '#00ff88'
}: MEFModelProps) => {
  const groupRef = useRef<THREE.Group>(null);

  // Create geometries for each mesh
  const geometries = useMemo(() => {
    return meshes.map(mesh => {
      const geometry = new THREE.BufferGeometry();
      
      // Set vertex positions
      geometry.setAttribute('position', new THREE.BufferAttribute(mesh.vertices, 3));
      
      // Set indices
      geometry.setIndex(new THREE.BufferAttribute(mesh.indices, 1));
      
      // Compute normals for proper lighting
      geometry.computeVertexNormals();
      
      // Center the geometry
      geometry.computeBoundingBox();
      const center = new THREE.Vector3();
      geometry.boundingBox?.getCenter(center);
      geometry.translate(-center.x, -center.y, -center.z);
      
      return geometry;
    });
  }, [meshes]);

  // Auto rotation
  useFrame(() => {
    if (autoRotate && groupRef.current) {
      groupRef.current.rotation.y += 0.005;
    }
  });

  const material = useMemo(() => {
    if (wireframe) {
      return new THREE.MeshBasicMaterial({ 
        color: color,
        wireframe: true,
        side: THREE.DoubleSide
      });
    }
    return new THREE.MeshPhongMaterial({ 
      color: color,
      side: THREE.DoubleSide,
      flatShading: false
    });
  }, [wireframe, color]);

  return (
    <group ref={groupRef}>
      {geometries.map((geometry, index) => (
        <mesh key={index} geometry={geometry} material={material} />
      ))}
    </group>
  );
};