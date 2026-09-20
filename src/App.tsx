import React, { useState, useEffect, useMemo } from 'react';
import { FuelRecord, VehicleProfile, ActiveTab } from './types';
import {
  loadRecordsFromStorage,
  saveRecordsToStorage,
  loadProfileFromStorage,
  saveProfileToStorage,
  sampleInitialRecords,
} from './utils/storage';
import { computeDashboardStats } from './utils/fuelCalculator';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { DashboardView } from './components/DashboardView';
import { FuelInputForm } from './components/FuelInputForm';
import { HistoryView } from './components/HistoryView';
import { InstallModal } from './components/InstallModal';

export const App: React.FC = () => {
  // Main state
  const [records, setRecords] = useState<FuelRecord[]>(() => loadRecordsFromStorage());
  const [profile, setProfile] = useState<VehicleProfile>(() => loadProfileFromStorage());
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Dark Mode
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return (
      localStorage.getItem('smart_fuel_theme') === 'dark' ||
      window.matchMedia('(prefers-color-scheme: dark)').matches
    );
  });

  // PWA Install Prompt state
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState<boolean>(false);

  // Success Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync dark mode class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('smart_fuel_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('smart_fuel_theme', 'light');
    }
  }, [darkMode]);

  // Listen for PWA beforeinstallprompt event
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleTriggerInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };

  // Compute Dashboard KPIs
  const stats = useMemo(() => computeDashboardStats(records), [records]);

  // Get latest record for input reference
  const lastRecord = useMemo(() => {
    if (records.length === 0) return null;
    return [...records].sort((a, b) => a.odometer - b.odometer)[records.length - 1];
  }, [records]);

  // Handle Save Record
  const handleSaveRecord = (
    newRecordData: Omit<FuelRecord, 'id' | 'tripDistance' | 'fuelEfficiency' | 'costPerKm'>
  ) => {
    const newRecord: FuelRecord = {
      ...newRecordData,
      id: 'rec-' + Date.now(),
      tripDistance: 0,
      fuelEfficiency: null,
      costPerKm: null,
    };

    const updated = [...records, newRecord];
    saveRecordsToStorage(updated);
    setRecords(loadRecordsFromStorage());

    // Switch to Dashboard
    setActiveTab('dashboard');

    // Toast notification
    setToastMessage('주유 기록이 안전하게 저장되고 연비가 계산되었습니다! ✨');
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Handle Delete Record
  const handleDeleteRecord = (id: string) => {
    const filtered = records.filter((r) => r.id !== id);
    saveRecordsToStorage(filtered);
    setRecords(loadRecordsFromStorage());
    setToastMessage('주유 기록이 삭제되었습니다.');
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Handle Restore Sample Data
  const handleRestoreSampleData = () => {
    saveRecordsToStorage(sampleInitialRecords);
    setRecords(loadRecordsFromStorage());
    setToastMessage('체험용 샘플 주유 기록 5건을 불러왔습니다.');
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Handle Import JSON
  const handleImportJson = (imported: FuelRecord[]) => {
    saveRecordsToStorage(imported);
    setRecords(loadRecordsFromStorage());
    setToastMessage(`${imported.length}건의 기록을 성공적으로 복원했습니다.`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Handle Save Profile
  const handleSaveProfile = (newProfile: VehicleProfile) => {
    setProfile(newProfile);
    saveProfileToStorage(newProfile);
    setToastMessage('차량 정보가 저장되었습니다.');
    setTimeout(() => setToastMessage(null), 2500);
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col font-sans transition-colors duration-200">
      {/* Top Mobile Header */}
      <Header
        profile={profile}
        onOpenProfile={() => setIsInstallModalOpen(true)}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        onOpenInstall={() => setIsInstallModalOpen(true)}
        canInstallPwa={Boolean(deferredPrompt)}
      />

      {/* Main Content Area (Max width phone shell centered) */}
      <main className="flex-1 w-full max-w-md mx-auto px-4 pt-4 relative">
        {/* Floating Toast Notification */}
        {toastMessage && (
          <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-sm p-3 rounded-2xl bg-slate-900/95 dark:bg-emerald-950/95 text-white text-xs font-semibold shadow-xl border border-white/10 flex items-center justify-center text-center animate-bounce">
            {toastMessage}
          </div>
        )}

        {/* Tab Views */}
        {activeTab === 'dashboard' && (
          <DashboardView
            stats={stats}
            records={records}
            profile={profile}
            onNavigateToInput={() => setActiveTab('input')}
            onNavigateToHistory={() => setActiveTab('history')}
            darkMode={darkMode}
          />
        )}

        {activeTab === 'input' && (
          <FuelInputForm
            onSaveRecord={handleSaveRecord}
            lastRecord={lastRecord}
            onCancel={() => setActiveTab('dashboard')}
          />
        )}

        {activeTab === 'history' && (
          <HistoryView
            records={records}
            onDeleteRecord={handleDeleteRecord}
            onRestoreSampleData={handleRestoreSampleData}
            onImportJson={handleImportJson}
          />
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        recordCount={records.length}
      />

      {/* App Install / Vehicle Settings Modal */}
      <InstallModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
        deferredPrompt={deferredPrompt}
        onTriggerInstall={handleTriggerInstall}
        profile={profile}
        onSaveProfile={handleSaveProfile}
      />
    </div>
  );
};
