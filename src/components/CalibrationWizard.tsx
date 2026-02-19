
import React, { useState, useEffect } from 'react';
import { TankConfig } from '../../types';

interface CalibrationWizardProps {
  tankId: number;
  onCancel: () => void;
  onSave: (config: TankConfig) => void;
  liveRaw: number;
}

const CalibrationWizard: React.FC<CalibrationWizardProps> = ({ tankId, onCancel, onSave, liveRaw }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    dia: '',
    maxH: '',
    p1Raw: 0, p1H: '',
    p2Raw: 0, p2H: '',
    p3Raw: 0, p3H: '',
  });

  const nextStep = () => {
    if (step === 1) {
      if (!formData.dia || !formData.maxH) return alert("Fill all physical parameters");
      setStep(2);
    } else if (step < 4) {
      const currentHKey = `p${step-1}H` as keyof typeof formData;
      if (formData[currentHKey] === '') return alert("Enter current height");
      setStep(step + 1);
    } else {
      // Finalize
      if (formData.p3H === '') return alert("Enter final height");
      const config: TankConfig = {
        diameter: parseFloat(formData.dia),
        max_height: parseFloat(formData.maxH),
        p1_raw: formData.p1Raw, p1_h: parseFloat(formData.p1H),
        p2_raw: formData.p2Raw, p2_h: parseFloat(formData.p2H),
        p3_raw: formData.p3Raw, p3_h: parseFloat(formData.p3H),
        isConfigured: true
      };
      onSave(config);
    }
  };

  useEffect(() => {
    if (step > 1) {
      const rawKey = `p${step-1}Raw` as keyof typeof formData;
      setFormData(prev => ({ ...prev, [rawKey]: liveRaw }));
    }
  }, [step, liveRaw]);

  return (
    <div className="max-w-md mx-auto bg-[#161b22] border border-[#30363d] rounded-2xl p-8 shadow-2xl">
      <div className="mb-8">
        <h2 className="text-xl font-bold text-sky-500 mb-1">TANK 0{tankId} SETUP</h2>
        <p className="text-gray-500 text-xs uppercase tracking-widest">
          {step === 1 ? 'PHYSICAL SPECIFICATIONS' : `CALIBRATION POINT ${step - 1}`}
        </p>
      </div>

      <div className="space-y-6">
        {step === 1 ? (
          <>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Tank Diameter (mm)</label>
              <input 
                type="number"
                value={formData.dia}
                onChange={e => setFormData({ ...formData, dia: e.target.value })}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-sky-500 transition-colors"
                placeholder="e.g. 1200"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Maximum Height (mm)</label>
              <input 
                type="number"
                value={formData.maxH}
                onChange={e => setFormData({ ...formData, maxH: e.target.value })}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-sky-500 transition-colors"
                placeholder="e.g. 2000"
              />
            </div>
          </>
        ) : (
          <>
            <div className="text-center py-6 bg-[#0d1117] rounded-2xl border border-[#30363d] mb-6">
              <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-2">Live Signal Reading</div>
              <div className="text-5xl font-black text-white font-mono">{liveRaw}</div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Actual Fluid Height (mm)</label>
              <input 
                type="number"
                value={step === 2 ? formData.p1H : step === 3 ? formData.p2H : formData.p3H}
                onChange={e => {
                  const key = `p${step-1}H` as keyof typeof formData;
                  setFormData({ ...formData, [key]: e.target.value });
                }}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-sky-500 transition-colors"
                placeholder="Enter current measured depth"
              />
            </div>
          </>
        )}
      </div>

      <div className="flex gap-3 mt-10">
        <button 
          onClick={onCancel}
          className="flex-1 py-3 px-4 rounded-xl font-bold text-gray-500 hover:text-white transition-colors uppercase text-xs"
        >
          Cancel
        </button>
        <button 
          onClick={nextStep}
          className="flex-1 py-3 px-4 rounded-xl font-bold bg-sky-500 text-white hover:bg-sky-400 transition-colors uppercase text-xs tracking-widest shadow-lg shadow-sky-500/20"
        >
          {step === 4 ? 'Complete' : 'Next Step'}
        </button>
      </div>
    </div>
  );
};

export default CalibrationWizard;
