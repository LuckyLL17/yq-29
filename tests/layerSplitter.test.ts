import { describe, it, expect } from 'vitest';
import {
  splitModelByAxis,
  splitModelByBoundaries,
  splitModel,
} from '@/utils/layerSplitter';
import { createCubeModel } from './helpers';

describe('splitModelByAxis', () => {
  it('should split cube into 2 layers along Y axis', () => {
    const cube = createCubeModel(4);
    const layers = splitModelByAxis(cube, 'y', 2);

    expect(layers.length).toBe(2);
    expect(layers[0].index).toBe(0);
    expect(layers[1].index).toBe(1);
    expect(layers[0].name).toContain('Y层');
  });

  it('should split cube into 4 layers along X axis', () => {
    const cube = createCubeModel(4);
    const layers = splitModelByAxis(cube, 'x', 4);

    expect(layers.length).toBe(4);
    for (let i = 0; i < 4; i++) {
      expect(layers[i].index).toBe(i);
      expect(layers[i].geometry.faceCount).toBeGreaterThan(0);
      expect(layers[i].geometry.vertexCount).toBeGreaterThan(0);
    }
  });

  it('should split along Z axis', () => {
    const cube = createCubeModel(4);
    const layers = splitModelByAxis(cube, 'z', 3);

    expect(layers.length).toBeGreaterThan(0);
    for (const layer of layers) {
      expect(layer.name).toContain('Z层');
      expect(layer.visible).toBe(true);
      expect(layer.opacity).toBe(1);
      expect(layer.color).toBeDefined();
    }
  });

  it('should throw error for non-positive count', () => {
    const cube = createCubeModel(2);
    expect(() => splitModelByAxis(cube, 'y', 0)).toThrow();
    expect(() => splitModelByAxis(cube, 'y', -1)).toThrow();
  });

  it('should return single layer for flat model', () => {
    const flatVertices = new Float32Array([
      0, 0, 0,
      1, 0, 0,
      1, 0, 1,
      0, 0, 1,
    ]);
    const flatIndices = new Uint32Array([0, 1, 2, 0, 2, 3]);
    const flatNormals = new Float32Array([0, 1, 0, 0, 1, 0]);
    const flatBBox = {
      min: { x: 0, y: 0, z: 0 },
      max: { x: 1, y: 0, z: 1 },
      center: { x: 0.5, y: 0, z: 0.5 },
      size: { x: 1, y: 0, z: 1 },
    };

    const flatModel = {
      id: 'flat',
      name: 'Flat',
      vertices: flatVertices,
      indices: flatIndices,
      normals: flatNormals,
      boundingBox: flatBBox,
      faceCount: 2,
      vertexCount: 4,
    };

    const layers = splitModelByAxis(flatModel, 'y', 3);
    expect(layers.length).toBe(1);
    expect(layers[0].name).toContain('完整模型');
  });

  it('should preserve geometry data in layers', () => {
    const cube = createCubeModel(4);
    const layers = splitModelByAxis(cube, 'y', 2);

    let totalFaces = 0;
    let totalVertices = 0;
    for (const layer of layers) {
      expect(layer.geometry.vertices.length).toBe(layer.geometry.vertexCount * 3);
      expect(layer.geometry.indices.length).toBe(layer.geometry.faceCount * 3);
      expect(layer.geometry.normals.length).toBe(layer.geometry.vertexCount * 3);
      totalFaces += layer.geometry.faceCount;
      totalVertices += layer.geometry.vertexCount;
    }
    expect(totalFaces).toBe(cube.faceCount);
  });

  it('should compute bounding box for each layer', () => {
    const cube = createCubeModel(4);
    const layers = splitModelByAxis(cube, 'y', 2);

    for (const layer of layers) {
      expect(layer.boundingBox).toBeDefined();
      expect(layer.boundingBox.min).toBeDefined();
      expect(layer.boundingBox.max).toBeDefined();
      expect(layer.boundingBox.center).toBeDefined();
      expect(layer.boundingBox.size).toBeDefined();
    }
  });
});

describe('splitModelByBoundaries', () => {
  it('should split model with custom boundaries', () => {
    const cube = createCubeModel(4);
    const layers = splitModelByBoundaries(cube, 'y', [-0.5, 0.5]);

    expect(layers.length).toBeGreaterThanOrEqual(1);
    expect(layers.length).toBeLessThanOrEqual(3);
    for (let i = 0; i < layers.length; i++) {
      expect(layers[i].index).toBeDefined();
      expect(layers[i].geometry.faceCount).toBeGreaterThan(0);
    }
  });

  it('should handle empty boundaries', () => {
    const cube = createCubeModel(4);
    const layers = splitModelByBoundaries(cube, 'y', []);

    expect(layers.length).toBe(1);
  });

  it('should sort boundaries before splitting', () => {
    const cube = createCubeModel(4);
    const layers1 = splitModelByBoundaries(cube, 'y', [1, -1, 0]);
    const layers2 = splitModelByBoundaries(cube, 'y', [-1, 0, 1]);

    expect(layers1.length).toBe(layers2.length);
  });

  it('should generate descriptive layer names', () => {
    const cube = createCubeModel(4);
    const layers = splitModelByBoundaries(cube, 'x', [0]);

    for (const layer of layers) {
      expect(layer.name).toContain('图层');
      expect(layer.name).toMatch(/\d/);
    }
  });
});

describe('splitModel', () => {
  it('should dispatch to axis split strategy', () => {
    const cube = createCubeModel(4);
    const layers = splitModel(cube, { type: 'axis', axis: 'z', count: 3 });

    expect(layers.length).toBe(3);
  });

  it('should dispatch to manual split strategy', () => {
    const cube = createCubeModel(4);
    const layers = splitModel(cube, { type: 'manual', axis: 'x', boundaries: [0] });

    expect(layers.length).toBe(2);
  });
});
