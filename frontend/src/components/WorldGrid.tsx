import React, { useState, useMemo } from 'react';
import {
  Layers,
  CheckCircle,
  XCircle,
  Award,
  Eye,
  ThumbsUp,
  Sparkles,
  Zap,
  Droplets,
  Cpu,
  SlidersHorizontal,
  LayoutGrid,
  List,
  Search,
} from 'lucide-react';
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

function getVariableIcon(key: string) {
  const lower = key.toLowerCase();
  if (lower.includes('power') || lower.includes('energy') || lower.includes('grid')) {
    return <Zap className="w-3 h-3 text-amber-400" />;
  }
  if (lower.includes('water') || lower.includes('liquid') || lower.includes('cooling')) {
    return <Droplets className="w-3 h-3 text-[#3b82f6]" />;
  }
  return <Cpu className="w-3 h-3 text-[#00f5d4]" />;
}

export const WorldGrid: React.FC<WorldGridProps> = ({ session, onApproveWorld }) => {
  const [selectedWorldId, setSelectedWorldId] = useState<number | null>(0);
  const [viewMode, setViewMode] = useState<'cards' | 'grid'>('cards');
  const [filterMode, setFilterMode] = useState<'all' | 'feasible' | 'blocked'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const allWorlds = useMemo(() => computeWorlds(session.domain), [session.domain]);
  const feasibleWorldIds = useMemo(() => new Set(session.diagnosis?.world_ids || []), [session.diagnosis]);
  const committedWorldId = session.committed?.world_id;
  const isCompiled = session.status === 'FEASIBLE' || session.status === 'BLOCKED' || session.status === 'COMMITTED';
  const isFeasibleState = session.status === 'FEASIBLE';

  // Filtered worlds
  const filteredWorlds = useMemo(() => {
    return allWorlds
      .map((world, idx) => ({ world, idx }))
      .filter(({ world, idx }) => {
        const isFeasible = feasibleWorldIds.has(idx);

        if (filterMode === 'feasible' && isCompiled && !isFeasible) return false;
        if (filterMode === 'blocked' && isCompiled && isFeasible) return false;

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchId = String(idx).includes(q);
          const matchParam = Object.values(world).some((val) =>
            String(val).toLowerCase().includes(q)
          );
          if (!matchId && !matchParam) return false;
        }

        return true;
      });
  }, [allWorlds, feasibleWorldIds, filterMode, searchQuery, isCompiled]);

  const selectedWorld = selectedWorldId !== null && allWorlds[selectedWorldId] ? allWorlds[selectedWorldId] : null;

  return (
    <div className="glass-panel p-6 mb-8 border border-[var(--border-subtle)] hover:border-[var(--border-active)] transition-all">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#3b82f6]" />
              <span>Possibility Space Matrix</span>
            </h2>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#3b82f6]/10 text-[#3b82f6] border border-[#3b82f6]/30">
              {allWorlds.length} Discrete Worlds
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Every discrete parameter combination under negotiation. {isCompiled ? 'Evaluated by GenLayer AI Validators.' : 'Awaiting compiler consensus execution.'}
          </p>
        </div>

        {/* View Toggle, Filter & Search Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search by parameter */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search value (e.g. nuclear)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-2.5 py-1 text-xs w-44 font-mono bg-black/40 border-white/10 rounded-lg"
            />
          </div>

          {/* Filter Pills (if compiled) */}
          {isCompiled && (
            <div className="inline-flex p-0.5 rounded-lg bg-black/40 border border-white/10 text-xs">
              <button
                onClick={() => setFilterMode('all')}
                className={`px-2.5 py-1 rounded font-medium transition-all ${
                  filterMode === 'all' ? 'bg-[#161e31] text-[#00f5d4]' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                All ({allWorlds.length})
              </button>
              <button
                onClick={() => setFilterMode('feasible')}
                className={`px-2.5 py-1 rounded font-medium transition-all ${
                  filterMode === 'feasible' ? 'bg-[#161e31] text-emerald-400' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                Feasible ({feasibleWorldIds.size})
              </button>
              <button
                onClick={() => setFilterMode('blocked')}
                className={`px-2.5 py-1 rounded font-medium transition-all ${
                  filterMode === 'blocked' ? 'bg-[#161e31] text-rose-400' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                Blocked ({allWorlds.length - feasibleWorldIds.size})
              </button>
            </div>
          )}

          {/* Cards vs Compact Grid View Toggle */}
          <div className="inline-flex p-0.5 rounded-lg bg-black/40 border border-white/10 text-xs">
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded transition-all ${
                viewMode === 'cards' ? 'bg-[#161e31] text-[#00f5d4]' : 'text-gray-400 hover:text-gray-200'
              }`}
              title="Expanded Cyber Cards View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded transition-all ${
                viewMode === 'grid' ? 'bg-[#161e31] text-[#00f5d4]' : 'text-gray-400 hover:text-gray-200'
              }`}
              title="Compact Matrix Tile View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* VIEW 1: Expanded Cyber Cards View (Vibrant & Rich) */}
      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 mb-6 max-h-[580px] overflow-y-auto pr-1">
          {filteredWorlds.map(({ world, idx }) => {
            const isFeasible = feasibleWorldIds.has(idx);
            const isCommitted = committedWorldId === idx;
            const isSelected = selectedWorldId === idx;

            // Border & Glow styling
            let cardClasses = 'p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden ';
            if (isCommitted) {
              cardClasses += 'bg-[#00f5d4]/10 border-[#00f5d4] shadow-lg shadow-[#00f5d4]/15 ';
            } else if (!isCompiled) {
              cardClasses += isSelected
                ? 'bg-[#161e31] border-[#00f5d4]/60 shadow-md shadow-[#00f5d4]/10 '
                : 'bg-black/30 border-white/10 hover:border-[#00f5d4]/40 hover:bg-[#161e31]/80 ';
            } else if (isFeasible) {
              cardClasses += isSelected
                ? 'bg-emerald-500/15 border-emerald-400 shadow-md shadow-emerald-500/20 '
                : 'bg-emerald-500/5 border-emerald-500/30 hover:border-emerald-400 hover:bg-emerald-500/10 ';
            } else {
              cardClasses += isSelected
                ? 'bg-rose-500/15 border-rose-400 opacity-90 '
                : 'bg-black/40 border-rose-500/20 opacity-70 hover:opacity-100 hover:border-rose-500/40 ';
            }

            return (
              <div
                key={idx}
                onClick={() => setSelectedWorldId(idx)}
                className={cardClasses}
              >
                {/* Top Badge & World Tag */}
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-extrabold text-white px-2 py-0.5 rounded bg-white/5 border border-white/10">
                      W-{String(idx).padStart(2, '0')}
                    </span>
                    {isSelected && (
                      <span className="text-[10px] text-[#00f5d4] font-bold tracking-wider">
                        ACTIVE
                      </span>
                    )}
                  </div>

                  {/* Status Indicator */}
                  {isCommitted ? (
                    <span className="badge-status badge-committed flex items-center gap-1 text-[10px]">
                      <Award className="w-3 h-3" />
                      <span>Committed</span>
                    </span>
                  ) : !isCompiled ? (
                    <span className="text-[10px] font-mono text-cyan-300 px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5 text-[#00f5d4]" />
                      <span>Candidate</span>
                    </span>
                  ) : isFeasible ? (
                    <span className="badge-status badge-feasible flex items-center gap-1 text-[10px]">
                      <CheckCircle className="w-3 h-3 text-emerald-400" />
                      <span>Feasible</span>
                    </span>
                  ) : (
                    <span className="badge-status badge-blocked flex items-center gap-1 text-[10px]">
                      <XCircle className="w-3 h-3 text-rose-400" />
                      <span>Blocked</span>
                    </span>
                  )}
                </div>

                {/* Concrete Parameter Badges */}
                <div className="space-y-1.5 mb-3">
                  {Object.entries(world).map(([paramKey, paramVal]) => (
                    <div
                      key={paramKey}
                      className="flex items-center justify-between px-2.5 py-1 rounded-md bg-black/30 border border-white/5 text-xs"
                    >
                      <span className="text-gray-400 text-[11px] font-mono flex items-center gap-1.5">
                        {getVariableIcon(paramKey)}
                        <span>{paramKey}</span>
                      </span>
                      <span className="font-mono font-bold text-white text-[11px]">
                        {String(paramVal)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Card Action Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px]">
                  <span className="text-gray-500">
                    {isSelected ? 'Click to deselect' : 'Click to inspect'}
                  </span>

                  {isFeasibleState && isFeasible && onApproveWorld && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onApproveWorld(idx);
                      }}
                      className="px-2.5 py-1 rounded bg-[#00f5d4]/20 hover:bg-[#00f5d4]/30 text-[#00f5d4] border border-[#00f5d4]/40 font-semibold text-[11px] flex items-center gap-1 transition-colors"
                      title="Vote approval for this world configuration"
                    >
                      <ThumbsUp className="w-3 h-3" />
                      <span>Vote Approve</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* VIEW 2: Compact Matrix Tile View (Enhanced with color & badges) */
        <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-9 gap-2.5 mb-6">
          {filteredWorlds.map(({ world, idx }) => {
            const isFeasible = feasibleWorldIds.has(idx);
            const isCommitted = committedWorldId === idx;
            const isSelected = selectedWorldId === idx;

            let tileClass = 'p-3 rounded-xl border flex flex-col items-center justify-center cursor-pointer transition-all ';
            if (isCommitted) {
              tileClass += 'bg-[#00f5d4]/20 border-[#00f5d4] shadow-lg shadow-[#00f5d4]/20 ';
            } else if (!isCompiled) {
              tileClass += isSelected
                ? 'bg-[#161e31] border-[#00f5d4] ring-2 ring-[#00f5d4]/30 '
                : 'bg-black/30 border-white/10 hover:border-cyan-400/50 hover:bg-[#161e31] ';
            } else if (isFeasible) {
              tileClass += isSelected
                ? 'bg-emerald-500/20 border-emerald-400 ring-2 ring-emerald-400/40 '
                : 'bg-emerald-500/10 border-emerald-500/30 hover:border-emerald-400 ';
            } else {
              tileClass += isSelected
                ? 'bg-rose-500/20 border-rose-400 opacity-90 '
                : 'bg-black/40 border-rose-500/20 opacity-50 hover:opacity-90 ';
            }

            return (
              <div
                key={idx}
                onClick={() => setSelectedWorldId(idx)}
                className={tileClass}
                title={`World #${idx}: ${JSON.stringify(world)}`}
              >
                <span className="text-xs font-mono font-extrabold text-white mb-1">
                  #{idx}
                </span>

                <div className="my-1">
                  {isCommitted ? (
                    <Award className="w-4 h-4 text-[#00f5d4]" />
                  ) : !isCompiled ? (
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  ) : isFeasible ? (
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-rose-500" />
                  )}
                </div>

                <span className="text-[10px] text-gray-400 font-mono truncate max-w-full">
                  {String(Object.values(world)[0] || '')}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Selected World Assignment Drawer */}
      {selectedWorld && (
        <div className="p-4 rounded-xl bg-black/60 border border-white/10 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Eye className="w-4 h-4 text-[#00f5d4]" />
              <span className="font-bold text-sm text-white font-mono">
                World #{selectedWorldId} Selected Configuration
              </span>
              {!isCompiled ? (
                <span className="text-[10px] font-mono text-cyan-300 px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30">
                  Uncompiled Candidate World
                </span>
              ) : feasibleWorldIds.has(selectedWorldId!) ? (
                <span className="badge-status badge-feasible">Feasible Joint Candidate</span>
              ) : (
                <span className="badge-status badge-blocked">Violates Stakeholder Constraints</span>
              )}
              {committedWorldId === selectedWorldId && (
                <span className="badge-status badge-committed">Permanent Committed Accord</span>
              )}
            </div>

            {isFeasibleState && feasibleWorldIds.has(selectedWorldId!) && onApproveWorld && (
              <button
                onClick={() => onApproveWorld(selectedWorldId!)}
                className="btn-cyan text-xs py-1.5 px-3"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                <span>Cast Vote for World #{selectedWorldId}</span>
              </button>
            )}
          </div>

          {/* Detailed parameter breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {Object.entries(selectedWorld).map(([k, v]) => (
              <div key={k} className="p-3 rounded-lg bg-[#161e31] border border-white/5">
                <span className="text-[11px] font-mono text-gray-400 flex items-center gap-1.5">
                  {getVariableIcon(k)}
                  <span>{k}</span>
                </span>
                <span className="block text-sm font-bold font-mono text-[#00f5d4] mt-1">
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
