import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useAppStore } from '@/store/useAppStore';
import { createDraftAngleVertexColors } from '@/utils/draftAngle';

interface ModelMeshProps {
  model: {
    vertices: Float32Array;
    indices: Uint32Array | Uint16Array;
    normals: Float32Array;
  };
}

export function ModelMesh({ model }: ModelMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const analysisMode = useAppStore((state) => state.analysisMode);
  const visualizationMode = useAppStore((state) => state.visualizationMode);
  const draftAngleResult = useAppStore((state) => state.draftAngleResult);
  const wallThicknessResult = useAppStore((state) => state.wallThicknessResult);
  const autoRotate = useAppStore((state) => state.autoRotate);
  const sectionPlane = useAppStore((state) => state.sectionPlane);
  useThree();

  const clippingPlane = useMemo(() => {
    if (analysisMode !== 'section' || !sectionPlane.visible) {
      return null;
    }

    const normal = new THREE.Vector3();
    switch (sectionPlane.axis) {
      case 'x':
        normal.set(1, 0, 0);
        break;
      case 'y':
        normal.set(0, 1, 0);
        break;
      case 'z':
        normal.set(0, 0, 1);
        break;
    }

    const plane = new THREE.Plane(normal, -sectionPlane.position);
    return plane;
  }, [analysisMode, sectionPlane.axis, sectionPlane.position, sectionPlane.visible]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(model.vertices, 3));
    geo.setIndex(new THREE.BufferAttribute(model.indices, 1));
    geo.computeVertexNormals();
    return geo;
  }, [model.vertices, model.indices]);

  const material = useMemo(() => {
    let mat: THREE.MeshStandardMaterial;

    if (analysisMode === 'draft' && draftAngleResult) {
      const colors = createDraftAngleVertexColors(
        { vertices: model.vertices, indices: model.indices } as any,
        draftAngleResult
      );
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      mat = new THREE.MeshStandardMaterial({
        vertexColors: true,
        metalness: 0.1,
        roughness: 0.7,
        side: THREE.DoubleSide,
        clippingPlanes: clippingPlane ? [clippingPlane] : undefined,
        clipShadows: true,
      });
    } else if (analysisMode === 'thickness' && wallThicknessResult) {
      mat = new THREE.MeshStandardMaterial({
        color: 0x4a90d9,
        metalness: 0.1,
        roughness: 0.7,
        transparent: true,
        opacity: 0.85,
        side: THREE.DoubleSide,
        clippingPlanes: clippingPlane ? [clippingPlane] : undefined,
        clipShadows: true,
      });
    } else if (analysisMode === 'section') {
      mat = new THREE.MeshStandardMaterial({
        color: 0x6b8e9e,
        metalness: 0.2,
        roughness: 0.5,
        side: THREE.DoubleSide,
        clippingPlanes: clippingPlane ? [clippingPlane] : undefined,
        clipShadows: true,
      });
    } else {
      mat = new THREE.MeshStandardMaterial({
        color: 0x6b8e9e,
        metalness: 0.2,
        roughness: 0.5,
        side: THREE.DoubleSide,
      });
    }

    if (visualizationMode === 'wireframe') {
      mat.wireframe = true;
    } else if (visualizationMode === 'xray') {
      mat.transparent = true;
      mat.opacity = 0.3;
    }

    return mat;
  }, [analysisMode, visualizationMode, draftAngleResult, wallThicknessResult, geometry, model, clippingPlane]);

  useFrame((_, delta) => {
    if (autoRotate && meshRef.current) {
      meshRef.current.rotation.y += delta * 0.2;
    }
  });

  return (
    <mesh ref={meshRef} geometry={geometry} material={material} castShadow receiveShadow />
  );
}
