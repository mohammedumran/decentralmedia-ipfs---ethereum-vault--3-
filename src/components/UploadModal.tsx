import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  Image as ImageIcon,
  Video as VideoIcon,
  Sparkles,
  Lock,
  Globe,
  Users,
  KeyRound,
  Server,
  Plus,
  Trash2,
  Check,
  RefreshCw,
  Coins,
  Layers,
  AlertCircle,
  Camera,
  Smartphone,
  Share2,
  Copy,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Eye,
  Download
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useDecentralMedia } from '../context/DecentralMediaContext';
import { MediaType, HostNode, MediaFile } from '../types';
import { generateUniqueAccessCode, formatBytes, formatCid, formatAddress } from '../lib/crypto';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose }) => {
  const { currentUser } = useAuth();
  const { uploadMedia, hostNodes, updateAccessControl } = useDecentralMedia();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  // File state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string>('');
  const [fileType, setFileType] = useState<MediaType>('image');
  const [fileDimensions, setFileDimensions] = useState<{ width?: number; height?: number; duration?: number }>({});

  // Form state
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [tagsInput, setTagsInput] = useState<string>('');
  const [accessMode, setAccessMode] = useState<'public' | 'private' | 'restricted'>('restricted');
  const [whitelistAddressInput, setWhitelistAddressInput] = useState<string>('');
  const [whitelistAddresses, setWhitelistAddresses] = useState<string[]>([]);
  const [uniqueAccessCode, setUniqueAccessCode] = useState<string>(() => generateUniqueAccessCode());
  const [selectedNodes, setSelectedNodes] = useState<string[]>(["node-us-east-01", "node-eu-central-02"]);
  const [customFields, setCustomFields] = useState<{ key: string; value: string }[]>([]);

  // Post-upload success state
  const [uploadedSuccessFile, setUploadedSuccessFile] = useState<MediaFile | null>(null);
  const [copiedSuccessLink, setCopiedSuccessLink] = useState(false);
  const [copiedSuccessCode, setCopiedSuccessCode] = useState(false);
  const [copiedSuccessCid, setCopiedSuccessCid] = useState(false);
  const [isMakingPublic, setIsMakingPublic] = useState(false);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isAnalyzingAi, setIsAnalyzingAi] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  if (!isOpen) return null;

  const handleResetForm = () => {
    setSelectedFile(null);
    setFilePreviewUrl('');
    setName('');
    setDescription('');
    setTagsInput('');
    setAccessMode('restricted');
    setWhitelistAddresses([]);
    setCustomFields([]);
    setUniqueAccessCode(generateUniqueAccessCode());
    setUploadedSuccessFile(null);
    setErrorMessage('');
    setIsSubmitting(false);
  };

  const handleCloseModal = () => {
    handleResetForm();
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    processSelectedFile(file);
  };

  const processSelectedFile = (file: File) => {
    setSelectedFile(file);
    setName(file.name);
    const isVid = file.type.startsWith('video/');
    const determinedType: MediaType = isVid ? 'video' : 'image';
    setFileType(determinedType);

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl && typeof dataUrl === 'string' && dataUrl.trim() !== '') {
        setFilePreviewUrl(dataUrl);

        // Extract dimensions/duration
        if (isVid) {
          const video = document.createElement('video');
          video.src = dataUrl;
          video.onloadedmetadata = () => {
            setFileDimensions({
              width: video.videoWidth || 1920,
              height: video.videoHeight || 1080,
              duration: Math.round(video.duration || 10),
            });
          };
        } else {
          const img = new Image();
          img.src = dataUrl;
          img.onload = () => {
            setFileDimensions({
              width: img.naturalWidth || 1920,
              height: img.naturalHeight || 1080,
            });
          };
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAiAutoFill = async () => {
    if (!name) {
      setErrorMessage("Please select a file first so Cipher AI can analyze it.");
      return;
    }
    setIsAnalyzingAi(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/gemini/analyze-media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: name,
          fileType,
          mimeType: selectedFile?.type || (fileType === 'video' ? 'video/mp4' : 'image/png'),
          size: selectedFile ? formatBytes(selectedFile.size) : 'Unknown',
          metadata: { width: fileDimensions.width, height: fileDimensions.height, duration: fileDimensions.duration },
          cid: "bafybeig...preview",
          ownerAddress: currentUser?.address || "0x0000000000000000000000000000000000000000",
        }),
      });

      if (!response.ok) throw new Error("AI analysis service unavailable");
      const data = await response.json();

      if (data.summary) setDescription(data.summary);
      if (data.suggestedTags && Array.isArray(data.suggestedTags)) {
        setTagsInput(data.suggestedTags.join(', '));
      }
    } catch (err: any) {
      console.warn("AI Auto-fill warning:", err);
      setErrorMessage("AI analysis failed to respond, but you can continue uploading manually.");
    } finally {
      setIsAnalyzingAi(false);
    }
  };

  const addWhitelistAddress = () => {
    const val = whitelistAddressInput.trim();
    if (val && !whitelistAddresses.includes(val)) {
      setWhitelistAddresses([...whitelistAddresses, val]);
      setWhitelistAddressInput('');
    }
  };

  const addCustomField = () => {
    setCustomFields([...customFields, { key: '', value: '' }]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !filePreviewUrl) {
      setErrorMessage("Please select an image or video file to pin.");
      return;
    }
    if (!name.trim()) {
      setErrorMessage("Please specify a valid media name.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const parsedTags = tagsInput
        .split(',')
        .map(t => t.trim().replace(/^#/, ''))
        .filter(Boolean);

      const filteredCustomFields = customFields.filter(f => f.key.trim() && f.value.trim());

      const newFile = await uploadMedia({
        name: name.trim(),
        type: fileType,
        mimeType: selectedFile.type || (fileType === 'video' ? 'video/mp4' : 'image/jpeg'),
        sizeBytes: selectedFile.size,
        dataUrl: filePreviewUrl,
        description: description.trim(),
        tags: parsedTags,
        width: fileDimensions.width,
        height: fileDimensions.height,
        duration: fileDimensions.duration,
        accessMode,
        allowedAddresses: whitelistAddresses,
        selectedHostNodes: selectedNodes,
        customAccessCode: uniqueAccessCode,
        customFields: filteredCustomFields,
      });

      if (newFile) {
        setUploadedSuccessFile(newFile);
      } else {
        onClose();
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      setErrorMessage(err.message || "Failed to commit media to IPFS and Ethereum ledger.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMakeSuccessFilePublic = async () => {
    if (!uploadedSuccessFile) return;
    setIsMakingPublic(true);
    try {
      await updateAccessControl(uploadedSuccessFile.id, { mode: 'public' });
      setUploadedSuccessFile((prev) =>
        prev
          ? {
              ...prev,
              accessControl: {
                ...prev.accessControl,
                mode: 'public',
              },
            }
          : null
      );
    } catch (err) {
      console.error("Failed to make file public:", err);
    } finally {
      setIsMakingPublic(false);
    }
  };

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const successShareUrl = uploadedSuccessFile
    ? `${origin}/?file=${uploadedSuccessFile.id}${
        uploadedSuccessFile.accessControl.mode === 'restricted'
          ? `&code=${uploadedSuccessFile.accessControl.uniqueAccessCode}`
          : ''
      }`
    : '';

  const copyShareLink = () => {
    if (!successShareUrl) return;
    navigator.clipboard.writeText(successShareUrl);
    setCopiedSuccessLink(true);
    setTimeout(() => setCopiedSuccessLink(false), 2500);
  };

  const copySuccessCode = () => {
    if (!uploadedSuccessFile) return;
    navigator.clipboard.writeText(uploadedSuccessFile.accessControl.uniqueAccessCode);
    setCopiedSuccessCode(true);
    setTimeout(() => setCopiedSuccessCode(false), 2000);
  };

  const copySuccessCid = () => {
    if (!uploadedSuccessFile) return;
    navigator.clipboard.writeText(uploadedSuccessFile.ipfsCid);
    setCopiedSuccessCid(true);
    setTimeout(() => setCopiedSuccessCid(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        
        {/* POST-UPLOAD SUCCESS & DIRECT SHARE SCREEN */}
        {uploadedSuccessFile ? (
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                    <span>Uploaded & Pinned to Network!</span>
                  </h2>
                  <p className="text-xs text-slate-400">Permanently stored on server & pinned to IPFS cluster nodes</p>
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Media Card Preview */}
              <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl bg-slate-950 border border-slate-800">
                <div className="w-full sm:w-40 aspect-video rounded-lg overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center relative flex-shrink-0">
                  {uploadedSuccessFile.type === 'image' && uploadedSuccessFile.url ? (
                    <img
                      src={uploadedSuccessFile.url}
                      alt={uploadedSuccessFile.name}
                      className="w-full h-full object-cover"
                    />
                  ) : uploadedSuccessFile.type === 'video' && uploadedSuccessFile.url ? (
                    <video
                      src={uploadedSuccessFile.url}
                      className="w-full h-full object-cover"
                      muted
                    />
                  ) : (
                    <div className="text-slate-500 font-mono text-xs uppercase">{uploadedSuccessFile.type}</div>
                  )}
                </div>

                <div className="flex-1 min-w-0 space-y-1.5 text-xs w-full">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-100 truncate">{uploadedSuccessFile.name}</span>
                    <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-slate-900 border border-slate-700 text-cyan-400 uppercase">
                      {uploadedSuccessFile.type}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-slate-400 text-[11px]">
                    <span>{formatBytes(uploadedSuccessFile.sizeBytes)}</span>
                    <span>•</span>
                    <span className="font-mono text-cyan-400">CID: {formatCid(uploadedSuccessFile.ipfsCid, 6)}</span>
                    <span>•</span>
                    <span>{uploadedSuccessFile.pinningState?.pinnedNodes?.length || 2} Swarm Nodes</span>
                  </div>

                  <div className="pt-1 flex items-center gap-2">
                    {uploadedSuccessFile.accessControl.mode === 'public' ? (
                      <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-700/80">
                        <Globe className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Public (Accessible to Anyone)</span>
                      </span>
                    ) : uploadedSuccessFile.accessControl.mode === 'restricted' ? (
                      <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-950/80 text-amber-300 border border-amber-700/80">
                        <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                        <span>Restricted (Access Code Required)</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-950/80 text-rose-300 border border-rose-700/80">
                        <Lock className="w-3.5 h-3.5 text-rose-400" />
                        <span>Private (Owner Only)</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Access Mode Advice & Explanation */}
              {uploadedSuccessFile.accessControl.mode === 'public' ? (
                <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/50 via-slate-950 to-slate-950 border border-emerald-700/60 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-300 font-semibold text-xs">
                    <Globe className="w-4 h-4 text-emerald-400" />
                    <span>How Another Person Can Access This File:</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    This file is <strong>Public</strong>! Any person visiting this website on any browser, incognito window, or mobile device will immediately see it in the media vault. They can click it to view and download it immediately.
                  </p>
                </div>
              ) : uploadedSuccessFile.accessControl.mode === 'restricted' ? (
                <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/50 via-slate-950 to-slate-950 border border-amber-700/60 space-y-3">
                  <div className="flex items-center gap-2 text-amber-300 font-semibold text-xs">
                    <KeyRound className="w-4 h-4 text-amber-400" />
                    <span>Secret Code Required to Get or View this File:</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    This file is now stored and showing on the dashboard. To view, stream, or get the file, the <strong>Secret Access Code</strong> below must be entered.
                  </p>
                  <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-950 border border-amber-900/60 text-xs font-mono">
                    <span className="text-slate-400">Secret Code:</span>
                    <span className="text-amber-300 font-bold tracking-wider select-all">{uploadedSuccessFile.accessControl.uniqueAccessCode}</span>
                    <button
                      onClick={copySuccessCode}
                      className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-sans text-xs font-medium flex items-center gap-1 transition-colors"
                    >
                      {copiedSuccessCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedSuccessCode ? 'Copied' : 'Copy Secret Code'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-gradient-to-r from-rose-950/50 via-slate-950 to-slate-950 border border-rose-700/60 space-y-3">
                  <div className="flex items-center gap-2 text-rose-300 font-semibold text-xs">
                    <Lock className="w-4 h-4 text-rose-400" />
                    <span>File is Strictly Private (Owner Only)</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    You uploaded this file with <strong>Private mode</strong>. Only your current wallet address can view or stream it. <strong>Another person cannot access it</strong> unless you make it Public.
                  </p>
                  <button
                    onClick={handleMakeSuccessFilePublic}
                    disabled={isMakingPublic}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-sm transition-all"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>{isMakingPublic ? 'Updating...' : 'Make Public Now (Allow Anyone to Access)'}</span>
                  </button>
                </div>
              )}

              {/* Direct Shareable Link Box */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-950/40 via-slate-950 to-slate-950 border border-cyan-800/60 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                    <Share2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Direct Shareable Link:</span>
                  </label>
                  <span className="text-[11px] text-slate-400">One-click auto-open</span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={successShareUrl}
                    className="flex-1 px-3 py-2 rounded-lg bg-slate-950 border border-cyan-900/60 text-xs font-mono text-cyan-200 select-all focus:outline-none"
                  />
                  <button
                    onClick={copyShareLink}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-cyan-500/20"
                  >
                    {copiedSuccessLink ? <Check className="w-4 h-4 text-slate-950" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedSuccessLink ? 'Copied!' : 'Copy Link'}</span>
                  </button>
                </div>

                <p className="text-[11px] text-slate-400 leading-normal">
                  Copy and send this link to another person. Opening this link will immediately display and play the media on their device without requiring any login!
                </p>
              </div>

              {/* IPFS Verification Details */}
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                <span className="flex items-center gap-1 font-mono text-slate-300">
                  <ShieldCheck className="w-3.5 h-3.5 text-violet-400" />
                  <span>IPFS CID: {uploadedSuccessFile.ipfsCid}</span>
                </span>
                <button
                  onClick={copySuccessCid}
                  className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                >
                  {copiedSuccessCid ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedSuccessCid ? 'Copied' : 'Copy CID'}</span>
                </button>
              </div>

            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between">
              <button
                type="button"
                onClick={handleResetForm}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Upload Another File</span>
              </button>

              <button
                type="button"
                onClick={handleCloseModal}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20 transition-all font-bold"
              >
                Done & View in Vault
              </button>
            </div>
          </div>
        ) : (
          /* STANDARD UPLOAD FORM */
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-100">Upload & Pin Media</h2>
                  <p className="text-xs text-slate-400">IPFS Storage + Ethereum Smart Contract Registration</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Section 1: File Dropzone */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-300 block">
                Select Image or Video File
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="px-2 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-medium flex items-center gap-1 transition-colors"
                  title="Snap photo or record video directly with your camera"
                >
                  <Camera className="w-3 h-3 text-emerald-400" />
                  <span>Camera</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition-colors"
                >
                  Browse Files
                </button>
              </div>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*,video/*"
              className="hidden"
            />

            <input
              type="file"
              ref={cameraInputRef}
              onChange={handleFileChange}
              accept="image/*,video/*"
              capture="environment"
              className="hidden"
            />

            {!selectedFile ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className="border-2 border-dashed border-slate-800 hover:border-cyan-500/60 rounded-xl p-8 text-center bg-slate-950/50 hover:bg-slate-950 cursor-pointer transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-slate-800 group-hover:bg-cyan-500/10 border border-slate-700 group-hover:border-cyan-500/30 flex items-center justify-center mx-auto text-slate-400 group-hover:text-cyan-400 transition-colors mb-3">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="text-sm font-medium text-slate-200">
                  Click or drag and drop media file here
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Supports Images (PNG, JPG, WebP, GIF, SVG) and Videos (MP4, WebM, MOV)
                </div>
                <div className="mt-3 flex items-center justify-center gap-2 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1 text-emerald-400">
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Android Camera & Gallery Supported</span>
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="relative w-16 h-12 rounded-lg bg-slate-900 overflow-hidden flex-shrink-0 border border-slate-800 flex items-center justify-center">
                    {filePreviewUrl && filePreviewUrl.trim() !== '' ? (
                      fileType === 'video' ? (
                        <video src={filePreviewUrl} className="w-full h-full object-cover" />
                      ) : (
                        <img src={filePreviewUrl} alt="Preview" className="w-full h-full object-cover" />
                      )
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-900 text-slate-500 text-xs">
                        <Upload className="w-4 h-4 animate-pulse text-cyan-400" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-sm text-slate-200 truncate">{selectedFile.name}</div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {formatBytes(selectedFile.size)} • {fileType.toUpperCase()}
                      {fileDimensions.width && ` • ${fileDimensions.width}x${fileDimensions.height}`}
                      {fileDimensions.duration && ` • ${fileDimensions.duration}s`}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300"
                  >
                    Change
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setFilePreviewUrl('');
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Metadata & AI Assistant */}
          <div className="space-y-4 pt-2 border-t border-slate-800/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Asset Metadata</span>
              <button
                type="button"
                onClick={handleAiAutoFill}
                disabled={isAnalyzingAi || !selectedFile}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-violet-950/80 hover:bg-violet-900 text-violet-300 border border-violet-800/60 disabled:opacity-50 transition-colors"
              >
                <Sparkles className={`w-3.5 h-3.5 text-violet-400 ${isAnalyzingAi ? 'animate-spin' : ''}`} />
                <span>{isAnalyzingAi ? 'AI Analyzing...' : 'Auto-Fill with AI'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-400 mb-1 block">File Display Title</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Project_Presentation_Deck.pdf"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-400 mb-1 block">Category Tags (comma separated)</label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="e.g. Space, 4K, Abstract, Artwork"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-400 mb-1 block">Description & Metadata Notes</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Detailed description of the image or video content, capture settings, or artistic notes..."
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none resize-none"
              />
            </div>
          </div>

          {/* Section 3: Smart Contract Access Control & Unique Share Code */}
          <div className="space-y-4 pt-2 border-t border-slate-800/80">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">Access Control & Security</span>
            
            {/* Mode selection cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'restricted', label: 'Secret Code Protected', desc: 'Ask Secret Code to get or view the file on dashboard & devices.', icon: KeyRound },
                { id: 'public', label: 'Public IPFS (Open)', desc: 'Directly viewable by anyone on any device without secret code.', icon: Globe },
                { id: 'private', label: 'Private (Owner Only)', desc: 'Strictly locked to your wallet address.', icon: Lock },
              ].map(mode => {
                const Icon = mode.icon;
                const isSelected = accessMode === mode.id;
                return (
                  <div
                    key={mode.id}
                    onClick={() => setAccessMode(mode.id as any)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? mode.id === 'private'
                          ? 'bg-rose-500/10 border-rose-500/60 shadow-sm'
                          : mode.id === 'restricted'
                            ? 'bg-amber-500/10 border-amber-500/60 shadow-sm'
                            : 'bg-cyan-500/10 border-cyan-500/60 shadow-sm'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${
                        isSelected
                          ? mode.id === 'private'
                            ? 'text-rose-400'
                            : mode.id === 'restricted'
                              ? 'text-amber-400'
                              : 'text-cyan-400'
                          : 'text-slate-400'
                      }`} />
                      <span className={`text-xs font-semibold ${
                        isSelected
                          ? mode.id === 'private'
                            ? 'text-rose-300'
                            : mode.id === 'restricted'
                              ? 'text-amber-300'
                              : 'text-cyan-300'
                          : 'text-slate-200'
                      }`}>
                        {mode.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">{mode.desc}</p>
                  </div>
                );
              })}
            </div>

            {/* Mode Explanation Helper */}
            <div className={`p-2.5 rounded-lg border text-[11px] ${
              accessMode === 'restricted'
                ? 'bg-amber-950/40 border-amber-800/60 text-amber-300'
                : accessMode === 'public'
                  ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
            }`}>
              {accessMode === 'restricted' && (
                <span>🔑 <strong>Secret Code Protected:</strong> The file shows on the dashboard, but requires entering this Secret Access Code to get or view the media file.</span>
              )}
              {accessMode === 'public' && (
                <span>🌐 <strong>Public Mode:</strong> Any visitor can view and stream this file directly without entering a secret code.</span>
              )}
              {accessMode === 'private' && (
                <span>🔒 <strong>Private Mode:</strong> Strictly limited to your current wallet address.</span>
              )}
            </div>

            {/* Generated Unique Access Code Panel */}
            <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-900/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Automatic Unique Secret Access Code</span>
                </span>
                <button
                  type="button"
                  onClick={() => setUniqueAccessCode(generateUniqueAccessCode())}
                  className="text-xs text-indigo-400 hover:text-indigo-200 flex items-center gap-1 font-mono"
                  title="Generate New Unique Key"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Regenerate</span>
                </button>
              </div>
              <div className="font-mono text-sm font-bold text-indigo-200 bg-slate-950 p-2 rounded-lg border border-indigo-900/60 text-center tracking-wider select-all">
                {uniqueAccessCode}
              </div>
              <p className="text-[11px] text-slate-400">
                This secret code is required to unlock, view, and get this media file from the dashboard or across devices.
              </p>
            </div>

            {/* If Restricted Mode: Whitelist inputs */}
            {accessMode === 'restricted' && (
              <div className="space-y-3 p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                <span className="font-semibold text-slate-200 block">Optional: Whitelist Ethereum Address (0x...)</span>
                
                {/* Ethereum Address */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={whitelistAddressInput}
                    onChange={(e) => setWhitelistAddressInput(e.target.value)}
                    placeholder="Add Ethereum Address (0x...)"
                    className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={addWhitelistAddress}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium"
                  >
                    Add
                  </button>
                </div>
                {whitelistAddresses.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {whitelistAddresses.map((addr, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded bg-slate-800 font-mono text-[10px] text-cyan-300 flex items-center gap-1">
                        <span>{addr.slice(0, 8)}...{addr.slice(-4)}</span>
                        <button type="button" onClick={() => setWhitelistAddresses(whitelistAddresses.filter((_, i) => i !== idx))}>
                          <X className="w-3 h-3 text-slate-400 hover:text-rose-400" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section 4: Host Nodes Pinning Selection */}
          <div className="space-y-3 pt-2 border-t border-slate-800/80">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">IPFS Host Node Pinning</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {hostNodes.map(node => {
                const isSelected = selectedNodes.includes(node.id);
                return (
                  <div
                    key={node.id}
                    onClick={() => {
                      if (isSelected && selectedNodes.length === 1) return; // keep at least 1
                      setSelectedNodes(
                        isSelected ? selectedNodes.filter(id => id !== node.id) : [...selectedNodes, node.id]
                      );
                    }}
                    className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                      isSelected ? 'bg-slate-950 border-cyan-500/40' : 'bg-slate-950/50 border-slate-800'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-semibold text-slate-200">{node.name}</div>
                      <div className="text-[10px] text-slate-400">{node.region}</div>
                    </div>
                    <div className={`w-4 h-4 rounded flex items-center justify-center border ${
                      isSelected ? 'bg-cyan-500 border-cyan-500 text-slate-950' : 'border-slate-700'
                    }`}>
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </form>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
            <Coins className="w-3.5 h-3.5 text-emerald-400" />
            <span>Est. Gas: ~0.0028 ETH</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || !selectedFile}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-md shadow-cyan-500/20 disabled:opacity-50 transition-all hover:scale-[1.02]"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Pinning & Minting...</span>
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  <span>Pin to IPFS & Mint Record</span>
                </>
              )}
            </button>
          </div>
        </div>
      </>
    )}

      </div>
    </div>
  );
};
