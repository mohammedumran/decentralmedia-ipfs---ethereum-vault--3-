import React, { useState } from 'react';
import {
  Blocks,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  Code,
  FileText,
  Clock,
  ShieldCheck,
  Coins,
  ArrowLeft
} from 'lucide-react';
import { useDecentralMedia } from '../context/DecentralMediaContext';
import { SMART_CONTRACT_ADDRESS, SOLIDITY_VAULT_SOURCE, SMART_CONTRACT_ABI } from '../lib/contracts';
import { formatAddress } from '../lib/crypto';

export const TransactionsView: React.FC = () => {
  const { transactions, setActiveTab } = useDecentralMedia();
  const [subTab, setSubTab] = useState<'ledger' | 'solidity' | 'abi'>('ledger');
  const [copiedTx, setCopiedTx] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTx(id);
    setTimeout(() => setCopiedTx(null), 2000);
  };

  return (
    <div className="space-y-6">
      
      {/* Return to Media Vault Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setActiveTab('vault')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-cyan-300 transition-colors bg-slate-900/60 hover:bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg"
        >
          <ArrowLeft className="w-4 h-4 text-cyan-400" />
          <span>← Back to Media Vault</span>
        </button>
      </div>

      {/* Contract Overview Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-violet-950/30 to-slate-900 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-violet-400">
              <Blocks className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <span>Ethereum Smart Contract Ledger</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-violet-950 text-violet-300 border border-violet-800">
                  DECENTRALIZED VAULT
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Every file mint, ownership transfer, and access rule is immutably recorded with Keccak-256 state hashes.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 font-mono text-xs text-violet-300">
            <span className="text-slate-500">Contract:</span>
            <span>{SMART_CONTRACT_ADDRESS.slice(0, 10)}...{SMART_CONTRACT_ADDRESS.slice(-6)}</span>
            <button
              onClick={() => copyToClipboard(SMART_CONTRACT_ADDRESS, 'contract')}
              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200"
              title="Copy Contract Address"
            >
              {copiedTx === 'contract' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
        </div>

        {/* View Selection Tabs */}
        <div className="flex items-center gap-2 border-t border-slate-800/80 pt-3">
          {[
            { id: 'ledger', label: 'On-Chain Transactions Log', icon: Clock },
            { id: 'solidity', label: 'Solidity Smart Contract', icon: Code },
            { id: 'abi', label: 'EVM Contract ABI', icon: FileText },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = subTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSubTab(tab.id as any)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab 1: Ledger Table */}
      {subTab === 'ledger' && (
        <div className="bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] uppercase font-bold text-slate-400">
                <tr>
                  <th className="py-3 px-4">Status & Tx Hash</th>
                  <th className="py-3 px-4">Method / Action</th>
                  <th className="py-3 px-4">Block #</th>
                  <th className="py-3 px-4">Caller Address</th>
                  <th className="py-3 px-4">Gas Consumed</th>
                  <th className="py-3 px-4 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      <Clock className="w-8 h-8 mx-auto mb-2 text-slate-600 stroke-[1.5]" />
                      <p className="font-semibold text-slate-300 text-sm">No on-chain transactions yet</p>
                      <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
                        Upload media files, pin to decentralized host clusters, or create access grants to write immutable EVM transactions.
                      </p>
                    </td>
                  </tr>
                ) : (
                  transactions.map(tx => (
                    <tr key={tx.id} className="hover:bg-slate-850/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                          <span className="font-mono text-cyan-400 font-medium">
                            {tx.txHash.slice(0, 10)}...{tx.txHash.slice(-6)}
                          </span>
                          <button
                            onClick={() => copyToClipboard(tx.txHash, tx.id)}
                            className="p-1 hover:bg-slate-800 rounded text-slate-500 hover:text-slate-300"
                          >
                            {copiedTx === tx.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="px-2.5 py-1 rounded-md font-mono text-[11px] bg-slate-950 text-indigo-300 border border-slate-800 font-semibold">
                          {tx.method}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-300">
                        #{tx.blockNumber}
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-400">
                        {formatAddress(tx.fromAddress, 3)}
                      </td>

                      <td className="py-3 px-4 font-mono text-emerald-400">
                        {tx.gasUsed}
                      </td>

                      <td className="py-3 px-4 text-right text-slate-400">
                        {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Solidity Source */}
      {subTab === 'solidity' && (
        <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4 overflow-hidden">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800 text-xs">
            <span className="font-mono text-slate-300 font-semibold">DecentralMediaVault.sol (Solidity ^0.8.20)</span>
            <button
              onClick={() => copyToClipboard(SOLIDITY_VAULT_SOURCE, 'solidity')}
              className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300"
            >
              {copiedTx === 'solidity' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>Copy Solidity Source</span>
            </button>
          </div>
          <pre className="p-4 rounded-xl bg-slate-900/90 font-mono text-xs text-slate-300 overflow-x-auto max-h-[500px] leading-relaxed">
            {SOLIDITY_VAULT_SOURCE}
          </pre>
        </div>
      )}

      {/* Tab 3: ABI */}
      {subTab === 'abi' && (
        <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4 overflow-hidden">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800 text-xs">
            <span className="font-mono text-slate-300 font-semibold">DecentralMediaVault ABI Specification</span>
            <button
              onClick={() => copyToClipboard(JSON.stringify(SMART_CONTRACT_ABI, null, 2), 'abi')}
              className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300"
            >
              {copiedTx === 'abi' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>Copy ABI JSON</span>
            </button>
          </div>
          <pre className="p-4 rounded-xl bg-slate-900/90 font-mono text-xs text-cyan-300 overflow-x-auto max-h-[500px] leading-relaxed">
            {JSON.stringify(SMART_CONTRACT_ABI, null, 2)}
          </pre>
        </div>
      )}

    </div>
  );
};
