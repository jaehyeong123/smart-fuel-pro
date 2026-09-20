import { FuelRecord, VehicleProfile } from '../types';
import { recalculateRecordsChain } from './fuelCalculator';

const STORAGE_KEYS = {
  RECORDS: 'smart_fuel_pro_records_v1',
  PROFILE: 'smart_fuel_pro_profile_v1',
  DARK_MODE: 'smart_fuel_pro_theme_v1'
};

const DEFAULT_PROFILE: VehicleProfile = {
  carName: '내 차 (아반떼)',
  plateNumber: '12가 3456',
  fuelType: 'gasoline',
  officialEfficiency: 14.5,
  tankCapacity: 47
};

export const sampleInitialRecords: FuelRecord[] = [
  {
    id: 'rec-1',
    date: '2025-01-05T09:30',
    odometer: 45200,
    liters: 42.5,
    totalCost: 70125,
    unitPrice: 1650,
    isFullTank: true,
    gasStation: 'GS칼텍스 대동주유소',
    memo: '새해 첫 가득 주유 (기준점)',
    tripDistance: 0,
    fuelEfficiency: null,
    costPerKm: null
  },
  {
    id: 'rec-2',
    date: '2025-01-18T18:40',
    odometer: 45830,
    liters: 44.0,
    totalCost: 72600,
    unitPrice: 1650,
    isFullTank: true,
    gasStation: 'SK에너지 서초셀프',
    memo: '출퇴근 및 주말 서울 근교 주행',
    tripDistance: 630,
    fuelEfficiency: 14.32,
    costPerKm: 115.2
  },
  {
    id: 'rec-3',
    date: '2025-02-02T14:15',
    odometer: 46490,
    liters: 43.2,
    totalCost: 72144,
    unitPrice: 1670,
    isFullTank: true,
    gasStation: 'S-OIL 강남충전주유소',
    memo: '설 명절 고속도로 주행 포함',
    tripDistance: 660,
    fuelEfficiency: 15.28,
    costPerKm: 109.3
  },
  {
    id: 'rec-4',
    date: '2025-02-19T20:10',
    odometer: 47110,
    liters: 45.0,
    totalCost: 76050,
    unitPrice: 1690,
    isFullTank: true,
    gasStation: 'HD현대 판교주유소',
    memo: '도심 정체 구간 다수 운행',
    tripDistance: 620,
    fuelEfficiency: 13.78,
    costPerKm: 122.7
  },
  {
    id: 'rec-5',
    date: '2025-03-08T11:20',
    odometer: 47790,
    liters: 44.5,
    totalCost: 75205,
    unitPrice: 1690,
    isFullTank: true,
    gasStation: '알뜰 분당행복주유소',
    memo: '봄맞이 드라이브 후 주유',
    tripDistance: 680,
    fuelEfficiency: 15.28,
    costPerKm: 110.6
  }
];

export function loadRecordsFromStorage(): FuelRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RECORDS);
    if (!raw) {
      // First time launch: initialize with sample records so user immediately sees rich UI
      saveRecordsToStorage(sampleInitialRecords);
      return sampleInitialRecords;
    }
    const parsed = JSON.parse(raw) as FuelRecord[];
    return recalculateRecordsChain(parsed);
  } catch (e) {
    console.error('Failed to load records from storage', e);
    return [];
  }
}

export function saveRecordsToStorage(records: FuelRecord[]): void {
  try {
    const normalized = recalculateRecordsChain(records);
    localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(normalized));
  } catch (e) {
    console.error('Failed to save records to storage', e);
  }
}

export function loadProfileFromStorage(): VehicleProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (!raw) return DEFAULT_PROFILE;
    return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PROFILE;
  }
}

export function saveProfileToStorage(profile: VehicleProfile): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  } catch (e) {
    console.error('Failed to save profile', e);
  }
}

export function exportRecordsAsJson(records: FuelRecord[]): void {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(records, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `smart_fuel_pro_backup_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function exportRecordsAsCsv(records: FuelRecord[]): void {
  const headers = ['일자', '누적주행거리(km)', '구간거리(km)', '주유량(L)', '결제금액(원)', '단가(원/L)', '연비(km/L)', '주유소', '메모'];
  const rows = records.map(r => [
    r.date.replace('T', ' '),
    r.odometer,
    r.tripDistance,
    r.liters,
    r.totalCost,
    r.unitPrice,
    r.fuelEfficiency ?? '-',
    `"${r.gasStation.replace(/"/g, '""')}"`,
    `"${(r.memo || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `smart_fuel_records_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
}
