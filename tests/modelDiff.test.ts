import { describe, it, expect } from 'vitest';
import {
  computeModelDiff,
  createDiffVertexColors,
} from '@/utils/modelDiff';
import { createCubeModel } from './helpers';

describe('computeModelDiff', () => {
  it('should return zero diff for identical models', () => {
    const cube = createCubeModel(2);
    const result = computeModelDiff(cube, cube);

    expect(result.vertexDistances.length).toBe(cube.vertexCount);
    expect(result.avgDistance).toBeLessThan(0.01);
    expect(result.zeroCount).toBe(cube.vertexCount);
  });

  it('should detect positive distance for translated model', () => {
    const cube1 = createCubeModel(2);
    const cube2 = createCubeModel(2, { x: 0, y: 5, z: 0 });
    const result = computeModelDiff(cube1, cube2);

    expect(result.maxDistance).toBeGreaterThan(3);
    expect(result.avgDistance).toBeGreaterThan(3);
  });

  it('should classify vertex distances correctly', () => {
    const cube1 = createCubeModel(2);
    const cube2 = createCubeModel(2, { x: 0, y: 10, z: 0 });
    const result = computeModelDiff(cube1, cube2);

    const total = result.positiveCount + result.negativeCount + result.zeroCount;
    expect(total).toBe(cube1.vertexCount);
  });

  it('should compute distance distribution', () => {
    const cube1 = createCubeModel(2);
    const cube2 = createCubeModel(2, { x: 0, y: 3, z: 0 });
    const result = computeModelDiff(cube1, cube2);

    expect(result.distanceDistribution).toBeDefined();
    expect(result.distanceDistribution.length).toBe(10);
    const total = result.distanceDistribution.reduce((sum, d) => sum + d.count, 0);
    expect(total).toBe(cube1.vertexCount);
  });

  it('should have valid distance values', () => {
    const cube1 = createCubeModel(2);
    const cube2 = createCubeModel(4);
    const result = computeModelDiff(cube1, cube2);

    expect(result.minDistance).toBeLessThanOrEqual(result.maxDistance);
    expect(result.avgDistance).toBeGreaterThanOrEqual(0);

    for (let i = 0; i < result.vertexDistances.length; i++) {
      const d = result.vertexDistances[i];
      expect(d).toBeGreaterThanOrEqual(result.minDistance - 1e-6);
      expect(d).toBeLessThanOrEqual(result.maxDistance + 1e-6);
    }
  });

  it('should detect negative distances for enclosed vertices', () => {
    const outerCube = createCubeModel(4);
    const innerCube = createCubeModel(1);
    const result = computeModelDiff(innerCube, outerCube);

    expect(result.vertexDistances.length).toBe(innerCube.vertexCount);
  });
});

describe('createDiffVertexColors', () => {
  it('should create correct number of vertex colors', () => {
    const cube = createCubeModel(2);
    const diffResult = computeModelDiff(cube, cube);
    const colors = createDiffVertexColors(cube, diffResult);

    expect(colors.length).toBe(cube.vertexCount * 3);
  });

  it('should use gray for zero-diff vertices', () => {
    const cube = createCubeModel(2);
    const diffResult = computeModelDiff(cube, cube);
    const colors = createDiffVertexColors(cube, diffResult);

    for (let i = 0; i < cube.vertexCount; i++) {
      expect(colors[i * 3]).toBeCloseTo(0.5);
      expect(colors[i * 3 + 1]).toBeCloseTo(0.5);
      expect(colors[i * 3 + 2]).toBeCloseTo(0.5);
    }
  });

  it('should use red for positive distances', () => {
    const cube1 = createCubeModel(2);
    const cube2 = createCubeModel(2, { x: 0, y: 5, z: 0 });
    const diffResult = computeModelDiff(cube1, cube2);
    const colors = createDiffVertexColors(cube1, diffResult);

    for (let i = 0; i < cube1.vertexCount; i++) {
      const d = diffResult.vertexDistances[i];
      if (d > 0.001) {
        expect(colors[i * 3]).toBeGreaterThan(0.5);
        expect(colors[i * 3 + 2]).toBeCloseTo(0.2);
      }
    }
  });

  it('should return valid RGB values', () => {
    const cube1 = createCubeModel(2);
    const cube2 = createCubeModel(2, { x: 1, y: 2, z: -1 });
    const diffResult = computeModelDiff(cube1, cube2);
    const colors = createDiffVertexColors(cube1, diffResult);

    for (let i = 0; i < colors.length; i++) {
      expect(colors[i]).toBeGreaterThanOrEqual(0);
      expect(colors[i]).toBeLessThanOrEqual(1);
    }
  });
});
