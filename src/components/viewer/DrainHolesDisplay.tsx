import { useMemo } from 'react';
import * as THREE from 'three';
import type { DrainHole } from '@/types';

interface DrainHolesDisplayProps {
  holes: DrainHole[];
}

export function DrainHolesDisplay({ holes }: DrainHolesDisplayProps) {
  const holeGeometry = useMemo(() => {
    const geometries: THREE.Mesh[] = [];

    holes.forEach((hole) => {
      const radius = hole.diameter / 2;
      const geometry = new THREE.CylinderGeometry(radius, radius, 0.5, 16);
      const material = new THREE.MeshStandardMaterial({
        color: hole.type === 'suction' ? 0xff6b35 : 0x06b6d4,
        emissive: hole.type === 'suction' ? 0xff4500 : 0x0891b2,
        emissiveIntensity: 0.3,
        metalness: 0.5,
        roughness: 0.3,
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(hole.position.x, hole.position.y, hole.position.z);

      const normal = new THREE.Vector3(hole.normal.x, hole.normal.y, hole.normal.z);
      const up = new THREE.Vector3(0, 1, 0);
      const quaternion = new THREE.Quaternion().setFromUnitVectors(up, normal);
      mesh.quaternion.copy(quaternion);

      geometries.push(mesh);
    });

    return geometries;
  }, [holes]);

  return (
    <group>
      {holeGeometry.map((mesh, index) => (
        <primitive key={index} object={mesh} />
      ))}
    </group>
  );
}
