import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import {
  vec3ToThree,
  threeToVec3,
  normalize,
  dot,
  cross,
  subtract,
  add,
  scale,
  length,
  distance,
  distanceSq,
  angleBetween,
  computeBoundingBox,
  computeFaceNormal,
  computeFaceNormals,
  getFaceCentroid,
  buildBVH,
  rayTriangleIntersect,
  raycastBVH,
  closestPointBVH,
  geometryToModelData,
} from '@/utils/geometry';
import { expectVec3Close, expectBBoxClose, createCubeModel, createTetrahedronModel, createPlaneModel } from './helpers';

describe('vec3ToThree / threeToVec3', () => {
  it('should convert Vector3 to THREE.Vector3', () => {
    const v = { x: 1, y: 2, z: 3 };
    const result = vec3ToThree(v);
    expect(result).toBeInstanceOf(THREE.Vector3);
    expect(result.x).toBe(1);
    expect(result.y).toBe(2);
    expect(result.z).toBe(3);
  });

  it('should convert THREE.Vector3 to Vector3', () => {
    const v = new THREE.Vector3(1, 2, 3);
    const result = threeToVec3(v);
    expect(result).toEqual({ x: 1, y: 2, z: 3 });
  });

  it('should be inverse operations', () => {
    const v = { x: 1.5, y: -2.3, z: 0.7 };
    const roundTripped = threeToVec3(vec3ToThree(v));
    expectVec3Close(roundTripped, v);
  });
});

describe('Vector math operations', () => {
  it('normalize: should return unit vector', () => {
    const v = { x: 3, y: 4, z: 0 };
    const result = normalize(v);
    expectVec3Close(result, { x: 0.6, y: 0.8, z: 0 });
  });

  it('normalize: zero vector returns zero', () => {
    const result = normalize({ x: 0, y: 0, z: 0 });
    expect(result).toEqual({ x: 0, y: 0, z: 0 });
  });

  it('dot: should compute dot product', () => {
    const a = { x: 1, y: 2, z: 3 };
    const b = { x: 4, y: 5, z: 6 };
    expect(dot(a, b)).toBe(1 * 4 + 2 * 5 + 3 * 6);
  });

  it('dot: orthogonal vectors return 0', () => {
    expect(dot({ x: 1, y: 0, z: 0 }, { x: 0, y: 1, z: 0 })).toBe(0);
  });

  it('cross: should compute cross product', () => {
    const a = { x: 1, y: 0, z: 0 };
    const b = { x: 0, y: 1, z: 0 };
    expectVec3Close(cross(a, b), { x: 0, y: 0, z: 1 });
  });

  it('cross: cross of parallel vectors is zero', () => {
    const a = { x: 1, y: 2, z: 3 };
    const b = { x: 2, y: 4, z: 6 };
    expectVec3Close(cross(a, b), { x: 0, y: 0, z: 0 });
  });

  it('subtract: should subtract vectors', () => {
    const a = { x: 5, y: 7, z: 9 };
    const b = { x: 2, y: 3, z: 4 };
    expectVec3Close(subtract(a, b), { x: 3, y: 4, z: 5 });
  });

  it('add: should add vectors', () => {
    const a = { x: 1, y: 2, z: 3 };
    const b = { x: 4, y: 5, z: 6 };
    expectVec3Close(add(a, b), { x: 5, y: 7, z: 9 });
  });

  it('scale: should scale vector', () => {
    const v = { x: 1, y: 2, z: 3 };
    expectVec3Close(scale(v, 2), { x: 2, y: 4, z: 6 });
    expectVec3Close(scale(v, 0), { x: 0, y: 0, z: 0 });
  });

  it('length: should compute vector length', () => {
    expect(length({ x: 3, y: 4, z: 0 })).toBe(5);
    expect(length({ x: 0, y: 0, z: 0 })).toBe(0);
  });

  it('distance: should compute distance between points', () => {
    const a = { x: 0, y: 0, z: 0 };
    const b = { x: 3, y: 4, z: 0 };
    expect(distance(a, b)).toBe(5);
  });

  it('distanceSq: should compute squared distance', () => {
    const a = { x: 0, y: 0, z: 0 };
    const b = { x: 1, y: 2, z: 3 };
    expect(distanceSq(a, b)).toBe(14);
  });

  it('angleBetween: should compute angle in degrees', () => {
    const a = { x: 1, y: 0, z: 0 };
    const b = { x: 0, y: 1, z: 0 };
    expect(Math.abs(angleBetween(a, b) - 90)).toBeLessThan(1e-6);
  });

  it('angleBetween: same direction returns 0', () => {
    const a = { x: 1, y: 0, z: 0 };
    expect(angleBetween(a, a)).toBe(0);
  });

  it('angleBetween: zero vectors return 0', () => {
    expect(angleBetween({ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 })).toBe(0);
  });
});

describe('Bounding box computation', () => {
  it('should compute correct bounding box for unit cube', () => {
    const vertices = new Float32Array([
      0, 0, 0,
      1, 0, 0,
      1, 1, 0,
      0, 1, 0,
      0, 0, 1,
      1, 0, 1,
      1, 1, 1,
      0, 1, 1,
    ]);

    const bbox = computeBoundingBox(vertices);
    expectBBoxClose(bbox, {
      min: { x: 0, y: 0, z: 0 },
      max: { x: 1, y: 1, z: 1 },
      center: { x: 0.5, y: 0.5, z: 0.5 },
      size: { x: 1, y: 1, z: 1 },
    });
  });

  it('should handle single vertex', () => {
    const vertices = new Float32Array([5, -3, 7]);
    const bbox = computeBoundingBox(vertices);
    expectBBoxClose(bbox, {
      min: { x: 5, y: -3, z: 7 },
      max: { x: 5, y: -3, z: 7 },
      center: { x: 5, y: -3, z: 7 },
      size: { x: 0, y: 0, z: 0 },
    });
  });
});

