import React from 'react';
import { ExternalLink, CheckCircle2, AlertTriangle, Loader2, X, ShieldAlert, Cpu } from 'lucide-react';
import { TransactionLifecycleState } from '../types/genworld';

interface TransactionModalProps {
  state: TransactionLifecycleState;
  onClose: () => void;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({ state, onClose }) => {
  if (!state.isOpen) return null;

  const isFinalized = state.stage === 'finalized';
  const isError = state.stage === 'error';
  const isPending = !isFinalized && !isError;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg p-6 rounded-2xl bg-[#0d121d] border border-[var(--border-active)] shadow-2xl shadow-[#00f5d4]/10 text-white">
        
        {/* Close Button */}
        {(isFinalized || isError) && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Header Visual */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white/5 border border-white/10">
            {isPending && <Loader2 className="w-6 h-6 text-[#00f5d4] animate-spin" />}
            {isFinalized && <CheckCircle2 className="w-6 h-6 text-emerald-400" />}
            {isError && <AlertTriangle className="w-6 h-6 text-rose-500" />}
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{state.title}</h3>
            <p className="text-xs text-gray-400">{state.description}</p>
          </div>
        </div>

        {/* Live Consensus Steps Indicator */}
        <div className="mb-6 p-4 rounded-xl bg-black/40 border border-white/5">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider mb-2">
            <span className={state.stage === 'preparing' ? 'text-[#00f5d4]' : 'text-gray-400'}>
              1. Preparing
            </span>
            <span className={state.stage === 'submitted' ? 'text-[#00f5d4]' : 'text-gray-400'}>
              2. Broadcast
            </span>
            <span className={state.stage === 'proposing' ? 'text-[#00f5d4]' : 'text-gray-400'}>
              3. AI Consensus
            </span>
            <span className={isFinalized ? 'text-emerald-400' : 'text-gray-400'}>
              4. Finalized
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                isError
                  ? 'bg-rose-500 w-full'
                  : isFinalized
                  ? 'bg-emerald-400 w-full'
                  : 'bg-gradient-to-r from-[#00f5d4] to-[#3b82f6] animate-pulse w-3/4'
              }`}
            />
          </div>

          <div className="mt-3 flex items-center gap-2 text-[11px] text-gray-400">
            <Cpu className="w-3.5 h-3.5 text-[#00f5d4]" />
            <span>
              {state.stage === 'preparing' && 'Constructing transaction payload...'}
              {state.stage === 'submitted' && 'Transaction submitted to GenLayer StudioNet mempool.'}
              {state.stage === 'proposing' && 'Validators executing non-deterministic AI verification...'}
              {isFinalized && 'Optimistic Democracy consensus reached and state finalized on-chain.'}
              {isError && 'Transaction reverted or failed validator verification.'}
            </span>
          </div>
        </div>

        {/* Transaction Hash & Explorer Link */}
        {state.txHash && (
          <div className="mb-5 p-3 rounded-xl bg-[#161e31] border border-white/5 text-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="text-gray-400">Transaction Hash</span>
              {state.explorerUrl && (
                <a
                  href={state.explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[#00f5d4] hover:underline font-medium"
                >
                  <span>GenLayer Explorer</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
            <p className="font-mono text-[11px] text-gray-200 break-all select-all">
              {state.txHash}
            </p>
          </div>
        )}

        {/* Error Details */}
        {isError && state.error && (
          <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
            <div className="break-all font-mono text-[11px]">
              {state.error}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-4">
          {(isFinalized || isError) && (
            <button
              onClick={onClose}
              className="btn-cyan w-full justify-center"
            >
              Continue
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
