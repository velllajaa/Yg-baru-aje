import React, { useState } from 'react';
import { 
  UserPlus, 
  Trash2, 
  Edit3, 
  Shield, 
  Search, 
  Check, 
  X, 
  Copy,
  Users,
  AlertCircle,
  FileText,
  Sparkles
} from 'lucide-react';
import { Member, BattalionId } from '../types';
import { BATTALIONS } from '../constants';
import { getTodayString } from '../utils/date';

interface MemberManagementProps {
  members: Member[];
  onAddMember: (member: Omit<Member, 'id' | 'createdAt'>) => void;
  onUpdateMember: (id: string, updates: Partial<Member>) => void;
  onDeleteMember: (id: string) => void;
  onBatchAddMembers: (newMembers: Omit<Member, 'id' | 'createdAt'>[]) => void;
}

export const MemberManagement: React.FC<MemberManagementProps> = ({
  members,
  onAddMember,
  onUpdateMember,
  onDeleteMember,
  onBatchAddMembers,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBattalion, setSelectedBattalion] = useState<BattalionId | 'all'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [batchText, setBatchText] = useState('');
  const [batchBattalion, setBatchBattalion] = useState<BattalionId>('1st_bat');

  // New member form state
  const [formName, setFormName] = useState('');
  const [formDiscordId, setFormDiscordId] = useState('');
  const [formBattalion, setFormBattalion] = useState<BattalionId>('1st_bat');
  const [formPosition, setFormPosition] = useState('Brigade Staff');
  const [formTarget, setFormTarget] = useState<number>(3);
  const [formStatus, setFormStatus] = useState<'active' | 'inactive'>('active');

  const filteredMembers = members.filter((m) => {
    const matchesBat = selectedBattalion === 'all' || m.battalion === selectedBattalion;
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.discordId && m.discordId.includes(searchQuery)) ||
      m.position.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesBat && matchesSearch;
  });

  const handleOpenAdd = () => {
    setFormName('');
    setFormDiscordId('');
    setFormBattalion('1st_bat');
    setFormPosition('Brigade Staff');
    setFormTarget(3);
    setFormStatus('active');
    setEditingMember(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (member: Member) => {
    setEditingMember(member);
    setFormName(member.name);
    setFormDiscordId(member.discordId || '');
    setFormBattalion(member.battalion);
    setFormPosition(member.position);
    setFormTarget(member.dailyQuotaTarget);
    setFormStatus(member.status);
    setIsAddModalOpen(true);
  };

  const handleSaveMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (editingMember) {
      onUpdateMember(editingMember.id, {
        name: formName.trim(),
        discordId: formDiscordId.trim().replace(/[<@>]/g, ''),
        battalion: formBattalion,
        position: formPosition.trim(),
        dailyQuotaTarget: formTarget,
        status: formStatus,
      });
    } else {
      onAddMember({
        name: formName.trim(),
        discordId: formDiscordId.trim().replace(/[<@>]/g, ''),
        battalion: formBattalion,
        position: formPosition.trim(),
        dailyQuotaTarget: formTarget,
        status: formStatus,
      });
    }

    setIsAddModalOpen(false);
  };

  const handleBatchImport = () => {
    if (!batchText.trim()) return;
    const lines = batchText.split('\n');
    const newItems: Omit<Member, 'id' | 'createdAt'>[] = [];

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      // Match patterns like "Name, DiscordID, Position" or "<@123456> Name" or just "Name"
      let name = line;
      let discordId = '';
      let position = 'Brigade Staff';

      if (line.includes(',')) {
        const parts = line.split(',').map((p) => p.trim());
        name = parts[0];
        if (parts[1]) discordId = parts[1].replace(/[<@>]/g, '');
        if (parts[2]) position = parts[2];
      } else if (line.includes('<@')) {
        const match = line.match(/<@(\d+)>/);
        if (match) {
          discordId = match[1];
          name = line.replace(/<@\d+>/, '').trim() || `Staff_${discordId.slice(-4)}`;
        }
      }

      if (name) {
        newItems.push({
          name,
          discordId,
          battalion: batchBattalion,
          position,
          dailyQuotaTarget: 3,
          status: 'active',
        });
      }
    }

    if (newItems.length > 0) {
      onBatchAddMembers(newItems);
      setBatchText('');
      setIsBatchModalOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-zinc-900/60 border border-white/[0.08] rounded-2xl backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.37)]">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Users className="w-4 h-4" />
            </span>
            <h2 className="text-base font-bold text-white font-['Rajdhani',sans-serif] uppercase tracking-wide">
              Brigade Staff & Personnel Roster
            </h2>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Manage personnel records, Discord IDs for auto-mentions, battalion assignments, and daily quota targets.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            id="batch-add-btn"
            onClick={() => setIsBatchModalOpen(true)}
            className="px-3.5 py-2 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-xl border border-white/[0.08] transition-colors backdrop-blur-md"
          >
            Paste Multi-Members
          </button>

          <button
            id="add-single-member-btn"
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-emerald-950/50 border border-emerald-400/30 transition-all hover:scale-105"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Member</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-zinc-900/50 p-3.5 rounded-2xl border border-white/[0.08] backdrop-blur-2xl shadow-lg">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            id="roster-search-input"
            type="text"
            placeholder="Search member by name, Discord ID, position..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-950/70 border border-white/[0.08] rounded-xl pl-9 pr-4 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50 backdrop-blur-md"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            id="roster-filter-all"
            onClick={() => setSelectedBattalion('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              selectedBattalion === 'all'
                ? 'bg-zinc-800 text-white shadow border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            All Units ({members.length})
          </button>

          {(Object.keys(BATTALIONS) as BattalionId[]).map((batId) => {
            const b = BATTALIONS[batId];
            const isSelected = selectedBattalion === batId;
            const count = members.filter((m) => m.battalion === batId).length;

            return (
              <button
                key={batId}
                id={`roster-filter-${batId}`}
                onClick={() => setSelectedBattalion(batId)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  isSelected ? `${b.badgeBg} shadow border` : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <span>{b.shortName}</span>
                <span className="text-[10px] opacity-75 font-mono ml-1">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Roster List Table */}
      <div className="border border-white/[0.08] bg-zinc-900/40 rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.37)] backdrop-blur-2xl">
        {filteredMembers.length === 0 ? (
          <div className="p-12 text-center text-zinc-500 text-xs">
            {members.length === 0
              ? 'No personnel added yet. Click "Add Member" above to create a new record.'
              : 'No personnel match the filter or search query.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-zinc-950/80 border-b border-zinc-800 text-zinc-400 font-semibold uppercase font-mono text-[11px]">
                <tr>
                  <th className="px-5 py-3">Personnel / Call Sign</th>
                  <th className="px-4 py-3">Battalion Unit</th>
                  <th className="px-4 py-3">Position / Rank</th>
                  <th className="px-4 py-3">Discord Tag</th>
                  <th className="px-4 py-3 text-center">Daily Quota Target</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {filteredMembers.map((member) => {
                  const bat = BATTALIONS[member.battalion];

                  return (
                    <tr key={member.id} id={`roster-row-${member.id}`} className="hover:bg-zinc-800/20 transition-colors">
                      {/* Name */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-white text-xs">
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-white text-sm block">
                              {member.name}
                            </span>
                            <span className="text-[10px] text-zinc-500 font-mono">
                              ID: {member.id.slice(0, 8)}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Battalion */}
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${bat?.badgeBg}`}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: bat?.color }} />
                          <span>{bat?.shortName || member.battalion}</span>
                        </span>
                      </td>

                      {/* Position */}
                      <td className="px-4 py-3.5 font-medium text-zinc-200">
                        {member.position}
                      </td>

                      {/* Discord ID */}
                      <td className="px-4 py-3.5 font-mono">
                        {member.discordId ? (
                          <span className="px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-emerald-400 text-[11px]">
                            &lt;@{member.discordId}&gt;
                          </span>
                        ) : (
                          <span className="text-zinc-600 text-[11px] italic">None</span>
                        )}
                      </td>

                      {/* Daily Quota Target */}
                      <td className="px-4 py-3.5 text-center font-mono font-bold text-zinc-200">
                        {member.dailyQuotaTarget}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 text-center">
                        <span
                          className={`text-[11px] px-2 py-0.5 rounded-full font-semibold border ${
                            member.status === 'active'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                          }`}
                        >
                          {member.status.toUpperCase()}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            id={`edit-member-${member.id}`}
                            onClick={() => handleOpenEdit(member)}
                            className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-lg transition-colors"
                            title="Edit Member"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            id={`delete-member-${member.id}`}
                            onClick={() => {
                              if (confirm(`Remove ${member.name} from brigade roster?`)) {
                                onDeleteMember(member.id);
                              }
                            }}
                            className="p-1.5 hover:bg-rose-500/20 text-zinc-500 hover:text-rose-400 rounded-lg transition-colors"
                            title="Delete Member"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================= ADD / EDIT MODAL ================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-5 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-emerald-400" />
                <span>{editingMember ? 'Edit Personnel' : 'Add New Brigade Personnel'}</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMember} className="p-6 space-y-4">
              {/* Member Name */}
              <div>
                <label htmlFor="member-form-name" className="block text-xs font-semibold text-zinc-300 mb-1">
                  Personnel Name / Call Sign *
                </label>
                <input
                  id="member-form-name"
                  type="text"
                  required
                  placeholder="e.g. John 'Vanguard' Miller"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Discord ID */}
              <div>
                <label htmlFor="member-form-discord" className="block text-xs font-semibold text-zinc-300 mb-1">
                  Discord User ID (For &lt;@ID&gt; Tag)
                </label>
                <input
                  id="member-form-discord"
                  type="text"
                  placeholder="e.g. 1516471139134734346"
                  value={formDiscordId}
                  onChange={(e) => setFormDiscordId(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                />
                <p className="text-[11px] text-zinc-500 mt-1">
                  Copy User ID from Discord (Developer Mode) so that generated summary tags format as &lt;@1516471139134734346&gt;.
                </p>
              </div>

              {/* Battalion Assignment */}
              <div>
                <label htmlFor="member-form-battalion" className="block text-xs font-semibold text-zinc-300 mb-1">
                  Battalion Unit *
                </label>
                <select
                  id="member-form-battalion"
                  value={formBattalion}
                  onChange={(e) => setFormBattalion(e.target.value as BattalionId)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="1st_bat">1st Battalion (Tryouts, Recruits, Events)</option>
                  <option value="2nd_bat">2nd Battalion (Supervisions, BMT, Events)</option>
                  <option value="commandants_guards">Commandants Guards (Recruits, Selections, Events, DDT)</option>
                </select>
              </div>

                {/* Position / Rank */}
              <div>
                <label htmlFor="member-form-position" className="block text-xs font-semibold text-zinc-300 mb-1">
                  Position / Role (e.g. BXO, BSM, Officer)
                </label>
                <div className="flex items-center gap-2 mb-2">
                  {(['BXO', 'BSM', 'Officer'] as const).map((posPreset) => (
                    <button
                      key={posPreset}
                      type="button"
                      onClick={() => setFormPosition(posPreset)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                        formPosition === posPreset
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                          : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                      }`}
                    >
                      {posPreset}
                    </button>
                  ))}
                </div>
                <input
                  id="member-form-position"
                  type="text"
                  placeholder="e.g. BXO, BSM, Officer"
                  value={formPosition}
                  onChange={(e) => setFormPosition(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Daily Quota Target & Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="member-form-target" className="block text-xs font-semibold text-zinc-300 mb-1">
                    Daily Quota Target
                  </label>
                  <input
                    id="member-form-target"
                    type="number"
                    min="1"
                    value={formTarget}
                    onChange={(e) => setFormTarget(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label htmlFor="member-form-status" className="block text-xs font-semibold text-zinc-300 mb-1">
                    Roster Status
                  </label>
                  <select
                    id="member-form-status"
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as 'active' | 'inactive')}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="active">Active Duty</option>
                    <option value="inactive">Inactive / Retired</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-800 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="save-member-submit-btn"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-950/50 border border-emerald-400/30 transition-all hover:scale-105"
                >
                  {editingMember ? 'Save Changes' : 'Add Personnel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= BATCH IMPORT MODAL ================= */}
      {isBatchModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden">
            <div className="p-5 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                <span>Bulk Import Personnel</span>
              </h3>
              <button
                onClick={() => setIsBatchModalOpen(false)}
                className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label htmlFor="batch-battalion-select" className="block text-xs font-semibold text-zinc-300 mb-1">
                  Assign to Battalion Unit:
                </label>
                <select
                  id="batch-battalion-select"
                  value={batchBattalion}
                  onChange={(e) => setBatchBattalion(e.target.value as BattalionId)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="1st_bat">1st Battalion</option>
                  <option value="2nd_bat">2nd Battalion</option>
                  <option value="commandants_guards">Commandants Guards</option>
                </select>
              </div>

              <div>
                <label htmlFor="batch-import-textarea" className="block text-xs font-semibold text-zinc-300 mb-1">
                  Paste List (One per line):
                </label>
                <p className="text-[11px] text-zinc-500 mb-2">
                  Line format: <code className="bg-zinc-950 px-1.5 py-0.5 rounded text-zinc-300">Name, DiscordID, Position</code> or <code className="bg-zinc-950 px-1.5 py-0.5 rounded text-zinc-300">&lt;@1516471139134734346&gt; Name</code>
                </p>
                <textarea
                  id="batch-import-textarea"
                  rows={6}
                  value={batchText}
                  onChange={(e) => setBatchText(e.target.value)}
                  placeholder={`Vanguard Alpha, 1516471139134734346, Lead Recruiter\nIron Sentinel, 1067699233836240906, Senior Inspector\nShadow Warden, 1430442300353544193, Guard Officer`}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-zinc-800 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsBatchModalOpen(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  id="confirm-batch-import-btn"
                  onClick={handleBatchImport}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-950/50 border border-emerald-400/30"
                >
                  Import All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
