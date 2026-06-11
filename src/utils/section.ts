import type {
  ModelData,
  SectionResult,
  SectionPlane,
  SectionContourPoint,
  SectionThicknessSample,
  Vector3,
} from '@/types';
import {
  normalize,
  scale,
  add,
  subtract,
  dot,
  distance,
  computeFaceNormals,
  getFaceCentroid,
  buildBVH,
  rayTriangleIntersect,
} from './geometry';

interface IntersectionPoint {
  point: Vector3;
  edgeIndex: number;
  faceIndex: number;
}

export function computeSection(
  model: ModelData,
  plane: SectionPlane,
  thicknessResolution: number = 50
): SectionResult {
  const { vertices, indices } = model;
  const faceCount = indices.length / 3;

  const planeNormal = getPlaneNormal(plane.axis);
  const planePos = plane.position;

  const intersectionEdges: Map<string, IntersectionPoint[]> = new Map();
  const faceIntersections: { faceIndex: number; points: Vector3[] }[] = [];

  for (let i = 0; i < faceCount; i++) {
    const i0 = indices[i * 3];
    const i1 = indices[i * 3 + 1];
    const i2 = indices[i * 3 + 2];

    const v0 = {
      x: vertices[i0 * 3],
      y: vertices[i0 * 3 + 1],
      z: vertices[i0 * 3 + 2],
    };
    const v1 = {
      x: vertices[i1 * 3],
      y: vertices[i1 * 3 + 1],
      z: vertices[i1 * 3 + 2],
    };
    const v2 = {
      x: vertices[i2 * 3],
      y: vertices[i2 * 3 + 1],
      z: vertices[i2 * 3 + 2],
    };

    const d0 = getPlaneDistance(v0, plane.axis) - planePos;
    const d1 = getPlaneDistance(v1, plane.axis) - planePos;
    const d2 = getPlaneDistance(v2, plane.axis) - planePos;

    const points: Vector3[] = [];

    if (d0 * d1 < 0) {
      const t = Math.abs(d0) / (Math.abs(d0) + Math.abs(d1));
      points.push(lerpVector3(v0, v1, t));
    }
    if (d1 * d2 < 0) {
      const t = Math.abs(d1) / (Math.abs(d1) + Math.abs(d2));
      points.push(lerpVector3(v1, v2, t));
    }
    if (d2 * d0 < 0) {
      const t = Math.abs(d2) / (Math.abs(d2) + Math.abs(d0));
      points.push(lerpVector3(v2, v0, t));
    }

    if (points.length >= 2) {
      faceIntersections.push({ faceIndex: i, points: points.slice(0, 2) });
    }
  }

  const contours = buildContours(faceIntersections);
  const area = computeContoursArea(contours, planeNormal);
  const perimeter = computeContoursPerimeter(contours);
  const thicknessSamples = computeSectionThickness(
    model,
    plane,
    contours,
    thicknessResolution
  );

  let minThickness = Infinity;
  let maxThickness = 0;
  let totalThickness = 0;

  for (const sample of thicknessSamples) {
    if (sample.thickness > 0) {
      if (sample.thickness < minThickness) minThickness = sample.thickness;
      if (sample.thickness > maxThickness) maxThickness = sample.thickness;
      totalThickness += sample.thickness;
    }
  }

  const avgThickness = thicknessSamples.length > 0
    ? totalThickness / thicknessSamples.filter(s => s.thickness > 0).length
    : 0;

  const thicknessDistribution = computeThicknessDistribution(
    thicknessSamples.filter(s => s.thickness > 0),
    minThickness,
    maxThickness
  );

  return {
    contourPoints: contours,
    area,
    perimeter,
    thicknessSamples,
    minThickness: isFinite(minThickness) ? minThickness : 0,
    maxThickness,
    avgThickness,
    thicknessDistribution,
    plane,
  };
}

