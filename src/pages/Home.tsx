import { useEffect } from 'react';
import { TopNavBar } from '@/components/layout/TopNavBar';
import { StatusBar } from '@/components/layout/StatusBar';
import { LeftToolbar } from '@/components/panels/LeftToolbar';
import { RightPanel } from '@/components/panels/RightPanel';
import { ModelViewer } from '@/components/viewer/ModelViewer';
import { ProjectMenu } from '@/components/dialogs/ProjectMenu';
import { SettingsDialog } from '@/components/dialogs/SettingsDialog';
import { HelpDialog } from '@/components/dialogs/HelpDialog';
import { useAppStore } from '@/store/useAppStore';

function ThemeClassSync() {
  const isDarkMode = useAppStore((state) => state.isDarkMode);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    document.documentElement.classList.toggle('light', !isDarkMode);
  }, [isDarkMode]);

  return null;
}

export default function Home() {
  const isDarkMode = useAppStore((state) => state.isDarkMode);

  return (
    <div className={`h-screen w-screen flex flex-col overflow-hidden ${isDarkMode ? 'bg-slate-950' : 'bg-slate-50'}`}>
      <ThemeClassSync />
      <TopNavBar />

      <div className="flex-1 flex overflow-hidden">
        <LeftToolbar />
        <main className="flex-1 relative overflow-hidden">
          <ModelViewer />
        </main>
        <RightPanel />
      </div>

      <StatusBar />

      <ProjectMenu />
      <SettingsDialog />
      <HelpDialog />
    </div>
  );
}
