import { describe, it, expect } from 'vitest';
import {
  analyzeWallThickness,
  getThicknessColor,
  getThicknessColorStops,
  createThicknessVertexColors,
} from '@/utils/wallThickness';
import { createThinBoxModel, createCubeModel } from './helpers';

describe('analyzeWallThickness', () => {
  it('should analyze thin box and detect thickness', () => {
    const model = createThinBoxModel(10, 10, 2);
    const result = analyzeWallThickness(model, 100);

    expect(result.sampleCount).toBeGreaterThan(0);
    expect(result.samples.length).toBe(result.sampleCount);
    expect(result.minThickness).toBeGreaterThanOrEqual(0);
    expect(result.maxThickness).toBeGreaterThanOrEqual(result.minThickness);
    expect(result.avgThickness).toBeGreaterThanOrEqual(result.minThickness);
    expect(result.avgThickness).toBeLessThanOrEqual(result.maxThickness);
  });

  it('should respect sample count parameter', () => {
    const model = createThinBoxModel(10, 10, 2);
    const result1 = analyzeWallThickness(model, 10);
    const result2 = analyzeWallThickness(model, 100);

    expect(result1.sampleCount).toBeLessThanOrEqual(10);
    expect(result2.sampleCount).toBeLessThanOrEqual(100);
  });

  it('should compute thickness distribution', () => {
    const model = createThinBoxModel(10, 10, 2);
    const result = analyzeWallThickness(model, 100);

    expect(result.thicknessDistribution).toBeDefined();
    if (result.thicknessDistribution.length > 0) {
      const totalPercentage = result.thicknessDistribution.reduce((sum, d) => sum + d.percentage, 0);
      expect(totalPercentage).toBeGreaterThan(90);
      expect(totalPercentage).toBeLessThanOrEqual(100.1);
    }
  });

  it('should handle model with no valid samples', () => {
    const model = createCubeModel(2);
    const result = analyzeWallThickness(model, 10);

    expect(result).toBeDefined();
    expect(result.minThickness).toBeDefined();
    expect(result.maxThickness).toBeDefined();
    expect(result.avgThickness).toBeDefined();
  });

  it('should have valid sample data', () => {
    const model = createThinBoxModel(10, 10, 2);
    const result = analyzeWallThickness(model, 50);

    for (const sample of result.samples) {
      expect(typeof sample.x).toBe('number');
      expect(typeof sample.y).toBe('number');
      expect(typeof sample.z).toBe('number');
      expect(sample.thickness).toBeGreaterThan(0);
    }
  });
});

describe('getThicknessColor', () => {
  it('should return gray when min equals max', () => {
    const color = getThicknessColor(5, 5, 5);
    expect(color.r).toBeCloseTo(0.5);
    expect(color.g).toBeCloseTo(0.5);
    expect(color.b).toBeCloseTo(0.5);
  });

  it('should clamp values outside range', () => {
    const color1 = getThicknessColor(-10, 0, 10);
    const color2 = getThicknessColor(100, 0, 10);

    expect(color1.r).toBeGreaterThanOrEqual(0);
    expect(color1.g).toBeGreaterThanOrEqual(0);
    expect(color1.b).toBeGreaterThanOrEqual(0);
    expect(color2.r).toBeLessThanOrEqual(1);
    expect(color2.g).toBeLessThanOrEqual(1);
    expect(color2.b).toBeLessThanOrEqual(1);
  });

  it('should return valid colors for rainbow scheme', () => {
    const color = getThicknessColor(5, 0, 10, 'rainbow');
    expect(color.r).toBeGreaterThanOrEqual(0);
    expect(color.r).toBeLessThanOrEqual(1);
    expect(color.g).toBeGreaterThanOrEqual(0);
    expect(color.g).toBeLessThanOrEqual(1);
    expect(color.b).toBeGreaterThanOrEqual(0);
    expect(color.b).toBeLessThanOrEqual(1);
  });

  it('should return valid colors for coolwarm scheme', () => {
    const color = getThicknessColor(5, 0, 10, 'coolwarm');
    expect(color.r).toBeGreaterThanOrEqual(0);
    expect(color.r).toBeLessThanOrEqual(1);
    expect(color.g).toBeGreaterThanOrEqual(0);
    expect(color.g).toBeLessThanOrEqual(1);
    expect(color.b).toBeGreaterThanOrEqual(0);
    expect(color.b).toBeLessThanOrEqual(1);
  });

  it('should return valid colors for grayscale scheme', () => {
    const color = getThicknessColor(5, 0, 10, 'grayscale');
    expect(color.r).toBeCloseTo(color.g);
    expect(color.g).toBeCloseTo(color.b);
  });
});

describe('getThicknessColorStops', () => {
  it('should return 9 color stops', () => {
    const stops = getThicknessColorStops();
    expect(stops.length).toBe(9);
  });

  it('should return valid CSS RGB strings', () => {
    const stops = getThicknessColorStops('coolwarm');
    for (const stop of stops) {
      expect(stop).toMatch(/^rgb\(\d+, \d+, \d+\)$/);
    }
  });

  it('should handle different color schemes', () => {
    const rainbow = getThicknessColorStops('rainbow');
    const coolwarm = getThicknessColorStops('coolwarm');
    const grayscale = getThicknessColorStops('grayscale');

    expect(rainbow.length).toBe(9);
    expect(coolwarm.length).toBe(9);
    expect(grayscale.length).toBe(9);
  });
});

describe('createThicknessVertexColors', () => {
  it('should create correct number of vertex colors', () => {
    const model = createThinBoxModel(10, 10, 2);
    const result = analyzeWallThickness(model, 50);
    const colors = createThicknessVertexColors(model, result);

    expect(colors.length).toBe(model.vertexCount * 3);
    for (let i = 0; i < colors.length; i++) {
      expect(colors[i]).toBeGreaterThanOrEqual(0);
      expect(colors[i]).toBeLessThanOrEqual(1);
    }
  });

  it('should work with different color schemes', () => {
    const model = createThinBoxModel(10, 10, 2);
    const result = analyzeWallThickness(model, 50);

    const colorsRainbow = createThicknessVertexColors(model, result, 'rainbow');
    const colorsCoolWarm = createThicknessVertexColors(model, result, 'coolwarm');
    const colorsGrayscale = createThicknessVertexColors(model, result, 'grayscale');

    expect(colorsRainbow.length).toBe(model.vertexCount * 3);
    expect(colorsCoolWarm.length).toBe(model.vertexCount * 3);
    expect(colorsGrayscale.length).toBe(model.vertexCount * 3);
  });
});
