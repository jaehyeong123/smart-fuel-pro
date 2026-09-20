import React, { useState, useRef } from 'react';
import {
  Wrench,
  Plus,
  Coins,
  Calendar,
  MapPin,
  Camera,
  Image as ImageIcon,
  Trash2,
  CheckCircle2,
  X,
  Sparkles
} from 'lucide-react';
import { MaintenanceRecord, MaintenanceCategory } from '../types';

interface MaintenanceViewProps {
  records: MaintenanceRecord[];
  currentOdometer: number;
  onSaveRecord: (record: Omit<MaintenanceRecord, 'id'>) => void;
  onDeleteRecord: (id: string) => void;
}

const CATEGORY_MAP: Record<
  MaintenanceCategory,
  { label: string; color: string; bg: string; defaultCycleKm?: number }
> = {
  engine_oil: { label: '엔진오일', color: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-100 dark:bg-amber-950/80', defaultCycleKm: 10000 },
  mission_oil: { label: '미션오일', color: 'text-orange-700 dark:text-orange-300', bg: 'bg-orange-100 dark:bg-orange-950/80', defaultCycleKm: 60000 },
  brake: { label: '브레이크', color: 'text-rose-700 dark:text-rose-300', bg: 'bg-rose-100 dark:bg-rose-950/80', defaultCycleKm: 40000 },
  tire: { label: '타이어', color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-100 dark:bg-emerald-950/80', defaultCycleKm: 40000 },
  filter: { label: '에어컨필터', color: 'text-cyan-700 dark:text-cyan-300', bg: 'bg-cyan-100 dark:bg-cyan-950/80', defaultCycleKm: 10000 },
  battery: { label: '배터리', color: 'text-purple-700 dark:text-purple-300', bg: 'bg-purple-100 dark:bg-purple-950/80', defaultCycleKm: 50000 },
  wiper: { label: '와이퍼', color: 'text-blue-700 dark:text-blue-300', bg: 'bg-blue-100 dark:bg-blue-950/80', defaultCycleKm: 15000 },
  spark_plug: { label: '점화플러그', color: 'text-red-700 dark:text-red-300', bg: 'bg-red-100 dark:bg-red-950/80', defaultCycleKm: 80000 },
  inspection: { label: '정기종합검사', color: 'text-indigo-700 dark:text-indigo-300', bg: 'bg-indigo-100 dark:bg-indigo-950/80' },
  repair: { label: '일반정비수리', color: 'text-slate-700 dark:text-slate-300', bg: 'bg-slate-100 dark:bg-slate-800' },
  other: { label: '기타소모품', color: 'text-teal-700 dark:text-teal-300', bg: 'bg-teal-100 dark:bg-teal-950/80' }
};

export const MaintenanceView: React.FC<MaintenanceViewProps> = ({
  records,
  currentOdometer,
  onSaveRecord,
  onDeleteRecord,
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Form State
  const [category, setCategory] = useState<MaintenanceCategory>('engine_oil');
  const [title, setTitle] = useState('엔진오일 및 오일필터 세트 교체');
  const [odometer, setOdometer] = useState(currentOdometer ? currentOdometer.toString() : '');
  const [cost, setCost] = useState('');
  const [shopName, setShopName] = useState('');
  const [memo, setMemo] = useState('');
  const [nextDueOdometer, setNextDueOdometer] = useState<string>(() => {
    return currentOdometer ? (currentOdometer + 10000).toString() : '';
  });
  const [date, setDate] = useState(() => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - offset).toISOString().slice(0, 16);
  });
  const [receiptImg, setReceiptImg] = useState<string | null>(null);

  // Photo modal
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  // File input refs
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Handle category change
  const handleCategorySelect = (cat: MaintenanceCategory) => {
    setCategory(cat);
    const catInfo = CATEGORY_MAP[cat];
    setTitle(`${catInfo.label} 교체/점검`);
    if (catInfo.defaultCycleKm && odometer) {
      const odoNum = parseInt(odometer, 10);
      if (!isNaN(odoNum)) {
        setNextDueOdometer((odoNum + catInfo.defaultCycleKm).toString());
      }
    }
  };

  // Image Upload Handler
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setReceiptImg(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const odoNum = parseFloat(odometer.replace(/,/g, ''));
    const costNum = parseFloat(cost.replace(/,/g, ''));

    if (isNaN(odoNum) || odoNum <= 0) {
      alert('정비 시점의 누적 주행거리를 입력해주세요.');
      return;
    }
    if (isNaN(costNum) || costNum < 0) {
      alert('정비 비용을 입력해주세요 (0원 가능).');
      return;
    }

    onSaveRecord({
      date,
      odometer: odoNum,
      category,
      title: title.trim() || CATEGORY_MAP[category].label,
      cost: costNum,
      shopName: shopName.trim() || '정비소',
      memo: memo.trim(),
      receiptImage: receiptImg || undefined,
      nextDueOdometer: nextDueOdometer ? parseInt(nextDueOdometer.replace(/,/g, ''), 10) : undefined
    });

    // Reset & Close
    setIsFormOpen(false);
    setReceiptImg(null);
    setCost('');
    setMemo('');
  };

  // Calculate totals
  const totalMaintenanceCost = records.reduce((sum, r) => sum + (r.cost || 0), 0);

  // Find latest engine oil replacement
  const latestEngineOil = records.find((r) => r.category === 'engine_oil');
  let engineOilRemainingKm: number | null = null;
  if (latestEngineOil && latestEngineOil.nextDueOdometer && currentOdometer) {
    engineOilRemainingKm = latestEngineOil.nextDueOdometer - currentOdometer;
  }

  return (
    <div className="space-y-4 pb-24">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Wrench className="w-5 h-5 text-amber-500" />
            차량 정비 & 소모품 관리
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            엔진오일, 소모품 교체 주기와 정비 내역을 기록합니다.
          </p>
        </div>

        <button
          onClick={() => setIsFormOpen(true)}
          className="px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-xs flex items-center gap-1 shadow-md shadow-amber-500/20 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          정비 등록
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* Total Cost */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
            <span className="font-medium">총 정비 비용</span>
            <Coins className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-lg font-bold text-slate-900 dark:text-white">
            {totalMaintenanceCost.toLocaleString()}
            <span className="text-xs font-normal text-slate-500 ml-0.5">원</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">누적 {records.length}회 정비</span>
        </div>

        {/* Engine Oil Status Card */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
            <span className="font-medium">엔진오일 잔여</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-lg font-bold text-slate-900 dark:text-white">
            {engineOilRemainingKm !== null ? (
              <>
                <span className={engineOilRemainingKm <= 1000 ? 'text-rose-500' : 'text-emerald-600 dark:text-emerald-400'}>
                  {engineOilRemainingKm.toLocaleString()}
                </span>
                <span className="text-xs font-normal text-slate-500 ml-0.5">km</span>
              </>
            ) : (
              <span className="text-xs text-slate-400 font-normal">교체 기록 필요</span>
            )}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            {latestEngineOil ? `최근: ${latestEngineOil.odometer.toLocaleString()}km` : '기록 없음'}
          </span>
        </div>
      </div>

      {/* Maintenance Records List */}
      <div className="space-y-3">
        {records.length > 0 ? (
          records.map((record) => {
            const cat = CATEGORY_MAP[record.category] || CATEGORY_MAP.other;
            const dateObj = new Date(record.date);
            const dateFormatted = `${dateObj.getFullYear()}.${String(dateObj.getMonth() + 1).padStart(2, '0')}.${String(dateObj.getDate()).padStart(2, '0')}`;

            return (
              <div
                key={record.id}
                className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-2.5"
              >
                {/* Header: Category Badge, Title, Cost */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${cat.bg} ${cat.color}`}>
                        {cat.label}
                      </span>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                        {record.title}
                      </h3>
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-1">
                      <Calendar className="w-3 h-3 inline" />
                      <span>{dateFormatted}</span>
                      <span>·</span>
                      <MapPin className="w-3 h-3 inline" />
                      <span>{record.shopName}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      {record.cost.toLocaleString()}원
                    </span>
                  </div>
                </div>

                {/* Details Matrix */}
                <div className="grid grid-cols-2 gap-2 py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">정비 시점 주행거리</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {record.odometer.toLocaleString()} km
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">다음 교체 권장</span>
                    <span className="font-bold text-amber-600 dark:text-amber-400">
                      {record.nextDueOdometer ? `${record.nextDueOdometer.toLocaleString()} km` : '-'}
                    </span>
                  </div>
                </div>

                {record.memo && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 p-2 rounded-xl">
                    {record.memo}
                  </p>
                )}

                {/* Actions: Receipt Photo & Delete */}
                <div className="flex items-center justify-between pt-1 text-xs">
                  <div>
                    {record.receiptImage && (
                      <button
                        onClick={() => setSelectedPhoto(record.receiptImage!)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                      >
                        <ImageIcon className="w-3.5 h-3.5 text-amber-500" />
                        정비 명세서 확인
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      if (confirm('이 정비 기록을 삭제하시겠습니까?')) {
                        onDeleteRecord(record.id);
                      }
                    }}
                    className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-12 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
            <Wrench className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
            <p className="text-sm font-semibold">등록된 정비 기록이 없습니다.</p>
            <p className="text-xs text-slate-400 mt-1">엔진오일, 타이어 등 소모품 교체 내역을 관리해보세요.</p>
            <button
              onClick={() => setIsFormOpen(true)}
              className="mt-3 px-4 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 text-xs font-bold border border-amber-200 dark:border-amber-800"
            >
              첫 정비 기록 등록하기
            </button>
          </div>
        )}
      </div>

      {/* MODAL: New Maintenance Entry Form */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-800 shadow-2xl">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-900 z-10">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <Wrench className="w-4 h-4 text-amber-500" />
                신규 차량 정비 기록 등록
              </h3>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-3.5 text-xs">
              {/* Category Chips Selector */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  정비 카테고리 선택
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {(Object.keys(CATEGORY_MAP) as MaintenanceCategory[]).map((catKey) => {
                    const isSelected = category === catKey;
                    const catInfo = CATEGORY_MAP[catKey];
                    return (
                      <button
                        type="button"
                        key={catKey}
                        onClick={() => handleCategorySelect(catKey)}
                        className={`px-2.5 py-1.5 rounded-xl font-bold transition-all text-[11px] ${
                          isSelected
                            ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/30'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                        }`}
                      >
                        {catInfo.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  정비 항목 제목 *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="예: 엔진오일 및 오일필터 세트 교체"
                  required
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              {/* Mileage & Cost */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    정비 시점 거리 (km) *
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={odometer}
                    onChange={(e) => setOdometer(e.target.value)}
                    placeholder="예: 45000"
                    required
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    정비 비용 (원) *
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    placeholder="예: 85000"
                    required
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Date & Shop Name */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    정비 일시
                  </label>
                  <input
                    type="datetime-local"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full h-10 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none text-[11px]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    정비소 / 업체명
                  </label>
                  <input
                    type="text"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    placeholder="예: 블루핸즈 역삼점"
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Next Due Mileage */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  다음 교체 권장 주행거리 (km)
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    value={nextDueOdometer}
                    onChange={(e) => setNextDueOdometer(e.target.value)}
                    placeholder="예: 55000"
                    className="flex-1 h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const cur = parseInt(odometer, 10) || currentOdometer || 0;
                      setNextDueOdometer((cur + 10000).toString());
                    }}
                    className="px-2.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[11px] hover:bg-slate-200"
                  >
                    +1만 km
                  </button>
                </div>
              </div>

              {/* Photo Upload: Camera VS Gallery choice */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  정비 명세서 / 영수증 사진
                </label>
                {receiptImg ? (
                  <div className="relative rounded-xl overflow-hidden aspect-[16/9] bg-slate-950">
                    <img src={receiptImg} alt="명세서 사진" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setReceiptImg(null)}
                      className="absolute top-2 right-2 px-2 py-1 rounded-lg bg-black/70 text-white text-[10px] font-bold"
                    >
                      사진 삭제
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="py-2.5 px-3 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95"
                    >
                      <Camera className="w-4 h-4" />
                      <span>카메라 촬영</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => galleryInputRef.current?.click()}
                      className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95"
                    >
                      <ImageIcon className="w-4 h-4" />
                      <span>앨범에서 선택</span>
                    </button>
                  </div>
                )}

                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <input
                  ref={galleryInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </div>

              {/* Memo */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  정비 메모 (선택)
                </label>
                <input
                  type="text"
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  placeholder="예: 점화플러그 상태 양호, 브레이크액 추가 점검 완료"
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-xs shadow-md shadow-amber-500/20 active:scale-98 transition-all flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                정비 기록 저장하기
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Photo Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setSelectedPhoto(null)}>
          <div className="relative max-w-sm w-full bg-slate-900 rounded-2xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-3 bg-slate-800 flex items-center justify-between text-white text-xs font-bold">
              <span>정비 명세서 원본</span>
              <button onClick={() => setSelectedPhoto(null)}><X className="w-4 h-4" /></button>
            </div>
            <div className="p-2 flex items-center justify-center bg-black max-h-[70vh]">
              <img src={selectedPhoto} alt="정비 명세서" className="max-w-full max-h-[65vh] object-contain rounded" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
