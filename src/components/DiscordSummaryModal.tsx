import React, { useState, useEffect } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Send, 
  Clock, 
  Settings, 
  Sparkles, 
  Download, 
  Eye, 
  Code,
  Tag,
  Shield,
  HelpCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Member, DailyMemberLog, BattalionDailyReportData, AppSettings } from '../types';
import { generateDiscordSummary } from '../utils/discord';
import { getDiscordUnixTimestamp, formatReadableDateTime, formatIndonesianDateTime } from '../utils/date';

interface DiscordSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDate: string;
  members: Member[];
  memberLogs: Record<string, DailyMemberLog>;
  battalionReports: Record<string, BattalionDailyReportData>;
  settings: AppSettings;
  onUpdateSettings: (updates: Partial<AppSettings>) => void;
}

export const DiscordSummaryModal: React.FC<DiscordSummaryModalProps> = ({
  isOpen,
  onClose,
  currentDate,
  members,
  memberLogs,
  battalionReports,
  settings,
  onUpdateSettings,
}) => {
  const [copied, setCopied] = useState(false);
  const [useDiscordTimestamp, setUseDiscordTimestamp] = useState(true);
  const [timeFormatMode, setTimeFormatMode] = useState<'discord' | 'english' | 'indonesian'>('discord');
  const [shiftTime, setShiftTime] = useState(settings.shiftTime || '20:30');
  const [customHeader, setCustomHeader] = useState(settings.discordHeaderEmoji || '<:ETS:962722934508634122> | AEST');
  const [pingInput, setPingInput] = useState(settings.defaultPing || '<@1043324306068877453> <@&1430465415280066721>');
  const [includeMetrics, setIncludeMetrics] = useState(false);
  const [previewMode, setPreviewMode] = useState<'discord_styled' | 'raw_markdown'>('discord_styled');
  const [customText, setCustomText] = useState<string>('');
  const [isManualEdit, setIsManualEdit] = useState(false);

  // Generate output markdown
  const generatedText = generateDiscordSummary(
    members,
    memberLogs,
    battalionReports,
    settings,
    {
      date: currentDate,
      useDiscordTimestamp: timeFormatMode === 'discord',
      shiftTime,
      customHeaderEmoji: customHeader,
      pingString: pingInput,
      includeBattalionMetrics: includeMetrics,
    }
  );

  const activeText = isManualEdit ? customText : generatedText;

  useEffect(() => {
    if (!isManualEdit) {
      setCustomText(generatedText);
    }
  }, [generatedText, isManualEdit]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(activeText);
    setCopied(true);
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#10b981', '#38bdf8', '#a855f7'],
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([activeText], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `BRIGCOMM_Shift_Report_${currentDate}.md`;
    document.body.appendChild(element);
    element.click();
    element.remove();
  };

  const unixTs = getDiscordUnixTimestamp(currentDate, shiftTime);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-4xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-5 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white font-['Rajdhani',sans-serif] uppercase tracking-wide flex items-center gap-2">
                <span>Discord Shift Summary Generator</span>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                  Ready to Post
                </span>
              </h3>
              <p className="text-xs text-zinc-400">
                Format laporan siap kirim ke channel Discord Brigade Command untuk shift berakhir.
              </p>
            </div>
          </div>

          <button
            id="close-summary-modal-btn"
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body & Configs */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Quick Settings Toolbar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-zinc-950/70 border border-zinc-800/80 rounded-2xl text-xs">
            
            {/* Shift Time Config */}
            <div>
              <label htmlFor="shift-time-input" className="block text-[11px] font-semibold text-zinc-400 mb-1">
                Shift Time (Default 20:30):
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="shift-time-input"
                  type="time"
                  value={shiftTime}
                  onChange={(e) => {
                    setShiftTime(e.target.value);
                    onUpdateSettings({ shiftTime: e.target.value });
                  }}
                  className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500 w-full"
                />
              </div>
            </div>

            {/* Date Timestamp Format */}
            <div>
              <label htmlFor="date-format-select" className="block text-[11px] font-semibold text-zinc-400 mb-1">
                Date / Timestamp Mode:
              </label>
              <select
                id="date-format-select"
                value={timeFormatMode}
                onChange={(e) => setTimeFormatMode(e.target.value as any)}
                className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 w-full"
              >
                <option value="discord">Discord Tag: &lt;t:{unixTs}:f&gt;</option>
                <option value="english">{formatReadableDateTime(currentDate, shiftTime)}</option>
                <option value="indonesian">{formatIndonesianDateTime(currentDate, shiftTime)}</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                Preview Mode:
              </label>
              <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
                <button
                  id="preview-mode-discord-btn"
                  onClick={() => setPreviewMode('discord_styled')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    previewMode === 'discord_styled'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Discord UI</span>
                </button>
                <button
                  id="preview-mode-raw-btn"
                  onClick={() => setPreviewMode('raw_markdown')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    previewMode === 'raw_markdown'
                      ? 'bg-zinc-800 text-white shadow'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Code className="w-3.5 h-3.5" />
                  <span>Raw Markdown</span>
                </button>
              </div>
            </div>

          </div>

          {/* Pings & Custom Header Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="ping-mentions-input" className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-indigo-400" />
                <span>Ping Mentions / Roles:</span>
              </label>
              <input
                id="ping-mentions-input"
                type="text"
                value={pingInput}
                onChange={(e) => {
                  setPingInput(e.target.value);
                  onUpdateSettings({ defaultPing: e.target.value });
                }}
                placeholder="<@1043324306068877453> <@&1430465415280066721>"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label htmlFor="custom-header-emoji-input" className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>Header Prefix / Emoji:</span>
              </label>
              <input
                id="custom-header-emoji-input"
                type="text"
                value={customHeader}
                onChange={(e) => {
                  setCustomHeader(e.target.value);
                  onUpdateSettings({ discordHeaderEmoji: e.target.value });
                }}
                placeholder="<:ETS:962722934508634122> | AEST"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Discord Live Preview Styled Box */}
          {previewMode === 'discord_styled' ? (
            <div className="border border-[#202225] bg-[#313338] rounded-2xl p-5 font-sans text-zinc-200 shadow-inner">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#3f4147]">
                <div className="w-8 h-8 rounded-full bg-[#5865f2] flex items-center justify-center text-white font-bold text-xs">
                  HQ
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-xs">BRIGCOMM Shift Logger</span>
                    <span className="bg-[#5865f2] text-white text-[10px] px-1.5 py-0.2 rounded font-semibold">BOT</span>
                    <span className="text-[11px] text-[#949ba4]">Today at {shiftTime}</span>
                  </div>
                </div>
              </div>

              {/* Rendered Discord Mockup Content */}
              <div className="space-y-6 text-sm text-[#dbdee1] font-sans leading-relaxed">
                {(['1st_bat', '2nd_bat', 'commandants_guards'] as const).map((batId) => {
                  const batMembers = members.filter((m) => m.battalion === batId && m.status !== 'inactive');
                  const batTitle =
                    batId === '1st_bat'
                      ? '1st Battalion Daily Quota Tracker'
                      : batId === '2nd_bat'
                      ? '2nd Battalion Daily Quota Tracker'
                      : 'Commandants Guards Daily Quota Tracker';

                  return (
                    <div key={batId} className="space-y-2 border-l-2 border-transparent pl-1">
                      {/* Heading */}
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <span className="text-zinc-400 font-mono text-xs">{customHeader}</span>
                        <span>{batTitle}</span>
                      </h3>

                      <div className="text-xs text-[#949ba4] font-mono">
                        Date: <span className="bg-[#2b2d31] px-1.5 py-0.5 rounded text-white">{timeFormatMode === 'discord' ? `<t:${unixTs}:f>` : formatReadableDateTime(currentDate, shiftTime)}</span>
                      </div>

                      <div className="text-xs font-semibold text-[#dbdee1] mt-2">Member:</div>
                      {batMembers.length === 0 ? (
                        <div className="border-l-4 border-[#4e5058] pl-3 text-xs text-[#949ba4] italic">
                          *No active members assigned*
                        </div>
                      ) : (
                        <div className="border-l-4 border-[#4e5058] pl-3 space-y-1">
                          {batMembers.map((m) => {
                            const log = memberLogs[`${m.id}_${currentDate}`];
                            const st = log?.status || 'no_logs';
                            const emoji = st === 'completed' ? '🟢' : st === 'partial' ? '🟡' : st === 'no_logs' ? '🔴' : st === 'exempted' ? '⚪' : '🔵';
                            return (
                              <div key={m.id} className="text-xs flex items-center gap-2">
                                <span className="text-zinc-500">•</span>
                                {m.discordId ? (
                                  <span className="bg-[#5865f2]/20 text-[#c9cdfb] px-1 rounded font-mono">
                                    @{m.name}
                                  </span>
                                ) : (
                                  <span className="text-white font-medium">{m.name}</span>
                                )}
                                <span>( {emoji} )</span>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Notes in Discord */}
                      <div className="text-xs text-[#dbdee1] mt-2">
                        {batMembers.length > 0 ? (
                          batMembers.map((m) => {
                            const log = memberLogs[`${m.id}_${currentDate}`];
                            const st = log?.status || 'no_logs';
                            let note = log?.note?.trim();
                            if (!note) {
                              if (st === 'no_logs') note = '***No Logs*** (Demotion notice)';
                              else if (st === 'exempted' || (st as string) === 'loa') note = '***Exempted***';
                            }
                            if (!note) return null;

                            return (
                              <div key={m.id} className="text-xs text-[#dbdee1]">
                                <span className="font-semibold text-[#949ba4]">Note: </span>
                                {m.discordId ? (
                                  <span className="bg-[#5865f2]/20 text-[#c9cdfb] px-1 rounded font-mono mr-1">
                                    @{m.name}
                                  </span>
                                ) : (
                                  <span className="text-white font-medium mr-1">{m.name}</span>
                                )}
                                <span className="italic font-bold text-amber-200">{note}</span>
                              </div>
                            );
                          })
                        ) : (
                          <span className="text-[#949ba4]">Notes: ***None***</span>
                        )}
                      </div>
                    </div>
                  );
                })}

                {pingInput && (
                  <div className="pt-2 border-t border-[#3f4147] text-xs font-mono text-[#c9cdfb]">
                    <span className="text-[#949ba4] font-sans">Ping: </span>
                    <span className="bg-[#5865f2]/20 px-2 py-0.5 rounded">{pingInput}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Raw Markdown Textarea */
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs text-zinc-400">
                <span>Markdown output (Editable):</span>
                <span className="font-mono text-[11px]">{activeText.length} characters</span>
              </div>
              <textarea
                id="raw-markdown-textarea"
                rows={14}
                value={activeText}
                onChange={(e) => {
                  setCustomText(e.target.value);
                  setIsManualEdit(true);
                }}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 font-mono text-xs text-emerald-400 focus:outline-none focus:border-emerald-500 leading-relaxed shadow-inner"
              />
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-5 bg-zinc-950 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 flex-shrink-0">
          <div className="text-xs text-zinc-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Shift Time configured at: <strong className="text-white font-mono">{shiftTime} AEST</strong></span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              id="download-summary-btn"
              onClick={handleDownload}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold rounded-xl border border-zinc-800 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .MD</span>
            </button>

            <button
              id="copy-discord-summary-btn"
              onClick={handleCopy}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-950/60 border border-emerald-400/30 transition-all hover:scale-105 active:scale-95"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-emerald-100" />
                  <span>Copy Report for Discord</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
