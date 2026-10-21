import React, { useState } from 'react';
import { Award, CheckCircle2, ShieldCheck, ThumbsUp, Lock } from 'lucide-react';
import { WorldSession } from '../types/genworld';

interface ApprovalVaultProps {
  session: WorldSession;
  currentAccount: string;
  onRequestTx: (fn: string, args: any[], title: string, desc: string) => Promise<any>;
  onRefresh: () => void;
}

export const ApprovalVault: React.FC<ApprovalVaultProps> = ({
  session,
  currentAccount,
  onRequestTx,
  onRefresh,
}) => {
  const isCommitted = session.status === 'COMMITTED';
  const isFeasible = session.status === 'FEASIBLE';

  if (!isCommitted && !isFeasible) return null;

  const feasibleWorlds = session.diagnosis?.world_ids || [];
  const normalizedCaller = currentAccount.toLowerCase();
  const callerApprovedWorld = session.approvals ? session.approvals[normalizedCaller] : undefined;

  const [selectedWorld, setSelectedWorld] = useState<number>(
    callerApprovedWorld !== undefined ? callerApprovedWorld : feasibleWorlds[0] || 0
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleApprove = async () => {
    setIsSubmitting(true);
    try {
      const stateHash = session.committed?.state_hash || session.input_hash || '';
      await onRequestTx(
        'approve_plan',
        [session.id, selectedWorld, stateHash],
        'Approve Feasible Plan',
        `Casting stakeholder approval vote for candidate World #${selectedWorld} on StudioNet`
      );
      onRefresh();
    } catch (err) {
      console.error('Approval failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="glass-panel p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            {isCommitted ? (
              <ShieldCheck className="w-5 h-5 text-[#00f5d4]" />
            ) : (
              <Award className="w-5 h-5 text-emerald-400" />
            )}
            <span>Unanimous Consensus & Commitment Vault</span>
          </h2>
          <p className="text-xs text-gray-400">
            {isCommitted
              ? 'Multi-stakeholder agreement finalized and permanently committed on GenLayer.'
              : 'Requires unanimous vote from all roster participants to seal immutable plan commitment.'}
          </p>
        </div>

        <span className={`badge-status ${isCommitted ? 'badge-committed' : 'badge-feasible'}`}>
          {isCommitted ? 'COMMITTED · FINALIZED' : 'VOTING IN PROGRESS'}
        </span>
      </div>

      {/* Committed Final State Display */}
      {isCommitted && session.committed && (
        <div className="p-5 rounded-xl bg-gradient-to-r from-[#00f5d4]/15 via-emerald-500/10 to-transparent border border-[#00f5d4]/40 mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#00f5d4] flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>Finalized Plan: World #{session.committed.world_id} (Revision {session.committed.revision})</span>
            </span>
            <span className="text-[11px] font-mono text-gray-400 truncate max-w-xs">
              State Hash: {session.committed.state_hash.slice(0, 16)}...
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {Object.entries(session.committed.plan).map(([k, v]) => (
              <div key={k} className="p-3 rounded-lg bg-black/50 border border-white/10">
                <span className="block text-[11px] font-mono text-gray-400">{k}</span>
                <span className="block text-sm font-bold font-mono text-[#00f5d4] mt-0.5">
                  {String(v)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Voting Interface if FEASIBLE */}
      {isFeasible && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {session.roster.map((member, idx) => {
              const approvedWorld = session.approvals ? session.approvals[member] : undefined;
              const isYou = member.toLowerCase() === normalizedCaller;

              return (
                <div key={member} className="p-4 rounded-xl bg-[#161e31] border border-white/5">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-mono font-bold text-gray-300">
                      Stakeholder #{idx + 1} {isYou && <span className="text-[#00f5d4]">(You)</span>}
                    </span>
                    {approvedWorld !== undefined ? (
                      <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Voted World #{approvedWorld}</span>
                      </span>
                    ) : (
                      <span className="text-xs font-mono text-amber-400">
                        Awaiting Vote
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-mono text-gray-400 truncate">{member}</p>
                </div>
              );
            })}
          </div>

          {/* Voting Action */}
          <div className="p-4 rounded-xl bg-black/40 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <label className="text-xs font-semibold text-gray-300 whitespace-nowrap">
                Select Feasible World to Approve:
              </label>
              <select
                value={selectedWorld}
                onChange={(e) => setSelectedWorld(Number(e.target.value))}
                className="font-mono text-xs max-w-xs"
              >
                {feasibleWorlds.map((wId) => (
                  <option key={wId} value={wId}>
                    Candidate World #{wId}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleApprove}
              disabled={isSubmitting}
              className="btn-cyan py-2 text-xs"
            >
              <ThumbsUp className="w-3.5 h-3.5" />
              <span>Cast Approval for World #{selectedWorld}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
