import { describe, it, expect } from 'vitest';
import {
  computeSection,
  getPlaneBounds,
} from '@/utils/section';
import { createCubeModel, createThinBoxModel } from './helpers';

describe('computeSection', () => {
  it('should compute section through middle of cube', () => {
    const cube = createCubeModel(2);
    const result = computeSection(cube, { axis: 'y', position: 0, visible: true }, 20);

    expect(result.contourPoints).toBeDefined();
    expect(result.area).toBeGreaterThan(0);
    expect(result.perimeter).toBeGreaterThan(0);
    expect(result.plane.axis).toBe('y');
    expect(result.plane.position).toBe(0);
  });

  it('should compute section on different axes', () => {
    const cube = createCubeModel(2);

    const resultX = computeSection(cube, { axis: 'x', position: 0, visible: true });
    const resultY = computeSection(cube, { axis: 'y', position: 0, visible: true });
    const resultZ = computeSection(cube, { axis: 'z', position: 0, visible: true });

    expect(resultX.area).toBeGreaterThan(0);
    expect(resultY.area).toBeGreaterThan(0);
    expect(resultZ.area).toBeGreaterThan(0);
  });

  it('should return thickness samples for thin box', () => {
    const model = createThinBoxModel(10, 10, 2);
    const result = computeSection(model, { axis: 'y', position: 0, visible: true }, 30);

    expect(result.thicknessSamples).toBeDefined();
    if (result.thicknessSamples.length > 0) {
      expect(result.minThickness).toBeGreaterThanOrEqual(0);
      expect(result.maxThickness).toBeGreaterThanOrEqual(result.minThickness);
      expect(result.avgThickness).toBeGreaterThanOrEqual(0);
    }
  });

  it('should compute thickness distribution', () => {
    const model = createThinBoxModel(10, 10, 2);
    const result = computeSection(model, { axis: 'y', position: 0, visible: true }, 30);

    if (result.thicknessDistribution.length > 0) {
      for (const bin of result.thicknessDistribution) {
        expect(typeof bin.range).toBe('string');
        expect(typeof bin.count).toBe('number');
        expect(typeof bin.percentage).toBe('number');
        expect(bin.percentage).toBeGreaterThanOrEqual(0);
        expect(bin.percentage).toBeLessThanOrEqual(100);
      }
    }
  });

  it('should return empty contours when plane is outside model', () => {
    const cube = createCubeModel(2);
    const result = computeSection(cube, { axis: 'y', position: 100, visible: true });

    expect(result.contourPoints).toEqual([]);
    expect(result.area).toBe(0);
    expect(result.perimeter).toBe(0);
    expect(result.thicknessSamples).toEqual([]);
  });

  it('should compute valid contour points', () => {
    const cube = createCubeModel(2);
    const result = computeSection(cube, { axis: 'z', position: 0, visible: true });

    for (const contour of result.contourPoints) {
      for (const pt of contour) {
        expect(typeof pt.x).toBe('number');
        expect(typeof pt.y).toBe('number');
        expect(typeof pt.z).toBe('number');
      }
    }
  });
});

describe('getPlaneBounds', () => {
  it('should return correct bounds for Y axis', () => {
    const cube = createCubeModel(2, { x: 0, y: 0, z: 0 });
    const bounds = getPlaneBounds(cube, 'y');

    expect(bounds.min).toBeCloseTo(-1);
    expect(bounds.max).toBeCloseTo(1);
  });

  it('should return correct bounds for X axis', () => {
    const cube = createCubeModel(2);
    const bounds = getPlaneBounds(cube, 'x');

    expect(bounds.min).toBeCloseTo(-1);
    expect(bounds.max).toBeCloseTo(1);
  });

  it('should return correct bounds for Z axis', () => {
    const cube = createCubeModel(2);
    const bounds = getPlaneBounds(cube, 'z');

    expect(bounds.min).toBeCloseTo(-1);
    expect(bounds.max).toBeCloseTo(1);
  });

  it('should handle offset model', () => {
    const cube = createCubeModel(2, { x: 5, y: 3, z: -2 });
    const boundsX = getPlaneBounds(cube, 'x');
    const boundsY = getPlaneBounds(cube, 'y');
    const boundsZ = getPlaneBounds(cube, 'z');

    expect(boundsX.min).toBeCloseTo(4);
    expect(boundsX.max).toBeCloseTo(6);
    expect(boundsY.min).toBeCloseTo(2);
    expect(boundsY.max).toBeCloseTo(4);
    expect(boundsZ.min).toBeCloseTo(-3);
    expect(boundsZ.max).toBeCloseTo(-1);
  });
});
