import React from 'react';
import { ShieldCheck, ExternalLink, Key, Copy, Check, Wallet, AlertTriangle, LogOut, RefreshCw } from 'lucide-react';
import { GENWORLD_CONFIG } from '../config/genlayer';

interface NavbarProps {
  accountAddress: string;
  walletMode: 'browser' | 'session';
  browserAddress: string | null;
  isConnecting: boolean;
  isCorrectNetwork: boolean;
  onConnectBrowserWallet: () => void;
  onDisconnectBrowserWallet: () => void;
  onSwitchToStudioNet: () => void;
  onToggleWalletMode: (mode: 'browser' | 'session') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  accountAddress,
  walletMode,
  browserAddress,
  isConnecting,
  isCorrectNetwork,
  onConnectBrowserWallet,
  onDisconnectBrowserWallet,
  onSwitchToStudioNet,
  onToggleWalletMode,
}) => {
  const [copied, setCopied] = React.useState(false);

  const copyAddress = () => {
    if (!accountAddress) return;
    navigator.clipboard.writeText(accountAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shortAddr = accountAddress
    ? `${accountAddress.slice(0, 6)}...${accountAddress.slice(-4)}`
    : 'Not Connected';

  const shortContract = `${GENWORLD_CONFIG.contractAddress.slice(0, 6)}...${GENWORLD_CONFIG.contractAddress.slice(-4)}`;

  return (
    <header className="border-b border-[var(--border-subtle)] bg-[rgba(7,9,14,0.92)] sticky top-0 z-40 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-[64px] py-2 flex flex-col md:flex-row items-center justify-between gap-3">
        
        {/* Brand & Emblem */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-[#00f5d4] via-[#7928ca] to-[#3b82f6] p-[1.5px] flex items-center justify-center shadow-lg shadow-[#00f5d4]/20 group flex-shrink-0">
            <div className="w-full h-full bg-[#07090e] rounded-[10px] flex items-center justify-center overflow-hidden">
              <img
                src="/logo_transparent.png"
                alt="GenWorld Pixel Emblem"
                className="nav-logo-img hover:scale-110 transition-transform duration-300"
              />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-wider text-white">GENWORLD</span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-[#00f5d4]/10 text-[#00f5d4] border border-[#00f5d4]/30">
                v1.0
              </span>
            </div>
            <p className="text-[11px] text-gray-400">Decentralized Constraint Alignment Protocol</p>
          </div>
        </div>

        {/* Network & Contract Badge */}
        <div className="hidden lg:flex items-center gap-3">
          {/* Wrong Network Warning Pill */}
          {walletMode === 'browser' && browserAddress && !isCorrectNetwork ? (
            <button
              onClick={onSwitchToStudioNet}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 transition-all text-xs font-semibold animate-pulse"
              title="Click to switch your browser wallet network to GenLayer StudioNet"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Switch to StudioNet (61999)</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[rgba(255,255,255,0.03)] border border-[var(--border-subtle)]">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-semibold text-gray-300">StudioNet (Chain 61999)</span>
            </div>
          )}

          <a
            href={`${GENWORLD_CONFIG.explorerBaseUrl}/address/${GENWORLD_CONFIG.contractAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#00f5d4]/5 border border-[#00f5d4]/20 hover:border-[#00f5d4]/50 transition-all text-xs font-mono text-[#00f5d4]"
            title="View Deployed Contract on GenLayer Explorer"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Contract: {shortContract}</span>
            <ExternalLink className="w-3 h-3 opacity-70" />
          </a>
        </div>

        {/* Wallet Controls & Mode Switcher */}
        <div className="flex flex-wrap items-center gap-2 justify-end w-full md:w-auto">
          
          {/* Mode Switcher Pill */}
          <div className="inline-flex p-0.5 rounded-lg bg-[#0d121d] border border-[var(--border-subtle)] text-xs">
            <button
              onClick={() => onToggleWalletMode('browser')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all flex items-center gap-1.5 ${
                walletMode === 'browser'
                  ? 'bg-[#161e31] text-[#00f5d4] shadow-sm border border-[#00f5d4]/30'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
              title="Use MetaMask, Rabby, or browser injected Web3 wallet"
            >
              <Wallet className="w-3 h-3" />
              <span>Browser Wallet</span>
            </button>

            <button
              onClick={() => onToggleWalletMode('session')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all flex items-center gap-1.5 ${
                walletMode === 'session'
                  ? 'bg-[#161e31] text-[#00f5d4] shadow-sm border border-[#00f5d4]/30'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
              title="Use dedicated instant gasless session key"
            >
              <Key className="w-3 h-3" />
              <span>Session Key</span>
            </button>
          </div>

          {/* Action / Address Controls */}
          {walletMode === 'browser' ? (
            browserAddress ? (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={copyAddress}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#161e31] border border-[var(--border-subtle)] hover:border-[#00f5d4]/40 transition-all text-xs font-mono text-gray-200 hover:text-white"
                  title="Click to copy connected wallet address"
                >
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>{shortAddr}</span>
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-gray-400" />}
                </button>

                <button
                  onClick={onDisconnectBrowserWallet}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 border border-[var(--border-subtle)] transition-colors"
                  title="Disconnect Browser Wallet"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onConnectBrowserWallet}
                disabled={isConnecting}
                className="btn-cyan text-xs py-1.5 px-3 flex items-center gap-2"
                title="Connect MetaMask or Web3 Browser Wallet"
              >
                {isConnecting ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Wallet className="w-3.5 h-3.5" />
                )}
                <span>{isConnecting ? 'Connecting...' : 'Connect Wallet'}</span>
              </button>
            )
          ) : (
            <button
              onClick={copyAddress}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#161e31] border border-[var(--border-subtle)] hover:border-[#00f5d4]/40 transition-all text-xs font-mono text-gray-300 hover:text-white"
              title="Click to copy active session account address"
            >
              <Key className="w-3.5 h-3.5 text-[#00f5d4]" />
              <span>{shortAddr}</span>
              <span className="text-[10px] text-[#00f5d4] px-1 py-0.2 rounded bg-[#00f5d4]/10 border border-[#00f5d4]/20">Gasless</span>
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-gray-400" />}
            </button>
          )}

        </div>

      </div>
    </header>
  );
};
