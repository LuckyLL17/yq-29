import { useCallback, useRef, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useAppStore } from '@/store/useAppStore';
import type { AnnotationTool, Vector3 } from '@/types';

function useAnnotationInteraction() {
  const annotationTool = useAppStore((s) => s.annotationTool);
  const annotationStyle = useAppStore((s) => s.annotationStyle);
  const addAnnotation = useAppStore((s) => s.addAnnotation);
  const setIsDrawingFreehand = useAppStore((s) => s.setIsDrawingFreehand);
  const isDrawingFreehand = useAppStore((s) => s.isDrawingFreehand);
  const updateAnnotation = useAppStore((s) => s.updateAnnotation);
  const annotations = useAppStore((s) => s.annotations);
  const setSelectedAnnotationId = useAppStore((s) => s.setSelectedAnnotationId);

  const pendingArrowStart = useRef<Vector3 | null>(null);
  const pendingDimensionStart = useRef<Vector3 | null>(null);
  const currentFreehandId = useRef<string | null>(null);
  const { raycaster, camera, scene, gl } = useThree();

  const getModelIntersection = useCallback(
    (event: MouseEvent): Vector3 | null => {
      const rect = gl.domElement.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(new THREE.Vector2(x, y), camera);

      const meshes: THREE.Mesh[] = [];
      scene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh && !(child as any).isAnnotation) {
          meshes.push(child as THREE.Mesh);
        }
      });

      const intersects = raycaster.intersectObjects(meshes, false);
      if (intersects.length > 0) {
        const p = intersects[0].point;
        return { x: p.x, y: p.y, z: p.z };
      }

      const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
      const target = new THREE.Vector3();
      raycaster.ray.intersectPlane(plane, target);
      if (target) {
        return { x: target.x, y: target.y, z: target.z };
      }
      return null;
    },
    [raycaster, camera, scene, gl]
  );

  const handleClick = useCallback(
    (event: MouseEvent) => {
      if (annotationTool === 'none') return;

      const point = getModelIntersection(event);
      if (!point) return;

      const id = `ann_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      switch (annotationTool) {
        case 'text': {
          const text = prompt('请输入标注文字:');
          if (!text) break;
          addAnnotation({
            id,
            type: 'text',
            position: point,
            text,
            style: { ...annotationStyle },
          });
          break;
        }
        case 'arrow': {
          if (!pendingArrowStart.current) {
            pendingArrowStart.current = point;
          } else {
            addAnnotation({
              id,
              type: 'arrow',
              start: pendingArrowStart.current,
              end: point,
              style: { ...annotationStyle },
            });
            pendingArrowStart.current = null;
          }
          break;
        }
        case 'dimension': {
          if (!pendingDimensionStart.current) {
            pendingDimensionStart.current = point;
          } else {
            const s = pendingDimensionStart.current;
            const dir = new THREE.Vector3(point.x - s.x, point.y - s.y, point.z - s.z);
            const up = new THREE.Vector3(0, 1, 0);
            const perp = new THREE.Vector3().crossVectors(dir, up);
            const offset = Math.max(perp.length() * 0.3, 5);
            addAnnotation({
              id,
              type: 'dimension',
              start: pendingDimensionStart.current,
              end: point,
              offset,
              style: { ...annotationStyle },
            });
            pendingDimensionStart.current = null;
          }
          break;
        }
        case 'freehand': {
          break;
        }
      }
    },
    [annotationTool, annotationStyle, addAnnotation, getModelIntersection]
  );

  const handleMouseDown = useCallback(
    (event: MouseEvent) => {
      if (annotationTool !== 'freehand') return;
      if (event.button !== 0) return;

      const point = getModelIntersection(event);
      if (!point) return;

      const id = `ann_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      currentFreehandId.current = id;
      setIsDrawingFreehand(true);

      addAnnotation({
        id,
        type: 'freehand',
        points: [point],
        style: { ...annotationStyle },
      });
    },
    [annotationTool, annotationStyle, addAnnotation, getModelIntersection, setIsDrawingFreehand]
  );

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (!isDrawingFreehand || !currentFreehandId.current) return;

      const point = getModelIntersection(event);
      if (!point) return;

      const ann = annotations.find((a) => a.id === currentFreehandId.current);
      if (!ann || ann.type !== 'freehand') return;

      updateAnnotation(currentFreehandId.current, {
        points: [...ann.points, point],
      } as any);
    },
    [isDrawingFreehand, annotations, updateAnnotation, getModelIntersection]
  );

  const handleMouseUp = useCallback(() => {
    if (isDrawingFreehand) {
      setIsDrawingFreehand(false);
      currentFreehandId.current = null;
    }
  }, [isDrawingFreehand, setIsDrawingFreehand]);

  useEffect(() => {
    const canvas = gl.domElement;

    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);

    return () => {
      canvas.removeEventListener('click', handleClick);
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
    };
  }, [gl, handleClick, handleMouseDown, handleMouseMove, handleMouseUp]);

  return null;
}

export function AnnotationInteraction() {
  useAnnotationInteraction();
  return null;
}
