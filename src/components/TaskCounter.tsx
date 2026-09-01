import React, { useState, useEffect } from 'react';
import { Plus, Minus } from 'lucide-react';
import { playPop, playTap } from '../utils/audio';

interface TaskCounterProps {
  label: string;
  target: number;
  value: number;
  onChange: (newVal: number) => void;
}

export const TaskCounter: React.FC<TaskCounterProps> = ({
  label,
  target,
  value,
  onChange,
}) => {
  const [localVal, setLocalVal] = useState<string>(value > 0 ? String(value) : '0');

  useEffect(() => {
    setLocalVal(value > 0 ? String(value) : '0');
  }, [value]);

  const isMet = target > 0 && value >= target;

  const handleStep = (delta: number) => {
    playPop();
    const current = parseInt(localVal, 10) || 0;
    const next = Math.max(0, current + delta);
    setLocalVal(String(next));
    onChange(next);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setLocalVal(text);
    if (text === '') {
      onChange(0);
    } else {
      const num = parseInt(text, 10);
      if (!isNaN(num)) {
        onChange(Math.max(0, num));
      }
    }
  };

  return (
    <div
      className={`p-3 rounded-2xl border flex flex-col justify-between transition-all backdrop-blur-md ${
        isMet
          ? 'bg-emerald-500/10 border-emerald-500/30 shadow-sm shadow-emerald-950/40'
          : 'bg-zinc-900/60 border-white/[0.06]'
      }`}
    >
      <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-2 font-medium">
        <span className="truncate">{label}</span>
        <span className="font-mono text-zinc-500 text-[10px]">
          Target: <strong className="text-zinc-200">{target}</strong>
        </span>
      </div>

      <div className="flex items-center justify-between gap-1.5">
        <button
          type="button"
          onClick={() => handleStep(-1)}
          className="w-8 h-8 flex items-center justify-center bg-zinc-800/80 hover:bg-zinc-700 active:scale-95 text-zinc-200 rounded-xl text-sm font-bold border border-white/[0.06] transition-all cursor-pointer select-none"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>

        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={localVal}
          onChange={handleInputChange}
          className={`w-14 text-center bg-zinc-950/80 border rounded-xl py-1.5 text-sm font-mono font-bold focus:outline-none transition-all ${
            isMet
              ? 'text-emerald-400 border-emerald-500/40 bg-emerald-950/20 shadow-[0_0_8px_rgba(52,211,153,0.2)]'
              : 'text-zinc-100 border-white/[0.08] focus:border-white/[0.2]'
          }`}
        />

        <button
          type="button"
          onClick={() => handleStep(1)}
          className="w-8 h-8 flex items-center justify-center bg-zinc-800/80 hover:bg-zinc-700 active:scale-95 text-zinc-200 rounded-xl text-sm font-bold border border-white/[0.06] transition-all cursor-pointer select-none"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
