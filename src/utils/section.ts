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
  x: number;
  y: number;
  z: number;
  edgeKey: string;
}

interface FaceIntersection {
  faceIndex: number;
  points: IntersectionPoint[];
}

export function computeSection(
  model: ModelData,
  plane: SectionPlane,
  thicknessResolution: number = 50
): SectionResult {
  const { vertices, indices } = model;
  const faceCount = indices.length / 3;

  const planePos = plane.position;
  const planeNormal = getPlaneNormal(plane.axis);

  const faceIntersections: FaceIntersection[] = [];
  const edgePointMap: Map<string, IntersectionPoint> = new Map();

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

    const d0 = getPlaneCoordinate(v0, plane.axis) - planePos;
    const d1 = getPlaneCoordinate(v1, plane.axis) - planePos;
    const d2 = getPlaneCoordinate(v2, plane.axis) - planePos;

    const points: IntersectionPoint[] = [];

    const addIntersection = (va: Vector3, vb: Vector3, da: number, db: number, ea: number, eb: number) => {
      if (da * db < 0) {
        const t = Math.abs(da) / (Math.abs(da) + Math.abs(db));
        const pt = {
          x: va.x + (vb.x - va.x) * t,
          y: va.y + (vb.y - va.y) * t,
          z: va.z + (vb.z - va.z) * t,
          edgeKey: makeEdgeKey(ea, eb),
        };
        points.push(pt);
        edgePointMap.set(pt.edgeKey, pt);
      }
    };

    addIntersection(v0, v1, d0, d1, i0, i1);
    addIntersection(v1, v2, d1, d2, i1, i2);
    addIntersection(v2, v0, d2, d0, i2, i0);

    if (points.length >= 2) {
      faceIntersections.push({
        faceIndex: i,
        points: points.slice(0, 2),
      });
    }
  }

  const contours = buildContoursSimple(faceIntersections, plane.axis);
  const area = computeContoursArea2D(contours, plane.axis);
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
  let validSampleCount = 0;

  for (const sample of thicknessSamples) {
    if (sample.thickness > 0 && sample.thickness < 1000) {
      if (sample.thickness < minThickness) minThickness = sample.thickness;
      if (sample.thickness > maxThickness) maxThickness = sample.thickness;
      totalThickness += sample.thickness;
      validSampleCount++;
    }
  }

  const avgThickness = validSampleCount > 0 ? totalThickness / validSampleCount : 0;

  const thicknessDistribution = computeThicknessDistribution(
    thicknessSamples.filter(s => s.thickness > 0 && s.thickness < 1000),
    minThickness,
    maxThickness
  );

  return {
    contourPoints: contours,
    area,
    perimeter,
    thicknessSamples,
    minThickness: isFinite(minThickness) && validSampleCount > 0 ? minThickness : 0,
    maxThickness: validSampleCount > 0 ? maxThickness : 0,
    avgThickness,
    thicknessDistribution,
    plane,
  };
}

function makeEdgeKey(a: number, b: number): string {
  return a < b ? `${a}-${b}` : `${b}-${a}`;
}

function getPlaneNormal(axis: string): Vector3 {
  switch (axis) {
    case 'x': return { x: 1, y: 0, z: 0 };
    case 'y': return { x: 0, y: 1, z: 0 };
    case 'z': return { x: 0, y: 0, z: 1 };
    default: return { x: 0, y: 1, z: 0 };
  }
}

function getPlaneCoordinate(point: Vector3, axis: string): number {
  switch (axis) {
    case 'x': return point.x;
    case 'y': return point.y;
    case 'z': return point.z;
    default: return point.y;
  }
}

