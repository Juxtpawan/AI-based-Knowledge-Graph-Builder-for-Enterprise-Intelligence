import React from 'react';

export default function TimeSlider({ timeRange, onChange }) {
  // Hardcoded timeframe for Enron data based on your cleaning logic
  const minYear = 1998;
  const maxYear = 2005;

  // Basic HTML range slider implementation. 
  // In a robust architecture you'd use a dual handle slider from MUI or Radix
  // Here we use a standard single range mapping to max boundary for the demo
  const handleMaxChange = (e) => {
    const val = parseInt(e.target.value, 10);
    onChange([timeRange[0], val]);
  };

  return (
    <div className="flex flex-col gap-2 w-full text-slate-200">
      <div className="flex flex-col mb-3">
        <div className="flex justify-between items-center mb-1">
           <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Temporal Filter</span>
           <div className="font-mono text-[10px] bg-slate-950 px-2 py-0.5 rounded border border-slate-800 tracking-wider font-bold text-slate-300">
              {timeRange[0]} — {timeRange[1]}
           </div>
        </div>
        <span className="text-[9px] text-slate-500 uppercase tracking-widest leading-tight">Drag to simulate chronological communication events</span>
      </div>
      
      <div className="relative pt-1">
        <input
          type="range"
          min={minYear}
          max={maxYear}
          step={1}
          value={timeRange[1]}
          onChange={handleMaxChange}
          className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-ew-resize accent-emerald-500"
        />
        <div className="flex justify-between text-[10px] text-slate-500 mt-2 font-mono">
           <span>{minYear}</span>
           <span>2000</span>
           <span>2002</span>
           <span>2004</span>
           <span>{maxYear}</span>
        </div>
      </div>
    </div>
  );
}
