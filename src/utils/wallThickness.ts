import type {
  ModelData,
  WallThicknessResult,
  WallThicknessSample,
  Vector3,
} from '@/types';
import {
  normalize,
  scale,
  add,
  subtract,
  getFaceCentroid,
  computeFaceNormals,
  rayTriangleIntersect,
  buildBVH,
} from './geometry';

export function analyzeWallThickness(
  model: ModelData,
  sampleCount: number = 500
): WallThicknessResult {
  const { vertices, indices } = model;
  const faceCount = indices.length / 3;

  const samples: WallThicknessSample[] = [];
  const bvh = buildBVH(vertices, indices);
  const faceNormals = computeFaceNormals(vertices, indices);

  const step = Math.max(1, Math.floor(faceCount / sampleCount));
  const actualSamples = Math.min(sampleCount, faceCount);

  let minThickness = Infinity;
  let maxThickness = 0;
  let totalThickness = 0;

  for (let i = 0; i < actualSamples; i++) {
    const faceIndex = i * step;
    if (faceIndex >= faceCount) break;

    const centroid = getFaceCentroid(vertices, indices, faceIndex);
    const normal = {
      x: faceNormals[faceIndex * 3],
      y: faceNormals[faceIndex * 3 + 1],
      z: faceNormals[faceIndex * 3 + 2],
    };

    const rayDir = scale(normalize(normal), -1);
    const rayOrigin = add(centroid, scale(rayDir, -0.01));

    const thickness = raycastThickness(rayOrigin, rayDir, bvh.triangles);

    if (thickness > 0 && thickness < 100) {
      samples.push({
        x: centroid.x,
        y: centroid.y,
        z: centroid.z,
        thickness,
      });

      if (thickness < minThickness) minThickness = thickness;
      if (thickness > maxThickness) maxThickness = thickness;
      totalThickness += thickness;
    }
  }

  const avgThickness = samples.length > 0 ? totalThickness / samples.length : 0;
  const thicknessDistribution = computeThicknessDistribution(
    samples,
    minThickness,
    maxThickness
  );

  return {
    samples,
    minThickness: isFinite(minThickness) ? minThickness : 0,
    maxThickness,
    avgThickness,
    thicknessDistribution,
    sampleCount: samples.length,
  };
}

function raycastThickness(
  origin: Vector3,
  direction: Vector3,
  triangles: { v0: Vector3; v1: Vector3; v2: Vector3; normal: Vector3 }[]
): number {
  let minT = Infinity;

  for (const tri of triangles) {
    const result = rayTriangleIntersect(origin, direction, tri.v0, tri.v1, tri.v2);
    if (result.hit && result.t > 0.001 && result.t < minT) {
      minT = result.t;
    }
  }

  return isFinite(minT) ? minT : -1;
}

function computeThicknessDistribution(
  samples: WallThicknessSample[],
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

export function getThicknessColor(
  thickness: number,
  minThickness: number,
  maxThickness: number
): { r: number; g: number; b: number } {
  if (maxThickness === minThickness) {
    return { r: 0.5, g: 0.5, b: 0.5 };
  }

  const normalized = (thickness - minThickness) / (maxThickness - minThickness);

  const hue = (1 - normalized) * 240;
  return hslToRgb(hue / 360, 0.9, 0.5);
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return { r, g, b };
}
