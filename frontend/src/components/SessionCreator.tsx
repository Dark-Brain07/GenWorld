import React, { useState } from 'react';
import { PlusCircle, Sparkles, Database, Users, ArrowRight, Check } from 'lucide-react';
import { SCENARIO_PRESETS, ScenarioPreset } from '../utils/presets';
import { DomainVariable } from '../types/genworld';

interface SessionCreatorProps {
  currentAccount: string;
  onSessionCreated: (sessionId: string) => void;
  onRequestTx: (fn: string, args: any[], title: string, desc: string) => Promise<any>;
}

export const SessionCreator: React.FC<SessionCreatorProps> = ({
  currentAccount,
  onSessionCreated,
  onRequestTx,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<ScenarioPreset>(SCENARIO_PRESETS[0]);
  const [customSessionId, setCustomSessionId] = useState(`accord_${Date.now().toString(36)}`);
  const [participantB, setParticipantB] = useState('0x14729733f00c588384291dfe9ef2cc7921f87f25');
  const [isLoading, setIsLoading] = useState(false);

  const calculateTotalWorlds = (domain: DomainVariable[]) => {
    return domain.reduce((acc, v) => acc * v.values.length, 1);
  };

  const handleSelectPreset = (preset: ScenarioPreset) => {
    setSelectedPreset(preset);
    setCustomSessionId(`${preset.id}_${Date.now().toString(36).slice(-4)}`);
    if (preset.defaultRoster[1]) {
      setParticipantB(preset.defaultRoster[1]);
    }
  };

  const handleCreateSession = async () => {
    if (!customSessionId.trim()) return;
    setIsLoading(true);

    try {
      const roster = [currentAccount, participantB];
      const domainJson = JSON.stringify(selectedPreset.domain);

      await onRequestTx(
        'create_session',
        [customSessionId.trim(), roster, domainJson],
        'Create World Session',
        `Initializing multi-stakeholder possibility domain '${customSessionId.trim()}' on GenLayer StudioNet`
      );

      onSessionCreated(customSessionId.trim());
    } catch (err) {
      console.error('Session creation failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const totalWorlds = calculateTotalWorlds(selectedPreset.domain);

  return (
    <div className="glass-panel p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#00f5d4]" />
            <span>Launch Negotiation Session</span>
          </h2>
          <p className="text-xs text-gray-400">
            Define a discrete world domain for multi-stakeholder alignment on GenLayer.
          </p>
        </div>
      </div>

      {/* Preset Selector Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        {SCENARIO_PRESETS.map((preset) => {
          const isSelected = selectedPreset.id === preset.id;
          return (
            <div
              key={preset.id}
              onClick={() => handleSelectPreset(preset)}
              className={`p-4 rounded-xl cursor-pointer border transition-all ${
                isSelected
                  ? 'bg-[#00f5d4]/10 border-[#00f5d4] shadow-lg shadow-[#00f5d4]/10'
                  : 'bg-black/30 border-white/5 hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white/5 text-gray-300">
                  {preset.badge}
                </span>
                {isSelected && <Check className="w-4 h-4 text-[#00f5d4]" />}
              </div>
              <h3 className="font-bold text-sm text-white mb-1">{preset.name}</h3>
              <p className="text-[11px] text-gray-400 line-clamp-2">{preset.description}</p>
            </div>
          );
        })}
      </div>

      {/* Domain Specifications Matrix Preview */}
      <div className="mb-6 p-4 rounded-xl bg-black/40 border border-white/5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
            <Database className="w-4 h-4 text-[#3b82f6]" />
            <span>Domain Variables ({selectedPreset.domain.length})</span>
          </span>
          <span className="text-xs font-mono text-[#00f5d4] px-2 py-0.5 rounded bg-[#00f5d4]/10">
            {totalWorlds} Possibility Worlds (≤ 64 Limit)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {selectedPreset.domain.map((variable) => (
            <div key={variable.id} className="p-3 rounded-lg bg-[#161e31] border border-white/5">
              <div className="font-mono text-xs font-bold text-[#00f5d4] mb-1">{variable.id}</div>
              <p className="text-[11px] text-gray-400 mb-2 truncate" title={variable.meaning}>
                {variable.meaning}
              </p>
              <div className="flex flex-wrap gap-1">
                {variable.values.map((val) => (
                  <span
                    key={String(val)}
                    className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/40 text-gray-300 border border-white/10"
                  >
                    {String(val)}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Session ID & Participant Roster Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">
            Negotiation Session ID (Unique)
          </label>
          <input
            type="text"
            value={customSessionId}
            onChange={(e) => setCustomSessionId(e.target.value)}
            className="font-mono"
            placeholder="e.g. artemis_accord_prime"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">
            Counterparty / Stakeholder B Address
          </label>
          <input
            type="text"
            value={participantB}
            onChange={(e) => setParticipantB(e.target.value)}
            className="font-mono"
            placeholder="0x..."
          />
        </div>
      </div>

      {/* Submit Action */}
      <div className="flex items-center justify-between pt-2 border-t border-white/5">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Users className="w-4 h-4 text-emerald-400" />
          <span>Roster: You ({currentAccount.slice(0, 6)}...) + Stakeholder B</span>
        </div>

        <button
          onClick={handleCreateSession}
          disabled={isLoading || !customSessionId.trim() || !participantB.trim()}
          className="btn-cyan"
        >
          <span>Broadcast create_session to StudioNet</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
