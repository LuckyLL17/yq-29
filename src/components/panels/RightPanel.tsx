import {
  Info,
  Triangle,
  Ruler,
  CircleDot,
  Clock,
  Download,
  AlertTriangle,
  CheckCircle,
  TrendingDown,
  TrendingUp,
  Minus,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { DraftAngleChart, ThicknessChart, CyclePieChart } from '../charts/AnalysisCharts';

export function RightPanel() {
  const model = useAppStore((state) => state.model);
  const modelFileName = useAppStore((state) => state.modelFileName);
  const analysisMode = useAppStore((state) => state.analysisMode);
  const draftAngleResult = useAppStore((state) => state.draftAngleResult);
  const wallThicknessResult = useAppStore((state) => state.wallThicknessResult);
  const drainHoleResult = useAppStore((state) => state.drainHoleResult);
  const cycleResult = useAppStore((state) => state.cycleResult);

  const exportReport = () => {
    const report = generateReport();
    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '模具设计分析报告.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const generateReport = (): string => {
    let report = '========================================\n';
    report += '    纸浆模塑模具设计分析报告\n';
    report += '========================================\n\n';
    report += `模型文件: ${modelFileName || '示例模型'}\n`;
    report += `生成时间: ${new Date().toLocaleString()}\n\n`;

    if (model) {
      report += '--- 模型信息 ---\n';
      report += `顶点数: ${model.vertexCount}\n`;
      report += `面数: ${model.faceCount}\n`;
      report += `尺寸: ${model.boundingBox.size.x.toFixed(2)} × ${model.boundingBox.size.y.toFixed(2)} × ${model.boundingBox.size.z.toFixed(2)} mm\n\n`;
    }

    if (draftAngleResult) {
      report += '--- 脱模角度分析 ---\n';
      report += `最小脱模角: ${draftAngleResult.minAngle.toFixed(2)}°\n`;
      report += `最大脱模角: ${draftAngleResult.maxAngle.toFixed(2)}°\n`;
      report += `平均脱模角: ${draftAngleResult.avgAngle.toFixed(2)}°\n`;
      report += `倒扣面数量: ${draftAngleResult.undercutFaceCount}\n`;
      report += `脱模方向阈值: ${draftAngleResult.threshold}°\n\n`;
    }

    if (wallThicknessResult) {
      report += '--- 壁厚分布分析 ---\n';
      report += `最小壁厚: ${wallThicknessResult.minThickness.toFixed(2)} mm\n`;
      report += `最大壁厚: ${wallThicknessResult.maxThickness.toFixed(2)} mm\n`;
      report += `平均壁厚: ${wallThicknessResult.avgThickness.toFixed(2)} mm\n`;
      report += `采样点数: ${wallThicknessResult.sampleCount}\n\n`;
    }

    if (drainHoleResult) {
      report += '--- 滤水孔规划 ---\n';
      report += `滤水孔总数: ${drainHoleResult.totalCount}\n`;
      report += `吸水孔数量: ${drainHoleResult.suctionCount}\n`;
      report += `脱水孔数量: ${drainHoleResult.dewateringCount}\n`;
      report += `总开孔面积: ${drainHoleResult.totalArea.toFixed(2)} mm²\n`;
      report += `开孔密度: ${drainHoleResult.recommendedDensity.toFixed(2)}%\n\n`;
    }

    if (cycleResult) {
      report += '--- 成型周期预估 ---\n';
      report += `总周期: ${cycleResult.totalTime.toFixed(1)} 秒\n`;
      report += `吸浆时间: ${cycleResult.suctionTime.toFixed(1)} 秒\n`;
      report += `压制时间: ${cycleResult.pressingTime.toFixed(1)} 秒\n`;
      report += `干燥时间: ${cycleResult.dryingTime.toFixed(1)} 秒\n`;
      report += `脱模时间: ${cycleResult.demoldingTime.toFixed(1)} 秒\n\n`;
      report += '--- 灵敏度分析 ---\n';
      for (const item of cycleResult.sensitivityAnalysis) {
        const sign = item.impact > 0 ? '+' : '';
        report += `${item.factor}: ${sign}${item.impact.toFixed(2)}%\n`;
      }
    }

    report += '\n========================================\n';
    report += '报告结束\n';
    report += '========================================\n';

    return report;
  };

  return (
    <div className="w-80 h-full bg-slate-900 border-l border-slate-800 flex flex-col overflow-hidden">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-200">分析结果</h3>
        <button
          onClick={exportReport}
          disabled={!draftAngleResult && !wallThicknessResult && !drainHoleResult && !cycleResult}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download size={14} />
          导出报告
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {analysisMode === 'none' && (
          <div className="p-4">
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
              <div className="flex items-start gap-3">
                <Info size={20} className="text-cyan-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-slate-200 mb-1">使用说明</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    请从左侧工具栏选择分析工具，系统将自动计算并显示分析结果。
                    支持脱模角度分析、壁厚分布检测、滤水孔规划和成型周期预估。
                  </p>
                </div>
              </div>
            </div>

            {model && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-slate-200 mb-3 flex items-center gap-2">
                  <Triangle size={14} className="text-cyan-400" />
                  模型信息
                </h4>
                <div className="bg-slate-800/30 rounded-lg p-3 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">文件名</span>
                    <span className="text-slate-200 font-mono">{modelFileName || '示例模型'}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">顶点数</span>
                    <span className="text-slate-200 font-mono">{model.vertexCount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">面数</span>
                    <span className="text-slate-200 font-mono">{model.faceCount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">尺寸</span>
                    <span className="text-slate-200 font-mono text-right">
                      {model.boundingBox.size.x.toFixed(1)} × {model.boundingBox.size.y.toFixed(1)} × {model.boundingBox.size.z.toFixed(1)} mm
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {analysisMode === 'draft' && (
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Triangle size={16} className="text-orange-400" />
              <h4 className="text-sm font-medium text-slate-200">脱模角度分析</h4>
            </div>

            {draftAngleResult ? (
              <>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                    <p className="text-xs text-slate-400 mb-1">最小</p>
                    <p className="text-lg font-bold text-orange-400 font-mono">
                      {draftAngleResult.minAngle.toFixed(1)}°
                    </p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                    <p className="text-xs text-slate-400 mb-1">平均</p>
                    <p className="text-lg font-bold text-cyan-400 font-mono">
                      {draftAngleResult.avgAngle.toFixed(1)}°
                    </p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                    <p className="text-xs text-slate-400 mb-1">最大</p>
                    <p className="text-lg font-bold text-green-400 font-mono">
                      {draftAngleResult.maxAngle.toFixed(1)}°
                    </p>
                  </div>
                </div>

                <div
                  className={`rounded-lg p-3 flex items-start gap-2 ${
                    draftAngleResult.undercutFaceCount > 0
                      ? 'bg-orange-500/10 border border-orange-500/30'
                      : 'bg-green-500/10 border border-green-500/30'
                  }`}
                >
                  {draftAngleResult.undercutFaceCount > 0 ? (
                    <AlertTriangle size={18} className="text-orange-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle size={18} className="text-green-400 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="text-xs font-medium text-slate-200">
                      {draftAngleResult.undercutFaceCount > 0
                        ? '存在倒扣区域'
                        : '脱模角度合格'}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      共 {draftAngleResult.undercutFaceCount} 个面小于 {draftAngleResult.threshold}°
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-slate-400 mb-2">角度分布</p>
                  <DraftAngleChart result={draftAngleResult} />
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-slate-500 text-sm">
                正在计算...
              </div>
            )}
          </div>
        )}

        {analysisMode === 'thickness' && (
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Ruler size={16} className="text-cyan-400" />
              <h4 className="text-sm font-medium text-slate-200">壁厚分布分析</h4>
            </div>

            {wallThicknessResult ? (
              <>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                    <p className="text-xs text-slate-400 mb-1">最薄</p>
                    <p className="text-lg font-bold text-red-400 font-mono">
                      {wallThicknessResult.minThickness.toFixed(2)}
                    </p>
                    <p className="text-xs text-slate-500">mm</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                    <p className="text-xs text-slate-400 mb-1">平均</p>
                    <p className="text-lg font-bold text-cyan-400 font-mono">
                      {wallThicknessResult.avgThickness.toFixed(2)}
                    </p>
                    <p className="text-xs text-slate-500">mm</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                    <p className="text-xs text-slate-400 mb-1">最厚</p>
                    <p className="text-lg font-bold text-blue-400 font-mono">
                      {wallThicknessResult.maxThickness.toFixed(2)}
                    </p>
                    <p className="text-xs text-slate-500">mm</p>
                  </div>
                </div>

                <div className="bg-slate-800/30 rounded-lg p-3">
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-slate-400">采样点数</span>
                    <span className="text-slate-200 font-mono">
                      {wallThicknessResult.sampleCount}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">壁厚均匀度</span>
                    <span className="text-slate-200">
                      {wallThicknessResult.maxThickness > 0
                        ? (
                            (1 -
                              (wallThicknessResult.maxThickness -
                                wallThicknessResult.minThickness) /
                                wallThicknessResult.avgThickness) *
                            100
                          ).toFixed(1)
                        : 0}
                      %
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-slate-400 mb-2">壁厚分布</p>
                  <ThicknessChart result={wallThicknessResult} />
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-slate-500 text-sm">
                正在计算...
              </div>
            )}
          </div>
        )}

        {analysisMode === 'holes' && (
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-2">
              <CircleDot size={16} className="text-purple-400" />
              <h4 className="text-sm font-medium text-slate-200">滤水孔规划</h4>
            </div>

            {drainHoleResult ? (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                    <p className="text-xs text-slate-400 mb-1">总孔数</p>
                    <p className="text-2xl font-bold text-purple-400 font-mono">
                      {drainHoleResult.totalCount}
                    </p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                    <p className="text-xs text-slate-400 mb-1">开孔面积</p>
                    <p className="text-2xl font-bold text-cyan-400 font-mono">
                      {drainHoleResult.totalArea.toFixed(0)}
                    </p>
                    <p className="text-xs text-slate-500">mm²</p>
                  </div>
                </div>

                <div className="bg-slate-800/30 rounded-lg p-3 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-orange-500" />
                      <span className="text-slate-400">吸水孔</span>
                    </div>
                    <span className="text-slate-200 font-mono">{drainHoleResult.suctionCount} 个</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-cyan-500" />
                      <span className="text-slate-400">脱水孔</span>
                    </div>
                    <span className="text-slate-200 font-mono">{drainHoleResult.dewateringCount} 个</span>
                  </div>
                </div>

                <div className="bg-slate-800/30 rounded-lg p-3">
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-slate-400">开孔密度</span>
                    <span className="text-slate-200 font-mono">
                      {drainHoleResult.recommendedDensity.toFixed(2)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-cyan-500 to-purple-500 h-2 rounded-full"
                      style={{ width: `${Math.min(drainHoleResult.recommendedDensity * 10, 100)}%` }}
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-slate-500 text-sm">
                正在计算...
              </div>
            )}
          </div>
        )}

        {analysisMode === 'cycle' && (
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-green-400" />
              <h4 className="text-sm font-medium text-slate-200">成型周期预估</h4>
            </div>

            {cycleResult ? (
              <>
                <div className="bg-gradient-to-br from-green-500/20 to-cyan-500/20 rounded-xl p-4 border border-green-500/30 text-center">
                  <p className="text-xs text-slate-400 mb-1">预估总周期</p>
                  <p className="text-3xl font-bold text-white font-mono">
                    {cycleResult.totalTime.toFixed(1)}
                  </p>
                  <p className="text-sm text-slate-400">秒</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-cyan-500" />
                      <span className="text-slate-400">吸浆</span>
                    </div>
                    <span className="text-slate-200 font-mono">{cycleResult.suctionTime.toFixed(1)}s</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-1.5">
                    <div
                      className="bg-cyan-500 h-1.5 rounded-full"
                      style={{ width: `${(cycleResult.suctionTime / cycleResult.totalTime) * 100}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs mt-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-purple-500" />
                      <span className="text-slate-400">压制</span>
                    </div>
                    <span className="text-slate-200 font-mono">{cycleResult.pressingTime.toFixed(1)}s</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-1.5">
                    <div
                      className="bg-purple-500 h-1.5 rounded-full"
                      style={{ width: `${(cycleResult.pressingTime / cycleResult.totalTime) * 100}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs mt-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-orange-500" />
                      <span className="text-slate-400">干燥</span>
                    </div>
                    <span className="text-slate-200 font-mono">{cycleResult.dryingTime.toFixed(1)}s</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-1.5">
                    <div
                      className="bg-orange-500 h-1.5 rounded-full"
                      style={{ width: `${(cycleResult.dryingTime / cycleResult.totalTime) * 100}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs mt-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-green-500" />
                      <span className="text-slate-400">脱模</span>
                    </div>
                    <span className="text-slate-200 font-mono">{cycleResult.demoldingTime.toFixed(1)}s</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-1.5">
                    <div
                      className="bg-green-500 h-1.5 rounded-full"
                      style={{ width: `${(cycleResult.demoldingTime / cycleResult.totalTime) * 100}%` }}
                    />
                  </div>
                </div>

                <div>
                  <p className="text-xs text-slate-400 mb-2">周期分布</p>
                  <CyclePieChart result={cycleResult} />
                </div>

                <div>
                  <p className="text-xs text-slate-400 mb-2">灵敏度分析</p>
                  <div className="space-y-1.5">
                    {cycleResult.sensitivityAnalysis.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between text-xs bg-slate-800/50 rounded px-2 py-1.5"
                      >
                        <span className="text-slate-400">{item.factor}</span>
                        <div className="flex items-center gap-1">
                          {item.impact < -1 ? (
                            <TrendingDown size={12} className="text-green-400" />
                          ) : item.impact > 1 ? (
                            <TrendingUp size={12} className="text-red-400" />
                          ) : (
                            <Minus size={12} className="text-slate-500" />
                          )}
                          <span
                            className={`font-mono ${
                              item.impact < 0 ? 'text-green-400' : 'text-red-400'
                            }`}
                          >
                            {item.impact > 0 ? '+' : ''}
                            {item.impact.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-slate-500 text-sm">
                正在计算...
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
