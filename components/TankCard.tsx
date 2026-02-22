
import React from 'react';
import { TankData } from '../types';

interface TankCardProps {
  id: string;
  data: TankData;
}

const calculateVolumeAndPerc = (raw: number, config: any) => {
  if (!config?.isConfigured) return { vol: 0, perc: 0 };
  
  // Linear Regression (y = mx + c) using 3 calibration points
  const x = [config.p1_raw, config.p2_raw, config.p3_raw];
  const y = [config.p1_h, config.p2_h, config.p3_h];
  const n = 3;
  
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += x[i];
    sumY += y[i];
    sumXY += x[i] * y[i];
    sumX2 += x[i] * x[i];
  }
  
  const m = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX || 1);
  const c = (sumY - m * sumX) / n;
  
  let h = m * raw + c;
  h = Math.max(0, Math.min(h, config.max_height));
  
  const rawVol = (Math.PI * Math.pow(config.diameter / 2, 2) * h) / 1000000;
  const vol = rawVol < 5 ? 0 : Math.round(rawVol / 5) * 5;
  const perc = Math.min(100, (h / config.max_height) * 100);
  
  return { vol, perc };
};

const TankCard: React.FC<TankCardProps> = ({ id, data }) => {
  const { vol, perc } = calculateVolumeAndPerc(data.analog_raw, data.config);
  const isConfigured = !!data.config?.isConfigured;

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 transition-all hover:border-sky-500/50 group">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-gray-400 font-bold tracking-widest text-xs uppercase">
          {id.replace('Tank', 'Tank 0')}
        </h3>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-[10px] text-emerald-500 font-mono">SIGNAL: {data.analog_raw}</span>
        </div>
      </div>

      <div className="flex items-baseline gap-1 mb-2">
        <span className="text-4xl font-extrabold text-white">{vol}</span>
        <span className="text-gray-400 font-medium">L</span>
      </div>

      <div className="relative w-full h-3 bg-[#0d1117] rounded-full overflow-hidden mb-4">
        <div 
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-500 to-sky-500 transition-all duration-1000 ease-in-out"
          style={{ width: `${perc}%` }}
        />
      </div>

      <div className="flex justify-between items-center text-[11px]">
        <span className="text-gray-400 font-bold uppercase tracking-tighter">Level: {perc.toFixed(1)}%</span>
        {!isConfigured && (
          <span className="text-amber-500 font-bold italic">UNCONFIGURED</span>
        )}
      </div>
    </div>
  );
};

export default TankCard;
