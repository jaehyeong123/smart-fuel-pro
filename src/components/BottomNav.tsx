import { LayoutDashboard, Plus, History, Wrench } from 'lucide-react';
import { ActiveTab } from '../types';

interface BottomNavProps {
  activeTab: ActiveTab;
  onChangeTab: (tab: ActiveTab) => void;
  recordCount: number;
  maintenanceCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
  recordCount,
  maintenanceCount,
}) => {
  const handleTabClick = (tab: ActiveTab) => {
    // Smartphone native-like haptic feedback
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(15);
      } catch {}
    }
    onChangeTab(tab);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200/80 dark:border-slate-800/80 pb-safe">
      <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-around relative">
        {/* Tab 1: Dashboard */}
        <button
          onClick={() => handleTabClick('dashboard')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            activeTab === 'dashboard'
              ? 'text-emerald-600 dark:text-emerald-400 font-bold scale-105'
              : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">대시보드</span>
        </button>

        {/* Tab 2: New Record (Center Button) */}
        <button
          onClick={() => handleTabClick('input')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            activeTab === 'input'
              ? 'text-emerald-600 dark:text-emerald-400 font-bold scale-105'
              : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/30">
            <Plus className="w-5 h-5 stroke-[2.8]" />
          </div>
          <span className="text-[10px] mt-0.5">주유등록</span>
        </button>

        {/* Tab 3: Maintenance (NEW) */}
        <button
          onClick={() => handleTabClick('maintenance')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all relative ${
            activeTab === 'maintenance'
              ? 'text-amber-500 font-bold scale-105'
              : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          <div className="relative">
            <Wrench className="w-5 h-5 mb-0.5" />
            {maintenanceCount > 0 && (
              <span className="absolute -top-1 -right-2 px-1 min-w-[13px] h-[13px] flex items-center justify-center text-[8px] font-bold bg-amber-500 text-white rounded-full">
                {maintenanceCount}
              </span>
            )}
          </div>
          <span className="text-[10px]">정비관리</span>
        </button>

        {/* Tab 4: History */}
        <button
          onClick={() => handleTabClick('history')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all relative ${
            activeTab === 'history'
              ? 'text-emerald-600 dark:text-emerald-400 font-bold scale-105'
              : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          <div className="relative">
            <History className="w-5 h-5 mb-0.5" />
            {recordCount > 0 && (
              <span className="absolute -top-1 -right-2 px-1 min-w-[13px] h-[13px] flex items-center justify-center text-[8px] font-bold bg-emerald-500 text-white rounded-full">
                {recordCount}
              </span>
            )}
          </div>
          <span className="text-[10px]">주유내역</span>
        </button>
      </div>
    </nav>
  );
};
