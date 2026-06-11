import { TopNavBar } from '@/components/layout/TopNavBar';
import { StatusBar } from '@/components/layout/StatusBar';
import { LeftToolbar } from '@/components/panels/LeftToolbar';
import { RightPanel } from '@/components/panels/RightPanel';
import { ModelViewer } from '@/components/viewer/ModelViewer';

export default function Home() {
  return (
    <div className="h-screen w-screen flex flex-col bg-slate-950 overflow-hidden">
      <TopNavBar />

      <div className="flex-1 flex overflow-hidden">
        <LeftToolbar />

        <main className="flex-1 relative overflow-hidden">
          <ModelViewer />
        </main>

        <RightPanel />
      </div>

      <StatusBar />
    </div>
  );
}
