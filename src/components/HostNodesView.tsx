import React, { useState } from 'react';
import {
  Server,
  HardDrive,
  Activity,
  Plus,
  CheckCircle2,
  AlertCircle,
  Globe,
  Radio,
  Cpu,
  Database,
  Layers,
  Copy,
  Check,
  RefreshCw,
  ArrowLeft
} from 'lucide-react';
import { useDecentralMedia } from '../context/DecentralMediaContext';
import { HostNode } from '../types';
import { formatBytes } from '../lib/crypto';

export const HostNodesView: React.FC = () => {
  const { hostNodes, addHostNode, mediaFiles, setActiveTab } = useDecentralMedia();

  const [isAddingNode, setIsAddingNode] = useState(false);
  const [newNodeName, setNewNodeName] = useState('');
  const [newNodeRegion, setNewNodeRegion] = useState('US-West (Oregon)');
  const [newNodeMultiaddr, setNewNodeMultiaddr] = useState('');
  const [copiedAddr, setCopiedAddr] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const totalCapacityBytes = hostNodes.reduce((acc, n) => acc + n.capacityBytes, 0);
  const totalUsedBytes = hostNodes.reduce((acc, n) => acc + n.storageUsedBytes, 0);
  const averageLatency = Math.round(
    hostNodes.reduce((acc, n) => acc + n.latencyMs, 0) / hostNodes.length
  );

  const handleCopy = (addr: string, id: string) => {
    navigator.clipboard.writeText(addr);
    setCopiedAddr(id);
    setTimeout(() => setCopiedAddr(null), 2000);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const handleAddNodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNodeName.trim()) return;

    addHostNode({
      name: newNodeName.trim(),
      region: newNodeRegion,
      multiaddr: newNodeMultiaddr.trim() || `/ip4/142.250.190.${Math.floor(Math.random()*200)}/tcp/4001/p2p/QmNode${Math.random().toString(36).substring(2, 9)}`,
      capacityBytes: 500 * 1024 * 1024 * 1024, // 500 GB
      storageUsedBytes: 0,
      uptime: 100.0,
      latencyMs: Math.floor(Math.random() * 40) + 15,
      pinnedCount: 0,
      operator: 'User Self-Hosted Node',
    });

    setNewNodeName('');
    setNewNodeMultiaddr('');
    setIsAddingNode(false);
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

      {/* Cluster Overview Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Server className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <span>Decentralized IPFS Host Nodes & Pinning Swarm</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800">
                  HEALTHY (4/4)
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Multi-region Kubo and IPFS-Cluster nodes guaranteeing perpetual media availability and high-speed edge streaming.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Ping Swarm</span>
            </button>

            <button
              onClick={() => setIsAddingNode(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20 transition-all font-bold"
            >
              <Plus className="w-4 h-4" />
              <span>Add Custom Node</span>
            </button>
          </div>
        </div>

        {/* Global Cluster Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80">
            <span className="text-[11px] text-slate-400">Total Host Nodes</span>
            <div className="text-xl font-bold text-slate-100 mt-1">{hostNodes.length} Online</div>
          </div>
          <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80">
            <span className="text-[11px] text-slate-400">Cluster Capacity</span>
            <div className="text-xl font-bold text-cyan-400 mt-1">{formatBytes(totalCapacityBytes)}</div>
          </div>
          <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80">
            <span className="text-[11px] text-slate-400">Storage Utilized</span>
            <div className="text-xl font-bold text-indigo-300 mt-1">{formatBytes(totalUsedBytes)}</div>
          </div>
          <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80">
            <span className="text-[11px] text-slate-400">Avg Swarm Latency</span>
            <div className="text-xl font-bold text-emerald-400 mt-1">{averageLatency} ms</div>
          </div>
        </div>
      </div>

      {/* Add Custom Node Form Modal */}
      {isAddingNode && (
        <div className="p-5 rounded-2xl bg-slate-900 border border-cyan-500/40 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Plus className="w-4 h-4 text-cyan-400" />
              <span>Register New IPFS Host Node</span>
            </h3>
            <button onClick={() => setIsAddingNode(false)} className="text-slate-400 hover:text-slate-200">
              Cancel
            </button>
          </div>

          <form onSubmit={handleAddNodeSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Node Identifier / Label</label>
              <input
                type="text"
                value={newNodeName}
                onChange={(e) => setNewNodeName(e.target.value)}
                placeholder="e.g. My-Private-Node-01"
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-cyan-500"
                required
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Region / Location</label>
              <select
                value={newNodeRegion}
                onChange={(e) => setNewNodeRegion(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-cyan-500"
              >
                <option value="US-West (Oregon)">US-West (Oregon)</option>
                <option value="US-East (N. Virginia)">US-East (N. Virginia)</option>
                <option value="EU-Central (Frankfurt)">EU-Central (Frankfurt)</option>
                <option value="AP-Southeast (Singapore)">AP-Southeast (Singapore)</option>
                <option value="Local Home Lab (Direct)">Local Home Lab (Direct)</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">IPFS Multiaddress (Optional)</label>
              <input
                type="text"
                value={newNodeMultiaddr}
                onChange={(e) => setNewNodeMultiaddr(e.target.value)}
                placeholder="/ip4/x.x.x.x/tcp/4001/p2p/..."
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 font-mono text-[11px] focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="sm:col-span-3 flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddingNode(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold shadow"
              >
                Connect & Pin Swarm
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Nodes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {hostNodes.map((node) => {
          const usedPct = Math.min(100, Math.round((node.storageUsedBytes / node.capacityBytes) * 100));
          const isCopied = copiedAddr === node.id;

          return (
            <div
              key={node.id}
              className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all space-y-4 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <h3 className="text-sm font-bold text-slate-100">{node.name}</h3>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-slate-500" />
                    <span>{node.region}</span>
                    <span>•</span>
                    <span className="text-slate-400">{node.operator}</span>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-full text-xs font-mono bg-slate-950 text-cyan-300 border border-slate-800">
                  {node.latencyMs} ms
                </span>
              </div>

              {/* Multiaddress snippet */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono">
                <span className="text-slate-400 truncate max-w-[280px]" title={node.multiaddr}>
                  {node.multiaddr}
                </span>
                <button
                  onClick={() => handleCopy(node.multiaddr, node.id)}
                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200"
                  title="Copy Multiaddress"
                >
                  {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>

              {/* Progress & Storage breakdown */}
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Storage Allocation</span>
                  <span className="font-mono text-slate-200">
                    {formatBytes(node.storageUsedBytes)} / {formatBytes(node.capacityBytes)} ({usedPct}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(2, usedPct)}%` }}
                  />
                </div>
              </div>

              {/* Metrics footer */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-1.5 font-mono">
                  <Database className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-slate-200 font-semibold">{node.pinnedCount}</span>
                  <span>Pinned Items</span>
                </div>

                <div className="flex items-center gap-1.5 font-mono">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300 font-semibold">{node.uptime}%</span>
                  <span>Uptime</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
