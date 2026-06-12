import { useMemo } from 'react';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { useAppStore } from '@/store/useAppStore';
import type {
  Annotation,
  TextAnnotation,
  ArrowAnnotation,
  DimensionAnnotation,
  FreehandAnnotation,
} from '@/types';

function TextAnnotation3D({ annotation }: { annotation: TextAnnotation }) {
  const { position, text, style } = annotation;
  const isSelected = useAppStore(
    (s) => s.selectedAnnotationId === annotation.id
  );

  return (
    <group position={[position.x, position.y, position.z]}>
      <Text
        fontSize={style.fontSize}
        color={style.color}
        anchorX="center"
        anchorY="middle"
        font={style.fontFamily === 'monospace' ? undefined : undefined}
        outlineWidth={isSelected ? 0.15 : 0.08}
        outlineColor={isSelected ? '#ffffff' : '#000000'}
      >
        {text}
      </Text>
      {isSelected && (
        <mesh>
          <boxGeometry args={[style.fontSize * text.length * 0.6, style.fontSize * 1.4, 0.2]} />
          <meshBasicMaterial color={style.color} wireframe transparent opacity={0.3} />
        </mesh>
      )}
    </group>
  );
}

function ArrowAnnotation3D({ annotation }: { annotation: ArrowAnnotation }) {
  const { start, end, style } = annotation;
  const isSelected = useAppStore(
    (s) => s.selectedAnnotationId === annotation.id
  );

  const { lineGeometry, coneGeometry, conePosition, coneRotation } =
    useMemo(() => {
      const s = new THREE.Vector3(start.x, start.y, start.z);
      const e = new THREE.Vector3(end.x, end.y, end.z);
      const dir = new THREE.Vector3().subVectors(e, s);
      const length = dir.length();
      dir.normalize();

      const points = [s, e];
      const geo = new THREE.BufferGeometry().setFromPoints(points);

      const coneGeo = new THREE.ConeGeometry(
        Math.max(style.lineWidth * 0.8, 0.5),
        Math.max(style.lineWidth * 2, 1.5),
        8
      );

      const conePos = e.clone();

      const quaternion = new THREE.Quaternion();
      quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);

      return {
        lineGeometry: geo,
        coneGeometry: coneGeo,
        conePosition: conePos,
        coneRotation: new THREE.Euler().setFromQuaternion(quaternion),
      };
    }, [start, end, style.lineWidth]);

  return (
    <group>
      <line geometry={lineGeometry}>
        <lineBasicMaterial
          color={style.color}
          linewidth={style.lineWidth}
          depthTest={false}
        />
      </line>
      <mesh
        geometry={coneGeometry}
        position={conePosition}
        rotation={coneRotation}
      >
        <meshBasicMaterial color={style.color} depthTest={false} />
      </mesh>
      {isSelected && (
        <line
          geometry={new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(start.x, start.y, start.z),
            new THREE.Vector3(end.x, end.y, end.z),
          ])}
        >
          <lineBasicMaterial
            color="#ffffff"
            linewidth={1}
            transparent
            opacity={0.4}
            depthTest={false}
          />
        </line>
      )}
    </group>
  );
}

