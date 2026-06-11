import { Suspense, useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, Grid, Html, Center } from '@react-three/drei';
import { EffectComposer, Bloom, SSAO } from '@react-three/postprocessing';
import * as THREE from 'three';
import { useAppStore } from '@/store/useAppStore';
import { ModelMesh } from './ModelMesh';
import { DrainHolesDisplay } from './DrainHolesDisplay';
import { ThicknessSamplesDisplay } from './ThicknessSamplesDisplay';
import { SectionPlane } from './SectionPlane';
import { SectionContour } from './SectionContour';
import { createSampleBoxModel } from '@/utils/modelLoader';
import { computeSection } from '@/utils/section';

function SceneBackground() {
  const isDarkMode = useAppStore((state) => state.isDarkMode);
  const { scene, gl } = useThree();

  useEffect(() => {
    const bgColor = isDarkMode ? '#0f172a' : '#e2e8f0';
    const fogColor = isDarkMode ? '#0f172a' : '#e2e8f0';
    scene.background = new THREE.Color(bgColor);
    if (scene.fog instanceof THREE.Fog) {
      scene.fog.color.set(fogColor);
    }
  }, [isDarkMode, scene]);

  return null;
}

function Scene() {
  const model = useAppStore((state) => state.model);
  const analysisMode = useAppStore((state) => state.analysisMode);
  const drainHoleResult = useAppStore((state) => state.drainHoleResult);
  const wallThicknessResult = useAppStore((state) => state.wallThicknessResult);
  const sectionResult = useAppStore((state) => state.sectionResult);
  const sectionPlane = useAppStore((state) => state.sectionPlane);
  const sectionThicknessResolution = useAppStore((state) => state.sectionThicknessResolution);
  const setSectionResult = useAppStore((state) => state.setSectionResult);
  const showGrid = useAppStore((state) => state.showGrid);
  const showAxes = useAppStore((state) => state.showAxes);
  const autoRotate = useAppStore((state) => state.autoRotate);

  const displayModel = model || createSampleBoxModel();

  const controlsRef = useRef<any>(null);

  useEffect(() => {
    if (analysisMode === 'section' && displayModel && sectionPlane.visible) {
      const result = computeSection(displayModel, sectionPlane, sectionThicknessResolution);
      setSectionResult(result);
    }
  }, [sectionPlane.position, sectionPlane.axis, analysisMode, displayModel, sectionPlane.visible, sectionThicknessResolution, setSectionResult]);

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[100, 150, 100]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <directionalLight position={[-80, 60, -80]} intensity={0.5} />
      <pointLight position={[0, 80, 0]} intensity={0.3} color="#06b6d4" />

      <Center>
        <group>
          <ModelMesh
            model={{
              vertices: displayModel.vertices,
              indices: displayModel.indices,
              normals: displayModel.normals,
            }}
          />

          {analysisMode === 'holes' && drainHoleResult && (
            <DrainHolesDisplay holes={drainHoleResult.holes} />
          )}

          {analysisMode === 'thickness' && wallThicknessResult && (
            <ThicknessSamplesDisplay
              samples={wallThicknessResult.samples}
              minThickness={wallThicknessResult.minThickness}
              maxThickness={wallThicknessResult.maxThickness}
            />
          )}

          {analysisMode === 'section' && (
            <>
              <SectionPlane
                modelSize={displayModel.boundingBox.size}
                modelCenter={displayModel.boundingBox.center}
              />
              <SectionContour result={sectionResult} />
            </>
          )}
        </group>
      </Center>

      {showGrid && (
        <Grid
          position={[0, -displayModel.boundingBox.size.y / 2 - 1, 0]}
          args={[200, 200]}
          cellSize={5}
          cellThickness={0.5}
          cellColor={useAppStore.getState().isDarkMode ? '#1e293b' : '#cbd5e1'}
          sectionSize={25}
          sectionThickness={1}
          sectionColor={useAppStore.getState().isDarkMode ? '#334155' : '#94a3b8'}
          fadeDistance={300}
          fadeStrength={1}
          followCamera={false}
          infiniteGrid
        />
      )}

      {showAxes && <axesHelper args={[50]} position={[-80, -displayModel.boundingBox.size.y / 2, -60]} />}

      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.05}
        minDistance={30}
        maxDistance={500}
        autoRotate={autoRotate}
        autoRotateSpeed={0.5}
      />

      <EffectComposer>
        <Bloom
          intensity={0.3}
          luminanceThreshold={0.9}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
      </EffectComposer>
    </>
  );
}

export function ModelViewer() {
  const isLoading = useAppStore((state) => state.isLoading);

  return (
    <div className="w-full h-full relative bg-surface-base">
      <Canvas
        shadows
        camera={{ position: [120, 100, 120], fov: 45 }}
        gl={{ antialias: true, alpha: false, localClippingEnabled: true }}
        dpr={[1, 2]}
      >
        <color attach="background" args={['#0f172a']} />
        <fog attach="fog" args={['#0f172a', 200, 500]} />
        <SceneBackground />
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-surface-panel/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
            <p className="text-cyan-400 font-medium">正在计算分析...</p>
          </div>
        </div>
      )}

      <div className="absolute bottom-4 left-4 flex gap-2">
        <div className="px-3 py-1.5 bg-surface-elevated/90 backdrop-blur-sm rounded-lg text-xs text-content-muted border border-edge-subtle">
          左键旋转 | 右键平移 | 滚轮缩放
        </div>
      </div>
    </div>
  );
}
