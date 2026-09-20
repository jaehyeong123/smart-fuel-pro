import React, { useState } from 'react';
import {
  X,
  Smartphone,
  Share2,
  PlusSquare,
  Check,
  Download
} from 'lucide-react';
import { VehicleProfile } from '../types';

interface InstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt: any;
  onTriggerInstall: () => void;
  profile: VehicleProfile;
  onSaveProfile: (profile: VehicleProfile) => void;
}

export const InstallModal: React.FC<InstallModalProps> = ({
  isOpen,
  onClose,
  deferredPrompt,
  onTriggerInstall,
  profile,
  onSaveProfile,
}) => {
  const [activeTab, setActiveTab] = useState<'install' | 'profile'>('install');
  const [carName, setCarName] = useState(profile.carName);
  const [plateNumber, setPlateNumber] = useState(profile.plateNumber);
  const [fuelType, setFuelType] = useState(profile.fuelType);
  const [officialEfficiency, setOfficialEfficiency] = useState(
    profile.officialEfficiency?.toString() || ''
  );

  if (!isOpen) return null;

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile({
      carName: carName.trim() || '내 차',
      plateNumber: plateNumber.trim(),
      fuelType,
      officialEfficiency: parseFloat(officialEfficiency) || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl">
        {/* Modal Header Tabs */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('install')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                activeTab === 'install'
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-400'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
            >
              스마트폰 앱 설치 안내
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                activeTab === 'profile'
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-400'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
            >
              차량 설정
            </button>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab 1: PWA Mobile Install Guide */}
        {activeTab === 'install' && (
          <div className="p-5 space-y-4 text-xs">
            <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-2xl border border-emerald-200 dark:border-emerald-800/50">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shrink-0 shadow-md">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  홈 화면에 추가하여 어플로 사용하기
                </h3>
                <p className="text-emerald-800 dark:text-emerald-300 text-[11px] mt-0.5">
                  앱스토어 설치 없이 주소창 없는 전체화면 네이티브 앱으로 동작합니다.
                </p>
              </div>
            </div>

            {/* Direct QR Code for Smartphone Camera Scan */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex flex-col items-center text-center">
              <span className="font-bold text-slate-800 dark:text-slate-200 mb-1">
                📷 스마트폰 기본 카메라로 아래 QR을 비추세요
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2.5">
                별도 앱 없이 기본 카메라를 켜고 QR을 비추면 바로 열립니다.
              </p>
              <div className="p-2 bg-white rounded-xl shadow-xs border border-slate-200">
                <img src="/mobile-qr.png" alt="스마트폰 접속 QR코드" className="w-36 h-36 object-contain" />
              </div>
              <div className="mt-2 text-[11px] font-mono text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg">
                http://192.168.5.21:5173/
              </div>
            </div>

            {/* Direct Android / Chrome Install Button if prompt ready */}
            {deferredPrompt && (
              <button
                onClick={onTriggerInstall}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/30"
              >
                <Download className="w-4 h-4" />
                지금 홈 화면에 앱 설치하기
              </button>
            )}

            {/* Platform Instructions */}
            <div className="space-y-3 pt-2">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  <span className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px]">🍎</span>
                  iPhone (사파리 Safari)
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                  사파리 브라우저 하단의 <strong>공유 아이콘 (<Share2 className="w-3 h-3 inline" />)</strong> 클릭 후, 메뉴에서 <strong>'홈 화면에 추가 (<PlusSquare className="w-3 h-3 inline" />)'</strong>를 누르면 실제 어플 아이콘이 생성됩니다.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  <span className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px]">🤖</span>
                  Android (크롬 / 삼성 인터넷)
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                  우측 상단 <strong>메뉴(⋮)</strong>를 누르고 <strong>'홈 화면에 추가'</strong> 또는 <strong>'앱 설치'</strong>를 선택하시면 스마트폰 앱 목록에 즉시 등록됩니다.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Vehicle Profile Settings */}
        {activeTab === 'profile' && (
          <form onSubmit={handleProfileSubmit} className="p-5 space-y-3.5 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                차량 이름
              </label>
              <input
                type="text"
                value={carName}
                onChange={(e) => setCarName(e.target.value)}
                placeholder="예: 쏘렌토 하이브리드, 아반떼"
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                차량 번호
              </label>
              <input
                type="text"
                value={plateNumber}
                onChange={(e) => setPlateNumber(e.target.value)}
                placeholder="예: 12가 3456"
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                유종 선택
              </label>
              <select
                value={fuelType}
                onChange={(e: any) => setFuelType(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="gasoline">휘발유 (가솔린)</option>
                <option value="diesel">경유 (디젤)</option>
                <option value="hybrid">하이브리드</option>
                <option value="lpg">LPG</option>
                <option value="ev">전기차 (EV)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                공인 연비 (km/L, 선택)
              </label>
              <input
                type="number"
                step="0.1"
                value={officialEfficiency}
                onChange={(e) => setOfficialEfficiency(e.target.value)}
                placeholder="예: 15.2"
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/30 active:scale-98 transition-all"
            >
              <Check className="w-4 h-4" />
              설정 저장
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