function buildContoursSimple(
  faceIntersections: FaceIntersection[],
  axis: string
): SectionContourPoint[][] {
  if (faceIntersections.length === 0) return [];

  const contours: SectionContourPoint[][] = [];
  const usedFaces = new Set<number>();

  while (usedFaces.size < faceIntersections.length) {
    let startIdx = -1;
    for (let i = 0; i < faceIntersections.length; i++) {
      if (!usedFaces.has(i)) {
        startIdx = i;
        break;
      }
    }
    if (startIdx === -1) break;

    const contour: SectionContourPoint[] = [];
    let currentIdx = startIdx;
    let exitEdgeKey: string;

    const firstFace = faceIntersections[currentIdx];
    const firstPoint = firstFace.points[0];
    const firstEdgeKey = firstPoint.edgeKey;
    contour.push({ x: firstPoint.x, y: firstPoint.y, z: firstPoint.z });
    exitEdgeKey = firstFace.points[1].edgeKey;
    usedFaces.add(currentIdx);

    let safety = 0;
    const maxIterations = faceIntersections.length * 2 + 10;

    while (safety < maxIterations) {
      safety++;

      let nextIdx = -1;
      let entryPointIdx = -1;

      for (let i = 0; i < faceIntersections.length; i++) {
        if (i === currentIdx || usedFaces.has(i)) continue;

        const face = faceIntersections[i];
        for (let j = 0; j < face.points.length; j++) {
          if (face.points[j].edgeKey === exitEdgeKey) {
            nextIdx = i;
            entryPointIdx = j;
            break;
          }
        }
        if (nextIdx !== -1) break;
      }

      if (nextIdx === -1) break;

      const nextFace = faceIntersections[nextIdx];
      const entryPoint = nextFace.points[entryPointIdx];
      const exitPointIdx = entryPointIdx === 0 ? 1 : 0;
      const exitPoint = nextFace.points[exitPointIdx];

      contour.push({ x: entryPoint.x, y: entryPoint.y, z: entryPoint.z });
      exitEdgeKey = exitPoint.edgeKey;
      usedFaces.add(nextIdx);
      currentIdx = nextIdx;

      if (exitEdgeKey === firstEdgeKey) {
        break;
      }
    }

    if (contour.length >= 3) {
      contours.push(contour);
    }
  }

  return contours;
}

function distanceBetweenPoints(a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function projectTo2D(
  point: SectionContourPoint,
  axis: string
): { x: number; y: number } {
  switch (axis) {
    case 'x':
      return { x: point.y, y: point.z };
    case 'y':
      return { x: point.x, y: point.z };
    case 'z':
      return { x: point.x, y: point.y };
    default:
      return { x: point.x, y: point.z };
  }
}

function computeContoursArea2D(
  contours: SectionContourPoint[][],
  axis: string
): number {
  let totalArea = 0;

  for (const contour of contours) {
    if (contour.length < 3) continue;

    let area = 0;
    const n = contour.length;

    for (let i = 0; i < n; i++) {
      const p1 = projectTo2D(contour[i], axis);
      const p2 = projectTo2D(contour[(i + 1) % n], axis);
      area += p1.x * p2.y - p2.x * p1.y;
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
      perimeter += distanceBetweenPoints(p1, p2);
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
  const planeNormal = getPlaneNormal(plane.axis);

  for (const contour of contours) {
    if (contour.length < 2) continue;

    const contourLength = computeContourLength(contour);
    if (contourLength <= 0) continue;

    const step = contourLength / resolution;

    for (let i = 0; i <= resolution; i++) {
      const targetDist = Math.min(i * step, contourLength * 0.999);
      const samplePoint = getPointAtDistance(contour, targetDist);

      if (!samplePoint) continue;

      const thickness = raycastThicknessInPlane(
        samplePoint,
        planeNormal,
        bvh.triangles
      );

      if (thickness > 0 && thickness < 1000) {
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
    length += distanceBetweenPoints(contour[i], contour[i + 1]);
  }
  return length;
}

function getPointAtDistance(
  contour: SectionContourPoint[],
  targetDist: number
): SectionContourPoint | null {
  if (contour.length < 2) return null;

  let accumulated = 0;

  for (let i = 0; i < contour.length - 1; i++) {
    const segStart = contour[i];
    const segEnd = contour[i + 1];
    const segLen = distanceBetweenPoints(segStart, segEnd);

    if (accumulated + segLen >= targetDist) {
      const t = segLen > 0 ? (targetDist - accumulated) / segLen : 0;
      return {
        x: segStart.x + (segEnd.x - segStart.x) * t,
        y: segStart.y + (segEnd.y - segStart.y) * t,
        z: segStart.z + (segEnd.z - segStart.z) * t,
      };
    }

    accumulated += segLen;
  }

  return contour[contour.length - 1];
}

function raycastThicknessInPlane(
  point: Vector3,
  planeNormal: Vector3,
  triangles: { v0: Vector3; v1: Vector3; v2: Vector3; normal: Vector3 }[]
): number {
  const rayDir = {
    x: -planeNormal.x,
    y: -planeNormal.y,
    z: -planeNormal.z,
  };
  const rayOrigin = {
    x: point.x + planeNormal.x * 0.01,
    y: point.y + planeNormal.y * 0.01,
    z: point.z + planeNormal.z * 0.01,
  };

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
  if (samples.length === 0 || maxThickness <= minThickness) {
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
