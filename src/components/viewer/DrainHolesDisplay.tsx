import { useMemo } from 'react';
import * as THREE from 'three';
import type { DrainHole } from '@/types';
import { useAppStore } from '@/store/useAppStore';

interface DrainHolesDisplayProps {
  holes: DrainHole[];
}

export function DrainHolesDisplay({ holes }: DrainHolesDisplayProps) {
  const selectedHoleId = useAppStore((state) => state.selectedHoleId);
  const setSelectedHoleId = useAppStore((state) => state.setSelectedHoleId);
  const holeEditMode = useAppStore((state) => state.holeEditMode);
  const removeDrainHole = useAppStore((state) => state.removeDrainHole);

  const holeData = useMemo(() => {
    return holes.map((hole) => {
      const radius = hole.diameter / 2;
      const depth = hole.depth;
      const isSelected = selectedHoleId === hole.id;

      const geometry = new THREE.CylinderGeometry(radius, radius, depth, 24);
      const material = new THREE.MeshStandardMaterial({
        color: hole.type === 'suction' ? 0xff6b35 : 0x06b6d4,
        emissive: isSelected
          ? hole.type === 'suction'
            ? 0xff8c00
            : 0x00ffff
          : hole.type === 'suction'
          ? 0xff4500
          : 0x0891b2,
        emissiveIntensity: isSelected ? 0.8 : 0.3,
        metalness: 0.5,
        roughness: 0.3,
      });

      const mesh = new THREE.Mesh(geometry, material);

      const normal = new THREE.Vector3(hole.normal.x, hole.normal.y, hole.normal.z);
      const up = new THREE.Vector3(0, 1, 0);
      const quaternion = new THREE.Quaternion().setFromUnitVectors(up, normal);
      mesh.quaternion.copy(quaternion);

      const position = new THREE.Vector3(hole.position.x, hole.position.y, hole.position.z);
      const offset = normal.clone().multiplyScalar(depth / 2);
      mesh.position.copy(position.clone().add(offset));

      mesh.userData = { holeId: hole.id, holeType: 'drainHole' };

      let selectionRing: THREE.Mesh | null = null;
      if (isSelected) {
        const ringGeometry = new THREE.RingGeometry(radius * 1.3, radius * 1.6, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({
          color: 0xffff00,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.9,
        });
        selectionRing = new THREE.Mesh(ringGeometry, ringMaterial);
        selectionRing.position.copy(mesh.position);
        selectionRing.quaternion.copy(mesh.quaternion);
        selectionRing.userData = { holeId: hole.id, holeType: 'selectionRing' };
      }

      return { mesh, hole, selectionRing };
    });
  }, [holes, selectedHoleId]);

  const handleClick = (holeId: string) => {
    if (holeEditMode === 'delete') {
      removeDrainHole(holeId);
    } else {
      setSelectedHoleId(selectedHoleId === holeId ? null : holeId);
    }
  };

  return (
    <group>
      {holeData.map(({ mesh, hole, selectionRing }) => (
        <group key={hole.id}>
          <primitive
            object={mesh}
            onClick={(e) => {
              e.stopPropagation();
              handleClick(hole.id);
            }}
            onPointerOver={(e) => {
              e.stopPropagation();
              document.body.style.cursor =
                holeEditMode === 'delete' ? 'not-allowed' : 'pointer';
            }}
            onPointerOut={() => {
              document.body.style.cursor = 'default';
            }}
          />
          {selectionRing && <primitive object={selectionRing} />}
        </group>
      ))}
    </group>
  );
}
