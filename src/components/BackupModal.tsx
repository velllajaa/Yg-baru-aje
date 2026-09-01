import React, { useRef, useState } from 'react';
import { 
  X, 
  Download, 
  Upload, 
  Trash2, 
  Sparkles, 
  Database, 
  AlertTriangle, 
  Check, 
  RefreshCw,
  RotateCcw
} from 'lucide-react';
import { AppState } from '../types';
import { exportStateToJson, importStateFromJson, generateSampleData, INITIAL_STATE, clearAllLogsPreserveRoster } from '../utils/storage';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  appState: AppState;
  onRestoreState: (state: AppState) => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  onClose,
  appState,
  onRestoreState,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  if (!isOpen) return null;

  const handleExport = () => {
    exportStateToJson(appState);
    setFeedback({ type: 'success', message: 'Data backup exported successfully as JSON file.' });
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const imported = importStateFromJson(content);
        onRestoreState(imported);
        setFeedback({ type: 'success', message: 'Backup file imported and restored successfully!' });
        setTimeout(() => {
          setFeedback(null);
          onClose();
        }, 1500);
      } catch (err) {
        setFeedback({ type: 'error', message: 'Failed to parse JSON file. Please check file format.' });
      }
    };
    reader.readAsText(file);
  };

  const handleLoadDemo = () => {
    if (confirm('Load sample brigade data? This will populate sample members and 7 days of battalion activity logs to preview charts.')) {
      const demo = generateSampleData();
      onRestoreState(demo);
      setFeedback({ type: 'success', message: 'Sample demo data loaded!' });
      setTimeout(() => {
        setFeedback(null);
        onClose();
      }, 1200);
    }
  };

  const handleClearLogsPreserveRoster = () => {
    if (confirm('Kosongkan semua log kuota, jam aktivitas, dan laporan shift? Data personil (Nama, Posisi, Batalyon) TETAP TERSIMPAN.')) {
      const updated = clearAllLogsPreserveRoster(appState);
      onRestoreState(updated);
      setFeedback({ type: 'success', message: 'Semua log harian dibersihkan. Roster nama personil tetap tersimpan!' });
      setTimeout(() => {
        setFeedback(null);
        onClose();
      }, 1400);
    }
  };

  const handleResetAll = () => {
    if (confirm('Are you sure you want to reset all data? This will clear all members, reports, and quota logs.')) {
      onRestoreState(INITIAL_STATE);
      setFeedback({ type: 'success', message: 'All data cleared. Roster is now empty.' });
      setTimeout(() => {
        setFeedback(null);
        onClose();
      }, 1200);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-5 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Database & Backup Manager</h3>
              <p className="text-[11px] text-zinc-400">Save, export, restore, or reset local tracker data</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-3 text-xs font-semibold flex items-center gap-2 ${
              feedback.type === 'success'
                ? 'bg-emerald-500/20 text-emerald-300 border-b border-emerald-500/30'
                : 'bg-rose-500/20 text-rose-300 border-b border-rose-500/30'
            }`}
          >
            {feedback.type === 'success' ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Actions List */}
        <div className="p-6 space-y-4">
          
          {/* Export */}
          <div className="flex items-center justify-between p-4 bg-zinc-950/60 rounded-2xl border border-zinc-800/80">
            <div>
              <h4 className="font-semibold text-xs text-white">Export Data (JSON)</h4>
              <p className="text-[11px] text-zinc-400">Download complete roster, logs, and battalion reports.</p>
            </div>
            <button
              id="export-backup-btn"
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-semibold transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
          </div>

          {/* Import */}
          <div className="flex items-center justify-between p-4 bg-zinc-950/60 rounded-2xl border border-zinc-800/80">
            <div>
              <h4 className="font-semibold text-xs text-white">Import / Restore Backup</h4>
              <p className="text-[11px] text-zinc-400">Upload previous JSON backup file.</p>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              id="import-backup-btn"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import</span>
            </button>
          </div>

          {/* Demo Data Seeder */}
          <div className="flex items-center justify-between p-4 bg-zinc-950/60 rounded-2xl border border-zinc-800/80">
            <div>
              <h4 className="font-semibold text-xs text-white flex items-center gap-1.5">
                <span>Load Sample Testing Data</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-mono">Demo</span>
              </h4>
              <p className="text-[11px] text-zinc-400">Populate sample members and charts to see graphs in action.</p>
            </div>
            <button
              id="load-sample-data-btn"
              onClick={handleLoadDemo}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 rounded-xl text-xs font-semibold transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Load Demo</span>
            </button>
          </div>

          {/* Clear Logs Only (Keep Roster) */}
          <div className="flex items-center justify-between p-4 bg-amber-950/20 rounded-2xl border border-amber-900/30">
            <div>
              <h4 className="font-semibold text-xs text-amber-300 flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                <span>Kosongkan Log & Kuota Saja</span>
              </h4>
              <p className="text-[11px] text-amber-400/70">Hapus jam dinas, task progress, dan catatan. Nama & posisi personil tetap aman.</p>
            </div>
            <button
              id="reset-logs-only-backup-btn"
              onClick={handleClearLogsPreserveRoster}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Log</span>
            </button>
          </div>

          {/* Clear / Reset All */}
          <div className="flex items-center justify-between p-4 bg-rose-950/20 rounded-2xl border border-rose-900/30">
            <div>
              <h4 className="font-semibold text-xs text-rose-300">Clear All Roster & Records</h4>
              <p className="text-[11px] text-rose-400/70">Wipe all local records and all roster members back to empty.</p>
            </div>
            <button
              id="reset-all-data-btn"
              onClick={handleResetAll}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 border border-rose-500/40 rounded-xl text-xs font-semibold transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Reset All</span>
            </button>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-zinc-950 border-t border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
