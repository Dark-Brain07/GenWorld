import React, { useState } from 'react';
import { Lock, Cpu, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { WorldSession } from '../types/genworld';

interface ConditionSealerProps {
  session: WorldSession;
  currentAccount: string;
  onRequestTx: (fn: string, args: any[], title: string, desc: string) => Promise<any>;
  onRefresh: () => void;
}

export const ConditionSealer: React.FC<ConditionSealerProps> = ({
  session,
  currentAccount,
  onRequestTx,
  onRefresh,
}) => {
  const [conditionText, setConditionText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const normalizedCaller = currentAccount.toLowerCase();
  const hasSealed = Boolean(session.sealed && session.sealed[normalizedCaller]);
  const isAwaitingCompile = session.status === 'AWAITING_COMPILATION';

  const handleSeal = async () => {
    if (!conditionText.trim()) return;
    setIsSubmitting(true);

    try {
      await onRequestTx(
        'seal_conditions',
        [session.id, [conditionText.trim()]],
        'Seal Stakeholder Conditions',
        `Committing cryptographic constraint submission for stakeholder ${normalizedCaller.slice(0, 6)}...`
      );
      setConditionText('');
      onRefresh();
    } catch (err) {
      console.error('Failed to seal condition:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompile = async () => {
    setIsSubmitting(true);
    try {
      await onRequestTx(
        'compile_session',
        [session.id],
        'Trigger GenLayer AI Consensus',
        `Decentralized AI validators are compiling natural language constraints into verifiable boolean ASTs over ${session.id}`
      );
      onRefresh();
    } catch (err) {
      console.error('Failed to compile session:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="glass-panel p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Lock className="w-5 h-5 text-[#00f5d4]" />
            <span>Stakeholder Constraint Submission</span>
          </h2>
          <p className="text-xs text-gray-400">
            Submit natural language requirements in plain text. GenLayer AI validators independently compile them into discrete ASTs.
          </p>
        </div>

        <span className={`badge-status ${
          session.status === 'COLLECTING'
            ? 'badge-collecting'
            : session.status === 'AWAITING_COMPILATION'
            ? 'badge-awaiting'
            : session.status === 'FEASIBLE'
            ? 'badge-feasible'
            : 'badge-blocked'
        }`}>
          {session.status}
        </span>
      </div>

      {/* Roster Submission Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {session.roster.map((member, idx) => {
          const memberSealed = session.sealed && session.sealed[member];
          const isYou = member.toLowerCase() === normalizedCaller;

          return (
            <div
              key={member}
              className={`p-4 rounded-xl border ${
                memberSealed
                  ? 'bg-emerald-500/5 border-emerald-500/20'
                  : 'bg-black/30 border-white/5'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold text-gray-300">
                  Stakeholder #{idx + 1} {isYou && <span className="text-[#00f5d4]">(You)</span>}
                </span>
                {memberSealed ? (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Sealed ({memberSealed.length} condition)</span>
                  </span>
                ) : (
                  <span className="text-[11px] font-mono text-amber-400">
                    Pending Submission
                  </span>
                )}
              </div>

              <div className="font-mono text-xs text-gray-400 truncate mb-3">
                {member}
              </div>

              {memberSealed && (
                <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 text-xs text-gray-300 italic">
                  "{memberSealed[0]}"
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Input Form if not sealed and status is COLLECTING */}
      {session.status === 'COLLECTING' && !hasSealed && (
        <div className="p-4 rounded-xl bg-black/40 border border-white/5 mb-4">
          <label className="block text-xs font-medium text-gray-300 mb-2">
            Your Natural Language Constraint / Policy
          </label>
          <textarea
            rows={3}
            value={conditionText}
            onChange={(e) => setConditionText(e.target.value)}
            placeholder="e.g. Primary power source must be nuclear or fusion for baseload radiation shield safety during lunar night."
            className="mb-3 resize-none"
          />
          <div className="flex justify-end">
            <button
              onClick={handleSeal}
              disabled={isSubmitting || !conditionText.trim()}
              className="btn-cyan"
            >
              <Lock className="w-4 h-4" />
              <span>Seal Condition on StudioNet</span>
            </button>
          </div>
        </div>
      )}

      {/* Trigger AI Compilation when all sealed */}
      {isAwaitingCompile && (
        <div className="p-5 rounded-xl bg-gradient-to-r from-amber-500/10 via-[#00f5d4]/10 to-transparent border border-amber-500/30 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>All Stakeholders Sealed — Ready for GenLayer Consensus</span>
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              Input digest: <span className="font-mono text-amber-300">{session.input_hash?.slice(0, 16)}...</span>
            </p>
          </div>

          <button
            onClick={handleCompile}
            disabled={isSubmitting}
            className="btn-cyan bg-gradient-to-r from-amber-400 to-[#00f5d4] hover:opacity-95"
          >
            <Cpu className="w-4 h-4" />
            <span>Execute compile_session (AI Consensus)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
