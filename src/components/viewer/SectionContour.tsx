import { useMemo } from 'react';
import * as THREE from 'three';
import type { SectionResult } from '@/types';

interface SectionContourProps {
  result: SectionResult | null;
}

export function SectionContour({ result }: SectionContourProps) {
  const lineObjects = useMemo(() => {
    if (!result || result.contourPoints.length === 0) return [];

    const objects: (THREE.Line | THREE.LineSegments)[] = [];

    for (const contour of result.contourPoints) {
      if (contour.length < 2) continue;

      const positions = new Float32Array((contour.length + 1) * 3);

      for (let i = 0; i < contour.length; i++) {
        positions[i * 3] = contour[i].x;
        positions[i * 3 + 1] = contour[i].y;
        positions[i * 3 + 2] = contour[i].z;
      }

      positions[contour.length * 3] = contour[0].x;
      positions[contour.length * 3 + 1] = contour[0].y;
      positions[contour.length * 3 + 2] = contour[0].z;

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      const lineMaterial = new THREE.LineBasicMaterial({
        color: 0x06b6d4,
        transparent: true,
        opacity: 1,
      });
      const line = new THREE.Line(geometry, lineMaterial);
      objects.push(line);

      const glowMaterial = new THREE.LineBasicMaterial({
        color: 0x06b6d4,
        transparent: true,
        opacity: 0.4,
      });
      const glowLine = new THREE.LineSegments(geometry, glowMaterial);
      objects.push(glowLine);
    }

    return objects;
  }, [result]);

  const capObjects = useMemo(() => {
    if (!result || result.contourPoints.length === 0) return null;

    const axis = result.plane.axis;
    const objects: THREE.Mesh[] = [];

    try {
      for (const contour of result.contourPoints) {
        if (!contour || contour.length < 3) continue;

        const shape = new THREE.Shape();
        let p0: [number, number];
        let p1: [number, number];

        switch (axis) {
          case 'x':
            p0 = [contour[0].y, contour[0].z];
            break;
          case 'y':
            p0 = [contour[0].x, contour[0].z];
            break;
          case 'z':
            p0 = [contour[0].x, contour[0].y];
            break;
          default:
            p0 = [contour[0].x, contour[0].z];
        }

        shape.moveTo(p0[0], p0[1]);

        for (let i = 1; i < contour.length; i++) {
          switch (axis) {
            case 'x':
              p1 = [contour[i].y, contour[i].z];
              break;
            case 'y':
              p1 = [contour[i].x, contour[i].z];
              break;
            case 'z':
              p1 = [contour[i].x, contour[i].y];
              break;
            default:
              p1 = [contour[i].x, contour[i].z];
          }
          shape.lineTo(p1[0], p1[1]);
        }

        shape.closePath();

        const geometry = new THREE.ShapeGeometry(shape);
        const posAttr = geometry.attributes.position;
        const positions = posAttr.array as Float32Array;

        const planePos = result.plane.position;

        for (let i = 0; i < positions.length / 3; i++) {
          const x = positions[i * 3];
          const y = positions[i * 3 + 1];
          const z = positions[i * 3 + 2];

          switch (axis) {
            case 'x':
              positions[i * 3] = planePos;
              positions[i * 3 + 1] = x;
              positions[i * 3 + 2] = y;
              break;
            case 'y':
              positions[i * 3 + 1] = planePos;
              break;
            case 'z':
              positions[i * 3] = x;
              positions[i * 3 + 1] = y;
              positions[i * 3 + 2] = planePos;
              break;
          }
        }

        geometry.computeVertexNormals();

        const capMaterial = new THREE.MeshStandardMaterial({
          color: 0x4a6b7a,
          metalness: 0.2,
          roughness: 0.6,
          side: THREE.DoubleSide,
        });
        const capMesh = new THREE.Mesh(geometry, capMaterial);
        objects.push(capMesh);

        const glowMaterial = new THREE.MeshBasicMaterial({
          color: 0x06b6d4,
          transparent: true,
          opacity: 0.15,
          side: THREE.DoubleSide,
          depthWrite: false,
          polygonOffset: true,
          polygonOffsetFactor: -1,
        });
        const glowMesh = new THREE.Mesh(geometry, glowMaterial);
        objects.push(glowMesh);
      }

      return objects.length > 0 ? objects : null;
    } catch (e) {
      return null;
    }
  }, [result]);

  if (!result) return null;

  return (
    <group>
      {capObjects && capObjects.map((obj, index) => (
        <primitive key={`cap-${index}`} object={obj} />
      ))}

      {lineObjects.map((obj, index) => (
        <primitive key={`line-${index}`} object={obj} />
      ))}
    </group>
  );
}
