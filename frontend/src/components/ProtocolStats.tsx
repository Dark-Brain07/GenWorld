import React from 'react';
import { Cpu, Layers, GitFork, Shield, Hash } from 'lucide-react';
import { GENWORLD_CONFIG } from '../config/genlayer';

interface ProtocolStatsProps {
  sessionCount: number;
  activeSessionId: string;
}

export const ProtocolStats: React.FC<ProtocolStatsProps> = ({ sessionCount, activeSessionId }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      
      {/* Metric 1 */}
      <div className="glass-panel p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between text-gray-400 mb-2">
          <span className="text-xs uppercase tracking-wider font-semibold">Consensus Engine</span>
          <Cpu className="w-4 h-4 text-[#00f5d4]" />
        </div>
        <div>
          <div className="text-lg font-bold text-white tracking-wide">GenVM / LLM</div>
          <p className="text-[11px] text-gray-400 mt-0.5">Optimistic Equivalence</p>
        </div>
      </div>

      {/* Metric 2 */}
      <div className="glass-panel p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between text-gray-400 mb-2">
          <span className="text-xs uppercase tracking-wider font-semibold">Possibility Space</span>
          <Layers className="w-4 h-4 text-[#3b82f6]" />
        </div>
        <div>
          <div className="text-lg font-bold text-white tracking-wide">Max 64 Worlds</div>
          <p className="text-[11px] text-gray-400 mt-0.5">Bitmask SAT + MUS Cores</p>
        </div>
      </div>

      {/* Metric 3 */}
      <div className="glass-panel p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between text-gray-400 mb-2">
          <span className="text-xs uppercase tracking-wider font-semibold">On-Chain Sessions</span>
          <GitFork className="w-4 h-4 text-emerald-400" />
        </div>
        <div>
          <div className="text-lg font-bold text-white tracking-wide">{Math.max(sessionCount, 1)} Active</div>
          <p className="text-[11px] text-gray-400 mt-0.5 font-mono truncate">{activeSessionId || 'artemis_accord_prime'}</p>
        </div>
      </div>

      {/* Metric 4 */}
      <div className="glass-panel p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between text-gray-400 mb-2">
          <span className="text-xs uppercase tracking-wider font-semibold">Network Standard</span>
          <Shield className="w-4 h-4 text-amber-400" />
        </div>
        <div>
          <div className="text-lg font-bold text-white tracking-wide">GENWORLD-V1</div>
          <p className="text-[11px] text-gray-400 mt-0.5">StudioNet Chain 61999</p>
        </div>
      </div>

    </div>
  );
};
