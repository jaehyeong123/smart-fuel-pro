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

export type ActiveTab = 'dashboard' | 'input' | 'history' | 'stats';
