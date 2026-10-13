import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User,
  RefreshCw,
  HelpCircle,
  Shield,
  Layers,
  Database,
  KeyRound,
  FileCode,
  ArrowRight,
  CheckCircle2,
  Trash2
} from 'lucide-react';
import { MediaFile } from '../types';
import { useDecentralMedia } from '../context/DecentralMediaContext';
import { useAuth } from '../context/AuthContext';

interface AssistantViewProps {
  initialFileContext?: MediaFile | null;
  onClearFileContext?: () => void;
}

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: number;
}

export const AssistantView: React.FC<AssistantViewProps> = ({
  initialFileContext,
  onClearFileContext,
}) => {
  const { mediaFiles } = useDecentralMedia();
  const { currentUser } = useAuth();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `👋 Welcome! I am **Cipher AI**, your guide to the DecentralMedia vault.

**Getting started**
1. Choose **Explore Public** to browse as a guest, or **Log In / Create Account** to set up an account.
2. Select **Upload** to add media, or **Redeem** to open a shared file with its access code or CID.
3. Use the vault controls to manage sharing permissions, access codes, and file details.

If you are setting up the app locally, open a terminal in the project folder and run \`npm install\`, then \`npm run dev\`. Open **http://localhost:3000** in your browser. The Gemini API key is optional for starting the app; without it, the assistant uses built-in help.

Ask me how to use any feature, or pick a suggestion below.`,
      timestamp: Date.now(),
    },
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeMediaContext, setActiveMediaContext] = useState<MediaFile | null>(
    initialFileContext || null
  );

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    if (initialFileContext) {
      setActiveMediaContext(initialFileContext);
      // Post an automatic contextual query
      handleSendMessage(
        `Please provide a comprehensive technical and security breakdown of my stored media asset "${initialFileContext.name}" (CID: ${initialFileContext.ipfsCid}, Type: ${initialFileContext.type}).`,
        initialFileContext
      );
    }
  }, [initialFileContext]);

  const quickQuestions = [
    "I am new here. How do I get started?",
    "How do I run this app on my computer?",
    "How do I upload and share a file?",
    "How does the unique secret access code grant file access?",
    "Explain the difference between ACL sharing and full ownership transfer.",
    "How are IPFS CIDs and Keccak-256 hashes generated from images and videos?",
    "How does the multi-region IPFS host node pinning cluster work?",
    "How does cryptographic Web3 wallet derivation provide privacy and decentralization?",
  ];

  const handleSendMessage = async (customText?: string, fileCtx?: MediaFile | null) => {
    const textToSend = customText || inputMessage;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend.trim(),
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    if (!customText) setInputMessage('');
    setIsLoading(true);

    try {
      const currentTargetFile = fileCtx !== undefined ? fileCtx : activeMediaContext;

      let replyText = "";
      try {
        const response = await fetch('/api/gemini/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: textToSend.trim(),
            messages: [...messages, userMsg].map((m) => ({
              role: m.sender,
              content: m.text,
            })),
            mediaContext: currentTargetFile ? {
              name: currentTargetFile.name,
              type: currentTargetFile.type,
              cid: currentTargetFile.ipfsCid,
              size: currentTargetFile.sizeBytes,
              owner: currentTargetFile.ownerAddress,
              accessMode: currentTargetFile.accessControl.mode,
              accessCode: currentTargetFile.accessControl.uniqueAccessCode,
              metadata: currentTargetFile.metadata,
            } : undefined,
          }),
        });

        if (response.ok) {
          const data = await response.json().catch(() => ({}));
          replyText = data.reply || "";
        }
      } catch (networkErr) {
        console.warn("AI chat network call:", networkErr);
      }

      if (!replyText) {
        replyText = "I am your decentralized systems assistant. You can upload media, configure custom Access Control (Public, Private, Restricted), generate unique access passcodes for peer sharing, pin files across multi-region IPFS host nodes, and transfer smart contract ownership.";
      }

      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        text: replyText,
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err: any) {
      console.warn("AI chat handler issue:", err);
      const fallbackMsg: Message = {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        text: "I am ready to assist with your decentralized database and storage vault questions.",
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] min-h-[500px] max-h-[850px] bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      
      {/* Assistant Header */}
      <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-violet-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-100">Cipher AI Intelligence</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-violet-950 text-violet-300 border border-violet-800">
                Gemini 2.5 Flash
              </span>
            </div>
            <p className="text-xs text-slate-400">Decentralized Storage & Smart Contract Oracle</p>
          </div>
        </div>

        {/* Clear Chat */}
        <button
          onClick={() => {
            setMessages([messages[0]]);
            setActiveMediaContext(null);
            if (onClearFileContext) onClearFileContext();
          }}
          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
          title="Reset Conversation"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Active File Context Bar (if active) */}
      {activeMediaContext && (
        <div className="px-6 py-2 bg-indigo-950/40 border-b border-indigo-900/50 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-indigo-300 truncate">
            <Layers className="w-3.5 h-3.5 flex-shrink-0 text-indigo-400" />
            <span>Context:</span>
            <span className="font-semibold text-slate-200 truncate max-w-xs">{activeMediaContext.name}</span>
            <span className="font-mono text-[10px] text-cyan-400">({activeMediaContext.ipfsCid.slice(0, 10)}...)</span>
          </div>
          <button
            onClick={() => {
              setActiveMediaContext(null);
              if (onClearFileContext) onClearFileContext();
            }}
            className="text-[11px] text-slate-400 hover:text-slate-200"
          >
            Clear Context
          </button>
        </div>
      )}

      {/* Chat Messages List */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
        {messages.map((msg) => {
          const isBot = msg.sender === 'assistant';
          return (
            <div
              key={msg.id}
              className={`flex gap-3 text-xs ${isBot ? 'items-start' : 'items-start flex-row-reverse'}`}
            >
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                isBot
                  ? 'bg-gradient-to-tr from-violet-600 to-cyan-500 text-white shadow-sm'
                  : 'bg-cyan-500 text-slate-950 shadow-sm'
              }`}>
                {isBot ? <Sparkles className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>

              {/* Message Content */}
              <div
                className={`p-4 rounded-2xl max-w-[85%] sm:max-w-[75%] leading-relaxed space-y-2 ${
                  isBot
                    ? 'bg-slate-950 border border-slate-800 text-slate-200 shadow-sm'
                    : 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-medium shadow-md shadow-cyan-600/10'
                }`}
              >
                <div className="whitespace-pre-wrap font-sans break-words">
                  {msg.text}
                </div>
                <div className={`text-[10px] ${isBot ? 'text-slate-500' : 'text-cyan-100/70'} text-right`}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-3 items-start text-xs">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-cyan-500 flex items-center justify-center text-white">
              <Sparkles className="w-4 h-4 animate-spin" />
            </div>
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-slate-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>Analyzing decentralized protocol data...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Question Prompts */}
      <div className="px-4 sm:px-6 py-2.5 bg-slate-950/60 border-t border-slate-800/80 overflow-x-auto">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider whitespace-nowrap flex items-center gap-1">
            <HelpCircle className="w-3 h-3 text-cyan-400" />
            Suggested:
          </span>
          {quickQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(q)}
              className="px-2.5 py-1 rounded-full text-[11px] bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 border border-slate-800 whitespace-nowrap transition-colors flex-shrink-0"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Input Form Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-3 sm:p-4 bg-slate-950 border-t border-slate-800 flex items-center gap-2"
      >
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Ask Cipher AI about IPFS, smart contracts, unique codes, or metadata..."
          className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none transition-colors"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !inputMessage.trim()}
          className="p-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold disabled:opacity-40 transition-colors flex items-center justify-center"
          title="Send Query"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

    </div>
  );
};