function DimensionAnnotation3D({ annotation }: { annotation: DimensionAnnotation }) {
  const { start, end, offset, style } = annotation;
  const isSelected = useAppStore(
    (s) => s.selectedAnnotationId === annotation.id
  );

  const { dimLineStart, dimLineEnd, extStart1, extEnd1, extStart2, extEnd2, distance, midPoint } =
    useMemo(() => {
      const s = new THREE.Vector3(start.x, start.y, start.z);
      const e = new THREE.Vector3(end.x, end.y, end.z);
      const dir = new THREE.Vector3().subVectors(e, s);
      const length = dir.length();

      const up = new THREE.Vector3(0, 1, 0);
      const perpendicular = new THREE.Vector3().crossVectors(dir, up).normalize();
      if (perpendicular.length() < 0.001) {
        perpendicular.set(1, 0, 0);
      }
      const offsetDir = perpendicular.multiplyScalar(offset);

      const dimStart = s.clone().add(offsetDir);
      const dimEnd = e.clone().add(offsetDir);
      const mid = new THREE.Vector3().addVectors(dimStart, dimEnd).multiplyScalar(0.5);

      return {
        dimLineStart: dimStart,
        dimLineEnd: dimEnd,
        extStart1: s,
        extEnd1: dimStart,
        extStart2: e,
        extEnd2: dimEnd,
        distance: length,
        midPoint: mid,
      };
    }, [start, end, offset]);

  const extLine1Geo = useMemo(
    () => new THREE.BufferGeometry().setFromPoints([extStart1, extEnd1]),
    [extStart1, extEnd1]
  );
  const extLine2Geo = useMemo(
    () => new THREE.BufferGeometry().setFromPoints([extStart2, extEnd2]),
    [extStart2, extEnd2]
  );
  const dimLineGeo = useMemo(
    () => new THREE.BufferGeometry().setFromPoints([dimLineStart, dimLineEnd]),
    [dimLineStart, dimLineEnd]
  );

  const dimText = `${distance.toFixed(1)} mm`;

  return (
    <group>
      <line geometry={extLine1Geo}>
        <lineBasicMaterial color={style.color} depthTest={false} transparent opacity={0.6} />
      </line>
      <line geometry={extLine2Geo}>
        <lineBasicMaterial color={style.color} depthTest={false} transparent opacity={0.6} />
      </line>
      <line geometry={dimLineGeo}>
        <lineBasicMaterial color={style.color} linewidth={style.lineWidth} depthTest={false} />
      </line>

      {(() => {
        const dir = new THREE.Vector3().subVectors(dimLineEnd, dimLineStart).normalize();
        const arrowLen = Math.max(style.lineWidth * 1.5, 1);
        const coneGeo = new THREE.ConeGeometry(Math.max(style.lineWidth * 0.5, 0.4), arrowLen, 8);
        const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
        const rot = new THREE.Euler().setFromQuaternion(q);
        return (
          <>
            <mesh geometry={coneGeo} position={dimLineStart} rotation={rot}>
              <meshBasicMaterial color={style.color} depthTest={false} />
            </mesh>
            <mesh
              geometry={coneGeo}
              position={dimLineEnd}
              rotation={new THREE.Euler().setFromQuaternion(
                new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.negate())
              )}
            >
              <meshBasicMaterial color={style.color} depthTest={false} />
            </mesh>
          </>
        );
      })()}

      <group position={midPoint}>
        <mesh>
          <planeGeometry args={[style.fontSize * dimText.length * 0.55 + 1, style.fontSize * 1.6]} />
          <meshBasicMaterial color="#0f172a" transparent opacity={0.8} depthTest={false} />
        </mesh>
        <Text
          fontSize={style.fontSize}
          color={style.color}
          anchorX="center"
          anchorY="middle"
          depthOffset={-1}
        >
          {dimText}
        </Text>
      </group>

      {isSelected && (
        <line
          geometry={new THREE.BufferGeometry().setFromPoints([dimLineStart, dimLineEnd])}
        >
          <lineBasicMaterial color="#ffffff" transparent opacity={0.3} depthTest={false} />
        </line>
      )}
    </group>
  );
}

function FreehandAnnotation3D({ annotation }: { annotation: FreehandAnnotation }) {
  const { points, style } = annotation;
  const isSelected = useAppStore(
    (s) => s.selectedAnnotationId === annotation.id
  );

  const lineGeometry = useMemo(() => {
    if (points.length < 2) return null;
    const pts = points.map((p) => new THREE.Vector3(p.x, p.y, p.z));
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, [points]);

  if (!lineGeometry) return null;

  return (
    <group>
      <line geometry={lineGeometry}>
        <lineBasicMaterial color={style.color} linewidth={style.lineWidth} depthTest={false} />
      </line>
      {isSelected && (
        <line geometry={lineGeometry}>
          <lineBasicMaterial
            color="#ffffff"
            linewidth={1}
            transparent
            opacity={0.3}
            depthTest={false}
          />
        </line>
      )}
    </group>
  );
}

function AnnotationItem({ annotation }: { annotation: Annotation }) {
  switch (annotation.type) {
    case 'text':
      return <TextAnnotation3D annotation={annotation} />;
    case 'arrow':
      return <ArrowAnnotation3D annotation={annotation} />;
    case 'dimension':
      return <DimensionAnnotation3D annotation={annotation} />;
    case 'freehand':
      return <FreehandAnnotation3D annotation={annotation} />;
    default:
      return null;
  }
}

export function Annotations3D() {
  const annotations = useAppStore((s) => s.annotations);

  if (annotations.length === 0) return null;

  return (
    <group renderOrder={999}>
      {annotations.map((ann) => (
        <AnnotationItem key={ann.id} annotation={ann} />
      ))}
    </group>
  );
}
