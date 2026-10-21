import React from 'react';
import { Globe, ShieldCheck, ExternalLink, Key, Copy, Check } from 'lucide-react';
import { GENWORLD_CONFIG } from '../config/genlayer';

interface NavbarProps {
  accountAddress: string;
}

export const Navbar: React.FC<NavbarProps> = ({ accountAddress }) => {
  const [copied, setCopied] = React.useState(false);

  const copyAddress = () => {
    navigator.clipboard.writeText(accountAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shortAddr = accountAddress
    ? `${accountAddress.slice(0, 6)}...${accountAddress.slice(-4)}`
    : 'Not Connected';

  const shortContract = `${GENWORLD_CONFIG.contractAddress.slice(0, 6)}...${GENWORLD_CONFIG.contractAddress.slice(-4)}`;

  return (
    <header className="border-b border-[var(--border-subtle)] bg-[rgba(7,9,14,0.85)] sticky top-0 z-40 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#00f5d4] to-[#3b82f6] p-[1.5px] flex items-center justify-center shadow-lg shadow-[#00f5d4]/20">
            <div className="w-full h-full bg-[#07090e] rounded-[10px] flex items-center justify-center">
              <Globe className="w-5 h-5 text-[#00f5d4]" />
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

        {/* Network & Live Contract Badge */}
        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[rgba(255,255,255,0.03)] border border-[var(--border-subtle)]">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold text-gray-300">StudioNet (Chain 61999)</span>
          </div>

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

        {/* User Session Signer */}
        <div className="flex items-center gap-2">
          <button
            onClick={copyAddress}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#161e31] border border-[var(--border-subtle)] hover:border-[#00f5d4]/40 transition-all text-xs font-mono text-gray-300 hover:text-white"
            title="Click to copy active session account address"
          >
            <Key className="w-3.5 h-3.5 text-[#00f5d4]" />
            <span>{shortAddr}</span>
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-gray-400" />}
          </button>
        </div>

      </div>
    </header>
  );
};
