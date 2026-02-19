
import React from 'react';
import TankCard from './TankCard';
import { TankData } from '../types';

interface DashboardProps {
  tanks: Record<string, TankData>;
}

const Dashboard: React.FC<DashboardProps> = ({ tanks }) => {
  // Stats Calculation Logic
  const stats = React.useMemo(() => {
    let totalV = 0;
    let totalMaxV = 0;
    
    Object.values(tanks).forEach((t: TankData) => {
      if (t.config && t.config.isConfigured) {
        const raw = t.analog_raw;
        const config = t.config;
        let h;
        if (raw <= config.p2_raw) {
          h = config.p1_h + ((raw - config.p1_raw) * (config.p2_h - config.p1_h)) / (config.p2_raw - config.p1_raw || 1);
        } else {
          h = config.p2_h + ((raw - config.p2_raw) * (config.p3_h - config.p2_h)) / (config.p3_raw - config.p2_raw || 1);
        }
        h = Math.max(0, Math.min(h, config.max_height));
        const v = (Math.PI * Math.pow(config.diameter / 2, 2) * h) / 1000000;
        totalV += Math.max(0, v);
        totalMaxV += (Math.PI * Math.pow(config.diameter / 2, 2) * config.max_height) / 1000000;
      }
    });

    return {
      total: Math.round(totalV / 5) * 5,
      avg: totalMaxV > 0 ? (totalV / totalMaxV) * 100 : 0
    };
  }, [tanks]);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#161b22] p-6 rounded-2xl border border-[#30363d] relative overflow-hidden">
          <div className="absolute top-0 left-0 bottom-0 w-1 bg-emerald-500" />
          <h4 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Total System Volume</h4>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-white">{stats.total}</span>
            <span className="text-xl font-bold text-gray-500">L</span>
          </div>
        </div>
        <div className="bg-[#161b22] p-6 rounded-2xl border border-[#30363d] relative overflow-hidden">
          <div className="absolute top-0 left-0 bottom-0 w-1 bg-sky-500" />
          <h4 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">System Load Percentage</h4>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-white">{stats.avg.toFixed(1)}</span>
            <span className="text-xl font-bold text-gray-500">%</span>
          </div>
        </div>
      </div>

      {/* Tanks Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {Object.entries(tanks).map(([id, data]) => (
          <TankCard key={id} id={id} data={data} />
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
