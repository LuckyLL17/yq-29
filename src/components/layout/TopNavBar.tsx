import { Box, FileText, Settings, HelpCircle, Moon, Sun } from 'lucide-react';

interface TopNavBarProps {
  onToggleTheme?: () => void;
}

export function TopNavBar({ onToggleTheme }: TopNavBarProps) {
  return (
    <header className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <Box size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-base font-bold text-white tracking-tight">
            纸浆模塑模具设计助手
          </h1>
          <p className="text-xs text-slate-500 -mt-0.5">Pulp Molding Mold Designer</p>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button className="px-3 py-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-2 text-sm">
          <FileText size={16} />
          <span>项目</span>
        </button>
        <button className="px-3 py-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-2 text-sm">
          <Settings size={16} />
          <span>设置</span>
        </button>
        <button className="px-3 py-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-2 text-sm">
          <HelpCircle size={16} />
          <span>帮助</span>
        </button>

        <div className="w-px h-6 bg-slate-700 mx-2" />

        <button
          onClick={onToggleTheme}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
        >
          <Moon size={18} />
        </button>
      </div>
    </header>
  );
}
