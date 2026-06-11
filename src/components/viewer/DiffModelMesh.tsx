import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useAppStore } from '@/store/useAppStore';
import { createDiffVertexColors } from '@/utils/modelDiff';
import type { ModelData, ModelDiffResult } from '@/types';

interface DiffModelMeshProps {
  model: ModelData;
  diffResult: ModelDiffResult;
  position?: [number, number, number];
}

export function DiffModelMesh({ model, diffResult, position = [0, 0, 0] }: DiffModelMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const autoRotate = useAppStore((state) => state.autoRotate);
  const visualizationMode = useAppStore((state) => state.visualizationMode);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(model.vertices, 3));
    geo.setIndex(new THREE.BufferAttribute(model.indices, 1));
    geo.computeVertexNormals();

    const colors = createDiffVertexColors(model, diffResult);
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    return geo;
  }, [model, diffResult]);

  const material = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      metalness: 0.1,
      roughness: 0.7,
      side: THREE.DoubleSide,
    });

    if (visualizationMode === 'wireframe') {
      mat.wireframe = true;
    } else if (visualizationMode === 'xray') {
      mat.transparent = true;
      mat.opacity = 0.5;
    }

    return mat;
  }, [visualizationMode]);

  useFrame((_, delta) => {
    if (autoRotate && meshRef.current) {
      meshRef.current.rotation.y += delta * 0.2;
    }
  });

  return (
    <mesh ref={meshRef} geometry={geometry} material={material} position={position} castShadow receiveShadow />
  );
}
