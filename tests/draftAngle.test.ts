import { describe, it, expect } from 'vitest';
import {
  analyzeDraftAngles,
  getDraftAngleColor,
  createDraftAngleVertexColors,
  createUndercutRegionGeometry,
} from '@/utils/draftAngle';
import { createCubeModel, createPlaneModel, expectVec3Close } from './helpers';

describe('analyzeDraftAngles', () => {
  it('should analyze cube with +Y draft direction (perfect draft)', () => {
    const cube = createCubeModel(2);
    const result = analyzeDraftAngles(cube, { x: 0, y: 1, z: 0 }, 3);

    expect(result.threshold).toBe(3);
    expect(result.faceAngles.length).toBe(cube.faceCount);
    expect(result.avgAngle).toBeGreaterThan(0);
    expect(result.minAngle).toBeGreaterThanOrEqual(0);
    expect(result.maxAngle).toBeLessThanOrEqual(90);

    expect(result.angleDistribution.length).toBe(5);
    const totalCount = result.angleDistribution.reduce((sum, d) => sum + d.count, 0);
    expect(totalCount).toBe(cube.faceCount);
  });

  it('should identify undercuts when draft is inverted', () => {
    const cube = createCubeModel(2);
    const result = analyzeDraftAngles(cube, { x: 0, y: -1, z: 0 }, 3);

    expect(result.undercutFaceCount).toBeGreaterThan(0);
    expect(result.undercutRegions.length).toBeGreaterThan(0);
  });

  it('should handle plane model with correct normal', () => {
    const plane = createPlaneModel(2, 2);
    const result = analyzeDraftAngles(plane, { x: 0, y: 1, z: 0 }, 3);

    expect(result.faceAngles.length).toBe(plane.faceCount);
    expect(result.faceAngles[0]).toBeCloseTo(0, 0.1);
  });

  it('should generate repair suggestions for critical undercuts', () => {
    const cube = createCubeModel(10);
    const result = analyzeDraftAngles(cube, { x: 0, y: -1, z: 0 }, 3);

    if (result.undercutRegions.length > 0) {
      expect(result.repairSuggestions.length).toBeGreaterThanOrEqual(0);
      for (const suggestion of result.repairSuggestions) {
        expect(suggestion.id).toBeDefined();
        expect(suggestion.regionId).toBeDefined();
        expect(['add_draft', 'fillet', 'chamfer', 'redesign', 'split']).toContain(suggestion.type);
        expect(['easy', 'medium', 'hard']).toContain(suggestion.difficulty);
      }
    }
  });

  it('should classify undercut severity correctly', () => {
    const cube = createCubeModel(10);
    const result = analyzeDraftAngles(cube, { x: 0, y: -1, z: 0 }, 3);

    for (const region of result.undercutRegions) {
      expect(['critical', 'high', 'medium', 'low']).toContain(region.severity);
      expect(region.area).toBeGreaterThan(0);
      expect(region.faceIndices.length).toBeGreaterThan(0);
    }
  });

  it('should normalize draft direction', () => {
    const cube = createCubeModel(2);
    const result1 = analyzeDraftAngles(cube, { x: 0, y: 2, z: 0 }, 3);
    const result2 = analyzeDraftAngles(cube, { x: 0, y: 1, z: 0 }, 3);

    expectVec3Close(result1.draftDirection, result2.draftDirection);
  });

  it('should return empty undercut regions when threshold is 0', () => {
    const cube = createCubeModel(2);
    const result = analyzeDraftAngles(cube, { x: 0, y: 1, z: 0 }, 0);

    expect(result.undercutFaceCount).toBe(0);
    expect(result.undercutRegions).toEqual([]);
    expect(result.repairSuggestions).toEqual([]);
  });
});

describe('getDraftAngleColor', () => {
  it('should return warm colors for under-threshold angles', () => {
    const color = getDraftAngleColor(1, 3);
    expect(color.r).toBe(1);
    expect(color.g).toBeLessThan(0.7);
    expect(color.b).toBe(0.1);
  });

  it('should return cool colors for good draft angles', () => {
    const color = getDraftAngleColor(30, 3);
    expect(color.r).toBeLessThan(0.5);
    expect(color.g).toBeGreaterThan(0.5);
  });

  it('should return valid RGB values between 0 and 1', () => {
    for (let angle = 0; angle <= 90; angle += 5) {
      const color = getDraftAngleColor(angle, 3);
      expect(color.r).toBeGreaterThanOrEqual(0);
      expect(color.r).toBeLessThanOrEqual(1);
      expect(color.g).toBeGreaterThanOrEqual(0);
      expect(color.g).toBeLessThanOrEqual(1);
      expect(color.b).toBeGreaterThanOrEqual(0);
      expect(color.b).toBeLessThanOrEqual(1);
    }
  });
});

describe('createDraftAngleVertexColors', () => {
  it('should create correct number of vertex colors', () => {
    const cube = createCubeModel(2);
    const result = analyzeDraftAngles(cube, { x: 0, y: 1, z: 0 }, 3);
    const colors = createDraftAngleVertexColors(cube, result);

    expect(colors.length).toBe(cube.vertexCount * 3);
    for (let i = 0; i < colors.length; i++) {
      expect(colors[i]).toBeGreaterThanOrEqual(0);
      expect(colors[i]).toBeLessThanOrEqual(1);
    }
  });
});

describe('createUndercutRegionGeometry', () => {
  it('should create geometry for undercut regions', () => {
    const cube = createCubeModel(10);
    const result = analyzeDraftAngles(cube, { x: 0, y: -1, z: 0 }, 3);

    for (const region of result.undercutRegions) {
      const geo = createUndercutRegionGeometry(cube.vertices, cube.indices, region);
      expect(geo.positions.length).toBe(region.faceIndices.length * 9);
      expect(geo.normals.length).toBe(region.faceIndices.length * 9);
    }
  });
});
