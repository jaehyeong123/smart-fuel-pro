export interface FuelRecord {
  id: string;
  date: string;              // ISO string or YYYY-MM-DDTHH:mm
  odometer: number;          // Cumulative mileage (km)
  liters: number;            // Fuel volume (L)
  totalCost: number;         // Total payment amount (KRW)
  unitPrice: number;         // KRW / L
  isFullTank: boolean;       // Full tank (가득) or partial
  gasStation: string;        // Station name (e.g. GS칼텍스 대동주유소)
  memo: string;              // Custom memo
  receiptImage?: string;     // Base64 thumbnail or URI
  odometerImage?: string;    // Base64 thumbnail or URI
  
  // Calculated fields (updated dynamically across chain)
  tripDistance: number;      // km driven since previous full or refuel
  fuelEfficiency: number | null; // km / L (null if initial or cannot calculate)
  costPerKm: number | null;  // KRW / km
}

export interface VehicleProfile {
  carName: string;           // e.g. "아반떼 CN7"
  plateNumber: string;       // e.g. "12가 3456"
  fuelType: 'gasoline' | 'diesel' | 'hybrid' | 'lpg' | 'ev';
  officialEfficiency?: number; // Manufacturer certified fuel economy (km/L)
  tankCapacity?: number;     // Fuel tank capacity (L)
}

export interface DashboardStats {
  averageEfficiency: number; // km/L
  totalCost: number;         // KRW
  totalLiters: number;       // L
  totalDistance: number;     // km
  averageCostPerKm: number;  // KRW / km
  latestEfficiency: number | null;
  efficiencyChange: number | null; // compared to previous
}

export type MaintenanceCategory =
  | 'engine_oil'      // 엔진오일 및 필터
  | 'mission_oil'     // 미션오일
  | 'brake'           // 브레이크 패드 / 오일
  | 'tire'            // 타이어 교체 / 위치교환
  | 'filter'          // 에어컨 / 캐빈 필터
  | 'battery'         // 배터리
  | 'wiper'           // 와이퍼
  | 'spark_plug'      // 점화플러그
  | 'inspection'      // 정기 종합검사
  | 'repair'          // 일반 정비 / 부품 수리
  | 'other';          // 기타 정비

export interface MaintenanceRecord {
  id: string;
  date: string;               // YYYY-MM-DDTHH:mm or YYYY-MM-DD
  odometer: number;           // Mileage at maintenance (km)
  category: MaintenanceCategory;
  title: string;              // e.g. "엔진오일 및 오일필터 교체"
  cost: number;               // Cost in KRW
  shopName: string;           // Service center e.g. "블루핸즈 역삼점", "공임나라"
  memo: string;               // Notes
  receiptImage?: string;      // Receipt / Invoice photo thumbnail
  nextDueOdometer?: number;   // Recommended next change km (e.g. +10,000km)
  nextDueDate?: string;       // Recommended next change date
}

export type ActiveTab = 'dashboard' | 'input' | 'maintenance' | 'history';
