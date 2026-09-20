import React from 'react';
import { Fuel, Moon, Sun, Download, Car } from 'lucide-react';
import { VehicleProfile } from '../types';

interface HeaderProps {
  profile: VehicleProfile;
  onOpenProfile: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenInstall: () => void;
  canInstallPwa: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  profile,
  onOpenProfile,
  darkMode,
  onToggleDarkMode,
  onOpenInstall,
  canInstallPwa,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 pt-safe">
      <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
        {/* App Title & Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-md shadow-emerald-500/20 text-white">
            <Fuel className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-base font-bold tracking-tight text-slate-900 dark:text-white leading-none">
                스마트 차계부
              </h1>
              <span className="px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-400 rounded">
                PRO
              </span>
            </div>
            <button
              onClick={onOpenProfile}
              className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors mt-0.5 text-left"
            >
              <Car className="w-3 h-3" />
              <span className="truncate max-w-[120px] font-medium">{profile.carName}</span>
              <span className="text-[10px] text-slate-400">({profile.plateNumber})</span>
            </button>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1.5">
          {canInstallPwa && (
            <button
              onClick={onOpenInstall}
              title="앱 설치하기"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shadow-sm active:scale-95 transition-transform"
            >
              <Download className="w-3.5 h-3.5" />
              <span>앱 설치</span>
            </button>
          )}

          <button
            onClick={onToggleDarkMode}
            title={darkMode ? '라이트 모드' : '다크 모드'}
            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors active:scale-90"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
