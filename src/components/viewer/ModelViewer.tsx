import { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Grid, Html, Center } from '@react-three/drei';
import { EffectComposer, Bloom, SSAO } from '@react-three/postprocessing';
import * as THREE from 'three';
import { useAppStore } from '@/store/useAppStore';
import { ModelMesh } from './ModelMesh';
import { DrainHolesDisplay } from './DrainHolesDisplay';
import { ThicknessSamplesDisplay } from './ThicknessSamplesDisplay';
import { createSampleBoxModel } from '@/utils/modelLoader';

function Scene() {
  const model = useAppStore((state) => state.model);
  const analysisMode = useAppStore((state) => state.analysisMode);
  const drainHoleResult = useAppStore((state) => state.drainHoleResult);
  const wallThicknessResult = useAppStore((state) => state.wallThicknessResult);
  const showGrid = useAppStore((state) => state.showGrid);
  const showAxes = useAppStore((state) => state.showAxes);
  const autoRotate = useAppStore((state) => state.autoRotate);

  const displayModel = model || createSampleBoxModel();

  const controlsRef = useRef<any>(null);

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
        </group>
      </Center>

      {showGrid && (
        <Grid
          position={[0, -displayModel.boundingBox.size.y / 2 - 1, 0]}
          args={[200, 200]}
          cellSize={5}
          cellThickness={0.5}
          cellColor="#1e293b"
          sectionSize={25}
          sectionThickness={1}
          sectionColor="#334155"
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
    <div className="w-full h-full relative bg-slate-950">
      <Canvas
        shadows
        camera={{ position: [120, 100, 120], fov: 45 }}
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 2]}
      >
        <color attach="background" args={['#0f172a']} />
        <fog attach="fog" args={['#0f172a', 200, 500]} />
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
            <p className="text-cyan-400 font-medium">正在计算分析...</p>
          </div>
        </div>
      )}

      <div className="absolute bottom-4 left-4 flex gap-2">
        <div className="px-3 py-1.5 bg-slate-800/90 backdrop-blur-sm rounded-lg text-xs text-slate-400 border border-slate-700">
          左键旋转 | 右键平移 | 滚轮缩放
        </div>
      </div>
    </div>
  );
}
