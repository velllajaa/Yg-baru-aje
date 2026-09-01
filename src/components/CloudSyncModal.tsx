import React, { useState, useEffect } from 'react';
import { 
  Cloud, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Copy, 
  ExternalLink, 
  X, 
  Database, 
  ShieldCheck, 
  Lock, 
  Zap,
  Trash2,
  DownloadCloud,
  UploadCloud,
  Layers,
  RotateCcw
} from 'lucide-react';
import { 
  getStoredCustomFirebase, 
  saveCustomFirebase, 
  testFirebaseConnection, 
  isFirebaseConfigured,
  FirebaseConfigOptions,
  PROVISIONED_FIREBASE_CONFIG,
} from '../utils/firebase';
import { playTap, playSuccess, playAlert } from '../utils/audio';
import { AppState } from '../types';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  appState: AppState;
  onClearAllPersonnel: () => void;
  onClearLogsPreserveRoster?: () => void;
  onManualSync: () => void;
  onPullFromCloud?: () => Promise<boolean>;
  onPushToCloud?: () => Promise<boolean>;
  syncStatus?: 'idle' | 'syncing' | 'synced' | 'error';
  lastSyncAt?: string | null;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({
  isOpen,
  onClose,
  appState,
  onClearAllPersonnel,
  onClearLogsPreserveRoster,
  onManualSync,
  onPullFromCloud,
  onPushToCloud,
  syncStatus,
  lastSyncAt,
}) => {
  const [apiKey, setApiKey] = useState('');
  const [projectId, setProjectId] = useState('');
  const [authDomain, setAuthDomain] = useState('');
  const [appId, setAppId] = useState('');
  const [testStatus, setTestStatus] = useState<{ loading: boolean; success?: boolean; message?: string }>({
    loading: false,
  });
  const [isPulling, setIsPulling] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [copiedRules, setCopiedRules] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const custom = getStoredCustomFirebase();
      if (custom) {
        setApiKey(custom.apiKey || '');
        setProjectId(custom.projectId || '');
        setAuthDomain(custom.authDomain || '');
        setAppId(custom.appId || '');
      } else {
        setApiKey(import.meta.env.VITE_FIREBASE_API_KEY || PROVISIONED_FIREBASE_CONFIG.apiKey || '');
        setProjectId(import.meta.env.VITE_FIREBASE_PROJECT_ID || PROVISIONED_FIREBASE_CONFIG.projectId || '');
        setAuthDomain(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || PROVISIONED_FIREBASE_CONFIG.authDomain || '');
        setAppId(import.meta.env.VITE_FIREBASE_APP_ID || PROVISIONED_FIREBASE_CONFIG.appId || '');
      }
      setTestStatus({ loading: false });
      setShowDeleteConfirm(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestAndSave = async () => {
    playTap();
    setTestStatus({ loading: true, message: 'Menguji koneksi ke Firestore...' });

    const newConfig: FirebaseConfigOptions = {
      apiKey: apiKey.trim(),
      projectId: projectId.trim(),
      authDomain: authDomain.trim() || (projectId.trim() ? `${projectId.trim()}.firebaseapp.com` : ''),
      appId: appId.trim(),
    };

    saveCustomFirebase(newConfig.apiKey && newConfig.projectId ? newConfig : null);

    const result = await testFirebaseConnection();
    setTestStatus({
      loading: false,
      success: result.success,
      message: result.message,
    });

    if (result.success) {
      playSuccess();
      onManualSync();
    } else {
      playAlert();
    }
  };

  const handleManualPull = async () => {
    if (!onPullFromCloud) return;
    playTap();
    setIsPulling(true);
    const ok = await onPullFromCloud();
    setIsPulling(false);
    if (ok) {
      playSuccess();
      setTestStatus({
        loading: false,
        success: true,
        message: 'Berhasil menarik data terbaru dari Firebase Firestore!',
      });
    } else {
      playAlert();
      setTestStatus({
        loading: false,
        success: false,
        message: 'Gagal menarik data dari Firestore atau dokumen belum ada.',
      });
    }
  };

  const handleManualPush = async () => {
    if (!onPushToCloud) return;
    playTap();
    setIsPushing(true);
    const ok = await onPushToCloud();
    setIsPushing(false);
    if (ok) {
      playSuccess();
      setTestStatus({
        loading: false,
        success: true,
        message: 'Semua data lokal berhasil disimpan permanen ke Firebase Firestore!',
      });
    } else {
      playAlert();
      setTestStatus({
        loading: false,
        success: false,
        message: 'Gagal mengirim data ke Firestore. Periksa koneksi internet.',
      });
    }
  };

  const sampleRules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}`;

  const copyRules = () => {
    playTap();
    navigator.clipboard.writeText(sampleRules);
    setCopiedRules(true);
    playSuccess();
    setTimeout(() => setCopiedRules(false), 2000);
  };

  const memberCount = appState.members.length;
  const logCount = Object.keys(appState.memberLogs).length;

  return (
    <div 
      id="cloud-sync-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-zinc-900/95 border border-white/[0.08] rounded-3xl max-w-xl w-full p-6 shadow-[0_24px_64px_rgba(0,0,0,0.8)] max-h-[90vh] overflow-y-auto backdrop-blur-2xl text-zinc-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500/20 to-blue-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold tracking-tight text-white flex items-center gap-2">
                Penyimpanan Database Firebase Firestore
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                  isFirebaseConfigured() 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                    : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isFirebaseConfigured() ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-400'}`} />
                  {isFirebaseConfigured() ? 'Firebase Aktif' : 'Penyimpanan Lokal'}
                </span>
              </h3>
              <p className="text-xs text-zinc-400">
                Data tersimpan aman di cloud Firebase & disinkronkan secara instan di setiap sesi.
              </p>
            </div>
          </div>
          <button
            id="cloud-sync-close-btn"
            onClick={() => { playTap(); onClose(); }}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.05] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-5 pt-5">
          {/* Real-time Status Card */}
          <div className="p-4 rounded-2xl bg-sky-500/[0.06] border border-sky-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-white">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Status Penyimpanan Cloud & Data Lokal</span>
              </div>
              {lastSyncAt && (
                <span className="text-[10px] font-mono text-zinc-400">
                  Sinkron: {lastSyncAt}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-zinc-950/60 p-2.5 rounded-xl border border-white/[0.05]">
                <span className="text-[10px] text-zinc-500 block uppercase font-mono">Personel Terdaftar</span>
                <span className="text-sm font-bold text-white">{memberCount} Anggota</span>
              </div>
              <div className="bg-zinc-950/60 p-2.5 rounded-xl border border-white/[0.05]">
                <span className="text-[10px] text-zinc-500 block uppercase font-mono">Total Catatan Harian</span>
                <span className="text-sm font-bold text-emerald-400">{logCount} Log Disimpan</span>
              </div>
            </div>

            {/* Quick Action Cloud Buttons */}
            <div className="flex items-center gap-2 pt-1">
              <button
                id="pull-from-cloud-btn"
                onClick={handleManualPull}
                disabled={isPulling}
                className="flex-1 py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-medium border border-white/[0.08] flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] disabled:opacity-50"
                title="Unduh dan sinkronkan data dari Firebase Firestore"
              >
                {isPulling ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <DownloadCloud className="w-3.5 h-3.5 text-sky-400" />
                )}
                <span>Tarik Data Cloud</span>
              </button>

              <button
                id="push-to-cloud-btn"
                onClick={handleManualPush}
                disabled={isPushing}
                className="flex-1 py-2 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-md shadow-sky-600/20 flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] disabled:opacity-50"
                title="Kirim dan simpan data lokal ke Firebase sekarang"
              >
                {isPushing ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <UploadCloud className="w-3.5 h-3.5" />
                )}
                <span>Simpan ke Cloud</span>
              </button>
            </div>
          </div>

          {/* Config Fields */}
          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Firebase Project ID
              </label>
              <input
                id="fb-project-id-input"
                type="text"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                placeholder="e.g. eloquent-mission-v07pf"
                className="w-full bg-zinc-950/70 border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/20 transition-all font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Firebase Web API Key
              </label>
              <input
                id="fb-api-key-input"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full bg-zinc-950/70 border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/20 transition-all font-mono"
              />
            </div>
          </div>

          {/* Test Status Banner */}
          {testStatus.message && (
            <div className={`p-3.5 rounded-2xl border text-xs flex items-start gap-2.5 ${
              testStatus.loading
                ? 'bg-sky-500/10 text-sky-300 border-sky-500/30'
                : testStatus.success
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
            }`}>
              {testStatus.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <span className="font-semibold">{testStatus.success ? 'Koneksi Sukses' : 'Info Koneksi'}:</span>
                <p className="leading-relaxed">{testStatus.message}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-1">
            <button
              id="fb-save-and-test-btn"
              onClick={handleTestAndSave}
              disabled={testStatus.loading}
              className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white text-xs font-semibold shadow-lg shadow-sky-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {testStatus.loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Menguji Koneksi Firestore...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>Uji & Verifikasi Koneksi Database</span>
                </>
              )}
            </button>
          </div>

          {/* Firestore Security Rules Helper */}
          <div className="p-4 rounded-2xl bg-zinc-950/60 border border-white/[0.06] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                Firestore Security Rules (Dideploy Otomatis)
              </span>
              <button
                id="copy-firestore-rules-btn"
                onClick={copyRules}
                className="text-[11px] font-medium text-sky-400 hover:text-sky-300 flex items-center gap-1 px-2 py-1 rounded-lg bg-sky-500/10 border border-sky-500/20 transition-colors"
              >
                <Copy className="w-3 h-3" />
                <span>{copiedRules ? 'Disalin!' : 'Salin Rules'}</span>
              </button>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Aturan keamanan telah aktif di Firestore database untuk mengizinkan sinkronisasi data roster & log.
            </p>
            <pre className="p-2.5 rounded-xl bg-black/80 text-[10px] text-zinc-300 font-mono overflow-x-auto border border-zinc-800">
              {sampleRules}
            </pre>
          </div>

          {/* Reset Logs Only (Keep Members) */}
          <div className="p-4 rounded-2xl bg-amber-500/[0.04] border border-amber-500/20 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                  <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                  Kosongkan Data Log & Kuota (Simpan Nama & Batalyon)
                </span>
                <p className="text-[11px] text-zinc-400">
                  Menghapus semua jam aktivitas, task kuota, catatan dinas, dan laporan batalyon tetapi TETAP MENYIMPAN seluruh nama personil, jabatan, dan batalyon.
                </p>
              </div>
              <button
                id="reset-logs-keep-roster-btn"
                onClick={() => {
                  if (confirm('Kosongkan semua log kuota dan laporan shift? Data nama personil, posisi, dan batalyon TIDAK AKAN DIHAPUS.')) {
                    playAlert();
                    if (onClearLogsPreserveRoster) {
                      onClearLogsPreserveRoster();
                    }
                    playSuccess();
                    setTestStatus({
                      loading: false,
                      success: true,
                      message: 'Semua log kuota & laporan telah dibersihkan. Data nama personil tetap tersimpan rapi!',
                    });
                  }
                }}
                className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-medium transition-colors whitespace-nowrap"
              >
                Reset Log Saja
              </button>
            </div>
          </div>

          {/* Reset All Personnel Data (Full Wipe) */}
          <div className="p-4 rounded-2xl bg-rose-500/[0.04] border border-rose-500/20 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-rose-300 flex items-center gap-1.5">
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  Hapus Total Semua Data (Roster + Log)
                </span>
                <p className="text-[11px] text-zinc-400">
                  Menghapus seluruh anggota roster dan seluruh catatan harian hingga kosong total.
                </p>
              </div>
              {!showDeleteConfirm ? (
                <button
                  id="reset-roster-btn"
                  onClick={() => { playTap(); setShowDeleteConfirm(true); }}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-medium transition-colors whitespace-nowrap"
                >
                  Hapus Semua
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    id="confirm-reset-roster-btn"
                    onClick={() => {
                      playAlert();
                      onClearAllPersonnel();
                      setShowDeleteConfirm(false);
                      playSuccess();
                    }}
                    className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-colors whitespace-nowrap"
                  >
                    Ya, Hapus Semua
                  </button>
                  <button
                    onClick={() => { playTap(); setShowDeleteConfirm(false); }}
                    className="px-2 py-1.5 rounded-xl bg-zinc-800 text-zinc-400 text-xs hover:text-white"
                  >
                    Batal
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