function getPlaneNormal(axis: string): Vector3 {
  switch (axis) {
    case 'x': return { x: 1, y: 0, z: 0 };
    case 'y': return { x: 0, y: 1, z: 0 };
    case 'z': return { x: 0, y: 0, z: 1 };
    default: return { x: 0, y: 1, z: 0 };
  }
}

function getPlaneDistance(point: Vector3, axis: string): number {
  switch (axis) {
    case 'x': return point.x;
    case 'y': return point.y;
    case 'z': return point.z;
    default: return point.y;
  }
}

function lerpVector3(a: Vector3, b: Vector3, t: number): Vector3 {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    z: a.z + (b.z - a.z) * t,
  };
}

function buildContours(
  faceIntersections: { faceIndex: number; points: Vector3[] }[]
): SectionContourPoint[][] {
  const contours: SectionContourPoint[][] = [];
  const usedFaces = new Set<number>();

  while (usedFaces.size < faceIntersections.length) {
    let startFaceIndex = -1;
    for (let i = 0; i < faceIntersections.length; i++) {
      if (!usedFaces.has(i)) {
        startFaceIndex = i;
        break;
      }
    }

    if (startFaceIndex === -1) break;

    const contour: SectionContourPoint[] = [];
    let currentFaceIndex = startFaceIndex;
    let currentPointIndex = 0;

    while (true) {
      if (usedFaces.has(currentFaceIndex)) break;
      usedFaces.add(currentFaceIndex);

      const faceData = faceIntersections[currentFaceIndex];
      const point = faceData.points[currentPointIndex];
      contour.push({ x: point.x, y: point.y, z: point.z });

      const nextPoint = faceData.points[1 - currentPointIndex];

      let nextFaceIndex = -1;
      let nextPointIdx = 0;
      let minDist = Infinity;

      for (let i = 0; i < faceIntersections.length; i++) {
        if (i === currentFaceIndex || usedFaces.has(i)) continue;

        const otherFace = faceIntersections[i];
        for (let j = 0; j < otherFace.points.length; j++) {
          const dist = distance(nextPoint, otherFace.points[j]);
          if (dist < minDist && dist < 0.1) {
            minDist = dist;
            nextFaceIndex = i;
            nextPointIdx = j;
          }
        }
      }

      if (nextFaceIndex === -1) {
        break;
      }

      currentFaceIndex = nextFaceIndex;
      currentPointIndex = 1 - nextPointIdx;
    }

    if (contour.length >= 3) {
      contours.push(contour);
    }
  }

  return contours;
}

function computeContoursArea(
  contours: SectionContourPoint[][],
  normal: Vector3
): number {
  let totalArea = 0;

  for (const contour of contours) {
    if (contour.length < 3) continue;

    let area = 0;
    const n = contour.length;

    for (let i = 0; i < n; i++) {
      const p1 = contour[i];
      const p2 = contour[(i + 1) % n];

      const crossProduct = {
        x: p1.y * p2.z - p1.z * p2.y,
        y: p1.z * p2.x - p1.x * p2.z,
        z: p1.x * p2.y - p1.y * p2.x,
      };

      area += dot(crossProduct, normal);
    }

    totalArea += Math.abs(area) / 2;
  }

  return totalArea;
}

function computeContoursPerimeter(contours: SectionContourPoint[][]): number {
  let totalPerimeter = 0;

  for (const contour of contours) {
    if (contour.length < 2) continue;

    let perimeter = 0;
    const n = contour.length;

    for (let i = 0; i < n; i++) {
      const p1 = contour[i];
      const p2 = contour[(i + 1) % n];
      perimeter += distance(p1, p2);
    }

    totalPerimeter += perimeter;
  }

  return totalPerimeter;
}

