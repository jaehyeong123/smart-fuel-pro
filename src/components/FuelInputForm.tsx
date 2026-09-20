import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Sparkles,
  Loader2,
  CheckCircle2,
  X,
  Fuel,
  Gauge,
  Image as ImageIcon
} from 'lucide-react';
import Tesseract from 'tesseract.js';
import { FuelRecord } from '../types';
import { preprocessImageForOcr } from '../utils/imagePreprocess';
import { parseOdometerText, parseReceiptText } from '../utils/ocrParser';

interface FuelInputFormProps {
  onSaveRecord: (record: Omit<FuelRecord, 'id' | 'tripDistance' | 'fuelEfficiency' | 'costPerKm'>) => void;
  lastRecord: FuelRecord | null;
  onCancel: () => void;
}

export const FuelInputForm: React.FC<FuelInputFormProps> = ({
  onSaveRecord,
  lastRecord,
  onCancel,
}) => {
  // Input fields state
  const [odometer, setOdometer] = useState<string>('');
  const [liters, setLiters] = useState<string>('');
  const [totalCost, setTotalCost] = useState<string>('');
  const [unitPrice, setUnitPrice] = useState<string>('');
  const [gasStation, setGasStation] = useState<string>('');
  const [isFullTank, setIsFullTank] = useState<boolean>(true);
  const [date, setDate] = useState<string>(() => {
    // Current local ISO string formatted for datetime-local
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - offset).toISOString().slice(0, 16);
  });
  const [memo, setMemo] = useState<string>('');

  // Image previews
  const [odometerImg, setOdometerImg] = useState<string | null>(null);
  const [receiptImg, setReceiptImg] = useState<string | null>(null);

  // OCR Processing States
  const [odoOcrLoading, setOdoOcrLoading] = useState<boolean>(false);
  const [odoOcrProgress, setOdoOcrProgress] = useState<number>(0);
  const [odoOcrNote, setOdoOcrNote] = useState<string | null>(null);

  const [receiptOcrLoading, setReceiptOcrLoading] = useState<boolean>(false);
  const [receiptOcrProgress, setReceiptOcrProgress] = useState<number>(0);
  const [receiptOcrNote, setReceiptOcrNote] = useState<string | null>(null);

  // Field auto-detected badges
  const [autoFilledFields, setAutoFilledFields] = useState<Record<string, boolean>>({});

  // File input refs (camera & gallery separation)
  const odoCameraRef = useRef<HTMLInputElement>(null);
  const odoGalleryRef = useRef<HTMLInputElement>(null);
  const receiptCameraRef = useRef<HTMLInputElement>(null);
  const receiptGalleryRef = useRef<HTMLInputElement>(null);

  // Auto calculate unit price when totalCost and liters change
  useEffect(() => {
    const cost = parseFloat(totalCost.replace(/,/g, ''));
    const vol = parseFloat(liters);
    if (!isNaN(cost) && !isNaN(vol) && vol > 0) {
      setUnitPrice(Math.round(cost / vol).toString());
    }
  }, [totalCost, liters]);

  // Handle Odometer Image Upload & OCR
  const handleOdometerImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setOdoOcrLoading(true);
      setOdoOcrProgress(10);
      setOdoOcrNote('계기판 이미지 전처리 중...');

      // 1. Canvas Preprocessing (grayscale & contrast stretch)
      const { previewUrl, ocrReadyBlob } = await preprocessImageForOcr(file, 'odometer');
      setOdometerImg(previewUrl);
      setOdoOcrProgress(30);
      setOdoOcrNote('OCR AI 모델 로드 및 텍스트 인식 중...');

      // 2. Run Tesseract.js
      const result = await Tesseract.recognize(ocrReadyBlob, 'kor+eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setOdoOcrProgress(30 + Math.round(m.progress * 65));
          }
        },
      });

      // 3. Parse cumulative mileage from recognized text
      const parsed = parseOdometerText(result.data.text);
      if (parsed.odometer) {
        setOdometer(parsed.odometer.toString());
        setAutoFilledFields((prev) => ({ ...prev, odometer: true }));
        setOdoOcrNote(`✅ 인식 성공: ${parsed.odometer.toLocaleString()} km`);
      } else {
        setOdoOcrNote(parsed.confidenceNote);
      }
    } catch (err: any) {
      console.error('Odometer OCR failed', err);
      setOdoOcrNote('계기판 인식 중 오류가 발생했습니다. 직접 입력해주세요.');
    } finally {
      setOdoOcrLoading(false);
    }
  };

  // Handle Receipt Image Upload & OCR
  const handleReceiptImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setReceiptOcrLoading(true);
      setReceiptOcrProgress(10);
      setReceiptOcrNote('영수증 이미지 전처리 중...');

      // 1. Canvas Preprocessing (contrast binarization)
      const { previewUrl, ocrReadyBlob } = await preprocessImageForOcr(file, 'receipt');
      setReceiptImg(previewUrl);
      setReceiptOcrProgress(30);
      setReceiptOcrNote('영수증 항목 추출 중...');

      // 2. Run Tesseract.js
      const result = await Tesseract.recognize(ocrReadyBlob, 'kor+eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setReceiptOcrProgress(30 + Math.round(m.progress * 65));
          }
        },
      });

      // 3. Parse receipt fields
      const parsed = parseReceiptText(result.data.text);
      const newAutoFilled: Record<string, boolean> = {};

      if (parsed.liters) {
        setLiters(parsed.liters.toString());
        newAutoFilled.liters = true;
      }
      if (parsed.totalCost) {
        setTotalCost(parsed.totalCost.toString());
        newAutoFilled.totalCost = true;
      }
      if (parsed.unitPrice) {
        setUnitPrice(parsed.unitPrice.toString());
        newAutoFilled.unitPrice = true;
      }
      if (parsed.gasStation) {
        setGasStation(parsed.gasStation);
        newAutoFilled.gasStation = true;
      }
      if (parsed.date) {
        setDate(`${parsed.date}T12:00`);
      }

      setAutoFilledFields((prev) => ({ ...prev, ...newAutoFilled }));

      const detectedItems = [
        parsed.liters ? `${parsed.liters}L` : null,
        parsed.totalCost ? `${parsed.totalCost.toLocaleString()}원` : null,
        parsed.gasStation ? parsed.gasStation : null,
      ].filter(Boolean);

      if (detectedItems.length > 0) {
        setReceiptOcrNote(`✅ 추출 완료: ${detectedItems.join(' · ')}`);
      } else {
        setReceiptOcrNote('영수증 숫자를 판독하지 못했습니다. 수동으로 입력해주세요.');
      }
    } catch (err: any) {
      console.error('Receipt OCR failed', err);
      setReceiptOcrNote('영수증 인식 중 오류가 발생했습니다. 직접 입력해주세요.');
    } finally {
      setReceiptOcrLoading(false);
    }
  };

  // Estimated Live Calculation Preview
  const currentOdoNum = parseFloat(odometer.replace(/,/g, ''));
  const currentLitersNum = parseFloat(liters);
  const currentCostNum = parseFloat(totalCost.replace(/,/g, ''));

  let previewTripKm = 0;
  let previewEfficiency: number | null = null;
  if (lastRecord && !isNaN(currentOdoNum) && currentOdoNum > lastRecord.odometer) {
    previewTripKm = Math.round(currentOdoNum - lastRecord.odometer);
    if (!isNaN(currentLitersNum) && currentLitersNum > 0) {
      previewEfficiency = Number((previewTripKm / currentLitersNum).toFixed(2));
    }
  }

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isNaN(currentOdoNum) || currentOdoNum <= 0) {
      alert('올바른 누적 주행거리(km)를 입력해주세요.');
      return;
    }
    if (isNaN(currentLitersNum) || currentLitersNum <= 0) {
      alert('올바른 주유량(L)을 입력해주세요.');
      return;
    }
    if (isNaN(currentCostNum) || currentCostNum <= 0) {
      alert('올바른 결제금액(원)을 입력해주세요.');
      return;
    }

    if (lastRecord && currentOdoNum < lastRecord.odometer) {
      const confirmRetro = confirm(
        `입력하신 주행거리(${currentOdoNum.toLocaleString()} km)가 직전 기록(${lastRecord.odometer.toLocaleString()} km)보다 작습니다.\n과거 시점의 기록으로 저장하시겠습니까?`
      );
      if (!confirmRetro) return;
    }

    // Save
    onSaveRecord({
      date,
      odometer: currentOdoNum,
      liters: Number(currentLitersNum.toFixed(2)),
      totalCost: currentCostNum,
      unitPrice: parseFloat(unitPrice) || Math.round(currentCostNum / currentLitersNum),
      isFullTank,
      gasStation: gasStation.trim() || '주유소',
      memo: memo.trim(),
      odometerImage: odometerImg || undefined,
      receiptImage: receiptImg || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pb-24">
      {/* Header with dismiss button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">신규 주유 기록 등록</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            사진을 업로드하면 OCR이 숫자를 자동으로 채워줍니다.
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* 1. OCR Photo Capture Section */}
      <div className="grid grid-cols-2 gap-3">
        {/* Odometer Photo Card */}
        <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
              <Gauge className="w-3.5 h-3.5 text-emerald-600" />
              계기판 촬영
            </span>
            {odometerImg && (
              <button
                type="button"
                onClick={() => {
                  setOdometerImg(null);
                  setOdoOcrNote(null);
                }}
                className="text-[10px] text-rose-500 hover:underline"
              >
                삭제
              </button>
            )}
          </div>

          {odometerImg ? (
            <div className="relative rounded-xl overflow-hidden aspect-[4/3] bg-slate-950">
              <img src={odometerImg} alt="계기판 미리보기" className="w-full h-full object-cover" />
              {odoOcrLoading && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center text-white p-2">
                  <Loader2 className="w-6 h-6 animate-spin text-emerald-400 mb-1" />
                  <span className="text-[11px] font-semibold">{odoOcrProgress}%</span>
                </div>
              )}
            </div>
          ) : (
            <div className="aspect-[4/3] rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 p-2 flex flex-col justify-center gap-2">
              <button
                type="button"
                onClick={() => odoCameraRef.current?.click()}
                disabled={odoOcrLoading}
                className="w-full py-2 px-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-transform border border-emerald-200 dark:border-emerald-800 shadow-xs"
              >
                <Camera className="w-4 h-4 text-emerald-600" />
                <span>카메라 촬영</span>
              </button>
              <button
                type="button"
                onClick={() => odoGalleryRef.current?.click()}
                disabled={odoOcrLoading}
                className="w-full py-2 px-2.5 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-transform border border-slate-200 dark:border-slate-700 shadow-xs"
              >
                <ImageIcon className="w-4 h-4 text-slate-500" />
                <span>앨범에서 선택</span>
              </button>
            </div>
          )}

          {/* Camera input (capture="environment") */}
          <input
            ref={odoCameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleOdometerImageUpload}
            className="hidden"
          />
          {/* Gallery input (without capture) */}
          <input
            ref={odoGalleryRef}
            type="file"
            accept="image/*"
            onChange={handleOdometerImageUpload}
            className="hidden"
          />

          {odoOcrNote && (
            <div className="mt-2 text-[10px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/80 p-1.5 rounded-lg">
              {odoOcrNote}
            </div>
          )}
        </div>

        {/* Receipt Photo Card */}
        <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
              <Fuel className="w-3.5 h-3.5 text-blue-600" />
              영수증 사진
            </span>
            {receiptImg && (
              <button
                type="button"
                onClick={() => {
                  setReceiptImg(null);
                  setReceiptOcrNote(null);
                }}
                className="text-[10px] text-rose-500 hover:underline"
              >
                삭제
              </button>
            )}
          </div>

          {receiptImg ? (
            <div className="relative rounded-xl overflow-hidden aspect-[4/3] bg-slate-950">
              <img src={receiptImg} alt="영수증 미리보기" className="w-full h-full object-cover" />
              {receiptOcrLoading && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center text-white p-2">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-400 mb-1" />
                  <span className="text-[11px] font-semibold">{receiptOcrProgress}%</span>
                </div>
              )}
            </div>
          ) : (
            <div className="aspect-[4/3] rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 p-2 flex flex-col justify-center gap-2">
              <button
                type="button"
                onClick={() => receiptCameraRef.current?.click()}
                disabled={receiptOcrLoading}
                className="w-full py-2 px-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-transform border border-blue-200 dark:border-blue-800 shadow-xs"
              >
                <Camera className="w-4 h-4 text-blue-600" />
                <span>카메라 촬영</span>
              </button>
              <button
                type="button"
                onClick={() => receiptGalleryRef.current?.click()}
                disabled={receiptOcrLoading}
                className="w-full py-2 px-2.5 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-transform border border-slate-200 dark:border-slate-700 shadow-xs"
              >
                <ImageIcon className="w-4 h-4 text-slate-500" />
                <span>앨범에서 선택</span>
              </button>
            </div>
          )}

          {/* Camera input (capture="environment") */}
          <input
            ref={receiptCameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleReceiptImageUpload}
            className="hidden"
          />
          {/* Gallery input (without capture) */}
          <input
            ref={receiptGalleryRef}
            type="file"
            accept="image/*"
            onChange={handleReceiptImageUpload}
            className="hidden"
          />

          {receiptOcrNote && (
            <div className="mt-2 text-[10px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/80 p-1.5 rounded-lg">
              {receiptOcrNote}
            </div>
          )}
        </div>
      </div>

      {/* 2. Fuel Efficiency Live Simulation Card */}
      {previewEfficiency !== null && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between text-emerald-900 dark:text-emerald-200 animate-fadeIn">
          <div>
            <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400 block">
              계산 예정 구간 연비
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-black">{previewEfficiency.toFixed(2)}</span>
              <span className="text-xs font-bold">km/L</span>
            </div>
          </div>
          <div className="text-right text-xs">
            <span className="text-slate-500 dark:text-slate-400 block text-[10px]">구간 주행거리</span>
            <span className="font-bold text-emerald-800 dark:text-emerald-300">+{previewTripKm} km</span>
          </div>
        </div>
      )}

      {/* 3. Form Inputs */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-3.5">
        {/* Cumulative Mileage (km) */}
        <div>
          <label className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            <span className="flex items-center gap-1">
              누적 주행거리 (km) <span className="text-rose-500">*</span>
            </span>
            {autoFilledFields.odometer && (
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-normal flex items-center gap-0.5">
                <Sparkles className="w-3 h-3" /> OCR 자동입력
              </span>
            )}
          </label>
          <div className="relative">
            <input
              type="number"
              inputMode="numeric"
              placeholder={lastRecord ? `직전: ${lastRecord.odometer.toLocaleString()} km` : '예: 45000'}
              value={odometer}
              onChange={(e) => {
                setOdometer(e.target.value);
                setAutoFilledFields((prev) => ({ ...prev, odometer: false }));
              }}
              required
              className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-semibold text-base focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
            <span className="absolute right-3.5 top-3 text-xs text-slate-400 font-medium pointer-events-none">
              km
            </span>
          </div>
          {lastRecord && (
            <p className="mt-1 text-[11px] text-slate-400">
              직전 기록 주행거리: {lastRecord.odometer.toLocaleString()} km
            </p>
          )}
        </div>

        {/* Liters & Cost Row */}
        <div className="grid grid-cols-2 gap-3">
          {/* Liters */}
          <div>
            <label className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              <span>주유량 (L) *</span>
              {autoFilledFields.liters && <Sparkles className="w-3 h-3 text-emerald-600" />}
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                inputMode="decimal"
                placeholder="예: 42.5"
                value={liters}
                onChange={(e) => {
                  setLiters(e.target.value);
                  setAutoFilledFields((prev) => ({ ...prev, liters: false }));
                }}
                required
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-semibold text-base focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <span className="absolute right-3.5 top-3 text-xs text-slate-400 font-medium pointer-events-none">
                L
              </span>
            </div>
          </div>

          {/* Total Cost */}
          <div>
            <label className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              <span>결제금액 (원) *</span>
              {autoFilledFields.totalCost && <Sparkles className="w-3 h-3 text-emerald-600" />}
            </label>
            <div className="relative">
              <input
                type="number"
                inputMode="numeric"
                placeholder="예: 70000"
                value={totalCost}
                onChange={(e) => {
                  setTotalCost(e.target.value);
                  setAutoFilledFields((prev) => ({ ...prev, totalCost: false }));
                }}
                required
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-semibold text-base focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <span className="absolute right-3.5 top-3 text-xs text-slate-400 font-medium pointer-events-none">
                원
              </span>
            </div>
          </div>
        </div>

        {/* Unit Price & Full Tank Toggle */}
        <div className="grid grid-cols-2 gap-3 items-center pt-1">
          {/* Unit Price Display */}
          <div>
            <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
              주유 단가 (자동 계산)
            </label>
            <div className="h-10 px-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span>{unitPrice ? `${parseInt(unitPrice, 10).toLocaleString()}원/L` : '-'}</span>
            </div>
          </div>

          {/* Full Tank Toggle */}
          <div>
            <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
              주유 상태
            </label>
            <button
              type="button"
              onClick={() => setIsFullTank(!isFullTank)}
              className={`w-full h-10 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                isFullTank
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-950/60 dark:border-emerald-800 dark:text-emerald-300'
                  : 'bg-slate-100 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
              }`}
            >
              <CheckCircle2 className={`w-3.5 h-3.5 ${isFullTank ? 'text-emerald-600' : 'text-slate-400'}`} />
              {isFullTank ? '가득 주유 (추천)' : '부분 주유'}
            </button>
          </div>
        </div>

        {/* Date & Time Picker */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            주유 일시
          </label>
          <input
            type="datetime-local"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        {/* Gas Station Name */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            주유소명
          </label>
          <input
            type="text"
            placeholder="예: GS칼텍스 대동주유소"
            value={gasStation}
            onChange={(e) => {
              setGasStation(e.target.value);
              setAutoFilledFields((prev) => ({ ...prev, gasStation: false }));
            }}
            className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        {/* Memo */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            메모 (선택)
          </label>
          <input
            type="text"
            placeholder="예: 출퇴근 운행, 요소수 보충"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={odoOcrLoading || receiptOcrLoading}
        className="w-full h-13 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-[0.98] text-white font-bold text-base shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2"
      >
        <CheckCircle2 className="w-5 h-5" />
        기록 저장 및 연비 계산
      </button>
    </form>
  );
};
