import { create } from 'zustand';
import type {
  ModelData,
  DraftAngleResult,
  WallThicknessResult,
  DrainHoleResult,
  MoldingCycleResult,
  MoldingCycleParameters,
  AnalysisMode,
  VisualizationMode,
  Vector3,
  SectionPlane,
  SectionResult,
  SectionAxis,
} from '@/types';

export type DialogType = 'none' | 'project' | 'settings' | 'help';

interface AppState {
  model: ModelData | null;
  modelFileName: string;
  isLoading: boolean;
  analysisMode: AnalysisMode;
  visualizationMode: VisualizationMode;
  isDarkMode: boolean;
  activeDialog: DialogType;

  draftAngleThreshold: number;
  draftDirection: Vector3;
  draftAngleResult: DraftAngleResult | null;

  wallThicknessResult: WallThicknessResult | null;
  thicknessSampleCount: number;

  drainHoleResult: DrainHoleResult | null;
  holeDiameter: number;
  holeSpacing: number;

  cycleParameters: MoldingCycleParameters;
  cycleResult: MoldingCycleResult | null;

  showGrid: boolean;
  showAxes: boolean;
  autoRotate: boolean;

  sectionPlane: SectionPlane;
  sectionResult: SectionResult | null;
  sectionThicknessResolution: number;

  setModel: (model: ModelData | null, fileName?: string) => void;
  setIsLoading: (loading: boolean) => void;
  setAnalysisMode: (mode: AnalysisMode) => void;
  setVisualizationMode: (mode: VisualizationMode) => void;

  setDraftAngleThreshold: (threshold: number) => void;
  setDraftDirection: (direction: Vector3) => void;
  setDraftAngleResult: (result: DraftAngleResult | null) => void;

  setWallThicknessResult: (result: WallThicknessResult | null) => void;
  setThicknessSampleCount: (count: number) => void;

  setDrainHoleResult: (result: DrainHoleResult | null) => void;
  setHoleDiameter: (diameter: number) => void;
  setHoleSpacing: (spacing: number) => void;

  setCycleParameters: (params: Partial<MoldingCycleParameters>) => void;
  setCycleResult: (result: MoldingCycleResult | null) => void;

  setSectionPlane: (plane: Partial<SectionPlane>) => void;
  setSectionResult: (result: SectionResult | null) => void;
  setSectionAxis: (axis: SectionAxis) => void;
  setSectionPosition: (position: number) => void;
  setSectionThicknessResolution: (resolution: number) => void;
  toggleSectionVisible: () => void;

  setShowGrid: (show: boolean) => void;
  setShowAxes: (show: boolean) => void;
  setAutoRotate: (auto: boolean) => void;
  toggleDarkMode: () => void;
  setActiveDialog: (dialog: DialogType) => void;
  closeDialog: () => void;

  resetAnalysis: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  model: null,
  modelFileName: '',
  isLoading: false,
  analysisMode: 'none',
  visualizationMode: 'solid',

  draftAngleThreshold: 5,
  draftDirection: { x: 0, y: 1, z: 0 },
  draftAngleResult: null,

  wallThicknessResult: null,
  thicknessSampleCount: 500,

  drainHoleResult: null,
  holeDiameter: 2,
  holeSpacing: 15,

  cycleParameters: {
    materialType: '甘蔗浆',
    targetThickness: 1.5,
    temperature: 180,
    pressure: 0.6,
    pulpConcentration: 1.2,
    vacuumDegree: -0.06,
  },
  cycleResult: null,

  showGrid: true,
  showAxes: true,
  autoRotate: false,
  isDarkMode: true,
  activeDialog: 'none',

  sectionPlane: {
    axis: 'y',
    position: 0,
    visible: false,
  },
  sectionResult: null,
  sectionThicknessResolution: 50,

  setModel: (model, fileName = '') =>
    set({ model, modelFileName: fileName, draftAngleResult: null, wallThicknessResult: null, drainHoleResult: null, cycleResult: null, sectionResult: null }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setAnalysisMode: (mode) => set({ analysisMode: mode }),
  setVisualizationMode: (mode) => set({ visualizationMode: mode }),

  setDraftAngleThreshold: (threshold) => set({ draftAngleThreshold: threshold }),
  setDraftDirection: (direction) => set({ draftDirection: direction }),
  setDraftAngleResult: (result) => set({ draftAngleResult: result }),

  setWallThicknessResult: (result) => set({ wallThicknessResult: result }),
  setThicknessSampleCount: (count) => set({ thicknessSampleCount: count }),

  setDrainHoleResult: (result) => set({ drainHoleResult: result }),
  setHoleDiameter: (diameter) => set({ holeDiameter: diameter }),
  setHoleSpacing: (spacing) => set({ holeSpacing: spacing }),

  setCycleParameters: (params) =>
    set((state) => ({ cycleParameters: { ...state.cycleParameters, ...params } })),
  setCycleResult: (result) => set({ cycleResult: result }),

  setSectionPlane: (plane) =>
    set((state) => ({ sectionPlane: { ...state.sectionPlane, ...plane } })),
  setSectionResult: (result) => set({ sectionResult: result }),
  setSectionAxis: (axis) =>
    set((state) => ({ sectionPlane: { ...state.sectionPlane, axis } })),
  setSectionPosition: (position) =>
    set((state) => ({ sectionPlane: { ...state.sectionPlane, position } })),
  setSectionThicknessResolution: (resolution) =>
    set({ sectionThicknessResolution: resolution }),
  toggleSectionVisible: () =>
    set((state) => ({
      sectionPlane: { ...state.sectionPlane, visible: !state.sectionPlane.visible },
    })),

  setShowGrid: (show) => set({ showGrid: show }),
  setShowAxes: (show) => set({ showAxes: show }),
  setAutoRotate: (auto) => set({ autoRotate: auto }),
  toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
  setActiveDialog: (dialog) => set({ activeDialog: dialog }),
  closeDialog: () => set({ activeDialog: 'none' }),

  resetAnalysis: () =>
    set({
      draftAngleResult: null,
      wallThicknessResult: null,
      drainHoleResult: null,
      cycleResult: null,
    }),
}));
