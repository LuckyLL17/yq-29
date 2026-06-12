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
  CompareMode,
  ModelDiffResult,
  Annotation,
  AnnotationTool,
  AnnotationStyle,
} from '@/types';

export type DialogType = 'none' | 'project' | 'settings' | 'help';

interface AppState {
  model: ModelData | null;
  modelFileName: string;
  model2: ModelData | null;
  model2FileName: string;
  isLoading: boolean;
  analysisMode: AnalysisMode;
  visualizationMode: VisualizationMode;
  compareMode: CompareMode;
  modelDiffResult: ModelDiffResult | null;
  model1Opacity: number;
  model2Opacity: number;
  model1Color: string;
  model2Color: string;
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

  annotations: Annotation[];
  annotationTool: AnnotationTool;
  annotationStyle: AnnotationStyle;
  selectedAnnotationId: string | null;
  isDrawingFreehand: boolean;
  textAnnotationPrompt: {
    open: boolean;
    pendingPosition: Vector3 | null;
  };

  sectionPlane: SectionPlane;
  sectionResult: SectionResult | null;
  sectionThicknessResolution: number;

  setModel: (model: ModelData | null, fileName?: string) => void;
  setModel2: (model: ModelData | null, fileName?: string) => void;
  setIsLoading: (loading: boolean) => void;
  setAnalysisMode: (mode: AnalysisMode) => void;
  setVisualizationMode: (mode: VisualizationMode) => void;
  setCompareMode: (mode: CompareMode) => void;
  setModelDiffResult: (result: ModelDiffResult | null) => void;
  setModel1Opacity: (opacity: number) => void;
  setModel2Opacity: (opacity: number) => void;
  setModel1Color: (color: string) => void;
  setModel2Color: (color: string) => void;

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

  addAnnotation: (annotation: Annotation) => void;
  removeAnnotation: (id: string) => void;
  updateAnnotation: (id: string, updates: Partial<Annotation>) => void;
  setAnnotationTool: (tool: AnnotationTool) => void;
  setAnnotationStyle: (style: Partial<AnnotationStyle>) => void;
  setSelectedAnnotationId: (id: string | null) => void;
  setIsDrawingFreehand: (drawing: boolean) => void;
  clearAnnotations: () => void;
  openTextAnnotationPrompt: (position: Vector3) => void;
  closeTextAnnotationPrompt: () => void;
  confirmTextAnnotation: (text: string) => void;

  resetAnalysis: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  model: null,
  modelFileName: '',
  model2: null,
  model2FileName: '',
  isLoading: false,
  analysisMode: 'none',
  visualizationMode: 'solid',
  compareMode: 'overlay',
  modelDiffResult: null,
  model1Opacity: 0.85,
  model2Opacity: 0.45,
  model1Color: '#6b8e9e',
  model2Color: '#e07a5f',

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

  annotations: [],
  annotationTool: 'none',
  annotationStyle: {
    color: '#00ff88',
    fontSize: 3,
    fontFamily: 'sans-serif',
    lineWidth: 1,
  },
  selectedAnnotationId: null,
  isDrawingFreehand: false,
  textAnnotationPrompt: {
    open: false,
    pendingPosition: null,
  },

  sectionPlane: {
    axis: 'y',
    position: 0,
    visible: false,
  },
  sectionResult: null,
  sectionThicknessResolution: 50,

  setModel: (model, fileName = '') =>
    set({ model, modelFileName: fileName, draftAngleResult: null, wallThicknessResult: null, drainHoleResult: null, cycleResult: null, sectionResult: null, modelDiffResult: null }),
  setModel2: (model2, fileName = '') =>
    set({ model2, model2FileName: fileName, modelDiffResult: null }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setAnalysisMode: (mode) => set({ analysisMode: mode }),
  setVisualizationMode: (mode) => set({ visualizationMode: mode }),
  setCompareMode: (mode) => set({ compareMode: mode }),
  setModelDiffResult: (result) => set({ modelDiffResult: result }),
  setModel1Opacity: (opacity) => set({ model1Opacity: opacity }),
  setModel2Opacity: (opacity) => set({ model2Opacity: opacity }),
  setModel1Color: (color) => set({ model1Color: color }),
  setModel2Color: (color) => set({ model2Color: color }),

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

  addAnnotation: (annotation) =>
    set((state) => ({ annotations: [...state.annotations, annotation] })),
  removeAnnotation: (id) =>
    set((state) => ({
      annotations: state.annotations.filter((a) => a.id !== id),
      selectedAnnotationId: state.selectedAnnotationId === id ? null : state.selectedAnnotationId,
    })),
  updateAnnotation: (id, updates) =>
    set((state) => ({
      annotations: state.annotations.map((a) =>
        a.id === id ? ({ ...a, ...updates } as Annotation) : a
      ),
    })),
  setAnnotationTool: (tool) => set({ annotationTool: tool }),
  setAnnotationStyle: (style) =>
    set((state) => ({ annotationStyle: { ...state.annotationStyle, ...style } })),
  setSelectedAnnotationId: (id) => set({ selectedAnnotationId: id }),
  setIsDrawingFreehand: (drawing) => set({ isDrawingFreehand: drawing }),
  clearAnnotations: () =>
    set({ annotations: [], selectedAnnotationId: null }),
  openTextAnnotationPrompt: (position) =>
    set({
      textAnnotationPrompt: { open: true, pendingPosition: position },
    }),
  closeTextAnnotationPrompt: () =>
    set({
      textAnnotationPrompt: { open: false, pendingPosition: null },
    }),
  confirmTextAnnotation: (text) => {
    const state = get();
    const pos = state.textAnnotationPrompt.pendingPosition;
    if (!pos || !text.trim()) {
      set({
        textAnnotationPrompt: { open: false, pendingPosition: null },
      });
      return;
    }
    const id = `ann_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    set({
      annotations: [
        ...state.annotations,
        {
          id,
          type: 'text',
          position: pos,
          text: text.trim(),
          style: { ...state.annotationStyle },
        },
      ],
      textAnnotationPrompt: { open: false, pendingPosition: null },
    });
  },

  resetAnalysis: () =>
    set({
      draftAngleResult: null,
      wallThicknessResult: null,
      drainHoleResult: null,
      cycleResult: null,
    }),
}));
