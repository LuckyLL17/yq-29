export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface BoundingBox {
  min: Vector3;
  max: Vector3;
  center: Vector3;
  size: Vector3;
}

export interface ModelData {
  id: string;
  name: string;
  vertices: Float32Array;
  indices: Uint32Array | Uint16Array;
  normals: Float32Array;
  boundingBox: BoundingBox;
  faceCount: number;
  vertexCount: number;
}

export interface DraftAngleResult {
  faceAngles: Float32Array;
  minAngle: number;
  maxAngle: number;
  avgAngle: number;
  undercutFaceCount: number;
  draftDirection: Vector3;
  threshold: number;
  angleDistribution: { range: string; count: number; percentage: number }[];
}

export interface WallThicknessSample {
  x: number;
  y: number;
  z: number;
  thickness: number;
}

export interface WallThicknessResult {
  samples: WallThicknessSample[];
  minThickness: number;
  maxThickness: number;
  avgThickness: number;
  thicknessDistribution: { range: string; count: number; percentage: number }[];
  sampleCount: number;
}

export type DrainHoleType = 'suction' | 'dewatering';

export interface DrainHole {
  id: string;
  position: Vector3;
  normal: Vector3;
  diameter: number;
  type: DrainHoleType;
}

export interface DrainHoleResult {
  holes: DrainHole[];
  totalCount: number;
  totalArea: number;
  suctionCount: number;
  dewateringCount: number;
  recommendedDensity: number;
}

export interface MoldingCycleParameters {
  materialType: string;
  targetThickness: number;
  temperature: number;
  pressure: number;
  pulpConcentration: number;
  vacuumDegree: number;
}

export interface MoldingCycleResult {
  totalTime: number;
  suctionTime: number;
  pressingTime: number;
  dryingTime: number;
  demoldingTime: number;
  parameters: MoldingCycleParameters;
  sensitivityAnalysis: {
    factor: string;
    impact: number;
    description: string;
  }[];
}

export type AnalysisMode = 'none' | 'draft' | 'thickness' | 'holes' | 'cycle';

export type VisualizationMode = 'solid' | 'wireframe' | 'xray';
