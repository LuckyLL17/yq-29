import type { ModelData, DraftAngleResult, Vector3 } from '@/types';
import { normalize, dot, computeFaceNormals } from './geometry';

export function analyzeDraftAngles(
  model: ModelData,
  draftDirection: Vector3,
  threshold: number
): DraftAngleResult {
  const { vertices, indices } = model;
  const faceCount = indices.length / 3;
  const faceAngles = new Float32Array(faceCount);

  const faceNormals = computeFaceNormals(vertices, indices);
  const draftDir = normalize(draftDirection);

  let minAngle = 90;
  let maxAngle = 0;
  let totalAngle = 0;
  let undercutCount = 0;

  for (let i = 0; i < faceCount; i++) {
    const nx = faceNormals[i * 3];
    const ny = faceNormals[i * 3 + 1];
    const nz = faceNormals[i * 3 + 2];

    const dotProduct = nx * draftDir.x + ny * draftDir.y + nz * draftDir.z;
    const clampedDot = Math.max(-1, Math.min(1, dotProduct));
    let angle = (Math.acos(clampedDot) * 180) / Math.PI;

    angle = 90 - angle;
    if (angle < 0) angle = 0;

    faceAngles[i] = angle;

    if (angle < minAngle) minAngle = angle;
    if (angle > maxAngle) maxAngle = angle;
    totalAngle += angle;

    if (angle < threshold) {
      undercutCount++;
    }
  }

  const avgAngle = totalAngle / faceCount;
  const angleDistribution = computeAngleDistribution(faceAngles, threshold);

  return {
    faceAngles,
    minAngle,
    maxAngle,
    avgAngle,
    undercutFaceCount: undercutCount,
    draftDirection: draftDir,
    threshold,
    angleDistribution,
  };
}

function computeAngleDistribution(
  faceAngles: Float32Array,
  threshold: number
): { range: string; count: number; percentage: number }[] {
  const ranges = [
    { min: 0, max: threshold, label: `< ${threshold}° (倒扣)` },
    { min: threshold, max: threshold + 2, label: `${threshold}-${threshold + 2}°` },
    { min: threshold + 2, max: threshold + 5, label: `${threshold + 2}-${threshold + 5}°` },
    { min: threshold + 5, max: threshold + 10, label: `${threshold + 5}-${threshold + 10}°` },
    { min: threshold + 10, max: 90, label: `> ${threshold + 10}°` },
  ];

  const counts = new Array(ranges.length).fill(0);
  const total = faceAngles.length;

  for (let i = 0; i < faceAngles.length; i++) {
    const angle = faceAngles[i];
    for (let j = 0; j < ranges.length; j++) {
      if (angle >= ranges[j].min && angle < ranges[j].max) {
        counts[j]++;
        break;
      }
    }
    if (angle >= ranges[ranges.length - 1].min) {
      counts[ranges.length - 1]++;
    }
  }

  return ranges.map((range, i) => ({
    range: range.label,
    count: counts[i],
    percentage: total > 0 ? (counts[i] / total) * 100 : 0,
  }));
}

export function getDraftAngleColor(
  angle: number,
  threshold: number
): { r: number; g: number; b: number } {
  if (angle < threshold) {
    const t = angle / threshold;
    return {
      r: 1,
      g: 0.3 + t * 0.3,
      b: 0.1,
    };
  }

  const maxAngle = 45;
  const normalizedAngle = Math.min((angle - threshold) / (maxAngle - threshold), 1);

  const hue = 120 + normalizedAngle * 60;
  return hslToRgb(hue / 360, 0.8, 0.5);
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

export function createDraftAngleVertexColors(
  model: ModelData,
  draftResult: DraftAngleResult
): Float32Array {
  const { vertices, indices } = model;
  const vertexCount = vertices.length / 3;
  const colors = new Float32Array(vertexCount * 3);
  const vertexAngleSum = new Float32Array(vertexCount);
  const vertexFaceCount = new Uint32Array(vertexCount);

  const faceCount = indices.length / 3;
  for (let i = 0; i < faceCount; i++) {
    const i0 = indices[i * 3];
    const i1 = indices[i * 3 + 1];
    const i2 = indices[i * 3 + 2];
    const angle = draftResult.faceAngles[i];

    vertexAngleSum[i0] += angle;
    vertexAngleSum[i1] += angle;
    vertexAngleSum[i2] += angle;
    vertexFaceCount[i0]++;
    vertexFaceCount[i1]++;
    vertexFaceCount[i2]++;
  }

  for (let i = 0; i < vertexCount; i++) {
    const avgAngle = vertexFaceCount[i] > 0 ? vertexAngleSum[i] / vertexFaceCount[i] : 0;
    const color = getDraftAngleColor(avgAngle, draftResult.threshold);
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }

  return colors;
}
