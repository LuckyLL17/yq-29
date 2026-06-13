import type { ModelData, Vector3, BoundingBox } from '@/types';
import { computeBoundingBox, computeFaceNormals } from '@/utils/geometry';

export function createCubeModel(size: number = 2, center: Vector3 = { x: 0, y: 0, z: 0 }): ModelData {
  const s = size / 2;
  const cx = center.x, cy = center.y, cz = center.z;

  const vertices = new Float32Array([
    cx - s, cy - s, cz - s,
    cx + s, cy - s, cz - s,
    cx + s, cy + s, cz - s,
    cx - s, cy + s, cz - s,
    cx - s, cy - s, cz + s,
    cx + s, cy - s, cz + s,
    cx + s, cy + s, cz + s,
    cx - s, cy + s, cz + s,
  ]);

  const indices = new Uint32Array([
    0, 1, 2, 0, 2, 3,
    4, 6, 5, 4, 7, 6,
    0, 4, 5, 0, 5, 1,
    1, 5, 6, 1, 6, 2,
    2, 6, 7, 2, 7, 3,
    4, 0, 3, 4, 3, 7,
  ]);

  const normals = computeFaceNormals(vertices, indices);
  const boundingBox = computeBoundingBox(vertices);

  return {
    id: 'test-cube',
    name: 'Test Cube',
    vertices,
    indices,
    normals,
    boundingBox,
    faceCount: indices.length / 3,
    vertexCount: vertices.length / 3,
  };
}

export function createTetrahedronModel(): ModelData {
  const vertices = new Float32Array([
    0, 0, 0,
    1, 0, 0,
    0.5, Math.sqrt(3) / 2, 0,
    0.5, Math.sqrt(3) / 6, Math.sqrt(6) / 3,
  ]);

  const indices = new Uint32Array([
    0, 1, 2,
    0, 1, 3,
    1, 2, 3,
    0, 2, 3,
  ]);

  const normals = computeFaceNormals(vertices, indices);
  const boundingBox = computeBoundingBox(vertices);

  return {
    id: 'test-tetra',
    name: 'Test Tetrahedron',
    vertices,
    indices,
    normals,
    boundingBox,
    faceCount: indices.length / 3,
    vertexCount: vertices.length / 3,
  };
}

export function createPlaneModel(width: number = 2, height: number = 2): ModelData {
  const w = width / 2, h = height / 2;

  const vertices = new Float32Array([
    -w, 0, -h,
     w, 0, -h,
     w, 0,  h,
    -w, 0,  h,
  ]);

  const indices = new Uint32Array([
    0, 1, 2,
    0, 2, 3,
  ]);

  const normals = computeFaceNormals(vertices, indices);
  const boundingBox = computeBoundingBox(vertices);

  return {
    id: 'test-plane',
    name: 'Test Plane',
    vertices,
    indices,
    normals,
    boundingBox,
    faceCount: indices.length / 3,
    vertexCount: vertices.length / 3,
  };
}

export function createThinBoxModel(width: number = 10, height: number = 10, thickness: number = 2): ModelData {
  const w = width / 2, h = height / 2, t = thickness / 2;

  const vertices = new Float32Array([
    -w, -t, -h,
     w, -t, -h,
     w,  t, -h,
    -w,  t, -h,
    -w, -t,  h,
     w, -t,  h,
     w,  t,  h,
    -w,  t,  h,
  ]);

  const indices = new Uint32Array([
    0, 1, 2, 0, 2, 3,
    4, 6, 5, 4, 7, 6,
    0, 4, 5, 0, 5, 1,
    1, 5, 6, 1, 6, 2,
    2, 6, 7, 2, 7, 3,
    4, 0, 3, 4, 3, 7,
  ]);

  const normals = computeFaceNormals(vertices, indices);
  const boundingBox = computeBoundingBox(vertices);

  return {
    id: 'test-thinbox',
    name: 'Test Thin Box',
    vertices,
    indices,
    normals,
    boundingBox,
    faceCount: indices.length / 3,
    vertexCount: vertices.length / 3,
  };
}

export function expectVec3Close(a: Vector3, b: Vector3, epsilon: number = 1e-6) {
  expect(Math.abs(a.x - b.x)).toBeLessThan(epsilon);
  expect(Math.abs(a.y - b.y)).toBeLessThan(epsilon);
  expect(Math.abs(a.z - b.z)).toBeLessThan(epsilon);
}

export function expectBBoxClose(a: BoundingBox, b: BoundingBox, epsilon: number = 1e-6) {
  expectVec3Close(a.min, b.min, epsilon);
  expectVec3Close(a.max, b.max, epsilon);
  expectVec3Close(a.center, b.center, epsilon);
  expectVec3Close(a.size, b.size, epsilon);
}