describe('Face normal computation', () => {
  it('should compute correct face normal for XY plane triangle', () => {
    const vertices = new Float32Array([
      0, 0, 0,
      1, 0, 0,
      0, 1, 0,
    ]);
    const normal = computeFaceNormal(vertices, 0, 1, 2);
    expectVec3Close(normal, { x: 0, y: 0, z: 1 });
  });

  it('should return zero normal for degenerate triangle', () => {
    const vertices = new Float32Array([
      0, 0, 0,
      0, 0, 0,
      1, 0, 0,
    ]);
    const normal = computeFaceNormal(vertices, 0, 1, 2);
    expectVec3Close(normal, { x: 0, y: 0, z: 0 });
  });

  it('computeFaceNormals should return correct number of normals', () => {
    const cube = createCubeModel();
    const normals = computeFaceNormals(cube.vertices, cube.indices);
    expect(normals.length).toBe(cube.faceCount * 3);
  });
});

describe('Face centroid computation', () => {
  it('should compute correct centroid', () => {
    const vertices = new Float32Array([
      0, 0, 0,
      3, 0, 0,
      0, 3, 0,
    ]);
    const indices = new Uint32Array([0, 1, 2]);
    const centroid = getFaceCentroid(vertices, indices, 0);
    expectVec3Close(centroid, { x: 1, y: 1, z: 0 });
  });
});

describe('BVH building and raycasting', () => {
  it('buildBVH should create valid BVH structure', () => {
    const cube = createCubeModel();
    const bvh = buildBVH(cube.vertices, cube.indices);
    expect(bvh).toBeDefined();
    expect(bvh.root).toBeDefined();
    expect(bvh.triangles.length).toBe(cube.faceCount);
    expect(bvh.root.triCount).toBe(cube.faceCount);
  });

  it('rayTriangleIntersect should detect hit', () => {
    const v0 = { x: 0, y: 0, z: 0 };
    const v1 = { x: 1, y: 0, z: 0 };
    const v2 = { x: 0, y: 1, z: 0 };
    const origin = { x: 0.25, y: 0.25, z: 5 };
    const direction = { x: 0, y: 0, z: -1 };

    const result = rayTriangleIntersect(origin, direction, v0, v1, v2);
    expect(result.hit).toBe(true);
    expect(result.t).toBeCloseTo(5);
    expectVec3Close(result.point, { x: 0.25, y: 0.25, z: 0 });
  });

  it('rayTriangleIntersect should miss parallel ray', () => {
    const v0 = { x: 0, y: 0, z: 0 };
    const v1 = { x: 1, y: 0, z: 0 };
    const v2 = { x: 0, y: 1, z: 0 };
    const origin = { x: 0, y: 0, z: 5 };
    const direction = { x: 1, y: 0, z: 0 };

    const result = rayTriangleIntersect(origin, direction, v0, v1, v2);
    expect(result.hit).toBe(false);
  });

  it('raycastBVH should hit cube from front', () => {
    const cube = createCubeModel(2, { x: 0, y: 0, z: 0 });
    const bvh = buildBVH(cube.vertices, cube.indices);
    const origin = { x: 0, y: 0, z: 5 };
    const direction = { x: 0, y: 0, z: -1 };

    const result = raycastBVH(origin, direction, bvh);
    expect(result.hit).toBe(true);
    expect(result.t).toBeCloseTo(4);
    expectVec3Close(result.point, { x: 0, y: 0, z: 1 }, 1e-3);
  });

  it('raycastBVH should miss when ray points away', () => {
    const cube = createCubeModel();
    const bvh = buildBVH(cube.vertices, cube.indices);
    const origin = { x: 0, y: 0, z: 5 };
    const direction = { x: 0, y: 0, z: 1 };

    const result = raycastBVH(origin, direction, bvh);
    expect(result.hit).toBe(false);
  });

  it('closestPointBVH should find closest point on plane', () => {
    const plane = createPlaneModel(4, 4);
    const bvh = buildBVH(plane.vertices, plane.indices);
    const point = { x: 1, y: 2, z: 1 };

    const result = closestPointBVH(point, bvh);
    expect(result.distance).toBeCloseTo(2);
    expect(result.closestPoint.y).toBeCloseTo(0);
    expect(Math.abs(result.closestPoint.x - 1)).toBeLessThan(1e-3);
    expect(Math.abs(result.closestPoint.z - 1)).toBeLessThan(1e-3);
  });
});

describe('geometryToModelData', () => {
  it('should convert THREE.BufferGeometry to ModelData', () => {
    const geometry = new THREE.BoxGeometry(2, 2, 2);
    const modelData = geometryToModelData(geometry, 'test-box');

    expect(modelData.name).toBe('test-box');
    expect(modelData.faceCount).toBe(12);
    expect(modelData.vertices.length).toBe(modelData.vertexCount * 3);
    expect(modelData.indices.length).toBe(36);
    expect(modelData.normals.length).toBe(modelData.faceCount * 3);
    expectBBoxClose(modelData.boundingBox, {
      min: { x: -1, y: -1, z: -1 },
      max: { x: 1, y: 1, z: 1 },
      center: { x: 0, y: 0, z: 0 },
      size: { x: 2, y: 2, z: 2 },
    });
  });

  it('should handle non-indexed geometry', () => {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array([
      0, 0, 0, 1, 0, 0, 0, 1, 0,
    ]);
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const modelData = geometryToModelData(geometry);
    expect(modelData.faceCount).toBe(1);
    expect(modelData.vertexCount).toBe(3);
    expect(modelData.indices).toBeDefined();
  });
});
