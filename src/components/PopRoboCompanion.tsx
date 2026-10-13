import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Sparkles,
  X,
  Send,
  Minimize2,
  Maximize2,
  Volume2,
  VolumeX,
  KeyRound,
  Upload,
  Database,
  Server,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  HelpCircle,
  Cpu,
  Zap,
  Check,
  Copy,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useDecentralMedia } from '../context/DecentralMediaContext';
import { useTheme } from '../context/ThemeContext';
import { formatAddress, formatBytes } from '../lib/crypto';
import { SMART_CONTRACT_ADDRESS } from '../lib/contracts';
import { MediaFile } from '../types';

interface PopRoboCompanionProps {
  onOpenUpload: () => void;
  onOpenRedeem: () => void;
  onOpenWallet?: () => void;
  onSelectFile?: (file: MediaFile) => void;
}

interface ChatMessage {
  id: string;
  sender: 'robo' | 'user';
  text: string;
  timestamp: number;
  action?: {
    type: 'upload' | 'redeem' | 'nodes' | 'ledger' | 'wallet';
    label: string;
  };
}

export const PopRoboCompanion: React.FC<PopRoboCompanionProps> = ({
  onOpenUpload,
  onOpenRedeem,
  onOpenWallet,
  onSelectFile,
}) => {
  const { currentUser } = useAuth();
  const { mediaFiles, hostNodes, transactions, setActiveTab } = useDecentralMedia();
  const { settings, setPopRoboSound, setPopRoboEnabled } = useTheme();

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [roboMood, setRoboMood] = useState<'idle' | 'happy' | 'thinking' | 'chatting'>('idle');
  const [speechBubbleText, setSpeechBubbleText] = useState<string>('');
  const [showSpeechBubble, setShowSpeechBubble] = useState(true);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Initial welcome message in chat
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome-1',
      sender: 'robo',
      text: `BEEP BOOP! 🤖 Greetings ${currentUser?.name || 'Explorer'}! I am **Pop Robo**, your decentralized AI vault companion. I monitor your IPFS pins, verify Ethereum smart contracts, and explain cryptographic access codes. How can I assist you right now?`,
      timestamp: Date.now(),
      action: {
        type: 'upload',
        label: 'Upload New Media',
      },
    },
  ]);

  // Audio chirp generator using Web Audio API for friendly robotic feedback
  const playRoboChirp = (frequency = 640, duration = 0.08, type: OscillatorType = 'sine') => {
    if (!settings.popRoboSound) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(frequency * 1.5, ctx.currentTime + duration);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {}
  };

  // Rotating contextual hints in speech bubble when collapsed
  useEffect(() => {
    if (isOpen) {
      setShowSpeechBubble(false);
      return;
    }

    const hints = [
      `🤖 Pop Robo here! ${mediaFiles.length} files secured on IPFS.`,
      `✨ Tip: Share files securely using 16-character access codes!`,
      `⚡ ${hostNodes.length} IPFS Swarm nodes are active and syncing.`,
      `🔒 Smart contract ownership is verified on Sepolia testnet.`,
      `👋 Need quick help? Click me to chat with Pop Robo!`,
    ];

    let currentHintIndex = 0;
    setSpeechBubbleText(hints[0]);
    setShowSpeechBubble(true);

    const interval = setInterval(() => {
      currentHintIndex = (currentHintIndex + 1) % hints.length;
      setSpeechBubbleText(hints[currentHintIndex]);
      setShowSpeechBubble(true);
      // Auto-hide after 8 seconds
      setTimeout(() => {
        if (!isOpen) setShowSpeechBubble(false);
      }, 7000);
    }, 18000);

    return () => clearInterval(interval);
  }, [isOpen, mediaFiles.length, hostNodes.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  if (!settings.popRoboEnabled) {
    return null;
  }

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query || isLoading) return;

    setInputText('');
    playRoboChirp(520, 0.06);

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);
    setRoboMood('thinking');

    try {
      // Build smart system prompt with current user vault context
      const vaultContext = {
        userName: currentUser?.name || 'Guest Explorer',
        userAddress: currentUser?.address || 'Not Connected',
        userBalance: currentUser?.balanceEth || 0,
        totalFiles: mediaFiles.length,
        ownedFilesCount: currentUser?.address
          ? mediaFiles.filter((f) => f.ownerAddress.toLowerCase() === currentUser.address.toLowerCase()).length
          : 0,
        nodesCount: hostNodes.length,
        contractAddress: SMART_CONTRACT_ADDRESS,
        personality: settings.popRoboPersonality,
      };

      const personalityInstruction =
        settings.popRoboPersonality === 'crypto'
          ? 'Adopt a high-tech cypherpunk persona that references cryptographic hashing, Merkle DAGs, smart contract ABIs, and zero-knowledge proofs.'
          : settings.popRoboPersonality === 'concise'
          ? 'Be extremely brief, crisp, and direct with bullet points.'
          : 'Be an enthusiastic, friendly robot named Pop Robo who speaks warmly, occasionally making cute robot beeps (BEEP BOOP!), and explains Web3 decentralized media clearly.';

      const systemInstruction = `You are Pop Robo, an interactive robotic companion on display in the saus decentralized media app.
${personalityInstruction}
The user is viewing their decentralized vault:
- Current user: ${vaultContext.userName} (${vaultContext.userAddress})
- ETH Gas Balance: ${vaultContext.userBalance} ETH
- Total Network Files: ${vaultContext.totalFiles}
- Owned Files: ${vaultContext.ownedFilesCount}
- Active IPFS Nodes: ${vaultContext.nodesCount}
- Smart Contract: ${vaultContext.contractAddress}

Provide helpful, accurate assistance regarding IPFS pinning, access codes (e.g. IPFS-SEC-XXXX-XXXX-XXXX), privacy modes (public, private, restricted), smart contract transactions, and media streaming. Keep responses readable with bullet points.`;

      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          systemInstruction,
        }),
      });

      const data = await res.json();
      const reply = data.reply || "BEEP BOOP! I have processed your request. Let me know if you'd like to inspect files or test access codes!";

      playRoboChirp(880, 0.1);
      setRoboMood('happy');

      // Determine smart contextual action button
      let action: ChatMessage['action'] = undefined;
      const lower = query.toLowerCase();
      if (lower.includes('upload') || lower.includes('add file') || lower.includes('store')) {
        action = { type: 'upload', label: 'Open Upload Modal' };
      } else if (lower.includes('code') || lower.includes('redeem') || lower.includes('unlock')) {
        action = { type: 'redeem', label: 'Redeem Access Code' };
      } else if (lower.includes('node') || lower.includes('swarm') || lower.includes('host') || lower.includes('ping')) {
        action = { type: 'nodes', label: 'View Host Nodes' };
      } else if (lower.includes('contract') || lower.includes('transaction') || lower.includes('ledger') || lower.includes('tx')) {
        action = { type: 'ledger', label: 'Open EVM Ledger' };
      } else if (lower.includes('wallet') || lower.includes('account') || lower.includes('key')) {
        action = { type: 'wallet', label: 'Wallet Credentials' };
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `robo-${Date.now()}`,
          sender: 'robo',
          text: reply,
          timestamp: Date.now(),
          action,
        },
      ]);
    } catch (err) {
      console.warn('Pop Robo chat fallback:', err);
      playRoboChirp(440, 0.12, 'sawtooth');
      setRoboMood('idle');
      setMessages((prev) => [
        ...prev,
        {
          id: `robo-err-${Date.now()}`,
          sender: 'robo',
          text: `BEEP! 📡 I am operating in offline swarm assistance mode. You can upload media files, redeem unique access codes (IPFS-SEC-XXXX), and inspect smart contracts anytime.`,
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsLoading(false);
      setTimeout(() => setRoboMood('idle'), 3000);
    }
  };

  const handleActionClick = (action: ChatMessage['action']) => {
    if (!action) return;
    playRoboChirp(720, 0.08);
    if (action.type === 'upload') onOpenUpload();
    if (action.type === 'redeem') onOpenRedeem();
    if (action.type === 'wallet' && onOpenWallet) onOpenWallet();
    if (action.type === 'nodes') setActiveTab('hosts');
    if (action.type === 'ledger') setActiveTab('ledger');
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    playRoboChirp(960, 0.05);
    setTimeout(() => setCopiedText(null), 2000);
  };

  return (
    <>
      {/* 1. FLOATING ROBOT ON DISPLAY (COLLAPSED / LAUNCHER) */}
      <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-40 flex flex-col items-end select-none">
        
        {/* Animated Speech Bubble */}
        {showSpeechBubble && !isOpen && (
          <div className="mb-2 max-w-xs p-3 rounded-2xl bg-slate-900/95 border border-cyan-500/40 text-slate-100 shadow-xl shadow-cyan-950/40 text-xs backdrop-blur-md relative animate-in fade-in slide-in-from-bottom-2 duration-300">
            <button
              onClick={() => setShowSpeechBubble(false)}
              className="absolute top-1.5 right-1.5 text-slate-500 hover:text-slate-300 text-xs p-0.5"
              title="Dismiss"
            >
              ×
            </button>
            <div className="flex items-start gap-2 pr-3">
              <span className="text-sm">🤖</span>
              <p className="leading-snug text-slate-200">{speechBubbleText}</p>
            </div>
            {/* Bubble Tail */}
            <div className="absolute -bottom-1.5 right-6 w-3 h-3 bg-slate-900 border-r border-b border-cyan-500/40 transform rotate-45" />
          </div>
        )}

        {/* The Animated Pop Robo Avatar Button */}
        <button
          id="pop-robo-launcher-btn"
          onClick={() => {
            playRoboChirp(680, 0.1);
            setIsOpen(!isOpen);
            if (!isOpen) {
              setRoboMood('happy');
              setTimeout(() => setRoboMood('idle'), 2000);
            }
          }}
          className={`relative group p-1.5 rounded-2xl transition-all duration-300 cursor-pointer ${
            isOpen
              ? 'bg-cyan-500/20 ring-2 ring-cyan-400 scale-95 shadow-lg shadow-cyan-500/20'
              : 'hover:scale-105 hover:-translate-y-1'
          }`}
          title="Open Pop Robo AI Assistant"
          aria-label="Open Pop Robo AI"
        >
          {/* Outer Pulsing Glow */}
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 opacity-60 blur-sm group-hover:opacity-100 transition-opacity animate-pulse" />

          {/* Robot Shell Card */}
          <div className="relative w-14 h-14 rounded-2xl bg-slate-950 border border-cyan-500/50 flex flex-col items-center justify-center shadow-xl overflow-hidden">
            
            {/* Antenna & LED Light */}
            <div className="absolute top-1 w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping opacity-75" />
            <div className="absolute top-1 w-1.5 h-1.5 rounded-full bg-cyan-300 shadow-sm shadow-cyan-400" />

            {/* Robot Head Artwork (SVG) */}
            <svg
              className="w-9 h-9 transition-transform group-hover:rotate-3 duration-300"
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Antenna pole */}
              <line x1="24" y1="6" x2="24" y2="12" stroke="#06b6d4" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="24" cy="5" r="3" fill="#22d3ee" />

              {/* Ears */}
              <rect x="5" y="20" width="3" height="8" rx="1.5" fill="#0891b2" />
              <rect x="40" y="20" width="3" height="8" rx="1.5" fill="#0891b2" />

              {/* Head Base */}
              <rect
                x="8"
                y="12"
                width="32"
                height="24"
                rx="6"
                fill="#0f172a"
                stroke="#06b6d4"
                strokeWidth="2"
              />

              {/* Visor Screen */}
              <rect
                x="12"
                y="16"
                width="24"
                height="12"
                rx="3.5"
                fill="#020617"
                stroke="#164e63"
                strokeWidth="1.5"
              />

              {/* Glowing Eyes (Reacts to mood) */}
              {roboMood === 'thinking' ? (
                <>
                  <circle cx="18" cy="22" r="2.5" fill="#f59e0b" className="animate-pulse" />
                  <circle cx="30" cy="22" r="2.5" fill="#f59e0b" className="animate-pulse" />
                </>
              ) : roboMood === 'happy' ? (
                <>
                  {/* Happy Curved Eyes */}
                  <path d="M15 23 Q18 20 21 23" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" fill="none" />
                  <path d="M27 23 Q30 20 33 23" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" fill="none" />
                </>
              ) : (
                <>
                  <circle cx="18" cy="22" r="2.5" fill="#06b6d4">
                    <animate attributeName="opacity" values="1;1;0.2;1" dur="4s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="30" cy="22" r="2.5" fill="#06b6d4">
                    <animate attributeName="opacity" values="1;1;0.2;1" dur="4s" repeatCount="indefinite" />
                  </circle>
                </>
              )}

              {/* Smile / Mouth line */}
              <line x1="20" y1="31" x2="28" y2="31" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" />
            </svg>

            {/* Micro Badge */}
            <span className="text-[9px] font-bold font-mono text-cyan-300 leading-none mt-0.5 tracking-tighter">
              ROBO
            </span>
          </div>

          {/* Active Status Beacon */}
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-cyan-500 border-2 border-slate-950" />
          </span>
        </button>

      </div>

      {/* 2. POP ROBO EXPANDED CONSOLE / POPUP DIALOG */}
      {isOpen && (
        <div
          className={`fixed z-50 transition-all duration-300 flex flex-col bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden ${
            isMinimized
              ? 'bottom-20 md:bottom-6 right-4 md:right-6 w-80 h-14'
              : 'bottom-4 md:bottom-6 right-3 md:right-6 w-[94vw] sm:w-[420px] max-w-full h-[580px] max-h-[85vh]'
          }`}
          role="dialog"
          aria-label="Pop Robo AI Assistant Console"
        >
          {/* Header Bar */}
          <div className="px-4 py-3 bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950/60 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-bold text-slate-100 flex items-center gap-1">
                    <span>Pop Robo</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono">
                      AI v2.4
                    </span>
                  </h3>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>IPFS & Smart Contract Co-Pilot</span>
                </div>
              </div>
            </div>

            {/* Header Controls */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPopRoboSound(!settings.popRoboSound)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition-colors"
                title={settings.popRoboSound ? 'Mute Robo Sounds' : 'Enable Robo Sounds'}
              >
                {settings.popRoboSound ? <Volume2 className="w-3.5 h-3.5 text-cyan-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
              </button>

              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition-colors"
                title={isMinimized ? 'Expand Console' : 'Minimize'}
              >
                {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Expanded Console Body */}
          {!isMinimized && (
            <>
              {/* Quick Actions & Vault Summary Bar */}
              <div className="px-3.5 py-2 bg-slate-950/70 border-b border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-cyan-400 font-semibold">{mediaFiles.length} Vault Files</span>
                  <span>•</span>
                  <span>{hostNodes.length} Swarm Nodes</span>
                </div>
                <button
                  onClick={() => handleSendMessage('Run a complete health check on my vault files, IPFS pinning factor, and contract transactions.')}
                  className="text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  <span>Health Check</span>
                </button>
              </div>

              {/* Chat Message Scroll Area */}
              <div className="flex-1 p-3.5 overflow-y-auto space-y-3.5 text-xs">
                {messages.map((msg) => {
                  const isRobo = msg.sender === 'robo';
                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-2.5 ${isRobo ? 'items-start' : 'items-end justify-end'}`}
                    >
                      {isRobo && (
                        <div className="w-7 h-7 rounded-lg bg-cyan-950 border border-cyan-800/60 flex items-center justify-center text-cyan-400 flex-shrink-0 mt-0.5">
                          <Bot className="w-3.5 h-3.5" />
                        </div>
                      )}

                      <div
                        className={`max-w-[85%] rounded-2xl p-3 leading-relaxed shadow-sm ${
                          isRobo
                            ? 'bg-slate-950/90 text-slate-200 border border-slate-800'
                            : 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-br-sm'
                        }`}
                      >
                        {/* Message content */}
                        <div className="whitespace-pre-line text-xs font-normal">
                          {msg.text}
                        </div>

                        {/* Interactive Action Button (e.g. Upload, Redeem) */}
                        {msg.action && (
                          <div className="mt-2.5 pt-2 border-t border-slate-800/80">
                            <button
                              onClick={() => handleActionClick(msg.action)}
                              className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-semibold transition-all cursor-pointer"
                            >
                              <span>{msg.action.label}</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}

                        <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500">
                          <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {isRobo && (
                            <button
                              onClick={() => handleCopyText(msg.text)}
                              className="hover:text-slate-300 p-0.5"
                              title="Copy response"
                            >
                              {copiedText === msg.text ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {isLoading && (
                  <div className="flex items-center gap-2 text-xs text-cyan-400 pl-1">
                    <div className="w-6 h-6 rounded-lg bg-cyan-950 border border-cyan-800/60 flex items-center justify-center text-cyan-400">
                      <Bot className="w-3 h-3 animate-spin" />
                    </div>
                    <span className="font-mono text-[11px] animate-pulse">Pop Robo is analyzing swarm signals...</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Prompt Chips */}
              <div className="px-3 py-2 bg-slate-950/60 border-t border-slate-800/70 flex items-center gap-1.5 overflow-x-auto text-[11px] no-scrollbar flex-shrink-0">
                <span className="text-slate-500 text-[10px] flex items-center gap-0.5 flex-shrink-0">
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span>Ask:</span>
                </span>
                <button
                  onClick={() => handleSendMessage('How do unique secret access codes work for restricted media files?')}
                  className="px-2 py-0.5 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 border border-slate-800 whitespace-nowrap transition-colors"
                >
                  Access Codes?
                </button>
                <button
                  onClick={() => handleSendMessage('What is IPFS DAG-PB pinning and how does redundancy protect my files?')}
                  className="px-2 py-0.5 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 border border-slate-800 whitespace-nowrap transition-colors"
                >
                  IPFS Pinning
                </button>
                <button
                  onClick={() => handleSendMessage('Explain how smart contract ownership transfer works on Ethereum.')}
                  className="px-2 py-0.5 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 border border-slate-800 whitespace-nowrap transition-colors"
                >
                  Ownership Handover
                </button>
                <button
                  onClick={() => handleSendMessage('What are the best video codecs for browser streaming on decentralized gateways?')}
                  className="px-2 py-0.5 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 border border-slate-800 whitespace-nowrap transition-colors"
                >
                  Video Codecs
                </button>
              </div>

              {/* Input Message Area */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2 flex-shrink-0"
              >
                <input
                  id="pop-robo-input"
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Ask Pop Robo anything about your vault..."
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || isLoading}
                  className="p-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-bold transition-all shadow-md shadow-cyan-500/20 flex-shrink-0 cursor-pointer"
                  title="Send to Pop Robo"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
};
