import React, { useEffect, useState } from 'react';
import { CojLogo, DnwellLogo } from './Logos';
import { Plus, Download, MapPin, Maximize2, Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { OUTREACH_SITES } from '../data/mockData';
import { subscribeToSyncStatus, getSyncStatus } from '../data/db';

interface HeaderProps {
  onNewScreening: () => void;
  onOpenBatchReport: () => void;
  currentSite: string;
  onSelectSite: (site: string) => void;
  screeningCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onNewScreening,
  onOpenBatchReport,
  currentSite,
  onSelectSite,
  screeningCount,
}) => {
  const [syncState, setSyncState] = useState<'connected' | 'connecting' | 'offline'>(() => getSyncStatus());

  useEffect(() => {
    return subscribeToSyncStatus((status) => {
      setSyncState(status);
    });
  }, []);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm no-print">
      {/* Top micro-bar for jurisdiction & live status */}
      <div className="bg-[#0B2545] px-4 sm:px-8 py-1.5 flex flex-wrap items-center justify-between text-xs text-slate-200">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
          </span>
          <span className="font-extrabold text-amber-400 uppercase tracking-wider text-[11px]">
            City of Johannesburg & Dunwell Youth Priority Clinic
          </span>
          <span className="text-slate-400 hidden sm:inline">|</span>
          <span className="text-slate-200 hidden sm:inline">Homeless Outreach & Clinical Ledger</span>
        </div>

        <div className="flex items-center gap-3 text-xs">
          {/* Real-time Cloud Database Status Badge */}
          <div
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
              syncState === 'connected'
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                : syncState === 'connecting'
                ? 'bg-amber-950/80 text-amber-300 border border-amber-500/40'
                : 'bg-rose-950/80 text-rose-300 border border-rose-500/40'
            }`}
            title={
              syncState === 'connected'
                ? 'Cloud Firestore Database Connected: Real-time synchronization active across all devices'
                : syncState === 'connecting'
                ? 'Connecting to Cloud Firestore Database...'
                : 'Offline Cache Active: Records will sync when reconnected'
            }
          >
            {syncState === 'connected' ? (
              <>
                <Cloud className="w-3 h-3 text-emerald-400 animate-pulse" />
                <span>Cloud Database Synced</span>
              </>
            ) : syncState === 'connecting' ? (
              <>
                <RefreshCw className="w-3 h-3 text-amber-400 animate-spin" />
                <span>Connecting DB...</span>
              </>
            ) : (
              <>
                <CloudOff className="w-3 h-3 text-rose-400" />
                <span>Offline Cache Mode</span>
              </>
            )}
          </div>

          <span className="text-slate-500">|</span>

          <span className="text-slate-300">
            Total Intakes: <strong className="text-amber-400 font-mono font-bold">{screeningCount}</strong> screened
          </span>
          <span className="text-slate-500 hidden md:inline">|</span>
          <span className="text-emerald-300 font-bold hidden md:inline">POPIA & National Health Act Compliant</span>
        </div>
      </div>

      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Logos & Title */}
        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-3.5">
            <CojLogo className="h-10" variant="dark" />
            <div className="h-8 w-px bg-slate-300 hidden sm:block" />
            <DnwellLogo className="h-10" variant="dark" />
          </div>

          {/* Mobile quick new button */}
          <button
            onClick={onNewScreening}
            className="md:hidden p-2 bg-amber-500 text-slate-950 rounded-xl font-bold shadow"
            title="Start Screening Intake"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Center/Right Actions & Site Selector */}
        <div className="flex flex-wrap items-center justify-end gap-2.5 w-full md:w-auto">
          {/* Active Hotspot site picker */}
          <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-300 px-3 py-1.5 rounded-xl text-xs">
            <MapPin className="w-3.5 h-3.5 text-blue-900 shrink-0" />
            <span className="text-slate-600 text-[11px] uppercase font-bold hidden sm:inline">Hub:</span>
            <select
              value={currentSite}
              onChange={(e) => onSelectSite(e.target.value)}
              className="bg-transparent text-slate-900 font-bold text-xs focus:outline-none cursor-pointer max-w-[190px] truncate"
            >
              <option value="ALL">All Sites (Consolidated)</option>
              {OUTREACH_SITES.map((site) => (
                <option key={site} value={site}>
                  {site}
                </option>
              ))}
            </select>
          </div>

          {/* Consolidated All-Stats PDF Report Button */}
          <button
            onClick={onOpenBatchReport}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-xl transition shadow-sm"
            title="Download consolidated PDF with all statistics and tables for all screened people"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>All Stats (PDF)</span>
          </button>

          {/* Primary CTA: New Screening Form */}
          <button
            onClick={onNewScreening}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>Start Screening Intake</span>
          </button>
        </div>
      </div>
    </header>
  );
};
