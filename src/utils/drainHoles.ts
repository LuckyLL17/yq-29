import type { ModelData, DrainHoleResult, DrainHole, Vector3 } from '@/types';
import { getFaceCentroid, computeFaceNormals, distance, normalize } from './geometry';

export function planDrainHoles(
  model: ModelData,
  holeDiameter: number = 2,
  holeSpacing: number = 15
): DrainHoleResult {
  const { vertices, indices, boundingBox } = model;
  const faceCount = indices.length / 3;
  const faceNormals = computeFaceNormals(vertices, indices);

  const holes: DrainHole[] = [];
  const candidateFaces: { index: number; centroid: Vector3; normal: Vector3; priority: number }[] = [];

  const bottomY = boundingBox.min.y;
  const topY = boundingBox.max.y;
  const heightRange = topY - bottomY;

  for (let i = 0; i < faceCount; i++) {
    const centroid = getFaceCentroid(vertices, indices, i);
    const normal = {
      x: faceNormals[i * 3],
      y: faceNormals[i * 3 + 1],
      z: faceNormals[i * 3 + 2],
    };

    let priority = 0;
    const normalizedY = (centroid.y - bottomY) / heightRange;
    priority += normalizedY * 0.5;

    const normalY = Math.abs(normal.y);
    priority += (1 - normalY) * 0.3;

    if (normal.y < -0.3) {
      priority += 0.4;
    }

    candidateFaces.push({ index: i, centroid, normal, priority });
  }

  candidateFaces.sort((a, b) => b.priority - a.priority);

  let holeId = 0;
  for (const candidate of candidateFaces) {
    let tooClose = false;

    for (const hole of holes) {
      const dist = distance(candidate.centroid, hole.position);
      if (dist < holeSpacing) {
        tooClose = true;
        break;
      }
    }

    if (!tooClose && candidate.normal.y > -0.2) {
      const holeType = candidate.priority > 0.6 ? 'suction' : 'dewatering';
      const adjustedDiameter = holeType === 'suction' ? holeDiameter * 1.2 : holeDiameter;

      holes.push({
        id: `hole-${holeId++}`,
        position: { ...candidate.centroid },
        normal: normalize(candidate.normal),
        diameter: adjustedDiameter,
        type: holeType,
      });
    }

    if (holes.length >= 200) break;
  }

  const suctionCount = holes.filter((h) => h.type === 'suction').length;
  const dewateringCount = holes.filter((h) => h.type === 'dewatering').length;

  const totalArea = holes.reduce((sum, hole) => {
    const radius = hole.diameter / 2;
    return sum + Math.PI * radius * radius;
  }, 0);

  const modelSurfaceArea = estimateSurfaceArea(model);
  const recommendedDensity = (totalArea / modelSurfaceArea) * 100;

  return {
    holes,
    totalCount: holes.length,
    totalArea,
    suctionCount,
    dewateringCount,
    recommendedDensity,
  };
}

function estimateSurfaceArea(model: ModelData): number {
  const { vertices, indices } = model;
  const faceCount = indices.length / 3;
  let totalArea = 0;

  for (let i = 0; i < faceCount; i++) {
    const i0 = indices[i * 3];
    const i1 = indices[i * 3 + 1];
    const i2 = indices[i * 3 + 2];

    const v0 = { x: vertices[i0 * 3], y: vertices[i0 * 3 + 1], z: vertices[i0 * 3 + 2] };
    const v1 = { x: vertices[i1 * 3], y: vertices[i1 * 3 + 1], z: vertices[i1 * 3 + 2] };
    const v2 = { x: vertices[i2 * 3], y: vertices[i2 * 3 + 1], z: vertices[i2 * 3 + 2] };

    const e1 = {
      x: v1.x - v0.x,
      y: v1.y - v0.y,
      z: v1.z - v0.z,
    };
    const e2 = {
      x: v2.x - v0.x,
      y: v2.y - v0.y,
      z: v2.z - v0.z,
    };

    const crossX = e1.y * e2.z - e1.z * e2.y;
    const crossY = e1.z * e2.x - e1.x * e2.z;
    const crossZ = e1.x * e2.y - e1.y * e2.x;
    const area = 0.5 * Math.sqrt(crossX * crossX + crossY * crossY + crossZ * crossZ);

    totalArea += area;
  }

  return totalArea;
}

export function generateSampleModel(): {
  vertices: Float32Array;
  indices: Uint32Array;
} {
  const vertices: number[] = [];
  const indices: number[] = [];

  const width = 100;
  const depth = 80;
  const height = 50;
  const thickness = 2;

  const bottomVerts = [
    [-width / 2, 0, -depth / 2],
    [width / 2, 0, -depth / 2],
    [width / 2, 0, depth / 2],
    [-width / 2, 0, depth / 2],
  ];

  const topVerts = [
    [-width / 2 + thickness, height, -depth / 2 + thickness],
    [width / 2 - thickness, height, -depth / 2 + thickness],
    [width / 2 - thickness, height, depth / 2 - thickness],
    [-width / 2 + thickness, height, depth / 2 - thickness],
  ];

  const midVerts = [
    [-width / 2, height * 0.7, -depth / 2],
    [width / 2, height * 0.7, -depth / 2],
    [width / 2, height * 0.7, depth / 2],
    [-width / 2, height * 0.7, depth / 2],
  ];

  const baseVertexCount = vertices.length / 3;
  for (const v of bottomVerts) {
    vertices.push(v[0], v[1], v[2]);
  }
  for (const v of midVerts) {
    vertices.push(v[0], v[1], v[2]);
  }
  for (const v of topVerts) {
    vertices.push(v[0], v[1], v[2]);
  }

  for (let i = 0; i < 4; i++) {
    const next = (i + 1) % 4;
    indices.push(
      baseVertexCount + i,
      baseVertexCount + next,
      baseVertexCount + 4 + i
    );
    indices.push(
      baseVertexCount + next,
      baseVertexCount + 4 + next,
      baseVertexCount + 4 + i
    );
  }

  for (let i = 0; i < 4; i++) {
    const next = (i + 1) % 4;
    indices.push(
      baseVertexCount + 4 + i,
      baseVertexCount + 4 + next,
      baseVertexCount + 8 + i
    );
    indices.push(
      baseVertexCount + 4 + next,
      baseVertexCount + 8 + next,
      baseVertexCount + 8 + i
    );
  }

  indices.push(
    baseVertexCount + 8,
    baseVertexCount + 9,
    baseVertexCount + 10
  );
  indices.push(
    baseVertexCount + 8,
    baseVertexCount + 10,
    baseVertexCount + 11
  );

  indices.push(
    baseVertexCount,
    baseVertexCount + 3,
    baseVertexCount + 2
  );
  indices.push(
    baseVertexCount,
    baseVertexCount + 2,
    baseVertexCount + 1
  );

  return {
    vertices: new Float32Array(vertices),
    indices: new Uint32Array(indices),
  };
}
