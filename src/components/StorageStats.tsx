import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { HardDrive, Image as ImageIcon, Video as VideoIcon, Database, Filter, RefreshCw, Sparkles, PieChart, BarChart2 } from 'lucide-react';
import { MediaFile, UserAccount } from '../types';
import { formatBytes } from '../lib/crypto';

interface StorageStatsProps {
  mediaFiles: MediaFile[];
  currentUser: UserAccount | null;
  activeFilter?: string;
  onSelectFilter?: (filter: string) => void;
  quotaBytes?: number;
}

interface DataType {
  id: 'image' | 'video' | 'remaining';
  label: string;
  bytes: number;
  count: number;
  color: string;
  gradientId: string;
}

export const StorageStats: React.FC<StorageStatsProps> = ({
  mediaFiles,
  currentUser,
  activeFilter = 'all',
  onSelectFilter,
  quotaBytes = 5 * 1024 * 1024 * 1024, // 5 GB default allocation
}) => {
  const [scope, setScope] = useState<'my-vault' | 'network'>(() => {
    return currentUser?.address ? 'my-vault' : 'network';
  });
  const [viewType, setViewType] = useState<'donut' | 'bars'>('donut');
  const [hoveredSlice, setHoveredSlice] = useState<DataType | null>(null);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const barSvgRef = useRef<SVGSVGElement | null>(null);

  // Compute active files based on selected scope
  const targetFiles = useMemo(() => {
    if (scope === 'my-vault' && currentUser?.address) {
      const userAddr = currentUser.address.toLowerCase();
      return mediaFiles.filter(f => f.ownerAddress.toLowerCase() === userAddr);
    }
    return mediaFiles;
  }, [mediaFiles, scope, currentUser?.address]);

  // Aggregate stats
  const imageFiles = useMemo(() => targetFiles.filter(f => f.type === 'image'), [targetFiles]);
  const videoFiles = useMemo(() => targetFiles.filter(f => f.type === 'video'), [targetFiles]);

  const imageBytes = useMemo(() => imageFiles.reduce((acc, f) => acc + f.sizeBytes, 0), [imageFiles]);
  const videoBytes = useMemo(() => videoFiles.reduce((acc, f) => acc + f.sizeBytes, 0), [videoFiles]);
  const totalUsedBytes = imageBytes + videoBytes;
  const remainingBytes = Math.max(0, quotaBytes - totalUsedBytes);

  const usedPercentage = Math.min(100, Math.round((totalUsedBytes / (quotaBytes || 1)) * 100));
  const imagePercentage = totalUsedBytes > 0 ? Math.round((imageBytes / totalUsedBytes) * 100) : 0;
  const videoPercentage = totalUsedBytes > 0 ? 100 - imagePercentage : 0;

  const avgImageSize = imageFiles.length > 0 ? Math.round(imageBytes / imageFiles.length) : 0;
  const avgVideoSize = videoFiles.length > 0 ? Math.round(videoBytes / videoFiles.length) : 0;

  // Chart datasets
  const donutData: DataType[] = useMemo(() => {
    return [
      {
        id: 'image',
        label: 'Images',
        bytes: imageBytes,
        count: imageFiles.length,
        color: '#06b6d4', // cyan-500
        gradientId: 'grad-image',
      },
      {
        id: 'video',
        label: 'Videos',
        bytes: videoBytes,
        count: videoFiles.length,
        color: '#8b5cf6', // violet-500
        gradientId: 'grad-video',
      },
      {
        id: 'remaining',
        label: 'Free Quota',
        bytes: remainingBytes,
        count: 0,
        color: '#1e293b', // slate-800
        gradientId: 'grad-remaining',
      },
    ];
  }, [imageBytes, videoBytes, remainingBytes, imageFiles.length, videoFiles.length]);

  // Render D3 Donut Chart
  useEffect(() => {
    if (!svgRef.current || viewType !== 'donut') return;

    const width = 240;
    const height = 240;
    const margin = 16;
    const radius = Math.min(width, height) / 2 - margin;
    const innerRadius = radius * 0.68;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Define gradients and filters
    const defs = svg.append('defs');

    // Glow filter
    const filter = defs.append('filter')
      .attr('id', 'd3-glow')
      .attr('x', '-20%')
      .attr('y', '-20%')
      .attr('width', '140%')
      .attr('height', '140%');

    filter.append('feGaussianBlur')
      .attr('stdDeviation', '4')
      .attr('result', 'blur');
    filter.append('feComposite')
      .attr('in', 'SourceGraphic')
      .attr('in2', 'blur')
      .attr('operator', 'over');

    // Gradient Image
    const gradImage = defs.append('linearGradient')
      .attr('id', 'grad-image')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '100%').attr('y2', '100%');
    gradImage.append('stop').attr('offset', '0%').attr('stop-color', '#22d3ee');
    gradImage.append('stop').attr('offset', '100%').attr('stop-color', '#0891b2');

    // Gradient Video
    const gradVideo = defs.append('linearGradient')
      .attr('id', 'grad-video')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '100%').attr('y2', '100%');
    gradVideo.append('stop').attr('offset', '0%').attr('stop-color', '#a78bfa');
    gradVideo.append('stop').attr('offset', '100%').attr('stop-color', '#7c3aed');

    // Gradient Remaining
    const gradRemaining = defs.append('linearGradient')
      .attr('id', 'grad-remaining')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '100%').attr('y2', '100%');
    gradRemaining.append('stop').attr('offset', '0%').attr('stop-color', '#1e293b');
    gradRemaining.append('stop').attr('offset', '100%').attr('stop-color', '#0f172a');

    // Root Group
    const g = svg
      .append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`);

    // D3 Pie Generator
    const pie = d3.pie<DataType>()
      .value(d => Math.max(1, d.bytes))
      .sort(null)
      .padAngle(0.04);

    // D3 Arc Generator
    const arc = d3.arc<d3.PieArcDatum<DataType>>()
      .innerRadius(innerRadius)
      .outerRadius(radius)
      .cornerRadius(6);

    const arcHover = d3.arc<d3.PieArcDatum<DataType>>()
      .innerRadius(innerRadius - 2)
      .outerRadius(radius + 6)
      .cornerRadius(8);

    const pieData = pie(donutData);

    // Render Arcs
    const paths = g
      .selectAll('path')
      .data(pieData)
      .enter()
      .append('path')
      .attr('fill', d => `url(#${d.data.gradientId})`)
      .attr('stroke', d => d.data.id === 'remaining' ? '#334155' : 'rgba(255, 255, 255, 0.15)')
      .attr('stroke-width', 1.5)
      .style('cursor', d => d.data.id !== 'remaining' ? 'pointer' : 'default')
      .style('transition', 'filter 0.2s ease, transform 0.2s ease');

    // Entrance Animation
    paths
      .transition()
      .duration(750)
      .attrTween('d', (d) => {
        const i = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
        return (t) => arc(i(t)) || '';
      });

    // Interactivity
    paths
      .on('mouseenter', function (event, d) {
        if (d.data.id !== 'remaining') {
          d3.select(this)
            .transition()
            .duration(200)
            .attr('d', (datum: any) => arcHover(datum) || '')
            .style('filter', 'url(#d3-glow)');
        }
        setHoveredSlice(d.data);
      })
      .on('mouseleave', function (event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('d', (datum: any) => arc(datum) || '')
          .style('filter', 'none');
        setHoveredSlice(null);
      })
      .on('click', (event, d) => {
        if (d.data.id === 'image' && onSelectFilter) {
          onSelectFilter('image');
        } else if (d.data.id === 'video' && onSelectFilter) {
          onSelectFilter('video');
        }
      });

  }, [donutData, viewType, onSelectFilter]);

  // Render D3 Horizontal Comparative Bar Chart
  useEffect(() => {
    if (!barSvgRef.current || viewType !== 'bars') return;

    const width = 360;
    const height = 180;
    const margin = { top: 20, right: 30, bottom: 25, left: 70 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select(barSvgRef.current);
    svg.selectAll('*').remove();

    const barData = [
      { type: 'Images', bytes: imageBytes, count: imageFiles.length, color: '#06b6d4', id: 'image' },
      { type: 'Videos', bytes: videoBytes, count: videoFiles.length, color: '#8b5cf6', id: 'video' },
    ];

    const maxBytes = Math.max(1, d3.max(barData, d => d.bytes) || 1);

    const xScale = d3.scaleLinear()
      .domain([0, maxBytes * 1.15])
      .range([0, innerWidth]);

    const yScale = d3.scaleBand()
      .domain(barData.map(d => d.type))
      .range([0, innerHeight])
      .padding(0.35);

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Grid lines
    g.append('g')
      .attr('class', 'grid')
      .attr('transform', `translate(0, ${innerHeight})`)
      .call(
        d3.axisBottom(xScale)
          .ticks(4)
          .tickSize(-innerHeight)
          .tickFormat(() => '')
      )
      .selectAll('line')
      .attr('stroke', '#1e293b')
      .attr('stroke-dasharray', '2,2');

    // Y Axis Labels
    g.append('g')
      .call(d3.axisLeft(yScale).tickSize(0))
      .selectAll('text')
      .attr('fill', '#94a3b8')
      .attr('font-size', '11px')
      .attr('font-weight', '600');

    g.select('.domain').remove();

    // Bars
    const bars = g
      .selectAll('.bar-group')
      .data(barData)
      .enter()
      .append('g')
      .attr('class', 'bar-group')
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        if (onSelectFilter) {
          onSelectFilter(d.id);
        }
      });

    // Background track
    bars.append('rect')
      .attr('y', d => yScale(d.type) || 0)
      .attr('x', 0)
      .attr('width', innerWidth)
      .attr('height', yScale.bandwidth())
      .attr('fill', '#0f172a')
      .attr('rx', 6);

    // Colored bar
    bars.append('rect')
      .attr('y', d => yScale(d.type) || 0)
      .attr('x', 0)
      .attr('height', yScale.bandwidth())
      .attr('fill', d => d.color)
      .attr('rx', 6)
      .attr('width', 0)
      .transition()
      .duration(700)
      .attr('width', d => Math.max(6, xScale(d.bytes)));

    // Value Labels
    bars.append('text')
      .attr('y', d => (yScale(d.type) || 0) + yScale.bandwidth() / 2 + 4)
      .attr('x', d => Math.min(innerWidth - 8, Math.max(10, xScale(d.bytes) + 8)))
      .attr('fill', '#f1f5f9')
      .attr('font-size', '10px')
      .attr('font-family', 'monospace')
      .attr('font-weight', 'bold')
      .text(d => formatBytes(d.bytes));

  }, [imageBytes, videoBytes, imageFiles.length, videoFiles.length, viewType, onSelectFilter]);

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-slate-900/90 via-slate-950 to-slate-900/90 border border-slate-800 shadow-xl space-y-5">
      
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <PieChart className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-100 flex items-center gap-2">
                <span>Decentralized Storage Distribution</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                  D3.js ENGINE
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Live cryptographic breakdown of IPFS pinned media assets by type and storage footprint.
              </p>
            </div>
          </div>
        </div>

        {/* Action Toggles: Scope & Chart Type */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Scope Toggle: My Vault vs Public Network */}
          <div className="flex items-center bg-slate-950 p-0.5 rounded-xl border border-slate-800">
            {currentUser && (
              <button
                type="button"
                id="storage-scope-vault-btn"
                onClick={() => setScope('my-vault')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  scope === 'my-vault'
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                My Vault
              </button>
            )}
            <button
              type="button"
              id="storage-scope-network-btn"
              onClick={() => setScope('network')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                scope === 'network'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Network ({mediaFiles.length})
            </button>
          </div>

          {/* View Mode Toggle: Donut vs Bars */}
          <div className="flex items-center bg-slate-950 p-0.5 rounded-xl border border-slate-800">
            <button
              type="button"
              id="storage-view-donut-btn"
              onClick={() => setViewType('donut')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewType === 'donut'
                  ? 'bg-slate-800 text-cyan-300'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Donut Distribution"
            >
              <PieChart className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              id="storage-view-bars-btn"
              onClick={() => setViewType('bars')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewType === 'bars'
                  ? 'bg-slate-800 text-cyan-300'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Comparative Volume Bars"
            >
              <BarChart2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Layout: D3 Visualization + Informative Analytics Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        
        {/* Left Column: D3 Chart Container with Central Readout */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center p-3 relative">
          {viewType === 'donut' ? (
            <div className="relative flex items-center justify-center">
              <svg
                ref={svgRef}
                width={240}
                height={240}
                viewBox="0 0 240 240"
                className="overflow-visible"
              />
              
              {/* Dynamic Center Metric Readout */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
                <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400 font-semibold">
                  {hoveredSlice ? hoveredSlice.label : 'TOTAL IPFS USED'}
                </span>
                <span className="text-xl sm:text-2xl font-bold font-mono text-slate-100 tracking-tight mt-0.5">
                  {hoveredSlice
                    ? formatBytes(hoveredSlice.bytes)
                    : formatBytes(totalUsedBytes)}
                </span>
                <span className="text-[11px] text-slate-400 font-mono mt-0.5">
                  {hoveredSlice
                    ? hoveredSlice.count > 0 ? `${hoveredSlice.count} Assets` : `${usedPercentage}% used`
                    : `${targetFiles.length} Total Files (${usedPercentage}% Allocation)`}
                </span>
              </div>
            </div>
          ) : (
            <div className="w-full flex items-center justify-center">
              <svg
                ref={barSvgRef}
                width={360}
                height={180}
                viewBox="0 0 360 180"
                className="w-full max-w-sm overflow-visible"
              />
            </div>
          )}

          <div className="text-center text-[11px] text-slate-400 mt-2 font-mono">
            <span>Hover or click slices to filter media database</span>
          </div>
        </div>

        {/* Right Column: Detailed Interactive Breakdown Cards */}
        <div className="lg:col-span-7 space-y-3">
          
          {/* Card 1: Images Breakdown */}
          <div
            onClick={() => onSelectFilter && onSelectFilter('image')}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer group ${
              activeFilter === 'image'
                ? 'bg-cyan-950/40 border-cyan-500/60 shadow-lg shadow-cyan-500/10'
                : 'bg-slate-950/60 border-slate-800 hover:border-cyan-500/30 hover:bg-slate-900/60'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-100">Images Distribution</span>
                    <span className="text-[10px] font-mono text-cyan-300 font-semibold">
                      {imagePercentage}% of used storage
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                    <span>{imageFiles.length} Files</span>
                    <span>•</span>
                    <span className="font-mono">Avg: {formatBytes(avgImageSize)}</span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-sm font-bold font-mono text-cyan-300">
                  {formatBytes(imageBytes)}
                </div>
                <div className="text-[10px] text-slate-400 font-medium">
                  {activeFilter === 'image' ? 'Active Filter ✓' : 'Click to filter'}
                </div>
              </div>
            </div>

            {/* Proportion Bar */}
            <div className="mt-2.5 h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-cyan-400 transition-all duration-500"
                style={{ width: `${imagePercentage}%` }}
              />
            </div>
          </div>

          {/* Card 2: Videos Breakdown */}
          <div
            onClick={() => onSelectFilter && onSelectFilter('video')}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer group ${
              activeFilter === 'video'
                ? 'bg-violet-950/40 border-violet-500/60 shadow-lg shadow-violet-500/10'
                : 'bg-slate-950/60 border-slate-800 hover:border-violet-500/30 hover:bg-slate-900/60'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-violet-400 group-hover:scale-105 transition-transform">
                  <VideoIcon className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-100">Videos Distribution</span>
                    <span className="text-[10px] font-mono text-violet-300 font-semibold">
                      {videoPercentage}% of used storage
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                    <span>{videoFiles.length} Files</span>
                    <span>•</span>
                    <span className="font-mono">Avg: {formatBytes(avgVideoSize)}</span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-sm font-bold font-mono text-violet-300">
                  {formatBytes(videoBytes)}
                </div>
                <div className="text-[10px] text-slate-400 font-medium">
                  {activeFilter === 'video' ? 'Active Filter ✓' : 'Click to filter'}
                </div>
              </div>
            </div>

            {/* Proportion Bar */}
            <div className="mt-2.5 h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-violet-500 transition-all duration-500"
                style={{ width: `${videoPercentage}%` }}
              />
            </div>
          </div>

          {/* Card 3: Storage Quota Allocation & Swarm Capacity */}
          <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/80 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <HardDrive className="w-4 h-4 text-emerald-400" />
              <span>IPFS Allocation Quota:</span>
              <span className="font-mono font-bold text-slate-100">{formatBytes(quotaBytes)}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px]">
              <span>Free: <strong className="text-emerald-400">{formatBytes(remainingBytes)}</strong></span>
              {activeFilter !== 'all' && onSelectFilter && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectFilter('all');
                  }}
                  className="ml-2 text-cyan-400 hover:text-cyan-300 underline underline-offset-2 cursor-pointer"
                >
                  Reset Filter
                </button>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
