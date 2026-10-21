import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { ProtocolStats } from './components/ProtocolStats';
import { SessionCreator } from './components/SessionCreator';
import { ConditionSealer } from './components/ConditionSealer';
import { WorldGrid } from './components/WorldGrid';
import { ConflictDiagnosis } from './components/ConflictDiagnosis';
import { ApprovalVault } from './components/ApprovalVault';
import { TransactionModal } from './components/TransactionModal';
import { genworldService } from './services/genworldService';
import { WorldSession, TransactionLifecycleState } from './types/genworld';
import { GENWORLD_CONFIG } from './config/genlayer';
import { Search, RefreshCw, ExternalLink, Plus, Terminal } from 'lucide-react';

export const App: React.FC = () => {
  const [currentAccount, setCurrentAccount] = useState<string>('');
  const [activeSessionId, setActiveSessionId] = useState<string>(GENWORLD_CONFIG.defaultSessionId);
  const [session, setSession] = useState<WorldSession | null>(null);
  const [sessionList, setSessionList] = useState<string[]>([]);
  const [isLoadingSession, setIsLoadingSession] = useState<boolean>(true);
  const [showCreator, setShowCreator] = useState<boolean>(false);

  const [txState, setTxState] = useState<TransactionLifecycleState>({
    isOpen: false,
    txHash: '',
    stage: 'idle',
    title: '',
    description: '',
  });

  useEffect(() => {
    const addr = genworldService.getSessionAddress();
    setCurrentAccount(addr);
    loadSessionsList();
    loadSession(GENWORLD_CONFIG.defaultSessionId);
  }, []);

  const loadSessionsList = async () => {
    const list = await genworldService.listSessions(0, 20);
    setSessionList(list.length > 0 ? list : [GENWORLD_CONFIG.defaultSessionId]);
  };

  const loadSession = async (sessionId: string) => {
    setIsLoadingSession(true);
    try {
      const data = await genworldService.getSession(sessionId);
      if (data) {
        setSession(data);
        setActiveSessionId(sessionId);
      } else {
        setSession(null);
      }
    } catch (err) {
      console.error('Error fetching session:', err);
    } finally {
      setIsLoadingSession(false);
    }
  };

  const handleRequestTx = async (
    functionName: string,
    args: any[],
    title: string,
    description: string
  ): Promise<any> => {
    setTxState({
      isOpen: true,
      txHash: '',
      stage: 'preparing',
      title,
      description,
    });

    try {
      const res = await genworldService.sendTransaction(functionName, args, (update) => {
        setTxState((prev) => ({
          ...prev,
          txHash: update.txHash,
          stage: update.stage,
          explorerUrl: update.explorerUrl,
          receipt: update.receipt,
          error: update.error,
        }));
      });
      return res;
    } catch (err: any) {
      setTxState((prev) => ({
        ...prev,
        stage: 'error',
        error: err?.message || String(err),
      }));
      throw err;
    }
  };

  const handleApproveWorldFromGrid = async (worldId: number) => {
    if (!session) return;
    const stateHash = session.committed?.state_hash || session.input_hash || '';
    await handleRequestTx(
      'approve_plan',
      [session.id, worldId, stateHash],
      `Approve World #${worldId}`,
      `Submitting stakeholder approval for candidate World #${worldId} on GenLayer StudioNet`
    );
    loadSession(session.id);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-white flex flex-col justify-between">
      
      {/* Navigation */}
      <div>
        <Navbar accountAddress={currentAccount} />

        {/* Main Content Area */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Hero Banner */}
          <div className="mb-8 p-8 rounded-2xl glass-panel relative overflow-hidden">
            <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-[#00f5d4]/10 blur-3xl pointer-events-none" />
            <div className="absolute -left-16 -bottom-16 w-80 h-80 rounded-full bg-[#3b82f6]/10 blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-3xl">
              <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#00f5d4] px-3 py-1 rounded-full bg-[#00f5d4]/10 border border-[#00f5d4]/30 mb-4">
                <span>Autonomous Agreement Consensus</span>
              </span>

              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
                Decentralized Multi-Stakeholder Plan Alignment Protocol
              </h1>

              <p className="text-sm sm:text-base text-gray-300 mb-6 leading-relaxed">
                Stakeholders declare a discrete world possibility space and submit requirements in plain natural language. 
                GenLayer AI validators compile rules into typed boolean ASTs, and the on-chain SAT engine isolates Minimal Unsatisfiable Subsets (MUS cores) to resolve conflicts before unanimous commitment.
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setShowCreator(!showCreator)}
                  className="btn-cyan"
                >
                  <Plus className="w-4 h-4" />
                  <span>{showCreator ? 'Hide Session Launcher' : 'Launch New Session'}</span>
                </button>

                <a
                  href={`${GENWORLD_CONFIG.explorerBaseUrl}/address/${GENWORLD_CONFIG.contractAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-outline"
                >
                  <Terminal className="w-4 h-4 text-gray-400" />
                  <span>View Contract on Explorer</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                </a>
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <ProtocolStats
            sessionCount={sessionList.length}
            activeSessionId={activeSessionId}
          />

          {/* Collapsible Session Launcher */}
          {showCreator && (
            <SessionCreator
              currentAccount={currentAccount}
              onSessionCreated={(newId) => {
                setShowCreator(false);
                loadSessionsList();
                loadSession(newId);
              }}
              onRequestTx={handleRequestTx}
            />
          )}

          {/* Active Session Switcher Toolbar */}
          <div className="glass-panel p-4 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={activeSessionId}
                  onChange={(e) => setActiveSessionId(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadSession(activeSessionId)}
                  placeholder="Enter session ID..."
                  className="pl-9 pr-3 py-1.5 text-xs font-mono"
                />
              </div>

              <button
                onClick={() => loadSession(activeSessionId)}
                className="btn-cyan text-xs py-2 px-3"
              >
                <span>Load</span>
              </button>
            </div>

            {/* Quick Session List Dropdown */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <span className="text-xs text-gray-400 whitespace-nowrap">On-Chain Sessions:</span>
              <select
                value={activeSessionId}
                onChange={(e) => loadSession(e.target.value)}
                className="text-xs font-mono py-1.5 px-3 max-w-xs"
              >
                {sessionList.map((sid) => (
                  <option key={sid} value={sid}>
                    {sid}
                  </option>
                ))}
              </select>

              <button
                onClick={() => {
                  loadSessionsList();
                  loadSession(activeSessionId);
                }}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 transition-colors"
                title="Refresh from GenLayer"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Session Detail Content */}
          {isLoadingSession ? (
            <div className="glass-panel p-16 text-center text-gray-400">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-[#00f5d4]" />
              <p className="text-sm font-medium">Fetching verified state from GenLayer StudioNet...</p>
            </div>
          ) : session ? (
            <div>
              {/* 1. Condition Sealer & Compiler Trigger */}
              <ConditionSealer
                session={session}
                currentAccount={currentAccount}
                onRequestTx={handleRequestTx}
                onRefresh={() => loadSession(session.id)}
              />

              {/* 2. Interactive World Possibility Matrix */}
              <WorldGrid
                session={session}
                onApproveWorld={handleApproveWorldFromGrid}
              />

              {/* 3. Formal Conflict Diagnosis (MUS Cores & MCS Repairs) */}
              <ConflictDiagnosis
                session={session}
                currentAccount={currentAccount}
                onRequestTx={handleRequestTx}
                onRefresh={() => loadSession(session.id)}
              />

              {/* 4. Approval Vault & Commitment */}
              <ApprovalVault
                session={session}
                currentAccount={currentAccount}
                onRequestTx={handleRequestTx}
                onRefresh={() => loadSession(session.id)}
              />
            </div>
          ) : (
            <div className="glass-panel p-16 text-center text-gray-400">
              <p className="text-sm font-medium text-white mb-1">Session Not Found on GenLayer</p>
              <p className="text-xs text-gray-400 mb-4">
                No active session matching ID '{activeSessionId}' exists in contract storage.
              </p>
              <button
                onClick={() => loadSession(GENWORLD_CONFIG.defaultSessionId)}
                className="btn-cyan text-xs py-2 px-4 inline-flex"
              >
                <span>Load Flagship Session: {GENWORLD_CONFIG.defaultSessionId}</span>
              </button>
            </div>
          )}

        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-[var(--border-subtle)] bg-[#07090e] py-8 text-xs text-gray-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="font-bold text-white tracking-wider">GENWORLD PROTOCOL</span>
            <span className="mx-2 text-gray-600">·</span>
            <span>Decentralized Constraint Alignment on GenVM</span>
          </div>

          <div className="flex items-center gap-6">
            <a
              href="https://docs.genlayer.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              GenLayer Docs
            </a>
            <a
              href={`${GENWORLD_CONFIG.explorerBaseUrl}/address/${GENWORLD_CONFIG.contractAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#00f5d4] hover:underline flex items-center gap-1 font-mono"
            >
              <span>Explorer</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <span className="text-gray-500 font-mono">Chain ID: 61999</span>
          </div>
        </div>
      </footer>

      {/* Transaction Lifecycle Modal */}
      <TransactionModal
        state={txState}
        onClose={() => setTxState((prev) => ({ ...prev, isOpen: false }))}
      />

    </div>
  );
};
