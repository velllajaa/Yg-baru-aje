import React, { useState } from 'react';
import { 
  X, 
  Save, 
  Clock, 
  Shield, 
  Globe, 
  Check, 
  RotateCcw, 
  Sliders, 
  Target, 
  MessageSquare,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Sparkles,
  Info,
  ChevronDown,
  ChevronUp,
  Activity,
  Layers
} from 'lucide-react';
import { AppSettings, Language, CustomQuotaConfig, CustomTaskDefinition, BattalionId } from '../types';
import { DEFAULT_SETTINGS, DEFAULT_QUOTAS, DEFAULT_CUSTOM_TASKS, BATTALIONS } from '../constants';
import { TRANSLATIONS } from '../utils/i18n';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
}

type TabType = 'general' | 'quotas' | 'discord';

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
}) => {
  const currentLang = settings.language || 'en';
  const t = TRANSLATIONS[currentLang];

  const [activeTab, setActiveTab] = useState<TabType>('quotas');
  const [activeBatTab, setActiveBatTab] = useState<BattalionId | 'all'>('1st_bat');

  // General state
  const [appName, setAppName] = useState(settings.appName || 'BRIGCOMM');
  const [appSubtitle, setAppSubtitle] = useState(settings.appSubtitle || 'Daily Quota & Shift System');
  const [timezoneLabel, setTimezoneLabel] = useState(settings.timezoneLabel || 'AEST COMMAND');
  const [language, setLanguage] = useState<Language>(settings.language || 'en');
  const [shiftTime, setShiftTime] = useState(settings.shiftTime || '20:30');
  const [discordHeaderEmoji, setDiscordHeaderEmoji] = useState(settings.discordHeaderEmoji || '<:ETS:962722934508634122> | AEST');
  const [defaultPing, setDefaultPing] = useState(settings.defaultPing || '<@1043324306068877453> <@&1430465415280066721>');
  const [theme, setTheme] = useState(settings.theme || 'dark');
  
  // Custom Quotas & Dynamic Task Definitions
  const [quotas, setQuotas] = useState<CustomQuotaConfig>(settings.quotas || DEFAULT_QUOTAS);
  const [customTasks, setCustomTasks] = useState<CustomTaskDefinition[]>(() => {
    return settings.customTasks && settings.customTasks.length > 0
      ? settings.customTasks
      : DEFAULT_CUSTOM_TASKS;
  });

  // State for adding new task
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskShortLabel, setNewTaskShortLabel] = useState('');
  const [newTaskTarget, setNewTaskTarget] = useState(2);
  const [newTaskBxoTarget, setNewTaskBxoTarget] = useState(3);
  const [newTaskBsmTarget, setNewTaskBsmTarget] = useState(2);
  const [newTaskOfficerTarget, setNewTaskOfficerTarget] = useState(2);
  const [newTaskBattalion, setNewTaskBattalion] = useState<BattalionId | 'all'>('1st_bat');
  const [newTaskUnit, setNewTaskUnit] = useState('sessions');

  const [savedFeedback, setSavedFeedback] = useState(false);

  if (!isOpen) return null;

  // Handlers for Custom Tasks
  const handleUpdateTaskTarget = (taskId: string, batId: BattalionId | 'all', newTarget: number) => {
    setCustomTasks((prev) =>
      prev.map((task) => {
        if (task.id === taskId && task.battalionId === batId) {
          return {
            ...task,
            defaultTarget: Math.max(0, newTarget),
          };
        }
        return task;
      })
    );
  };

  const handleUpdatePositionTarget = (
    taskId: string, 
    batId: BattalionId | 'all', 
    position: string, 
    newVal: number
  ) => {
    setCustomTasks((prev) =>
      prev.map((task) => {
        if (task.id === taskId && task.battalionId === batId) {
          return {
            ...task,
            positionTargets: {
              ...(task.positionTargets || {}),
              [position]: Math.max(0, newVal),
            },
          };
        }
        return task;
      })
    );
  };

  const handleToggleTask = (taskId: string, batId: BattalionId | 'all') => {
    setCustomTasks((prev) =>
      prev.map((task) => {
        if (task.id === taskId && task.battalionId === batId) {
          return {
            ...task,
            enabled: !task.enabled,
          };
        }
        return task;
      })
    );
  };

  const handleDeleteTask = (taskId: string, batId: BattalionId | 'all') => {
    if (window.confirm(t.deleteTaskConfirm)) {
      setCustomTasks((prev) =>
        prev.filter((task) => !(task.id === taskId && task.battalionId === batId))
      );
    }
  };

  const handleAddNewTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskName.trim()) return;

    const slug = 'task_' + newTaskName.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now();
    const newTask: CustomTaskDefinition = {
      id: slug,
      name: newTaskName.trim(),
      shortLabel: newTaskShortLabel.trim() || newTaskName.trim(),
      battalionId: newTaskBattalion,
      defaultTarget: Math.max(0, newTaskTarget),
      positionTargets: {
        BXO: Math.max(0, newTaskBxoTarget),
        BSM: Math.max(0, newTaskBsmTarget),
        Officer: Math.max(0, newTaskOfficerTarget),
      },
      enabled: true,
      isCustom: true,
      unit: newTaskUnit || 'sessions',
    };

    setCustomTasks((prev) => [...prev, newTask]);
    
    // Reset form
    setNewTaskName('');
    setNewTaskShortLabel('');
    setNewTaskTarget(2);
    setNewTaskBxoTarget(3);
    setNewTaskBsmTarget(2);
    setNewTaskOfficerTarget(2);
    setShowAddForm(false);
  };

  const handleResetTasksForBattalion = (batId: BattalionId | 'all') => {
    const confirmMsg = language === 'id' 
      ? `Kembalikan semua tugas dan kuota untuk unit ini ke pengaturan standar awal?`
      : `Reset all tasks and quotas for this unit to factory default?`;

    if (window.confirm(confirmMsg)) {
      const defaultForThisBat = DEFAULT_CUSTOM_TASKS.filter((t) => t.battalionId === batId);
      setCustomTasks((prev) => {
        const otherBatTasks = prev.filter((t) => t.battalionId !== batId);
        return [...otherBatTasks, ...defaultForThisBat];
      });
      setQuotas(DEFAULT_QUOTAS);
    }
  };

  const handleResetToDefaults = () => {
    if (window.confirm(language === 'id' ? 'Kembalikan semua pengaturan ke standar awal?' : 'Reset all settings to default values?')) {
      setAppName('BRIGCOMM');
      setAppSubtitle('Daily Quota & Shift System');
      setTimezoneLabel('AEST COMMAND');
      setShiftTime('20:30');
      setDiscordHeaderEmoji('<:ETS:962722934508634122> | AEST');
      setDefaultPing('<@1043324306068877453> <@&1430465415280066721>');
      setQuotas(DEFAULT_QUOTAS);
      setCustomTasks(DEFAULT_CUSTOM_TASKS);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedSettings: AppSettings = {
      ...settings,
      appName: appName.trim() || 'BRIGCOMM',
      appSubtitle: appSubtitle.trim() || 'Daily Quota & Shift System',
      timezoneLabel: timezoneLabel.trim() || 'AEST COMMAND',
      language,
      shiftTime: shiftTime.trim() || '20:30',
      discordHeaderEmoji: discordHeaderEmoji.trim() || '<:ETS:962722934508634122> | AEST',
      defaultPing: defaultPing.trim(),
      theme,
      quotas,
      customTasks,
    };

    onSaveSettings(updatedSettings);
    setSavedFeedback(true);
    setTimeout(() => {
      setSavedFeedback(false);
      onClose();
    }, 600);
  };

  const displayedTasks = customTasks.filter(
    (t) => t.battalionId === activeBatTab || (activeBatTab === 'all' && t.battalionId === 'all')
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-zinc-950 border border-white/[0.08] rounded-3xl w-full max-w-3xl shadow-[0_24px_64px_rgba(0,0,0,0.7)] overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Top Header */}
        <div className="p-5 bg-zinc-900/90 border-b border-white/[0.08] flex items-center justify-between backdrop-blur-md flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-inner">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white flex items-center gap-2">
                <span>{t.settingsTitle}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono">
                  Full Control
                </span>
              </h3>
              <p className="text-xs text-zinc-400">{t.settingsSubtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation inside Settings */}
        <div className="flex border-b border-white/[0.08] bg-zinc-900/50 px-5 gap-2 overflow-x-auto scrollbar-none flex-shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('quotas')}
            className={`flex items-center gap-2 py-3 px-3.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'quotas'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>{t.quotasTab}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`flex items-center gap-2 py-3 px-3.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'general'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{t.generalTab}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('discord')}
            className={`flex items-center gap-2 py-3 px-3.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'discord'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{t.discordTab}</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          
          {/* ================= TAB 1: QUOTA TARGETS & CUSTOM TASKS MANAGER ================= */}
          {activeTab === 'quotas' && (
            <div className="space-y-6">
              
              {/* Quota Overview Banner */}
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-start gap-3">
                <Target className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-emerald-300">
                    {t.quotaConfigTitle}
                  </h4>
                  <p className="text-[11px] text-zinc-300 leading-relaxed">
                    {language === 'id'
                      ? 'Kelola target kuota minimal harian untuk semua batalyon, ubah angka target per posisi (BXO, BSM, Officer), kurangi beban aktivitas, atau tambahkan tugas/aktivitas operasional baru secara fleksibel.'
                      : 'Customize daily quota thresholds for all battalions, adjust targets per rank/position (BXO, BSM, Officer), reduce activity targets, or dynamically create new custom tasks.'}
                  </p>
                </div>
              </div>

              {/* Battalion Selector Sub-Tabs */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => { setActiveBatTab('1st_bat'); setShowAddForm(false); }}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      activeBatTab === '1st_bat'
                        ? 'bg-red-500/20 text-red-300 border-red-500/40 shadow-sm'
                        : 'bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                    <span>1B BRIGCOMM</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setActiveBatTab('2nd_bat'); setShowAddForm(false); }}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      activeBatTab === '2nd_bat'
                        ? 'bg-blue-500/20 text-blue-300 border-blue-500/40 shadow-sm'
                        : 'bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                    <span>2B BRIGCOMM</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setActiveBatTab('commandants_guards'); setShowAddForm(false); }}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      activeBatTab === 'commandants_guards'
                        ? 'bg-zinc-700/40 text-zinc-200 border-zinc-500/40 shadow-sm'
                        : 'bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-zinc-400"></span>
                    <span>Commandants Guards</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-950 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t.addNewTask}</span>
                </button>
              </div>

              {/* Add New Custom Task Accordion Form */}
              {showAddForm && (
                <div className="p-4 bg-zinc-900/90 border border-emerald-500/30 rounded-2xl space-y-4 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                    <h5 className="text-xs font-bold text-emerald-400 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      <span>{t.addNewTask}</span>
                    </h5>
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="text-zinc-500 hover:text-zinc-300 text-xs"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                        {t.taskNameLabel} *
                      </label>
                      <input
                        type="text"
                        value={newTaskName}
                        onChange={(e) => setNewTaskName(e.target.value)}
                        placeholder="e.g. Special Patrols, DDT Supervision, Rallies"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                        {t.taskShortLabel}
                      </label>
                      <input
                        type="text"
                        value={newTaskShortLabel}
                        onChange={(e) => setNewTaskShortLabel(e.target.value)}
                        placeholder="e.g. Patrol"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Targets per rank */}
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-300 mb-1.5">
                      {t.positionOverrides}
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <span className="block text-[10px] text-zinc-400 mb-1">Default Target</span>
                        <input
                          type="number"
                          value={newTaskTarget}
                          onChange={(e) => setNewTaskTarget(Number(e.target.value))}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2 text-xs text-center font-mono font-bold text-white focus:border-emerald-500"
                          min="0"
                        />
                      </div>
                      <div>
                        <span className="block text-[10px] text-zinc-400 mb-1">BXO Target</span>
                        <input
                          type="number"
                          value={newTaskBxoTarget}
                          onChange={(e) => setNewTaskBxoTarget(Number(e.target.value))}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2 text-xs text-center font-mono font-bold text-white focus:border-emerald-500"
                          min="0"
                        />
                      </div>
                      <div>
                        <span className="block text-[10px] text-zinc-400 mb-1">BSM Target</span>
                        <input
                          type="number"
                          value={newTaskBsmTarget}
                          onChange={(e) => setNewTaskBsmTarget(Number(e.target.value))}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2 text-xs text-center font-mono font-bold text-white focus:border-emerald-500"
                          min="0"
                        />
                      </div>
                      <div>
                        <span className="block text-[10px] text-zinc-400 mb-1">Officer Target</span>
                        <input
                          type="number"
                          value={newTaskOfficerTarget}
                          onChange={(e) => setNewTaskOfficerTarget(Number(e.target.value))}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2 text-xs text-center font-mono font-bold text-white focus:border-emerald-500"
                          min="0"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-zinc-400">{t.assignedBattalion}:</span>
                      <select
                        value={newTaskBattalion}
                        onChange={(e) => setNewTaskBattalion(e.target.value as any)}
                        className="bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 rounded-xl px-2.5 py-1.5 focus:border-emerald-500"
                      >
                        <option value="1st_bat">1st Battalion</option>
                        <option value="2nd_bat">2nd Battalion</option>
                        <option value="commandants_guards">Commandants Guards</option>
                        <option value="all">All Battalions (Global)</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddNewTask}
                      disabled={!newTaskName.trim()}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors"
                    >
                      Save New Task
                    </button>
                  </div>
                </div>
              )}

              {/* Tasks List for Selected Battalion */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
                  <span className="uppercase tracking-wider">
                    {activeBatTab === '1st_bat' ? '1B BRIGCOMM Tasks' : activeBatTab === '2nd_bat' ? '2B BRIGCOMM Tasks' : 'CG BRIGCOMM Tasks'} ({displayedTasks.length} configured)
                  </span>
                  <button
                    type="button"
                    onClick={() => handleResetTasksForBattalion(activeBatTab)}
                    className="text-[11px] text-zinc-500 hover:text-zinc-300 flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset this unit</span>
                  </button>
                </div>

                {displayedTasks.length === 0 ? (
                  <div className="p-8 text-center bg-zinc-900/40 rounded-2xl border border-zinc-800 text-zinc-500 text-xs">
                    {t.noCustomTasks}
                  </div>
                ) : (
                  displayedTasks.map((task) => {
                    const isEnabled = task.enabled !== false;
                    const bxoTarget = task.positionTargets?.['BXO'] ?? task.defaultTarget;
                    const bsmTarget = task.positionTargets?.['BSM'] ?? task.defaultTarget;
                    const offTarget = task.positionTargets?.['Officer'] ?? task.defaultTarget;

                    return (
                      <div
                        key={`${task.battalionId}_${task.id}`}
                        className={`p-4 rounded-2xl border transition-all ${
                          isEnabled
                            ? 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
                            : 'bg-zinc-950/40 border-zinc-900 opacity-60'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => handleToggleTask(task.id, task.battalionId)}
                              className="text-zinc-400 hover:text-zinc-200 transition-colors"
                              title={isEnabled ? 'Click to disable' : 'Click to enable'}
                            >
                              {isEnabled ? (
                                <ToggleRight className="w-6 h-6 text-emerald-400" />
                              ) : (
                                <ToggleLeft className="w-6 h-6 text-zinc-600" />
                              )}
                            </button>

                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-white">
                                  {task.name}
                                </span>
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                                  {task.shortLabel}
                                </span>
                                {task.isCustom && (
                                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                                    Custom
                                  </span>
                                )}
                              </div>
                              {task.description && (
                                <p className="text-[11px] text-zinc-500 mt-0.5">
                                  {task.description}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Delete Action */}
                          <div className="flex items-center gap-2 self-end sm:self-auto">
                            <button
                              type="button"
                              onClick={() => handleDeleteTask(task.id, task.battalionId)}
                              className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                              title="Delete task"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Interactive Position Targets with +/- Buttons */}
                        <div className="grid grid-cols-3 gap-2.5 pt-2 border-t border-zinc-800/80">
                          {/* BXO Target Control */}
                          <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800/80 flex flex-col items-center justify-between">
                            <span className="text-[10px] font-mono font-bold text-zinc-400 mb-1">
                              BXO Quota
                            </span>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleUpdatePositionTarget(task.id, task.battalionId, 'BXO', bxoTarget - 1)}
                                className="w-6 h-6 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold flex items-center justify-center text-xs transition-colors"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                value={bxoTarget}
                                onChange={(e) => handleUpdatePositionTarget(task.id, task.battalionId, 'BXO', Number(e.target.value))}
                                className="w-12 bg-transparent text-center font-mono font-bold text-white text-xs focus:outline-none"
                                min="0"
                              />
                              <button
                                type="button"
                                onClick={() => handleUpdatePositionTarget(task.id, task.battalionId, 'BXO', bxoTarget + 1)}
                                className="w-6 h-6 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold flex items-center justify-center text-xs transition-colors"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          {/* BSM Target Control */}
                          <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800/80 flex flex-col items-center justify-between">
                            <span className="text-[10px] font-mono font-bold text-zinc-400 mb-1">
                              BSM Quota
                            </span>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleUpdatePositionTarget(task.id, task.battalionId, 'BSM', bsmTarget - 1)}
                                className="w-6 h-6 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold flex items-center justify-center text-xs transition-colors"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                value={bsmTarget}
                                onChange={(e) => handleUpdatePositionTarget(task.id, task.battalionId, 'BSM', Number(e.target.value))}
                                className="w-12 bg-transparent text-center font-mono font-bold text-white text-xs focus:outline-none"
                                min="0"
                              />
                              <button
                                type="button"
                                onClick={() => handleUpdatePositionTarget(task.id, task.battalionId, 'BSM', bsmTarget + 1)}
                                className="w-6 h-6 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold flex items-center justify-center text-xs transition-colors"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          {/* Officer / Staff Target Control */}
                          <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800/80 flex flex-col items-center justify-between">
                            <span className="text-[10px] font-mono font-bold text-zinc-400 mb-1">
                              Officer / Staff
                            </span>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleUpdatePositionTarget(task.id, task.battalionId, 'Officer', offTarget - 1)}
                                className="w-6 h-6 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold flex items-center justify-center text-xs transition-colors"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                value={offTarget}
                                onChange={(e) => handleUpdatePositionTarget(task.id, task.battalionId, 'Officer', Number(e.target.value))}
                                className="w-12 bg-transparent text-center font-mono font-bold text-white text-xs focus:outline-none"
                                min="0"
                              />
                              <button
                                type="button"
                                onClick={() => handleUpdatePositionTarget(task.id, task.battalionId, 'Officer', offTarget + 1)}
                                className="w-6 h-6 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold flex items-center justify-center text-xs transition-colors"
                              >
                                +
                              </button>
                            </div>
                          </div>

                        </div>
                      </div>
                    );
                  })
                )}
              </div>

            </div>
          )}

          {/* ================= TAB 2: GENERAL & DISPLAY ================= */}
          {activeTab === 'general' && (
            <div className="space-y-4">
              
              {/* Language Switch */}
              <div className="p-4 bg-zinc-900/80 rounded-2xl border border-zinc-800">
                <label className="block text-xs font-bold text-zinc-200 mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-sky-400" />
                    <span>{t.languageSelectLabel}</span>
                  </span>
                  <span className="text-[11px] font-mono text-zinc-400">ID / EN</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setLanguage('id')}
                    className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold border transition-all ${
                      language === 'id'
                        ? 'bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-950'
                        : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white hover:bg-zinc-900'
                    }`}
                  >
                    <span>🇮🇩 Bahasa Indonesia</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLanguage('en')}
                    className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold border transition-all ${
                      language === 'en'
                        ? 'bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-950'
                        : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white hover:bg-zinc-900'
                    }`}
                  >
                    <span>🇺🇸 English (US)</span>
                  </button>
                </div>
              </div>

              {/* Application Name & Subtitle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    {t.appNameLabel}
                  </label>
                  <input
                    type="text"
                    value={appName}
                    onChange={(e) => setAppName(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                    placeholder="BRIGCOMM"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    {t.appSubtitleLabel}
                  </label>
                  <input
                    type="text"
                    value={appSubtitle}
                    onChange={(e) => setAppSubtitle(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                    placeholder="Daily Quota & Shift System"
                  />
                </div>
              </div>

              {/* Timezone and Shift End Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    {t.timezoneLabel}
                  </label>
                  <input
                    type="text"
                    value={timezoneLabel}
                    onChange={(e) => setTimezoneLabel(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                    placeholder="AEST COMMAND"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{t.shiftTimeLabel}</span>
                  </label>
                  <input
                    type="time"
                    value={shiftTime}
                    onChange={(e) => setShiftTime(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                  <p className="text-[11px] text-zinc-500 mt-1">{t.shiftTimeHelp}</p>
                </div>
              </div>

            </div>
          )}

          {/* ================= TAB 3: DISCORD FORMAT & PINGS ================= */}
          {activeTab === 'discord' && (
            <div className="space-y-4">
              
              {/* Header Prefix */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-sky-400" />
                  <span>{t.discordHeaderEmojiLabel}</span>
                </label>
                <input
                  type="text"
                  value={discordHeaderEmoji}
                  onChange={(e) => setDiscordHeaderEmoji(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                />
                <p className="text-[11px] text-zinc-500 mt-1">{t.discordHeaderEmojiHelp}</p>
              </div>

              {/* Default Ping */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{t.defaultPingLabel}</span>
                </label>
                <input
                  type="text"
                  value={defaultPing}
                  onChange={(e) => setDefaultPing(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                />
                <p className="text-[11px] text-zinc-500 mt-1">{t.defaultPingHelp}</p>
              </div>

            </div>
          )}

        </form>

        {/* Footer Actions */}
        <div className="p-4 bg-zinc-900/90 border-t border-white/[0.08] flex items-center justify-between backdrop-blur-md flex-shrink-0">
          <button
            type="button"
            onClick={handleResetToDefaults}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-xl transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t.resetDefaults}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 rounded-xl transition-colors"
            >
              {t.close}
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-950/60 border border-emerald-400/40 transition-all"
            >
              {savedFeedback ? (
                <>
                  <Check className="w-4 h-4 text-emerald-200" />
                  <span>{t.savedSuccess}</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{t.saveChanges}</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
