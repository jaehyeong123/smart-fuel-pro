import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import {
  TrendingUp,
  Fuel,
  Coins,
  Gauge,
  ChevronRight,
  PlusCircle,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
} from 'lucide-react';
import { FuelRecord, DashboardStats, VehicleProfile } from '../types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface DashboardViewProps {
  stats: DashboardStats;
  records: FuelRecord[];
  profile: VehicleProfile;
  onNavigateToInput: () => void;
  onNavigateToHistory: () => void;
  darkMode: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  records,
  profile: _profile,
  onNavigateToInput,
  onNavigateToHistory,
  darkMode,
}) => {
  // Extract records with valid calculated efficiency for chart
  const chartRecords = records
    .filter((r) => r.fuelEfficiency !== null)
    .slice(-8); // Show latest 8 entries for clean mobile view

  const chartLabels = chartRecords.map((r) => {
    const d = new Date(r.date);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  });

  const chartDataPoints = chartRecords.map((r) => r.fuelEfficiency);

  const chartData = {
    labels: chartLabels.length > 0 ? chartLabels : ['기록 없음'],
    datasets: [
      {
        label: '구간 연비 (km/L)',
        data: chartDataPoints.length > 0 ? chartDataPoints : [0],
        borderColor: '#10b981',
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 200);
          gradient.addColorStop(0, 'rgba(16, 185, 129, 0.3)');
          gradient.addColorStop(1, 'rgba(16, 185, 129, 0.0)');
          return gradient;
        },
        fill: true,
        tension: 0.35,
        pointBackgroundColor: '#10b981',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4.5,
        pointHoverRadius: 6,
      },
      ...(stats.averageEfficiency > 0
        ? [
            {
              label: '평균 연비',
              data: Array(chartLabels.length).fill(stats.averageEfficiency),
              borderColor: darkMode ? 'rgba(148, 163, 184, 0.5)' : 'rgba(100, 116, 139, 0.5)',
              borderDash: [5, 5],
              fill: false,
              pointRadius: 0,
            },
          ]
        : []),
    ],
  };

  const chartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: darkMode ? '#1e293b' : '#0f172a',
        titleColor: '#ffffff',
        bodyColor: '#34d399',
        padding: 10,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: (context: any) => `${context.parsed.y} km/L`,
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: darkMode ? '#94a3b8' : '#64748b',
          font: { size: 11 },
        },
      },
      y: {
        grid: {
          color: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
        },
        ticks: {
          color: darkMode ? '#94a3b8' : '#64748b',
          font: { size: 11 },
          callback: (val: any) => `${val}`,
        },
      },
    },
  };

  const recentRecords = [...records].reverse().slice(0, 3);

  return (
    <div className="space-y-4 pb-20">
      {/* Top Hero KPI: Average Fuel Efficiency */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white p-5 shadow-lg shadow-emerald-700/20">
        <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-100 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              내 차 종합 평균 연비
            </span>
            {stats.efficiencyChange !== null && (
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                  stats.efficiencyChange >= 0
                    ? 'bg-emerald-400/20 text-emerald-100 border border-emerald-300/30'
                    : 'bg-rose-400/20 text-rose-100 border border-rose-300/30'
                }`}
              >
                {stats.efficiencyChange >= 0 ? (
                  <ArrowUpRight className="w-3 h-3 mr-0.5" />
                ) : (
                  <ArrowDownRight className="w-3 h-3 mr-0.5" />
                )}
                {Math.abs(stats.efficiencyChange)} km/L
              </span>
            )}
          </div>

          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold tracking-tight">
              {stats.averageEfficiency > 0 ? stats.averageEfficiency.toFixed(2) : '--'}
            </span>
            <span className="text-lg font-medium text-emerald-100">km/L</span>
          </div>

          <div className="mt-4 pt-3 border-t border-white/15 grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-emerald-200 block text-[11px]">1km 주행 비용</span>
              <span className="font-bold text-white text-sm">
                {stats.averageCostPerKm > 0 ? `${stats.averageCostPerKm.toLocaleString()}원` : '-'}
              </span>
            </div>
            <div>
              <span className="text-emerald-200 block text-[11px]">누적 분석 거리</span>
              <span className="font-bold text-white text-sm">
                {stats.totalDistance > 0 ? `${stats.totalDistance.toLocaleString()} km` : '-'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Metrics Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Total Cost */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1.5">
            <span className="font-medium">누적 주유비 합계</span>
            <div className="w-6 h-6 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Coins className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg font-bold text-slate-900 dark:text-white">
            {stats.totalCost.toLocaleString()}
            <span className="text-xs font-normal text-slate-500 ml-1">원</span>
          </div>
        </div>

        {/* Total Liters */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1.5">
            <span className="font-medium">총 주유량</span>
            <div className="w-6 h-6 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Fuel className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-lg font-bold text-slate-900 dark:text-white">
            {stats.totalLiters.toFixed(1)}
            <span className="text-xs font-normal text-slate-500 ml-1">L</span>
          </div>
        </div>
      </div>

      {/* Fuel Efficiency Trend Chart */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">연비 변화 추이</h2>
          </div>
          <span className="text-[11px] text-slate-400">최근 {chartRecords.length}회 기록</span>
        </div>

        <div className="h-44 w-full">
          {chartRecords.length > 0 ? (
            <Line data={chartData} options={chartOptions} />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs gap-2">
              <Gauge className="w-8 h-8 text-slate-300 dark:text-slate-700" />
              <span>주유 기록을 2회 이상 등록하면 연비 그래프가 표시됩니다.</span>
            </div>
          )}
        </div>
      </div>

      {/* Recent Refueling Feed */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">최근 주유 내역</h2>
          <button
            onClick={onNavigateToHistory}
            className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5 font-medium"
          >
            전체보기 ({records.length})
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentRecords.length > 0 ? (
          <div className="space-y-2.5">
            {recentRecords.map((record) => (
              <div
                key={record.id}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                      {record.gasStation || '주유소'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(record.date).toLocaleDateString('ko-KR', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {record.odometer.toLocaleString()} km · {record.liters} L ·{' '}
                    {record.totalCost.toLocaleString()}원
                  </div>
                </div>

                <div className="text-right">
                  {record.fuelEfficiency !== null ? (
                    <div className="inline-flex flex-col items-end">
                      <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                        {record.fuelEfficiency.toFixed(2)} km/L
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5">
                        +{record.tripDistance} km 주행
                      </span>
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-400 font-medium px-2 py-0.5 bg-slate-200 dark:bg-slate-800 rounded">
                      기준 주유
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center text-slate-400 text-xs">
            아직 등록된 주유 기록이 없습니다.
          </div>
        )}

        {/* Quick Add Button */}
        <button
          onClick={onNavigateToInput}
          className="mt-3 w-full py-2.5 rounded-xl border-2 border-dashed border-emerald-500/40 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          신규 주유 기록 추가하기
        </button>
      </div>
    </div>
  );
};