function computeSectionThickness(
  model: ModelData,
  plane: SectionPlane,
  contours: SectionContourPoint[][],
  resolution: number
): SectionThicknessSample[] {
  if (contours.length === 0) return [];

  const samples: SectionThicknessSample[] = [];
  const bvh = buildBVH(model.vertices, model.indices);
  const faceNormals = computeFaceNormals(model.vertices, model.indices);

  const planeNormal = getPlaneNormal(plane.axis);

  for (const contour of contours) {
    if (contour.length < 2) continue;

    const contourLength = computeContourLength(contour);
    const step = contourLength / resolution;

    let accumulatedDist = 0;
    let currentSegment = 0;

    for (let i = 0; i < resolution; i++) {
      const targetDist = i * step;

      while (currentSegment < contour.length - 1 && accumulatedDist < targetDist) {
        const segStart = contour[currentSegment];
        const segEnd = contour[currentSegment + 1];
        const segLength = distance(segStart, segEnd);

        if (accumulatedDist + segLength < targetDist) {
          accumulatedDist += segLength;
          currentSegment++;
        } else {
          break;
        }
      }

      if (currentSegment >= contour.length - 1) break;

      const segStart = contour[currentSegment];
      const segEnd = contour[currentSegment + 1];
      const segLength = distance(segStart, segEnd);
      const t = segLength > 0 ? (targetDist - accumulatedDist) / segLength : 0;

      const samplePoint = lerpVector3(segStart, segEnd, Math.max(0, Math.min(1, t)));

      const thickness = raycastThicknessInPlane(
        samplePoint,
        planeNormal,
        bvh.triangles
      );

      if (thickness > 0 && thickness < 100) {
        samples.push({
          position: targetDist,
          thickness,
          normal: planeNormal,
        });
      }
    }
  }

  return samples;
}

function computeContourLength(contour: SectionContourPoint[]): number {
  let length = 0;
  for (let i = 0; i < contour.length - 1; i++) {
    length += distance(contour[i], contour[i + 1]);
  }
  return length;
}

function raycastThicknessInPlane(
  point: Vector3,
  planeNormal: Vector3,
  triangles: { v0: Vector3; v1: Vector3; v2: Vector3; normal: Vector3 }[]
): number {
  const rayDir = scale(normalize(planeNormal), -1);
  const rayOrigin = add(point, scale(rayDir, -0.01));

  let minT = Infinity;

  for (const tri of triangles) {
    const result = rayTriangleIntersect(rayOrigin, rayDir, tri.v0, tri.v1, tri.v2);
    if (result.hit && result.t > 0.001 && result.t < minT) {
      minT = result.t;
    }
  }

  return isFinite(minT) ? minT : -1;
}

function computeThicknessDistribution(
  samples: SectionThicknessSample[],
  minThickness: number,
  maxThickness: number
): { range: string; count: number; percentage: number }[] {
  if (samples.length === 0 || maxThickness === minThickness) {
    return [];
  }

  const binCount = 8;
  const range = maxThickness - minThickness;
  const binSize = range / binCount;
  const counts = new Array(binCount).fill(0);

  for (const sample of samples) {
    let binIndex = Math.floor((sample.thickness - minThickness) / binSize);
    if (binIndex >= binCount) binIndex = binCount - 1;
    if (binIndex < 0) binIndex = 0;
    counts[binIndex]++;
  }

  const total = samples.length;
  return counts.map((count, i) => {
    const start = (minThickness + i * binSize).toFixed(2);
    const end = (minThickness + (i + 1) * binSize).toFixed(2);
    return {
      range: `${start}-${end}mm`,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0,
    };
  });
}

export function getPlaneBounds(
  model: ModelData,
  axis: string
): { min: number; max: number } {
  const bb = model.boundingBox;
  switch (axis) {
    case 'x':
      return { min: bb.min.x, max: bb.max.x };
    case 'y':
      return { min: bb.min.y, max: bb.max.y };
    case 'z':
      return { min: bb.min.z, max: bb.max.z };
    default:
      return { min: bb.min.y, max: bb.max.y };
  }
}
