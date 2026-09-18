import React, { useState, useEffect } from 'react';
import { ScreeningRecord } from './types';
import { INITIAL_OUTREACH_RECORDS } from './data/mockData';
import {
  initDatabase,
  subscribeToDatabase,
  getCachedRecords,
  resetDatabase,
} from './data/db';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { ScreeningForm } from './components/ScreeningForm';
import { BatchReportModal } from './components/BatchReportModal';
import { ProtocolGuideModal } from './components/ProtocolGuideModal';
import { CojLogo, DnwellLogo } from './components/Logos';
import {
  FileText,
  Plus,
  BookOpen,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  HeartPulse,
  Activity,
  Maximize2,
  CheckCircle,
} from 'lucide-react';

export default function App() {
  const [records, setRecords] = useState<ScreeningRecord[]>(() => getCachedRecords());

  const [activeSite, setActiveSite] = useState<string>('ALL');
  const [isScreeningModalOpen, setIsScreeningModalOpen] = useState(false);
  const [isBatchReportOpen, setIsBatchReportOpen] = useState(false);
  const [isProtocolOpen, setIsProtocolOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Initialize DB and listen to real-time database changes
  useEffect(() => {
    initDatabase().catch(console.error);
    const unsubscribe = subscribeToDatabase((latestRecords) => {
      setRecords(latestRecords);
    });
    return unsubscribe;
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleSaveNewRecord = (newRecord: ScreeningRecord) => {
    setRecords((prev) => {
      const idx = prev.findIndex((r) => r.id === newRecord.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = newRecord;
        return next;
      }
      return [newRecord, ...prev];
    });

    if (newRecord.isFullyCompleted) {
      setIsScreeningModalOpen(false);
      showToast(`✓ Screening completed & saved for ${newRecord.personal.fullName}! Available in live ledger & reports.`);
    } else {
      showToast(`✓ Record saved for ${newRecord.personal.fullName} in database.`);
    }
  };

  const handleResetData = async () => {
    if (window.confirm('Clear all client screening records from the outreach database? This will clear all data.')) {
      await resetDatabase();
      setRecords([]);
      showToast('All outreach screening records cleared from database.');
    }
  };



  // Filter records by active site if not ALL
  const visibleRecords = activeSite === 'ALL' ? records : records.filter((r) => r.outreachSite === activeSite);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col selection:bg-amber-400 selection:text-slate-950 font-sans">
      {/* Top Application Header */}
      <Header
        onNewScreening={() => setIsScreeningModalOpen(true)}
        onOpenBatchReport={() => setIsBatchReportOpen(true)}
        currentSite={activeSite}
        onSelectSite={setActiveSite}
        screeningCount={records.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-6 space-y-6">
        {/* Field Notice & Protocol Banner */}
        <div className="bg-gradient-to-r from-[#0B2545] via-[#0E2E56] to-[#123B6E] text-white border border-blue-900/40 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-5 no-print">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-white font-extrabold text-base sm:text-xl tracking-tight">
                  Dunwell Youth Priority Clinic & COJ Homeless Outreach
                </h1>
                <span className="hidden sm:inline-block text-[10px] uppercase font-black bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-full shadow-sm">
                  Live Intake Tool
                </span>
              </div>
              <p className="text-xs text-blue-100 mt-1 max-w-3xl leading-relaxed">
                Integrated health ledger: Personal Details, Vitals & Clinical Ranges (Pulse, SpO2, BP, MAP, BMI), HTS Rapid Testing, Substance Screening, and Clinical Action Plan.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-stretch md:self-auto justify-end">
            <button
              onClick={() => setIsProtocolOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 transition"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>Field Protocol</span>
            </button>

            <button
              onClick={() => setIsScreeningModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl shadow-md transition whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Screen Client</span>
            </button>
          </div>
        </div>

        {/* Screening Form View (when active) or Live Dashboard */}
        {isScreeningModalOpen ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm">
              <button
                onClick={() => setIsScreeningModalOpen(false)}
                className="text-xs font-bold text-blue-900 hover:text-blue-700 transition flex items-center gap-1.5"
              >
                ← Return to Live Dashboard
              </button>
              <span className="text-xs text-slate-500 font-bold">
                Active Outreach Intake & Screening Mode
              </span>
            </div>
            <ScreeningForm
              onSaveRecord={handleSaveNewRecord}
              onCancel={() => setIsScreeningModalOpen(false)}
              activeOutreachSite={activeSite === 'ALL' ? 'Joubert Park Clinic Base' : activeSite}
            />
          </div>
        ) : (
          <Dashboard
            records={visibleRecords}
            onOpenPdf={() => setIsBatchReportOpen(true)}
            onNewScreening={() => setIsScreeningModalOpen(true)}
            onOpenBatchReport={() => setIsBatchReportOpen(true)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12 no-print text-xs text-slate-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <CojLogo className="h-8" variant="dark" />
            <div className="h-5 w-px bg-slate-300" />
            <DnwellLogo className="h-8" variant="dark" />
            <span className="text-xs text-slate-500 hidden sm:inline">
              • Joint Public Health & Homelessness Clinical Intervention
            </span>
          </div>

          <div className="flex items-center gap-4 text-slate-500">
            <span className="font-semibold">Light Mode • Navy Blue, Yellow & Grey</span>
            <span>•</span>
            <button
              onClick={handleResetData}
              className="text-slate-600 hover:text-amber-600 transition inline-flex items-center gap-1 font-semibold"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Clear Database Records
            </button>
          </div>
        </div>
      </footer>

      {/* Modal: City of Johannesburg & Dunwell Clinic All-Stats Consolidated PDF */}
      {isBatchReportOpen && (
        <BatchReportModal
          records={visibleRecords}
          onClose={() => setIsBatchReportOpen(false)}
        />
      )}

      {/* Modal: Field Intake Protocol Reference */}
      {isProtocolOpen && (
        <ProtocolGuideModal onClose={() => setIsProtocolOpen(false)} />
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-emerald-700 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 font-bold text-xs animate-in slide-in-from-bottom-5">
          <ShieldCheck className="w-4 h-4 text-emerald-200" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
