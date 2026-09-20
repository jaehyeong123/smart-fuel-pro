import { LayoutDashboard, Plus, History } from 'lucide-react';
import { ActiveTab } from '../types';

interface BottomNavProps {
  activeTab: ActiveTab;
  onChangeTab: (tab: ActiveTab) => void;
  recordCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
  recordCount,
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
      <div className="max-w-md mx-auto px-6 h-16 flex items-center justify-around relative">
        {/* Tab 1: Dashboard */}
        <button
          onClick={() => handleTabClick('dashboard')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            activeTab === 'dashboard'
              ? 'text-emerald-600 dark:text-emerald-400 font-bold scale-105'
              : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 mb-1" />
          <span className="text-[11px]">대시보드</span>
        </button>

        {/* Tab 2: New Record (Center Featured Button) */}
        <div className="flex-1 flex justify-center -mt-5">
          <button
            onClick={() => handleTabClick('input')}
            className={`w-13 h-13 rounded-full flex flex-col items-center justify-center shadow-lg transition-transform active:scale-95 ${
              activeTab === 'input'
                ? 'bg-emerald-600 text-white shadow-emerald-600/40 ring-4 ring-emerald-500/20'
                : 'bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-emerald-500/30'
            }`}
            style={{ width: '3.25rem', height: '3.25rem' }}
          >
            <Plus className="w-6 h-6 stroke-[2.6]" />
          </button>
        </div>

        {/* Tab 3: History */}
        <button
          onClick={() => handleTabClick('history')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all relative ${
            activeTab === 'history'
              ? 'text-emerald-600 dark:text-emerald-400 font-bold scale-105'
              : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          <div className="relative">
            <History className="w-5 h-5 mb-1" />
            {recordCount > 0 && (
              <span className="absolute -top-1 -right-2 px-1 min-w-[14px] h-[14px] flex items-center justify-center text-[9px] font-bold bg-emerald-500 text-white rounded-full">
                {recordCount}
              </span>
            )}
          </div>
          <span className="text-[11px]">기록 목록</span>
        </button>
      </div>
    </nav>
  );
};
