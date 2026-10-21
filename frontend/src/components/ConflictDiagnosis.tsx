import React, { useState } from 'react';
import { AlertOctagon, CheckCircle2, RefreshCw, Undo2, Wrench, FileCode2 } from 'lucide-react';
import { WorldSession } from '../types/genworld';

interface ConflictDiagnosisProps {
  session: WorldSession;
  currentAccount: string;
  onRequestTx: (fn: string, args: any[], title: string, desc: string) => Promise<any>;
  onRefresh: () => void;
}

export const ConflictDiagnosis: React.FC<ConflictDiagnosisProps> = ({
  session,
  currentAccount,
  onRequestTx,
  onRefresh,
}) => {
  const [waivingClauseId, setWaivingClauseId] = useState<string | null>(null);

  if (!session.diagnosis && !session.compilation) return null;

  const isBlocked = session.status === 'BLOCKED';
  const isFeasible = session.status === 'FEASIBLE';
  const isReviewRequired = session.status === 'REVIEW_REQUIRED';

  const clauses = [];
  for (const owner of session.roster) {
    for (const textVal of session.sealed[owner] || []) {
      clauses.push({
        id: `C${clauses.length}`,
        owner,
        text: textVal,
      });
    }
  }

  const handleWaive = async (clauseId: string) => {
    setWaivingClauseId(clauseId);
    try {
      // Need current state hash to prevent race conditions
      const stateHash = session.committed?.state_hash || session.input_hash || '';
      await onRequestTx(
        'waive_condition',
        [session.id, clauseId, stateHash],
        'Waive Conflicting Condition',
        `Waiving ${clauseId} to resolve mutual constraint deadlock and restore feasibility`
      );
      onRefresh();
    } catch (err) {
      console.error('Failed to waive condition:', err);
    } finally {
      setWaivingClauseId(null);
    }
  };

  return (
    <div className="glass-panel p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            {isBlocked ? (
              <AlertOctagon className="w-5 h-5 text-rose-500" />
            ) : isReviewRequired ? (
              <AlertOctagon className="w-5 h-5 text-amber-500" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            )}
            <span>Formal Conflict Diagnosis & Satisfiability Engine</span>
          </h2>
          <p className="text-xs text-gray-400">
            Mathematical resolution of compiled boolean constraints across discrete state space. Revision: r{session.revision}.
          </p>
        </div>

        <span className={`badge-status ${isBlocked ? 'badge-blocked' : isReviewRequired ? 'badge-awaiting' : 'badge-feasible'}`}>
          {isBlocked ? 'Deadlock / Blocked' : isReviewRequired ? 'Ambiguous / Review' : 'Feasible Solutions Found'}
        </span>
      </div>

      {/* Blocked State: Minimal Unsatisfiable Subsets (MUS) */}
      {isBlocked && session.diagnosis?.minimal_cores && session.diagnosis.minimal_cores.length > 0 && (
        <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30">
          <h3 className="text-xs font-bold uppercase tracking-wider text-rose-400 mb-3 flex items-center gap-2">
            <AlertOctagon className="w-4 h-4" />
            <span>Minimal Unsatisfiable Subsets (Conflict Cores)</span>
          </h3>

          <div className="space-y-3">
            {session.diagnosis.minimal_cores.map((core, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-black/40 border border-rose-500/20 text-xs">
                <span className="font-semibold text-rose-300 block mb-1">
                  Core #{idx + 1}: Mutually exclusive constraint loop between:
                </span>
                <div className="space-y-1.5 pl-2 border-l-2 border-rose-500/40 my-2">
                  {core.members.map((memberIdx) => {
                    const clause = clauses[memberIdx];
                    if (!clause) return null;
                    const isOwner = clause.owner.toLowerCase() === currentAccount.toLowerCase();

                    return (
                      <div key={clause.id} className="flex items-center justify-between gap-2">
                        <div className="text-gray-300">
                          <span className="font-mono font-bold text-rose-400 mr-2">[{clause.id}]</span>
                          <span className="italic">"{clause.text}"</span>
                          <span className="text-gray-400 text-[11px] ml-2">({clause.owner.slice(0, 6)}...)</span>
                        </div>

                        {isOwner && !session.waived.includes(memberIdx) && (
                          <button
                            onClick={() => handleWaive(clause.id)}
                            disabled={waivingClauseId === clause.id}
                            className="btn-outline text-[11px] py-1 px-2.5 text-rose-400 border-rose-500/30 hover:bg-rose-500/20"
                            title="Waive your condition to resolve conflict"
                          >
                            <Undo2 className="w-3 h-3" />
                            <span>Waive Clause</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Minimal Correction Sets (MCS Repairs) */}
      {isBlocked && session.diagnosis?.minimal_corrections && session.diagnosis.minimal_corrections.length > 0 && (
        <div className="mb-6 p-4 rounded-xl bg-[#161e31] border border-white/5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2 flex items-center gap-2">
            <Wrench className="w-4 h-4" />
            <span>Minimal Correction Repair Paths</span>
          </h3>
          <p className="text-xs text-gray-400 mb-3">
            Removing any of the following constraint sets immediately restores joint feasibility:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {session.diagnosis.minimal_corrections.map((repair, idx) => (
              <div key={idx} className="p-2.5 rounded-lg bg-black/40 border border-white/5 text-xs flex items-center justify-between">
                <div>
                  <span className="text-gray-400">Remove: </span>
                  <span className="font-mono font-bold text-[#00f5d4]">
                    {repair.remove_clauses.map((c) => `C${c}`).join(', ')}
                  </span>
                </div>
                <span className="text-[11px] text-emerald-400 font-mono">
                  Restores World #{repair.restored_world}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Compiled Boolean AST Rules */}
      {session.compilation && session.compilation.length > 0 && (
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-2">
            <FileCode2 className="w-4 h-4 text-[#00f5d4]" />
            <span>Compiled AST Predicates</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {session.compilation.map((rule) => (
              <div key={rule.clause_id} className="p-3 rounded-lg bg-[#161e31] border border-white/5 text-xs font-mono">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[#00f5d4] font-bold">[{rule.clause_id}]</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${rule.status === 'COMPILED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                    {rule.status}
                  </span>
                </div>
                <div className="text-gray-300 text-[11px] bg-black/50 p-2 rounded overflow-x-auto">
                  {rule.expr ? JSON.stringify(rule.expr, null, 2) : 'null'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
