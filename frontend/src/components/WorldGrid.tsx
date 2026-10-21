import React, { useState } from 'react';
import { Layers, CheckCircle, XCircle, Award, Eye, ThumbsUp } from 'lucide-react';
import { WorldSession, DomainVariable, ScalarValue } from '../types/genworld';

interface WorldGridProps {
  session: WorldSession;
  onApproveWorld?: (worldId: number) => void;
}

function computeWorlds(domain: DomainVariable[]): Record<string, ScalarValue>[] {
  if (!domain || domain.length === 0) return [];
  const keys = domain.map((d) => d.id);
  const pools = domain.map((d) => d.values);

  let result: ScalarValue[][] = [[]];
  for (const pool of pools) {
    const next: ScalarValue[][] = [];
    for (const r of result) {
      for (const val of pool) {
        next.push([...r, val]);
      }
    }
    result = next;
  }

  return result.map((row) => {
    const obj: Record<string, ScalarValue> = {};
    keys.forEach((k, i) => {
      obj[k] = row[i];
    });
    return obj;
  });
}

export const WorldGrid: React.FC<WorldGridProps> = ({ session, onApproveWorld }) => {
  const [selectedWorldId, setSelectedWorldId] = useState<number | null>(null);

  const allWorlds = computeWorlds(session.domain);
  const feasibleWorldIds = new Set(session.diagnosis?.world_ids || []);
  const committedWorldId = session.committed?.world_id;
  const isFeasibleState = session.status === 'FEASIBLE';

  const selectedWorld = selectedWorldId !== null ? allWorlds[selectedWorldId] : null;

  return (
    <div className="glass-panel p-6 mb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-6">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#3b82f6]" />
            <span>Possibility Space Matrix ({allWorlds.length} Worlds)</span>
          </h2>
          <p className="text-xs text-gray-400">
            Interactive Cartesian product of all discrete variable assignments under negotiation.
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-emerald-500/30 border border-emerald-500" />
            <span className="text-gray-300">Feasible ({feasibleWorldIds.size})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-rose-500/10 border border-rose-500/30" />
            <span className="text-gray-400">Blocked</span>
          </div>
          {committedWorldId !== undefined && (
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-[#00f5d4]/40 border border-[#00f5d4]" />
              <span className="text-[#00f5d4] font-semibold">Committed Plan</span>
            </div>
          )}
        </div>
      </div>

      {/* Grid of World Tiles */}
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2.5 mb-6">
        {allWorlds.map((world, idx) => {
          const isFeasible = feasibleWorldIds.has(idx);
          const isCommitted = committedWorldId === idx;
          const isSelected = selectedWorldId === idx;

          let tileClass = 'world-tile';
          if (isCommitted) tileClass += ' committed';
          else if (isFeasible) tileClass += ' feasible';
          else tileClass += ' blocked';

          if (isSelected) tileClass += ' ring-2 ring-white';

          return (
            <div
              key={idx}
              onClick={() => setSelectedWorldId(idx)}
              className={tileClass}
              title={`World #${idx}: ${JSON.stringify(world)}`}
            >
              <span className="text-[11px] font-mono font-bold text-gray-300">
                #{idx}
              </span>
              <div className="mt-1">
                {isCommitted ? (
                  <Award className="w-4 h-4 text-[#00f5d4]" />
                ) : isFeasible ? (
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <XCircle className="w-3 h-3 text-gray-500 opacity-40" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected World Assignment Drawer */}
      {selectedWorld && (
        <div className="p-4 rounded-xl bg-black/50 border border-white/10 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-[#00f5d4]" />
              <span className="font-bold text-sm text-white">World #{selectedWorldId} Assignment Details</span>
              {feasibleWorldIds.has(selectedWorldId!) && (
                <span className="badge-status badge-feasible">Feasible Candidate</span>
              )}
              {committedWorldId === selectedWorldId && (
                <span className="badge-status badge-committed">Committed Plan</span>
              )}
            </div>

            {isFeasibleState && feasibleWorldIds.has(selectedWorldId!) && onApproveWorld && (
              <button
                onClick={() => onApproveWorld(selectedWorldId!)}
                className="btn-cyan text-xs py-1.5 px-3"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                <span>Approve World #{selectedWorldId}</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {Object.entries(selectedWorld).map(([k, v]) => (
              <div key={k} className="p-3 rounded-lg bg-[#161e31] border border-white/5">
                <span className="block text-[11px] font-mono text-gray-400">{k}</span>
                <span className="block text-sm font-bold font-mono text-[#00f5d4] mt-0.5">
                  {String(v)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
