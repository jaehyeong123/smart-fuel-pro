import React, { useState } from 'react';
import {
  Fuel,
  Trash2,
  FileDown,
  FileSpreadsheet,
  Upload,
  Image as ImageIcon,
  X,
  MapPin
} from 'lucide-react';
import { FuelRecord } from '../types';
import { exportRecordsAsCsv, exportRecordsAsJson } from '../utils/storage';

interface HistoryViewProps {
  records: FuelRecord[];
  onDeleteRecord: (id: string) => void;
  onRestoreSampleData: () => void;
  onImportJson: (records: FuelRecord[]) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  records,
  onDeleteRecord,
  onRestoreSampleData,
  onImportJson,
}) => {
  // Sort descending by date & odometer
  const sortedRecords = [...records].reverse();

  // Selected image modal
  const [selectedPhoto, setSelectedPhoto] = useState<{ url: string; title: string } | null>(null);

  // JSON File Import Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          onImportJson(parsed);
          alert(`성공적으로 ${parsed.length}개의 기록을 복원했습니다.`);
        } else {
          alert('올바른 백업 파일 형식이 아닙니다.');
        }
      } catch {
        alert('JSON 파싱에 실패했습니다. 파일을 확인해주세요.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Top Header & Export/Import Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">주유 기록 히스토리</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            총 {records.length}회의 기록이 보관되어 있습니다.
          </p>
        </div>

        {/* Data Tools Menu */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => exportRecordsAsCsv(records)}
            title="CSV 엑셀 다운로드"
            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-emerald-600 shadow-sm transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
          </button>
          <button
            onClick={() => exportRecordsAsJson(records)}
            title="JSON 백업 다운로드"
            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-blue-600 shadow-sm transition-colors"
          >
            <FileDown className="w-4 h-4" />
          </button>
          <label
            title="JSON 백업 불러오기"
            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-purple-600 shadow-sm transition-colors cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
      </div>

      {/* Record Cards List (Mobile Optimized) */}
      {sortedRecords.length > 0 ? (
        <div className="space-y-3">
          {sortedRecords.map((record) => {
            const dateObj = new Date(record.date);
            const dateFormatted = `${dateObj.getFullYear()}.${String(dateObj.getMonth() + 1).padStart(2, '0')}.${String(dateObj.getDate()).padStart(2, '0')}`;
            const timeFormatted = `${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')}`;

            return (
              <div
                key={record.id}
                className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-3"
              >
                {/* Card Header: Station, Date, Efficiency Badge */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 font-bold text-sm text-slate-900 dark:text-white">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>{record.gasStation || '주유소'}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <span>{dateFormatted} {timeFormatted}</span>
                      {record.memo && (
                        <>
                          <span>·</span>
                          <span className="truncate max-w-[130px]">{record.memo}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Fuel Efficiency Badge */}
                  <div>
                    {record.fuelEfficiency !== null ? (
                      <div className="text-right">
                        <span className="inline-block px-2.5 py-1 rounded-xl text-xs font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 shadow-xs">
                          {record.fuelEfficiency.toFixed(2)} km/L
                        </span>
                        <div className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">
                          +{record.tripDistance.toLocaleString()} km
                        </div>
                      </div>
                    ) : (
                      <span className="inline-block px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                        최초 기준 등록
                      </span>
                    )}
                  </div>
                </div>

                {/* Metrics Table Matrix */}
                <div className="grid grid-cols-3 gap-2 py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">누적 주행거리</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {record.odometer.toLocaleString()} km
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">주유량 (단가)</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {record.liters} L ({record.unitPrice ? `${record.unitPrice.toLocaleString()}원` : '-'})
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">결제금액</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {record.totalCost.toLocaleString()}원
                    </span>
                  </div>
                </div>

                {/* Footer Actions: Photos & Delete */}
                <div className="flex items-center justify-between pt-1 text-xs">
                  <div className="flex items-center gap-1.5">
                    {record.odometerImage && (
                      <button
                        onClick={() => setSelectedPhoto({ url: record.odometerImage!, title: '계기판 사진' })}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                      >
                        <ImageIcon className="w-3 h-3 text-emerald-500" />
                        계기판
                      </button>
                    )}
                    {record.receiptImage && (
                      <button
                        onClick={() => setSelectedPhoto({ url: record.receiptImage!, title: '영수증 사진' })}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                      >
                        <ImageIcon className="w-3 h-3 text-blue-500" />
                        영수증
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      if (confirm('이 주유 기록을 정말 삭제하시겠습니까?\n이후 기록의 구간 연비가 자동으로 다시 계산됩니다.')) {
                        onDeleteRecord(record.id);
                      }
                    }}
                    className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                    title="기록 삭제"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-16 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-6">
          <Fuel className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
          <p className="text-sm font-semibold">저장된 주유 기록이 없습니다.</p>
          <p className="text-xs text-slate-400 mt-1">
            하단 [+] 버튼을 눌러 첫 번째 주유를 기록해보세요.
          </p>
          <button
            onClick={onRestoreSampleData}
            className="mt-4 px-4 py-2 rounded-xl text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors"
          >
            체험용 샘플 데이터 불러오기
          </button>
        </div>
      )}

      {/* Photo Preview Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative max-w-sm w-full bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
            <div className="p-3 bg-slate-800/80 flex items-center justify-between text-white text-xs font-bold">
              <span>{selectedPhoto.title}</span>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="p-1 rounded-full hover:bg-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-2 flex items-center justify-center bg-black max-h-[70vh] overflow-auto">
              <img src={selectedPhoto.url} alt="원본 사진" className="max-w-full max-h-[65vh] object-contain rounded" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
