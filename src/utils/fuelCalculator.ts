import { FuelRecord, DashboardStats } from '../types';

/**
 * Recomputes the entire chain of fuel records.
 * Ensures that if a user retroactively adds, edits, or deletes a past record,
 * all subsequent trip distances, fuel efficiencies, and costs per km are automatically recalculated accurately.
 */
export function recalculateRecordsChain(records: FuelRecord[]): FuelRecord[] {
  if (!records || records.length === 0) return [];

  // Sort chronologically primarily by date, and secondarily by odometer reading
  const sorted = [...records].sort((a, b) => {
    const timeA = new Date(a.date).getTime();
    const timeB = new Date(b.date).getTime();
    if (timeA !== timeB) return timeA - timeB;
    return a.odometer - b.odometer;
  });

  return sorted.map((record, index) => {
    if (index === 0) {
      // First baseline entry
      return {
        ...record,
        tripDistance: 0,
        fuelEfficiency: null,
        costPerKm: null,
      };
    }

    const prev = sorted[index - 1];
    const tripDistance = Math.max(0, record.odometer - prev.odometer);

    let fuelEfficiency: number | null = null;
    let costPerKm: number | null = null;

    if (tripDistance > 0 && record.liters > 0) {
      fuelEfficiency = Number((tripDistance / record.liters).toFixed(2));
      costPerKm = Number((record.totalCost / tripDistance).toFixed(1));
    }

    return {
      ...record,
      tripDistance,
      fuelEfficiency,
      costPerKm,
    };
  });
}

/**
 * Computes aggregate summary KPIs for the dashboard
 */
export function computeDashboardStats(records: FuelRecord[]): DashboardStats {
  if (!records || records.length === 0) {
    return {
      averageEfficiency: 0,
      totalCost: 0,
      totalLiters: 0,
      totalDistance: 0,
      averageCostPerKm: 0,
      latestEfficiency: null,
      efficiencyChange: null,
    };
  }

  const totalCost = records.reduce((sum, r) => sum + (r.totalCost || 0), 0);
  const totalLiters = Number(records.reduce((sum, r) => sum + (r.liters || 0), 0).toFixed(1));

  // Valid calculated trips (exclude the first baseline entry)
  const validTrips = records.filter(r => r.fuelEfficiency !== null && r.tripDistance > 0);

  const totalTripDistance = validTrips.reduce((sum, r) => sum + r.tripDistance, 0);
  const totalTripLiters = validTrips.reduce((sum, r) => sum + r.liters, 0);

  let averageEfficiency = 0;
  if (totalTripDistance > 0 && totalTripLiters > 0) {
    averageEfficiency = Number((totalTripDistance / totalTripLiters).toFixed(2));
  }

  let averageCostPerKm = 0;
  if (totalTripDistance > 0 && totalCost > 0) {
    const validTripCosts = validTrips.reduce((sum, r) => sum + r.totalCost, 0);
    averageCostPerKm = Math.round(validTripCosts / totalTripDistance);
  }

  // Latest efficiency
  let latestEfficiency: number | null = null;
  let efficiencyChange: number | null = null;

  if (validTrips.length > 0) {
    const latest = validTrips[validTrips.length - 1];
    latestEfficiency = latest.fuelEfficiency;

    if (validTrips.length >= 2) {
      const prior = validTrips[validTrips.length - 2];
      if (latestEfficiency !== null && prior.fuelEfficiency !== null) {
        efficiencyChange = Number((latestEfficiency - prior.fuelEfficiency).toFixed(2));
      }
    }
  }

  return {
    averageEfficiency,
    totalCost,
    totalLiters,
    totalDistance: totalTripDistance,
    averageCostPerKm,
    latestEfficiency,
    efficiencyChange,
  };
}
