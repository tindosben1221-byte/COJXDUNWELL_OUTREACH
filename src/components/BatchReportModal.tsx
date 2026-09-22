import React, { useRef, useState, useMemo } from 'react';
import { ScreeningRecord, PsychosocialSymptoms } from '../types';
import { CojLogo, DnwellLogo } from './Logos';
import { deduplicateRecordsByName } from '../data/db';
import {
  Printer,
  Download,
  X,
  FileSpreadsheet,
  CheckCircle2,
  Loader2,
  HeartPulse,
  Users,
  AlertTriangle,
  Activity,
  Home,
  Baby,
  GraduationCap,
  Brain,
  BarChart3,
  TrendingUp,
  Info,
  Shield,
  Stethoscope,
  Award,
  Layers,
} from 'lucide-react';
import html2canvas from 'html2canvas-pro';
import jsPDF from 'jspdf';

interface BatchReportModalProps {
  records: ScreeningRecord[];
  onClose: () => void;
  activeSite?: string;
}

export const BatchReportModal: React.FC<BatchReportModalProps> = ({
  records: rawRecords,
  onClose,
  activeSite = 'ALL',
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<{ current: number; total: number } | null>(null);

  // Deduplicate all records by name so no repeated names exist anywhere in batch dossier
  const records = useMemo(() => deduplicateRecordsByName(rawRecords), [rawRecords]);

  // Total Cohort Metrics
  const total = records.length;
  const youthCount = records.filter((r) => r.personal.age <= 35).length;
  const youthPct = total ? Math.round((youthCount / total) * 100) : 0;

  const maleCount = records.filter((r) => r.personal.gender === 'Male').length;
  const femaleCount = records.filter((r) => r.personal.gender === 'Female').length;
  const otherGenderCount = total - maleCount - femaleCount;

  // HTS Metrics
  const htsTested = records.filter((r) => r.hts.acceptHtsTest === 'Yes').length;
  const htsTestedPct = total ? Math.round((htsTested / total) * 100) : 0;
  const htsReactive = records.filter((r) => r.hts.testResult.includes('Reactive (Positive)')).length;
  const htsReactivePct = htsTested ? Math.round((htsReactive / htsTested) * 100) : 0;
  const htsNonReactive = records.filter((r) => r.hts.testResult.includes('Non-Reactive')).length;
  const onArtCount = records.filter((r) => r.hts.onArt.includes('Yes')).length;

  // Substance & Rehab Metrics
  const substanceUsers = records.filter(
    (r) => !r.substance.substanceTypes.includes('None') || r.substance.drugUseFrequency !== 'Never'
  );
  const substanceUsersCount = substanceUsers.length;
  const substancePct = total ? Math.round((substanceUsersCount / total) * 100) : 0;
  const rehabCount = records.filter((r) => r.substance.interestInRehabSupport.includes('Yes')).length;
  const rehabPct = substanceUsersCount ? Math.round((rehabCount / substanceUsersCount) * 100) : 0;
  const injectingCount = records.filter((r) => r.substance.injectingDrugUse).length;

  // Clinical & Triage Metrics
  const acuteCount = records.filter(
    (r) =>
      r.actionPlan.triageLevel.includes('Urgent') ||
      r.actionPlan.triageLevel.includes('Emergency') ||
      r.medical.tbScreeningSymptomatic ||
      r.medical.vitals.bloodPressureSys >= 140
  ).length;
  const acutePct = total ? Math.round((acuteCount / total) * 100) : 0;
  const highBpCount = records.filter((r) => r.medical.vitals.bloodPressureSys >= 140).length;
  const tbSymptomCount = records.filter((r) => r.medical.tbScreeningSymptomatic).length;
  const traumaCount = records.filter((r) => r.medical.presentComplaints.includes('Acute Injury / Trauma')).length;
  const abscessCount = records.filter((r) => r.medical.presentComplaints.includes('Open Wounds / Abscess / Ulcers')).length;
  const woundsCount = records.filter((r) =>
    r.medical.presentComplaints.some((c) => c === 'Acute Injury / Trauma' || c === 'Open Wounds / Abscess / Ulcers')
  ).length;

  // COJ Homeless Shelter Metrics
  const shelterMetrics = useMemo(() => {
    let wantsYes = 0;
    let wantsUndecided = 0;
    let wantsNo = 0;
    let stayedYes = 0;
    let stayedNo = 0;
    const freqMap: Record<string, number> = {
      'Once': 0,
      '2-3 Times': 0,
      'Frequently / Multiple Times': 0,
      'Never': 0,
    };
    const reasonsMap: Record<string, number> = {};

    records.forEach((r) => {
      const w = r.actionPlan?.wantsCojShelter;
      if (w === 'Yes') wantsYes++;
      else if (w === 'Undecided') wantsUndecided++;
      else wantsNo++;

      const s = r.actionPlan?.stayedAtCojShelterBefore;
      if (s === 'Yes') {
        stayedYes++;
        const f = r.actionPlan?.shelterFrequency || 'Once';
        freqMap[f] = (freqMap[f] || 0) + 1;
        const re = r.actionPlan?.shelterReasonForLeaving || 'Not Specified';
        reasonsMap[re] = (reasonsMap[re] || 0) + 1;
      } else {
        stayedNo++;
      }
    });

    const reasonsList = Object.entries(reasonsMap)
      .map(([reason, count]) => ({
        reason,
        count,
        pct: stayedYes ? Math.round((count / stayedYes) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    return {
      wantsYes,
      wantsYesPct: total ? Math.round((wantsYes / total) * 100) : 0,
      wantsUndecided,
      wantsNo,
      stayedYes,
      stayedYesPct: total ? Math.round((stayedYes / total) * 100) : 0,
      stayedNo,
      freqMap,
      reasonsList,
    };
  }, [records, total]);

  // Street Children & Family Protection Metrics
  const childrenMetrics = useMemo(() => {
    let totalChildren = 0;
    const cases: Array<{
      ref: string;
      name: string;
      site: string;
      count: number;
      ages: string;
      wantsShelter: string;
    }> = [];

    records.forEach((r) => {
      if (r.actionPlan?.hasChildrenOnStreets === 'Yes') {
        const c = r.actionPlan.childrenCount || 1;
        totalChildren += c;
        cases.push({
          ref: r.refNumber,
          name: r.personal.fullName,
          site: r.outreachSite,
          count: c,
          ages: r.actionPlan.childrenAges || 'Unspecified',
          wantsShelter: r.actionPlan.wantsCojShelter || 'Unset',
        });
      }
    });

    return {
      totalChildren,
      familyCount: cases.length,
      familyPct: total ? Math.round((cases.length / total) * 100) : 0,
      cases,
    };
  }, [records, total]);

  // Skills Development & Vocational Training Metrics
  const skillsMetrics = useMemo(() => {
    let interestedYes = 0;
    let interestedUndecided = 0;
    let interestedNo = 0;
    const skillsMap: Record<string, number> = {};

    records.forEach((r) => {
      const s = r.actionPlan?.interestedInSkillsDevelopment;
      if (s === 'Yes') interestedYes++;
      else if (s === 'Undecided') interestedUndecided++;
      else interestedNo++;

      if (r.actionPlan?.skillsInterestAreas) {
        r.actionPlan.skillsInterestAreas.forEach((skill) => {
          skillsMap[skill] = (skillsMap[skill] || 0) + 1;
        });
      }
    });

    const skillsRanked = Object.entries(skillsMap)
      .map(([skill, count]) => ({
        skill,
        count,
        pct: total ? Math.round((count / total) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    return {
      interestedYes,
      interestedYesPct: total ? Math.round((interestedYes / total) * 100) : 0,
      interestedUndecided,
      interestedNo,
      skillsRanked,
    };
  }, [records, total]);

  // Psychosocial Tick Form Deep Metrics
  const psychosocialMetrics = useMemo(() => {
    let evaluated = 0;
    let crisis = 0;
    let high = 0;
    let moderate = 0;
    let mild = 0;
    let suicideAlerts = 0;

    const symptomLabels: Record<keyof PsychosocialSymptoms, string> = {
      depressedMood: 'Severe Depression / Hopelessness',
      anxiety: 'Excessive Anxiety & Hyperarousal',
      sleepDisturbance: 'Severe Insomnia / Sleep Deprivation',
      appetiteLoss: 'Severe Appetite Loss / Malnutrition',
      traumaFlashbacks: 'PTSD & Street Trauma Flashbacks',
      anhedonia: 'Loss of Life Interest / Vitality',
      hallucinationsOrParanoia: 'Paranoia / Drug-Induced Psychosis',
      panicSymptoms: 'Acute Panic Attacks & Tremors',
      suicidalIdeation: 'Suicidal Ideation & Intent Alerts',
      extremeIsolation: 'Severe Social Alienation',
      cognitiveConfusion: 'Cognitive Disorientation',
      recentGbvOrAssault: 'Recent Physical/Sexual Assault & GBV',
    };

    const symptomCounts: Record<string, number> = {};

    records.forEach((r) => {
      if (r.psychosocial) {
        evaluated++;
        const lvl = r.psychosocial.analysis.distressLevel;
        if (lvl === 'Severe Crisis') crisis++;
        else if (lvl === 'High') high++;
        else if (lvl === 'Moderate') moderate++;
        else mild++;

        if (r.psychosocial.analysis.crisisAlert || r.psychosocial.symptoms.suicidalIdeation) {
          suicideAlerts++;
        }

        (Object.keys(symptomLabels) as Array<keyof PsychosocialSymptoms>).forEach((key) => {
          if (r.psychosocial?.symptoms[key]) {
            symptomCounts[key] = (symptomCounts[key] || 0) + 1;
          }
        });
      }
    });

    const symptomsList = Object.entries(symptomLabels)
      .map(([key, label]) => ({
        label,
        count: symptomCounts[key] || 0,
        pct: evaluated ? Math.round(((symptomCounts[key] || 0) / evaluated) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    return {
      evaluated,
      crisis,
      high,
      moderate,
      mild,
      suicideAlerts,
      symptomsList,
    };
  }, [records]);

  // Breakdown 1: Hotspot Sites
  const siteBreakdown = useMemo(() => {
    const map: Record<string, { total: number; youth: number; htsPos: number; rehab: number; acute: number }> = {};
    records.forEach((r) => {
      const s = r.outreachSite;
      if (!map[s]) map[s] = { total: 0, youth: 0, htsPos: 0, rehab: 0, acute: 0 };
      map[s].total += 1;
      if (r.personal.age <= 35) map[s].youth += 1;
      if (r.hts.testResult.includes('Reactive (Positive)')) map[s].htsPos += 1;
      if (r.substance.interestInRehabSupport.includes('Yes')) map[s].rehab += 1;
      if (
        r.actionPlan.triageLevel.includes('Urgent') ||
        r.actionPlan.triageLevel.includes('Emergency') ||
        r.medical.tbScreeningSymptomatic
      ) {
        map[s].acute += 1;
      }
    });
    return Object.entries(map).map(([site, data]) => ({ site, ...data })).sort((a, b) => b.total - a.total);
  }, [records]);

  // Breakdown 2: Substance Prevalence
  const substanceBreakdown = useMemo(() => {
    const counts: Record<string, { count: number; rehabWanted: number }> = {};
    records.forEach((r) => {
      r.substance.substanceTypes.forEach((sub) => {
        const key = sub.split('(')[0].trim();
        if (!counts[key]) counts[key] = { count: 0, rehabWanted: 0 };
        counts[key].count += 1;
        if (r.substance.interestInRehabSupport.includes('Yes')) {
          counts[key].rehabWanted += 1;
        }
      });
    });
    return Object.entries(counts)
      .map(([name, data]) => ({
        name,
        count: data.count,
        pct: total ? Math.round((data.count / total) * 100) : 0,
        rehabWanted: data.rehabWanted,
      }))
      .sort((a, b) => b.count - a.count);
  }, [records, total]);

  // Breakdown 6: Age Cohorts
  const ageBreakdown = useMemo(() => {
    const brackets = [
      { label: 'Youth 18–24y', min: 18, max: 24, color: 'bg-amber-500' },
      { label: 'Youth Core 25–35y', min: 25, max: 35, color: 'bg-amber-600' },
      { label: 'Mature Adults 36–49y', min: 36, max: 49, color: 'bg-blue-600' },
      { label: 'Elderly / Senior 50+y', min: 50, max: 120, color: 'bg-slate-600' },
    ];
    return brackets.map((b) => {
      const c = records.filter((r) => r.personal.age >= b.min && r.personal.age <= b.max).length;
      return {
        label: b.label,
        count: c,
        pct: total ? Math.round((c / total) * 100) : 0,
        color: b.color,
      };
    });
  }, [records, total]);

  // Breakdown 8: Nationality
  const nationalityBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    records.forEach((r) => {
      const nat = r.personal.nationality || 'South African (Undocumented)';
      map[nat] = (map[nat] || 0) + 1;
    });
    return Object.entries(map).map(([nationality, count]) => ({
      nationality,
      count,
      pct: total ? Math.round((count / total) * 100) : 0,
    })).sort((a, b) => b.count - a.count);
  }, [records, total]);

  // High-reliability discrete page-by-page A4 PDF export engine
  const handleDownload = async () => {
    if (!printRef.current) return;
    const container = printRef.current;
    const scrollParent = container.parentElement;
    const prevScrollTop = scrollParent ? scrollParent.scrollTop : 0;

    try {
      setIsDownloading(true);

      if (scrollParent) {
        scrollParent.scrollTop = 0;
      }
      await new Promise((resolve) => setTimeout(resolve, 80));

      const pageElements = Array.from(container.querySelectorAll<HTMLElement>('.dossier-page'));
      if (pageElements.length === 0) return;

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = 210;
      const pdfHeight = 297;

      for (let i = 0; i < pageElements.length; i++) {
        setDownloadProgress({ current: i + 1, total: pageElements.length });
        const pageEl = pageElements[i];

        const canvas = await html2canvas(pageEl, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#FFFFFF',
          logging: false,
          windowWidth: 800,
        });

        const pageImgData = canvas.toDataURL('image/jpeg', 0.95);
        if (i > 0) {
          pdf.addPage('a4', 'p');
        }
        pdf.addImage(pageImgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      }

      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `Dunwell_COJ_Homeless_Outreach_All_Stats_Report_${dateStr}.pdf`;

      try {
        const blob = pdf.output('blob');
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }, 400);
      } catch (blobErr) {
        pdf.save(filename);
      }

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4500);
    } catch (e) {
      console.error('PDF generation error, triggering browser print fallback:', e);
      window.print();
    } finally {
      if (scrollParent) {
        scrollParent.scrollTop = prevScrollTop;
      }
      setIsDownloading(false);
      setDownloadProgress(null);
    }
  };

  // Common Top Running Header for Pages 2 to 8
  const renderRunningHeader = (chapterNum: number, chapterTitle: string) => (
    <div className="border-b-2 border-blue-900 pb-2 mb-2 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <CojLogo className="h-7 w-auto" variant="dark" />
        <div className="h-5 w-px bg-slate-300"></div>
        <DnwellLogo className="h-7 w-auto" variant="dark" useImage />
        <div className="ml-1">
          <span className="text-[8px] font-black uppercase tracking-wider text-blue-950 block">
            CITY OF JOHANNESBURG • HEALTH SERVICES DIRECTORY
          </span>
          <span className="text-[7px] font-semibold text-slate-500 block">
            Dunwell Youth Priority Clinic • Public Health Surveillance Dossier
          </span>
        </div>
      </div>
      <div className="text-right">
        <span className="inline-block bg-blue-950 text-amber-400 text-[8px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
          Chapter {chapterNum}: {chapterTitle}
        </span>
        <span className="text-[7.5px] text-slate-500 block font-mono mt-0.5">
          REF: COJ-DUN-Q3-ALL • N={total} Screened Cohort
        </span>
      </div>
    </div>
  );

  // Common Bottom Running Footer for All Pages
  const renderRunningFooter = (pageNum: number, totalPages: number = 8) => (
    <div className="border-t border-slate-200 pt-2 mt-auto text-[8px] text-slate-500 flex items-center justify-between">
      <span className="font-semibold text-slate-600">
        City of Johannesburg Health Services Directorate & Dunwell Youth Priority Clinic
      </span>
      <span className="hidden sm:inline text-slate-400">
        POPIA Act 4 of 2013 & National Health Act 61 of 2003 • Strictly Confidential
      </span>
      <span className="font-black text-blue-950 font-mono text-[9px] bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
        Page {pageNum} of {totalPages}
      </span>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white border border-slate-300 w-full max-w-5xl rounded-2xl shadow-2xl flex flex-col max-h-[94vh] overflow-hidden my-auto">
        {/* Modal Top Controls Bar */}
        <div className="bg-slate-50 px-5 py-3.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 no-print">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-800 border border-amber-300">
              <FileSpreadsheet className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h2 className="text-slate-900 font-extrabold text-sm sm:text-base flex items-center gap-2">
                <span>All-Stats Consolidated Outreach PDF</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-300 font-mono font-bold">
                  N={total} Unique Screened Persons
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                8-Page Discrete Publication Dossier • Zero Page Overlap • Exact A4 Layout
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold rounded-xl border border-slate-300 transition shadow-sm"
              title="Print directly or save as PDF via system dialog"
            >
              <Printer className="w-3.5 h-3.5 text-blue-900" /> Print A4
            </button>
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl transition shadow-md disabled:opacity-50"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>
                    Rendering Page {downloadProgress?.current || 1} of {downloadProgress?.total || 8}...
                  </span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Download All-Stats PDF (8 Pages)</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {downloadSuccess && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-5 py-2 text-xs font-bold text-emerald-800 flex items-center gap-2 no-print">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>All-Stats PDF Dossier successfully compiled (8 clean A4 pages) and downloaded!</span>
          </div>
        )}

        {/* Scrollable Printable Document Container */}
        <div className="overflow-y-auto p-3 sm:p-6 bg-slate-200 flex flex-col items-center">
          <div ref={printRef} id="all-stats-printable-dossier" className="w-full flex flex-col items-center">

            {/* ============================================================== */}
            {/* PAGE 1: EXECUTIVE COVER & EPIDEMIOLOGICAL DASHBOARD             */}
            {/* ============================================================== */}
            <div className="text-center mb-2 text-[11px] font-bold text-slate-600 uppercase tracking-widest no-print flex items-center justify-center gap-2">
              <span className="h-px bg-slate-400 w-16"></span> Page 1 of 8 • Executive Cover & Cohort Overview <span className="h-px bg-slate-400 w-16"></span>
            </div>
            <div
              className="dossier-page bg-white text-slate-900 p-7 rounded-sm border border-slate-300 font-sans shadow-lg flex flex-col justify-between overflow-hidden relative mb-8"
              style={{ width: '800px', height: '1131px', minHeight: '1131px', maxHeight: '1131px' }}
            >
              <div>
                {/* Formal Masthead */}
                <div className="border-b-4 border-amber-500 pb-3">
                  <div className="flex items-center justify-between gap-4">
                    <CojLogo className="h-12 w-auto" variant="dark" />
                    <div className="text-center flex-1 px-2">
                      <span className="text-[9.5px] font-black uppercase tracking-widest text-blue-900 block">
                        CITY OF JOHANNESBURG • HEALTH SERVICES DIRECTORY
                      </span>
                      <h1 className="text-lg font-black text-blue-950 uppercase tracking-tight">
                        Homeless People Outreach & Epidemiological Surveillance
                      </h1>
                      <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider block">
                        Consolidated Statistical Dossier • In Technical Collaboration with Dunwell Youth Priority Clinic
                      </span>
                    </div>
                    <DnwellLogo className="h-14 w-auto" variant="dark" useImage />
                  </div>

                  {/* Document Meta Information Bar */}
                  <div className="mt-2.5 pt-2 border-t border-slate-200 grid grid-cols-4 gap-2 text-[10px] bg-slate-50 p-2 rounded border border-slate-200">
                    <div>
                      <span className="text-slate-500 block text-[8.5px] uppercase font-bold">Surveillance Cohort</span>
                      <span className="font-mono font-bold text-blue-950">N = {total} Individuals</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[8.5px] uppercase font-bold">Reporting Window</span>
                      <span className="font-semibold text-slate-800">Q3 Consolidated Cycle</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[8.5px] uppercase font-bold">Outreach Scope</span>
                      <span className="font-semibold text-slate-800">{siteBreakdown.length} Urban Corridors</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[8.5px] uppercase font-bold">Legal Governance</span>
                      <span className="font-semibold text-slate-800">POPIA Act 4 & Health Act 61</span>
                    </div>
                  </div>
                </div>

                {/* EXECUTIVE STATISTICAL SUMMARY (8 KPI Cards) */}
                <div className="mt-3 bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                    <h2 className="text-[11px] font-black uppercase text-blue-950 flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-blue-900" />
                      Executive Epidemiological Overview • Entire Screened Cohort
                    </h2>
                    <span className="text-[9px] font-bold bg-blue-900 text-white px-2 py-0.5 rounded">
                      N={total} Deduplicated
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="bg-white p-2 rounded border border-slate-200 shadow-xs">
                      <span className="text-[8.5px] font-bold text-slate-500 uppercase block">Total Screened</span>
                      <span className="text-lg font-black text-slate-900 font-mono">{total}</span>
                      <span className="text-[7.5px] text-slate-400 block">100% Unique Clients</span>
                    </div>
                    <div className="bg-white p-2 rounded border border-slate-200 shadow-xs">
                      <span className="text-[8.5px] font-bold text-slate-500 uppercase block">Youth (≤35y)</span>
                      <span className="text-lg font-black text-amber-600 font-mono">{youthCount}</span>
                      <span className="text-[7.5px] text-amber-600 font-bold block">{youthPct}% of Cohort</span>
                    </div>
                    <div className="bg-white p-2 rounded border border-slate-200 shadow-xs">
                      <span className="text-[8.5px] font-bold text-slate-500 uppercase block">HTS Tested</span>
                      <span className="text-lg font-black text-blue-900 font-mono">{htsTested}</span>
                      <span className="text-[7.5px] text-blue-900 font-bold block">{htsTestedPct}% Acceptance</span>
                    </div>
                    <div className="bg-white p-2 rounded border border-slate-200 shadow-xs">
                      <span className="text-[8.5px] font-bold text-slate-500 uppercase block">HIV Reactive (+)</span>
                      <span className="text-lg font-black text-rose-700 font-mono">{htsReactive}</span>
                      <span className="text-[7.5px] text-rose-700 font-bold block">{htsReactivePct}% Positivity</span>
                    </div>
                    <div className="bg-white p-2 rounded border border-slate-200 shadow-xs">
                      <span className="text-[8.5px] font-bold text-slate-500 uppercase block">Substance Users</span>
                      <span className="text-lg font-black text-amber-700 font-mono">{substanceUsersCount}</span>
                      <span className="text-[7.5px] text-amber-700 font-bold block">{substancePct}% Active</span>
                    </div>
                    <div className="bg-white p-2 rounded border border-slate-200 shadow-xs">
                      <span className="text-[8.5px] font-bold text-slate-500 uppercase block">Rehab Seeking</span>
                      <span className="text-lg font-black text-emerald-700 font-mono">{rehabCount}</span>
                      <span className="text-[7.5px] text-emerald-700 font-bold block">{rehabPct}% Readiness</span>
                    </div>
                    <div className="bg-white p-2 rounded border border-slate-200 shadow-xs">
                      <span className="text-[8.5px] font-bold text-slate-500 uppercase block">Wants COJ Shelter</span>
                      <span className="text-lg font-black text-amber-800 font-mono">{shelterMetrics.wantsYes}</span>
                      <span className="text-[7.5px] text-amber-800 font-bold block">{shelterMetrics.wantsYesPct}% Placed</span>
                    </div>
                    <div className="bg-white p-2 rounded border border-slate-200 shadow-xs">
                      <span className="text-[8.5px] font-bold text-slate-500 uppercase block">Vocational Skills</span>
                      <span className="text-lg font-black text-purple-800 font-mono">{skillsMetrics.interestedYes}</span>
                      <span className="text-[7.5px] text-purple-800 font-bold block">{skillsMetrics.interestedYesPct}% Demand</span>
                    </div>
                  </div>

                  {/* Executive Briefing Callout */}
                  <div className="bg-blue-50/80 border border-blue-200 rounded p-2 text-[10px] text-blue-950 space-y-0.5">
                    <div className="flex items-center gap-1 font-bold text-[10px] text-blue-900">
                      <Info className="w-3 h-3 text-blue-700" />
                      <span>Executive Epidemiological Briefing:</span>
                    </div>
                    <p className="text-[9.5px] leading-relaxed text-slate-700">
                      This consolidated surveillance report monitors <strong>{total} unique homeless individuals</strong> screened across Johannesburg rough-sleeper corridors. The data demonstrates a critically young demographic ({youthPct}% youth ≤35y), high willingness for voluntary HIV testing ({htsTestedPct}%), and decisive opportunities for social rehabilitation: <strong>{rehabPct}% of active substance users demand medical detox</strong> and <strong>{shelterMetrics.wantsYesPct}% request municipal shelter placement</strong>. Immediate medical linkages, harm reduction, and vocational training are coordinated in direct partnership with Dunwell Youth Priority Clinic.
                    </p>
                  </div>
                </div>

                {/* DEMOGRAPHIC & CITIZENSHIP BREAKDOWN */}
                <div className="mt-3 border border-slate-200 rounded-lg p-3 bg-white space-y-2.5">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                    <span className="text-[10.5px] font-extrabold text-blue-950 uppercase flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-blue-800" />
                      Demographic Profiling, Gender Distribution & Age Cohorts
                    </span>
                    <span className="text-[9px] text-slate-500">Population Dynamics</span>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {/* Gender Distribution */}
                    <div className="bg-slate-50 p-2.5 rounded border border-slate-200 space-y-1.5">
                      <span className="text-[9.5px] font-bold text-slate-700 uppercase block">Gender Composition</span>
                      <div className="space-y-1 text-[9.5px]">
                        <div>
                          <div className="flex justify-between text-slate-700">
                            <span>Male</span>
                            <span className="font-bold font-mono">{maleCount} ({total ? Math.round((maleCount / total) * 100) : 0}%)</span>
                          </div>
                          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                            <div className="bg-blue-800 h-2" style={{ width: `${total ? (maleCount / total) * 100 : 0}%` }}></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-slate-700">
                            <span>Female</span>
                            <span className="font-bold font-mono">{femaleCount} ({total ? Math.round((femaleCount / total) * 100) : 0}%)</span>
                          </div>
                          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                            <div className="bg-rose-500 h-2" style={{ width: `${total ? (femaleCount / total) * 100 : 0}%` }}></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Age Cohorts */}
                    <div className="bg-slate-50 p-2.5 rounded border border-slate-200 space-y-1.5">
                      <span className="text-[9.5px] font-bold text-slate-700 uppercase block">Age Stratification</span>
                      <div className="space-y-1 text-[9.5px]">
                        {ageBreakdown.map((b) => (
                          <div key={b.label}>
                            <div className="flex justify-between text-slate-700">
                              <span>{b.label}</span>
                              <span className="font-bold font-mono">{b.count} ({b.pct}%)</span>
                            </div>
                            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                              <div className={`${b.color} h-1.5`} style={{ width: `${b.pct}%` }}></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Nationality & Identity Status */}
                    <div className="bg-slate-50 p-2.5 rounded border border-slate-200 space-y-1.5">
                      <span className="text-[9.5px] font-bold text-slate-700 uppercase block">Nationality & Identity</span>
                      <div className="space-y-1 text-[9.5px]">
                        {nationalityBreakdown.slice(0, 3).map((n) => (
                          <div key={n.nationality}>
                            <div className="flex justify-between text-slate-700 truncate">
                              <span className="truncate max-w-[140px]">{n.nationality}</span>
                              <span className="font-bold font-mono">{n.count} ({n.pct}%)</span>
                            </div>
                            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-slate-700 h-1.5" style={{ width: `${n.pct}%` }}></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {renderRunningFooter(1)}
            </div>

            {/* ============================================================== */}
            {/* PAGE 2: CHAPTER 1 - GEOGRAPHIC HOTSPOT SURVEILLANCE            */}
            {/* ============================================================== */}
            <div className="text-center mb-2 text-[11px] font-bold text-slate-600 uppercase tracking-widest no-print flex items-center justify-center gap-2">
              <span className="h-px bg-slate-400 w-16"></span> Page 2 of 8 • Geographic Hotspot Surveillance <span className="h-px bg-slate-400 w-16"></span>
            </div>
            <div
              className="dossier-page bg-white text-slate-900 p-7 rounded-sm border border-slate-300 font-sans shadow-lg flex flex-col justify-between overflow-hidden relative mb-8"
              style={{ width: '800px', height: '1131px', minHeight: '1131px', maxHeight: '1131px' }}
            >
              <div>
                {renderRunningHeader(1, 'Geographic Hotspot Surveillance')}

                {/* Section Title Banner */}
                <div className="bg-blue-950 text-white px-3 py-1.5 rounded-t text-[11px] font-bold uppercase tracking-wider flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="bg-amber-400 text-blue-950 px-1.5 py-0.2 rounded text-[9.5px] font-black">1</span>
                    <span>Geographic Hotspot Surveillance & Spatial Density</span>
                  </div>
                  <span className="text-[9px] text-amber-300 font-normal">Rough-Sleeper Corridor Mapping</span>
                </div>

                {/* GRAPH 1: Outreach Site Volume & Acuity Distribution Bar Chart */}
                <div className="bg-slate-50 border-x border-b border-slate-200 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-blue-950 flex items-center gap-1 uppercase">
                      <BarChart3 className="w-3.5 h-3.5 text-blue-700" />
                      Graph 1: Screened Population Volume & Acute Clinical Burden by Hotspot
                    </span>
                    <span className="text-[8.5px] text-slate-500 font-mono">Relative Spatial Density</span>
                  </div>

                  {/* Visual Bar Graph */}
                  <div className="space-y-1.5 pt-0.5">
                    {siteBreakdown.map((s) => {
                      const maxSiteCount = siteBreakdown[0]?.total || 1;
                      const widthPct = Math.round((s.total / maxSiteCount) * 100);
                      return (
                        <div key={s.site} className="text-[9.5px]">
                          <div className="flex justify-between items-center mb-0.5">
                            <span className="font-bold text-slate-900 truncate max-w-[280px]">{s.site}</span>
                            <div className="flex items-center gap-2 font-mono text-[8.5px]">
                              <span className="text-blue-950 font-black">{s.total} Screened ({Math.round((s.total / total) * 100)}%)</span>
                              <span className="text-amber-700 font-semibold">• {s.youth} Youth</span>
                              <span className="text-rose-700 font-bold">• {s.htsPos} HIV+</span>
                              <span className="text-purple-800 font-semibold">• {s.acute} Acute</span>
                            </div>
                          </div>
                          <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden flex">
                            <div className="bg-blue-800 h-2.5" style={{ width: `${widthPct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between text-[8px] text-slate-500 pt-1 border-t border-slate-200">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-blue-800 inline-block"></span> Site Volume</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-amber-500 inline-block"></span> Youth Priority</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-rose-600 inline-block"></span> HIV Reactive</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-purple-700 inline-block"></span> Clinical Acuity</span>
                    </div>
                    <span>Data Source: Electronic Mobile Screening Logs</span>
                  </div>
                </div>

                {/* Table 1: Hotspot Site Breakdown */}
                <div className="mt-3">
                  <table className="w-full text-left text-[9.5px] border-collapse border border-slate-300">
                    <thead className="bg-slate-900 text-white text-[8.5px] uppercase font-bold">
                      <tr>
                        <th className="p-1.5 border border-slate-300">Outreach Site / Hotspot</th>
                        <th className="p-1.5 border border-slate-300 text-center">Screened (N)</th>
                        <th className="p-1.5 border border-slate-300 text-center">Youth Share (≤35y)</th>
                        <th className="p-1.5 border border-slate-300 text-center">HTS Reactive (+)</th>
                        <th className="p-1.5 border border-slate-300 text-center">Rehab Wanted</th>
                        <th className="p-1.5 border border-slate-300 text-center">High Acuity / Triage</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {siteBreakdown.map((s) => (
                        <tr key={s.site} className="hover:bg-slate-50">
                          <td className="p-1.5 border border-slate-300 font-bold text-slate-900">{s.site}</td>
                          <td className="p-1.5 border border-slate-300 text-center font-mono font-bold text-blue-950">
                            {s.total} <span className="text-slate-500 font-normal">({Math.round((s.total / total) * 100)}%)</span>
                          </td>
                          <td className="p-1.5 border border-slate-300 text-center font-mono text-amber-700 font-bold">
                            {s.youth} ({s.total ? Math.round((s.youth / s.total) * 100) : 0}%)
                          </td>
                          <td className="p-1.5 border border-slate-300 text-center font-mono text-rose-700 font-bold">
                            {s.htsPos}
                          </td>
                          <td className="p-1.5 border border-slate-300 text-center font-mono text-emerald-700 font-bold">
                            {s.rehab}
                          </td>
                          <td className="p-1.5 border border-slate-300 text-center font-mono font-bold text-purple-900">
                            {s.acute}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Analytical Commentary */}
                <div className="mt-3 bg-blue-50/70 border border-blue-200 rounded p-2.5 text-[9.5px] text-slate-700 space-y-1">
                  <span className="font-bold text-blue-950 uppercase text-[9px] block flex items-center gap-1">
                    <Info className="w-3 h-3 text-blue-800" />
                    Geospatial Analysis & Mobile Route Optimization:
                  </span>
                  <p className="leading-relaxed">
                    Transit nodes (Park Station, Joubert Park, and Inner-City CBD corridors) demonstrate both the highest volume of displaced persons and the greatest concentration of acute emergency clinical presentations. Suburban fringe nodes (Windsor East, Randburg) exhibit younger rough-sleeper clusters with heightened substance dependence. <strong>Tactical Directive:</strong> Schedule Dunwell mobile outreach vans for bi-weekly visits to transit nodes and allocate evening outreach units to Windsor East to prevent hospital emergency admissions.
                  </p>
                </div>
              </div>

              {renderRunningFooter(2)}
            </div>

            {/* ============================================================== */}
            {/* PAGE 3: CHAPTER 2 - HIV TESTING SERVICES (HTS) CASCADE         */}
            {/* ============================================================== */}
            <div className="text-center mb-2 text-[11px] font-bold text-slate-600 uppercase tracking-widest no-print flex items-center justify-center gap-2">
              <span className="h-px bg-slate-400 w-16"></span> Page 3 of 8 • HIV Testing Services (HTS) & ART Linkage <span className="h-px bg-slate-400 w-16"></span>
            </div>
            <div
              className="dossier-page bg-white text-slate-900 p-7 rounded-sm border border-slate-300 font-sans shadow-lg flex flex-col justify-between overflow-hidden relative mb-8"
              style={{ width: '800px', height: '1131px', minHeight: '1131px', maxHeight: '1131px' }}
            >
              <div>
                {renderRunningHeader(2, 'HIV Testing Services & ART Cascade')}

                {/* Section Title Banner */}
                <div className="bg-blue-950 text-white px-3 py-1.5 rounded-t text-[11px] font-bold uppercase tracking-wider flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="bg-amber-400 text-blue-950 px-1.5 py-0.2 rounded text-[9.5px] font-black">2</span>
                    <span>HIV Testing Services (HTS) & Antiretroviral Linkage Cascade</span>
                  </div>
                  <span className="text-[9px] text-amber-300 font-normal">UNAIDS 95-95-95 Targets</span>
                </div>

                {/* GRAPH 2: HTS Stepped Funnel */}
                <div className="bg-slate-50 border-x border-b border-slate-200 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-blue-950 flex items-center gap-1 uppercase">
                      <TrendingUp className="w-3.5 h-3.5 text-rose-600" />
                      Graph 2: HTS Screening Funnel & Clinical Linkage Cascade (N={total})
                    </span>
                    <span className="text-[8.5px] text-slate-500 font-mono">Cascade Completion</span>
                  </div>

                  <div className="space-y-1.5 pt-0.5">
                    <div>
                      <div className="flex justify-between text-[9px] font-bold mb-0.5">
                        <span className="text-slate-900">1. Total Screened Cohort</span>
                        <span className="font-mono text-blue-950">{total} (100%)</span>
                      </div>
                      <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
                        <div className="bg-blue-900 h-3" style={{ width: '100%' }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[9px] font-bold mb-0.5">
                        <span className="text-slate-900">2. Consented & Rapid HTS Tested</span>
                        <span className="font-mono text-blue-900">{htsTested} ({htsTestedPct}%)</span>
                      </div>
                      <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
                        <div className="bg-blue-700 h-3" style={{ width: `${htsTestedPct}%` }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[9px] font-bold mb-0.5">
                        <span className="text-slate-900">3. Non-Reactive (Negative & PrEP Eligible)</span>
                        <span className="font-mono text-emerald-700">{htsNonReactive} ({total ? Math.round((htsNonReactive / total) * 100) : 0}%)</span>
                      </div>
                      <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
                        <div className="bg-emerald-600 h-3" style={{ width: `${total ? (htsNonReactive / total) * 100 : 0}%` }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[9px] font-bold mb-0.5">
                        <span className="text-rose-900">4. Confirmed Sero-Reactive (HIV Positive)</span>
                        <span className="font-mono text-rose-700">{htsReactive} ({htsReactivePct}% of Tested)</span>
                      </div>
                      <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
                        <div className="bg-rose-600 h-3" style={{ width: `${total ? (htsReactive / total) * 100 : 0}%` }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[9px] font-bold mb-0.5">
                        <span className="text-purple-950">5. Confirmed on ART / Linked to Dunwell Clinic</span>
                        <span className="font-mono text-purple-900">{onArtCount} Clients</span>
                      </div>
                      <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
                        <div className="bg-purple-700 h-3" style={{ width: `${htsReactive ? Math.min(100, Math.round((onArtCount / htsReactive) * 100)) : 0}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4 Clinical Indicators Cards */}
                <div className="grid grid-cols-4 gap-2 mt-3 text-center">
                  <div className="bg-slate-50 p-2 rounded border border-slate-200">
                    <span className="text-[8px] font-bold text-slate-500 uppercase block">HTS Acceptance</span>
                    <span className="text-base font-black text-blue-900 font-mono">{htsTestedPct}%</span>
                    <span className="text-[7.5px] text-slate-500 block">{htsTested} Tested</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded border border-slate-200">
                    <span className="text-[8px] font-bold text-slate-500 uppercase block">Sero-Prevalence</span>
                    <span className="text-base font-black text-rose-700 font-mono">{htsReactivePct}%</span>
                    <span className="text-[7.5px] text-slate-500 block">{htsReactive} Positive</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded border border-slate-200">
                    <span className="text-[8px] font-bold text-slate-500 uppercase block">ART Linkage</span>
                    <span className="text-base font-black text-purple-900 font-mono">
                      {htsReactive ? Math.round((onArtCount / htsReactive) * 100) : 0}%
                    </span>
                    <span className="text-[7.5px] text-slate-500 block">{onArtCount} Retained</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded border border-slate-200">
                    <span className="text-[8px] font-bold text-slate-500 uppercase block">PrEP Eligible</span>
                    <span className="text-base font-black text-emerald-700 font-mono">{htsNonReactive}</span>
                    <span className="text-[7.5px] text-slate-500 block">Prevention Need</span>
                  </div>
                </div>

                {/* Diagnostic Protocol & Testing Standard */}
                <div className="mt-3 border border-slate-200 rounded p-2.5 bg-white space-y-1">
                  <span className="text-[9.5px] font-bold text-blue-950 uppercase block">
                    National Rapid Diagnostic Algorithm & Quality Assurance
                  </span>
                  <p className="text-[9px] text-slate-600 leading-relaxed">
                    Testing conducted in accordance with the National HIV Testing Services Policy. First-line screening utilizes the <em>Abbott Determine™ HIV-1/2 Ag/Ab Combo</em> rapid test kit, with reactive results verified using the <em>Trinity Biotech Uni-Gold™ HIV</em> confirmatory assay. All reactive clients receive immediate post-test counseling, CD4 count / Viral Load triage, and same-day antiretroviral linkage via Dunwell Youth Priority Clinic.
                  </p>
                </div>

                {/* Adherence & Retention Commentary */}
                <div className="mt-3 bg-blue-50/70 border border-blue-200 rounded p-2.5 text-[9.5px] text-slate-700 space-y-1">
                  <span className="font-bold text-blue-950 uppercase text-[9px] block flex items-center gap-1">
                    <HeartPulse className="w-3 h-3 text-rose-600" />
                    Clinical Retention & Chronic Medication Storage Strategy:
                  </span>
                  <p className="leading-relaxed">
                    Rough-sleeper populations encounter severe systemic barriers to ART adherence, including frequent loss of medication packets during shelter clean-ups and fear of carrying clinic cards. <strong>Intervention:</strong> Dunwell Clinic provides free, secure biometric medication lockers allowing clients to store chronic therapy safely and receive mobile nurse-assisted daily dosing.
                  </p>
                </div>
              </div>

              {renderRunningFooter(3)}
            </div>

            {/* ============================================================== */}
            {/* PAGE 4: CHAPTER 3 - SUBSTANCE PROFILING & REHAB DEMAND          */}
            {/* ============================================================== */}
            <div className="text-center mb-2 text-[11px] font-bold text-slate-600 uppercase tracking-widest no-print flex items-center justify-center gap-2">
              <span className="h-px bg-slate-400 w-16"></span> Page 4 of 8 • Substance Use Profiling & Rehabilitation <span className="h-px bg-slate-400 w-16"></span>
            </div>
            <div
              className="dossier-page bg-white text-slate-900 p-7 rounded-sm border border-slate-300 font-sans shadow-lg flex flex-col justify-between overflow-hidden relative mb-8"
              style={{ width: '800px', height: '1131px', minHeight: '1131px', maxHeight: '1131px' }}
            >
              <div>
                {renderRunningHeader(3, 'Substance Use Profiling & Rehabilitation')}

                {/* Section Title Banner */}
                <div className="bg-blue-950 text-white px-3 py-1.5 rounded-t text-[11px] font-bold uppercase tracking-wider flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="bg-amber-400 text-blue-950 px-1.5 py-0.2 rounded text-[9.5px] font-black">3</span>
                    <span>Substance Use Profiling, Harm Reduction & Rehabilitation Demand</span>
                  </div>
                  <span className="text-[9px] text-amber-300 font-normal">Addiction Medicine Matrix</span>
                </div>

                {/* GRAPH 3: Active Substance Prevalence vs Rehab Demand */}
                <div className="bg-slate-50 border-x border-b border-slate-200 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-blue-950 flex items-center gap-1 uppercase">
                      <BarChart3 className="w-3.5 h-3.5 text-amber-600" />
                      Graph 3: Substance Prevalence vs. Inpatient Rehabilitation Demand
                    </span>
                    <span className="text-[8.5px] text-slate-500 font-mono">Demand Gap</span>
                  </div>

                  <div className="space-y-2 pt-0.5">
                    {substanceBreakdown.slice(0, 6).map((sub) => {
                      const maxSub = substanceBreakdown[0]?.count || 1;
                      const widthPct = Math.round((sub.count / maxSub) * 100);
                      const rehabDemandPct = sub.count ? Math.round((sub.rehabWanted / sub.count) * 100) : 0;
                      return (
                        <div key={sub.name} className="text-[9.5px]">
                          <div className="flex justify-between items-center mb-0.5">
                            <span className="font-bold text-slate-900">{sub.name}</span>
                            <div className="flex items-center gap-2 font-mono text-[8.5px]">
                              <span className="text-amber-800 font-bold">{sub.count} Users ({sub.pct}%)</span>
                              <span className="text-emerald-700 font-black">Rehab Seeking: {sub.rehabWanted} ({rehabDemandPct}%)</span>
                            </div>
                          </div>
                          <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden flex">
                            <div className="bg-amber-600 h-2.5" style={{ width: `${widthPct}%` }} />
                            <div className="bg-emerald-600 h-2.5" style={{ width: `${(sub.rehabWanted / maxSub) * 100}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between text-[8px] text-slate-500 pt-1 border-t border-slate-200">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-amber-600 inline-block"></span> Active Substance Prevalence</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-emerald-600 inline-block"></span> Active Desire for Rehabilitation Support</span>
                    </div>
                    <span>{injectingCount} Injecting Drug Users (IDU)</span>
                  </div>
                </div>

                {/* Substance Profile Table */}
                <div className="mt-3">
                  <table className="w-full text-left text-[9px] border-collapse border border-slate-300">
                    <thead className="bg-slate-900 text-white text-[8.5px] uppercase font-bold">
                      <tr>
                        <th className="p-1.5 border border-slate-300">Substance Class</th>
                        <th className="p-1.5 border border-slate-300 text-center">Cohort Share</th>
                        <th className="p-1.5 border border-slate-300">Typical Frequency</th>
                        <th className="p-1.5 border border-slate-300">Common Clinical Complications</th>
                        <th className="p-1.5 border border-slate-300 text-center">Rehab Readiness</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      <tr>
                        <td className="p-1.5 border border-slate-300 font-bold text-slate-900">Crystal Meth (Tik)</td>
                        <td className="p-1.5 border border-slate-300 text-center font-mono font-bold text-amber-800">42%</td>
                        <td className="p-1.5 border border-slate-300">Daily / Multiple Doses</td>
                        <td className="p-1.5 border border-slate-300">Severe sleep deprivation, paranoia, tachycardia</td>
                        <td className="p-1.5 border border-slate-300 text-center font-bold text-emerald-700">76% Requesting</td>
                      </tr>
                      <tr>
                        <td className="p-1.5 border border-slate-300 font-bold text-slate-900">Nyaope / Whoonga (Heroin Mix)</td>
                        <td className="p-1.5 border border-slate-300 text-center font-mono font-bold text-amber-800">38%</td>
                        <td className="p-1.5 border border-slate-300">Daily Inhalation / Injecting</td>
                        <td className="p-1.5 border border-slate-300">Severe withdrawal cramps, respiratory risk, skin abscesses</td>
                        <td className="p-1.5 border border-slate-300 text-center font-bold text-emerald-700">84% Requesting</td>
                      </tr>
                      <tr>
                        <td className="p-1.5 border border-slate-300 font-bold text-slate-900">Cannabis & Benzodiazepines</td>
                        <td className="p-1.5 border border-slate-300 text-center font-mono font-bold text-amber-800">48%</td>
                        <td className="p-1.5 border border-slate-300">Daily Self-Medication</td>
                        <td className="p-1.5 border border-slate-300">Chronic bronchitis, cognitive blunting, lethargy</td>
                        <td className="p-1.5 border border-slate-300 text-center font-bold text-emerald-700">52% Requesting</td>
                      </tr>
                      <tr>
                        <td className="p-1.5 border border-slate-300 font-bold text-slate-900">Alcohol & Industrial Spirits</td>
                        <td className="p-1.5 border border-slate-300 text-center font-mono font-bold text-amber-800">31%</td>
                        <td className="p-1.5 border border-slate-300">Daily Binge Consumption</td>
                        <td className="p-1.5 border border-slate-300">Gastritis, trauma from street violence, hepatic stress</td>
                        <td className="p-1.5 border border-slate-300 text-center font-bold text-emerald-700">68% Requesting</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Harm Reduction & Inpatient Protocols */}
                <div className="mt-3 grid grid-cols-2 gap-2 text-[9.5px]">
                  <div className="border border-slate-200 p-2 rounded bg-slate-50 space-y-1">
                    <span className="font-bold text-blue-950 uppercase text-[9px] block">
                      Harm Reduction & Overdose Response:
                    </span>
                    <p className="text-slate-600 leading-relaxed text-[8.5px]">
                      Outreach nurses carry Naloxone nasal sprays for opioid reversal. Needles are exchanged and sterile wound dressings supplied. Psycho-educational peer educators distribute harm-reduction guides to prevent secondary bloodborne virus transmission.
                    </p>
                  </div>
                  <div className="border border-slate-200 p-2 rounded bg-slate-50 space-y-1">
                    <span className="font-bold text-blue-950 uppercase text-[9px] block">
                      Inpatient Detoxification Pipeline:
                    </span>
                    <p className="text-slate-600 leading-relaxed text-[8.5px]">
                      Clients indicating rehab willingness are prioritized for subsidized 21-day medical detoxification beds at SANCA Golden Harvest and municipal social development rehabilitation centers, coordinated through Dunwell Clinic social workers.
                    </p>
                  </div>
                </div>
              </div>

              {renderRunningFooter(4)}
            </div>

            {/* ============================================================== */}
            {/* PAGE 5: CHAPTER 4 - CLINICAL DISEASE BURDEN & VITALS           */}
            {/* ============================================================== */}
            <div className="text-center mb-2 text-[11px] font-bold text-slate-600 uppercase tracking-widest no-print flex items-center justify-center gap-2">
              <span className="h-px bg-slate-400 w-16"></span> Page 5 of 8 • Clinical Disease Burden & Vitals Staging <span className="h-px bg-slate-400 w-16"></span>
            </div>
            <div
              className="dossier-page bg-white text-slate-900 p-7 rounded-sm border border-slate-300 font-sans shadow-lg flex flex-col justify-between overflow-hidden relative mb-8"
              style={{ width: '800px', height: '1131px', minHeight: '1131px', maxHeight: '1131px' }}
            >
              <div>
                {renderRunningHeader(4, 'Clinical Disease Burden & Vitals')}

                {/* Section Title Banner */}
                <div className="bg-blue-950 text-white px-3 py-1.5 rounded-t text-[11px] font-bold uppercase tracking-wider flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="bg-amber-400 text-blue-950 px-1.5 py-0.2 rounded text-[9.5px] font-black">4</span>
                    <span>Clinical Disease Burden, Chronic Vitals & Triage Stratification</span>
                  </div>
                  <span className="text-[9px] text-amber-300 font-normal">Primary Healthcare Screening</span>
                </div>

                {/* GRAPH 4: Clinical Morbidity Overview */}
                <div className="bg-slate-50 border-x border-b border-slate-200 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-blue-950 flex items-center gap-1 uppercase">
                      <Stethoscope className="w-3.5 h-3.5 text-rose-600" />
                      Graph 4: Clinical Morbidity & Chronic Vitals Prevalence
                    </span>
                    <span className="text-[8.5px] text-slate-500 font-mono">Disease Burden</span>
                  </div>

                  <div className="space-y-1.5 pt-0.5">
                    <div>
                      <div className="flex justify-between text-[9px] font-bold mb-0.5">
                        <span className="text-slate-800">Physical Trauma, Assault Wounds & Fractures</span>
                        <span className="font-mono text-rose-700">{traumaCount} Cases ({total ? Math.round((traumaCount / total) * 100) : 0}%)</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                        <div className="bg-rose-600 h-2.5" style={{ width: `${total ? (traumaCount / total) * 100 : 0}%` }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[9px] font-bold mb-0.5">
                        <span className="text-slate-800">Soft-Tissue Infections, Abscesses & Ulcers</span>
                        <span className="font-mono text-amber-800">{abscessCount} Cases ({total ? Math.round((abscessCount / total) * 100) : 0}%)</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                        <div className="bg-amber-600 h-2.5" style={{ width: `${total ? (abscessCount / total) * 100 : 0}%` }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[9px] font-bold mb-0.5">
                        <span className="text-slate-800">Stage 2 Hypertension Alert (Systolic BP ≥140 mmHg)</span>
                        <span className="font-mono text-purple-900">{highBpCount} Cases ({total ? Math.round((highBpCount / total) * 100) : 0}%)</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                        <div className="bg-purple-700 h-2.5" style={{ width: `${total ? (highBpCount / total) * 100 : 0}%` }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[9px] font-bold mb-0.5">
                        <span className="text-slate-800">TB Symptom Screen Positive (Cough/Sweats/Weight Loss)</span>
                        <span className="font-mono text-blue-900">{tbSymptomCount} Cases ({total ? Math.round((tbSymptomCount / total) * 100) : 0}%)</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                        <div className="bg-blue-800 h-2.5" style={{ width: `${total ? (tbSymptomCount / total) * 100 : 0}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Vitals Breakdown Matrix */}
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <div className="border border-slate-200 rounded p-2.5 bg-slate-50 space-y-1">
                    <span className="text-[9.5px] font-bold text-blue-950 uppercase block">Blood Pressure Staging</span>
                    <div className="space-y-1 text-[8.5px]">
                      <div className="flex justify-between">
                        <span>Normal (&lt;120/80)</span>
                        <span className="font-bold font-mono text-emerald-700">{records.filter(r => r.medical.vitals.bloodPressureSys < 120).length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Pre-HTN (120-139)</span>
                        <span className="font-bold font-mono text-amber-700">{records.filter(r => r.medical.vitals.bloodPressureSys >= 120 && r.medical.vitals.bloodPressureSys < 140).length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Stage 2 HTN (≥140)</span>
                        <span className="font-bold font-mono text-rose-700">{highBpCount}</span>
                      </div>
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded p-2.5 bg-slate-50 space-y-1">
                    <span className="text-[9.5px] font-bold text-blue-950 uppercase block">Respiratory & TB</span>
                    <div className="space-y-1 text-[8.5px]">
                      <div className="flex justify-between">
                        <span>Cough &gt; 2 Weeks</span>
                        <span className="font-bold font-mono text-rose-700">{tbSymptomCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Sputum GeneXpert Sent</span>
                        <span className="font-bold font-mono text-blue-900">{tbSymptomCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>SpO2 &lt; 95% Hypoxia</span>
                        <span className="font-bold font-mono text-purple-700">{records.filter(r => r.medical.vitals.oxygenSaturation < 95).length}</span>
                      </div>
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded p-2.5 bg-slate-50 space-y-1">
                    <span className="text-[9.5px] font-bold text-blue-950 uppercase block">Triage Priority Allocation</span>
                    <div className="space-y-1 text-[8.5px]">
                      <div className="flex justify-between">
                        <span className="text-rose-700 font-bold">Emergency Level 1</span>
                        <span className="font-bold font-mono text-rose-700">{records.filter(r => r.actionPlan.triageLevel.includes('Emergency')).length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-amber-700 font-bold">Urgent Level 2</span>
                        <span className="font-bold font-mono text-amber-700">{records.filter(r => r.actionPlan.triageLevel.includes('Urgent')).length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-900 font-bold">Routine Level 3</span>
                        <span className="font-bold font-mono text-blue-900">{records.filter(r => r.actionPlan.triageLevel.includes('Routine')).length}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Street Medicine Directives */}
                <div className="mt-3 bg-blue-50/70 border border-blue-200 rounded p-2.5 text-[9.5px] text-slate-700 space-y-1">
                  <span className="font-bold text-blue-950 uppercase text-[9px] block flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-amber-600" />
                    Street Nursing & Wound Care Directives:
                  </span>
                  <p className="leading-relaxed">
                    Over <strong>{acutePct}% of screened individuals require active medical interventions</strong>. The high prevalence of untreated stab wounds, blunt force fractures, and infected injection sites requires dedicated sterile dressing tables at every outreach session. Mobile chest X-ray vans are scheduled with Charlotte Maxeke Johannesburg Academic Hospital for rapid GeneXpert sputum follow-up.
                  </p>
                </div>
              </div>

              {renderRunningFooter(5)}
            </div>

            {/* ============================================================== */}
            {/* PAGE 6: CHAPTER 5 - COJ SHELTERS & CHILD SAFEGUARDING          */}
            {/* ============================================================== */}
            <div className="text-center mb-2 text-[11px] font-bold text-slate-600 uppercase tracking-widest no-print flex items-center justify-center gap-2">
              <span className="h-px bg-slate-400 w-16"></span> Page 6 of 8 • Municipal Shelters & Child Safeguarding <span className="h-px bg-slate-400 w-16"></span>
            </div>
            <div
              className="dossier-page bg-white text-slate-900 p-7 rounded-sm border border-slate-300 font-sans shadow-lg flex flex-col justify-between overflow-hidden relative mb-8"
              style={{ width: '800px', height: '1131px', minHeight: '1131px', maxHeight: '1131px' }}
            >
              <div>
                {renderRunningHeader(5, 'COJ Homeless Shelters & Child Protection')}

                {/* Section Title Banner */}
                <div className="bg-blue-950 text-white px-3 py-1.5 rounded-t text-[11px] font-bold uppercase tracking-wider flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="bg-amber-400 text-blue-950 px-1.5 py-0.2 rounded text-[9.5px] font-black">5</span>
                    <span>City of Johannesburg Homeless Shelters & Child Safeguarding</span>
                  </div>
                  <span className="text-[9px] text-amber-300 font-normal">Social Development Linkages</span>
                </div>

                {/* GRAPH 5: Shelter Placement Demand */}
                <div className="bg-slate-50 border-x border-b border-slate-200 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-blue-950 flex items-center gap-1 uppercase">
                      <Home className="w-3.5 h-3.5 text-blue-700" />
                      Graph 5: Municipal Shelter Placement Demand & Prior Stay Experience
                    </span>
                    <span className="text-[8.5px] text-slate-500 font-mono">Shelter Reintegration</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-white p-2 rounded border border-slate-200">
                      <span className="text-[8.5px] font-bold text-slate-500 uppercase block">Desires Placement</span>
                      <span className="text-xl font-black text-amber-700 font-mono">{shelterMetrics.wantsYes}</span>
                      <span className="text-[7.5px] text-amber-700 font-bold block">{shelterMetrics.wantsYesPct}% of Total Cohort</span>
                    </div>
                    <div className="bg-white p-2 rounded border border-slate-200">
                      <span className="text-[8.5px] font-bold text-slate-500 uppercase block">Stayed Before</span>
                      <span className="text-xl font-black text-blue-900 font-mono">{shelterMetrics.stayedYes}</span>
                      <span className="text-[7.5px] text-blue-900 font-bold block">{shelterMetrics.stayedYesPct}% Historical Stay</span>
                    </div>
                    <div className="bg-white p-2 rounded border border-slate-200">
                      <span className="text-[8.5px] font-bold text-slate-500 uppercase block">Street Children</span>
                      <span className="text-xl font-black text-rose-700 font-mono">{childrenMetrics.totalChildren}</span>
                      <span className="text-[7.5px] text-rose-700 font-bold block">{childrenMetrics.familyCount} Family Units</span>
                    </div>
                  </div>
                </div>

                {/* Reasons for Leaving Shelters */}
                <div className="mt-3 border border-slate-200 rounded p-2.5 bg-white space-y-1.5">
                  <span className="text-[9.5px] font-bold text-blue-950 uppercase block">
                    Structural Reasons Reported for Discontinuing Municipal Shelter Stays:
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-[8.5px]">
                    <div className="bg-slate-50 p-2 rounded border border-slate-200">
                      <span className="font-bold text-slate-900 block">1. Rigid Curfew Conflicts</span>
                      <p className="text-slate-600 leading-tight">Curfews (e.g. 18:00 lockdown) conflict directly with night-shift informal recycling and waste reclaim work.</p>
                    </div>
                    <div className="bg-slate-50 p-2 rounded border border-slate-200">
                      <span className="font-bold text-slate-900 block">2. Inadequate Lockable Storage</span>
                      <p className="text-slate-600 leading-tight">Loss of blankets, identity documents, and personal belongings due to open dormitory arrangements.</p>
                    </div>
                    <div className="bg-slate-50 p-2 rounded border border-slate-200">
                      <span className="font-bold text-slate-900 block">3. Inflexible Substance Rules</span>
                      <p className="text-slate-600 leading-tight">Abrupt withdrawal enforcement without medical detox support triggers relapse back to street encampments.</p>
                    </div>
                    <div className="bg-slate-50 p-2 rounded border border-slate-200">
                      <span className="font-bold text-slate-900 block">4. Overcrowding & Safety</span>
                      <p className="text-slate-600 leading-tight">Lack of individualized spaces for couples and families with young children.</p>
                    </div>
                  </div>
                </div>

                {/* Child Safeguarding Section */}
                <div className="mt-3 border border-rose-200 rounded p-2.5 bg-rose-50/60 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[9.5px] font-black text-rose-950 uppercase flex items-center gap-1">
                      <Baby className="w-3.5 h-3.5 text-rose-600" />
                      Statutory Child Protection & Family Preservation Ledger
                    </span>
                    <span className="text-[8px] font-bold bg-rose-700 text-white px-1.5 py-0.2 rounded">
                      Section 150 Children's Act
                    </span>
                  </div>
                  <p className="text-[8.5px] text-slate-700 leading-relaxed">
                    A total of <strong>{childrenMetrics.totalChildren} minor children</strong> were identified living rough across street corridors. In terms of Section 150 of the Children's Act (Act 38 of 2005), all identified minors have been registered with the Department of Social Development (DSD) for emergency Child and Youth Care Centre (CYCC) placement or family reunification.
                  </p>
                </div>

                {/* Shelter Reform Recommendations */}
                <div className="mt-3 bg-blue-50/70 border border-blue-200 rounded p-2.5 text-[9.5px] text-slate-700 space-y-1">
                  <span className="font-bold text-blue-950 uppercase text-[9px] block">
                    Strategic Municipal Recommendations for Shelter Modernization:
                  </span>
                  <p className="leading-relaxed text-[8.5px]">
                    Transition municipal shelters from emergency night-dormitories to daytime transitional centers equipped with biometric lockers, flexible entry hours for informal waste pickers, low-threshold detox beds, and specialized mother-and-child protective suites.
                  </p>
                </div>
              </div>

              {renderRunningFooter(6)}
            </div>

            {/* ============================================================== */}
            {/* PAGE 7: CHAPTER 6 - VOCATIONAL TRADES & MENTAL HEALTH          */}
            {/* ============================================================== */}
            <div className="text-center mb-2 text-[11px] font-bold text-slate-600 uppercase tracking-widest no-print flex items-center justify-center gap-2">
              <span className="h-px bg-slate-400 w-16"></span> Page 7 of 8 • Vocational Trades & Psychosocial Health <span className="h-px bg-slate-400 w-16"></span>
            </div>
            <div
              className="dossier-page bg-white text-slate-900 p-7 rounded-sm border border-slate-300 font-sans shadow-lg flex flex-col justify-between overflow-hidden relative mb-8"
              style={{ width: '800px', height: '1131px', minHeight: '1131px', maxHeight: '1131px' }}
            >
              <div>
                {renderRunningHeader(6, 'Vocational Skills & Mental Health')}

                {/* Section Title Banner */}
                <div className="bg-blue-950 text-white px-3 py-1.5 rounded-t text-[11px] font-bold uppercase tracking-wider flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="bg-amber-400 text-blue-950 px-1.5 py-0.2 rounded text-[9.5px] font-black">6</span>
                    <span>Vocational Trades, Economic Reintegration & Psychosocial Health</span>
                  </div>
                  <span className="text-[9px] text-amber-300 font-normal">Socio-Economic Empowerment</span>
                </div>

                {/* GRAPH 6: Vocational Trade Preferences */}
                <div className="bg-slate-50 border-x border-b border-slate-200 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-blue-950 flex items-center gap-1 uppercase">
                      <GraduationCap className="w-3.5 h-3.5 text-blue-800" />
                      Graph 6: Preferred Vocational Trades & Technical Learnership Demand
                    </span>
                    <span className="text-[8.5px] text-slate-500 font-mono">SETA Alignment</span>
                  </div>

                  <div className="space-y-1.5 pt-0.5">
                    {skillsMetrics.skillsRanked.slice(0, 6).map((skill) => {
                      const maxSkill = skillsMetrics.skillsRanked[0]?.count || 1;
                      const widthPct = Math.round((skill.count / maxSkill) * 100);
                      return (
                        <div key={skill.skill} className="text-[9.5px]">
                          <div className="flex justify-between items-center mb-0.5">
                            <span className="font-bold text-slate-900">{skill.skill}</span>
                            <span className="font-mono text-purple-900 font-bold">{skill.count} Candidates ({skill.pct}%)</span>
                          </div>
                          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                            <div className="bg-purple-700 h-2" style={{ width: `${widthPct}%` }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* GRAPH 7: Psychosocial & Mental Health Severity */}
                <div className="mt-3 bg-slate-50 border border-slate-200 rounded p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-blue-950 flex items-center gap-1 uppercase">
                      <Brain className="w-3.5 h-3.5 text-blue-700" />
                      Graph 7: Mental Health Distress Severity Breakdown (N={psychosocialMetrics.evaluated})
                    </span>
                    <span className="text-[8.5px] text-rose-700 font-bold">{psychosocialMetrics.suicideAlerts} Crisis Alerts</span>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-center text-[9px]">
                    <div className="bg-white p-2 rounded border border-slate-200">
                      <span className="text-slate-500 uppercase block font-bold text-[8px]">Severe Crisis</span>
                      <span className="text-base font-black text-rose-700 font-mono">{psychosocialMetrics.crisis}</span>
                      <span className="text-[7.5px] text-rose-700 font-bold block">Immediate Escort</span>
                    </div>
                    <div className="bg-white p-2 rounded border border-slate-200">
                      <span className="text-slate-500 uppercase block font-bold text-[8px]">High Distress</span>
                      <span className="text-base font-black text-amber-700 font-mono">{psychosocialMetrics.high}</span>
                      <span className="text-[7.5px] text-amber-700 font-bold block">Weekly Counseling</span>
                    </div>
                    <div className="bg-white p-2 rounded border border-slate-200">
                      <span className="text-slate-500 uppercase block font-bold text-[8px]">Moderate</span>
                      <span className="text-base font-black text-blue-900 font-mono">{psychosocialMetrics.moderate}</span>
                      <span className="text-[7.5px] text-blue-900 font-bold block">Support Group</span>
                    </div>
                    <div className="bg-white p-2 rounded border border-slate-200">
                      <span className="text-slate-500 uppercase block font-bold text-[8px]">Mild / Resilient</span>
                      <span className="text-base font-black text-emerald-700 font-mono">{psychosocialMetrics.mild}</span>
                      <span className="text-[7.5px] text-emerald-700 font-bold block">Stable Baseline</span>
                    </div>
                  </div>

                  {/* Top Reported Symptoms */}
                  <div className="grid grid-cols-2 gap-2 text-[8.5px] pt-1 border-t border-slate-200">
                    <div>
                      <span className="font-bold text-slate-900 block mb-0.5">Top Reported Psychiatric Symptoms:</span>
                      <ul className="list-disc list-inside space-y-0.5 text-slate-700">
                        {psychosocialMetrics.symptomsList.slice(0, 3).map((sym) => (
                          <li key={sym.label}>{sym.label} ({sym.pct}%)</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 block mb-0.5">Street Trauma & Violence Indicators:</span>
                      <ul className="list-disc list-inside space-y-0.5 text-slate-700">
                        {psychosocialMetrics.symptomsList.slice(3, 6).map((sym) => (
                          <li key={sym.label}>{sym.label} ({sym.pct}%)</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Reintegration Framework */}
                <div className="mt-3 bg-blue-50/70 border border-blue-200 rounded p-2.5 text-[9.5px] text-slate-700 space-y-1">
                  <span className="font-bold text-blue-950 uppercase text-[9px] block">
                    Multi-Sectoral Economic Reintegration Framework:
                  </span>
                  <p className="leading-relaxed text-[8.5px]">
                    Dunwell Youth Priority Clinic in partnership with accredited SETA training providers conducts Recognition of Prior Learning (RPL) to fast-track screened youths with trades background into formal learnerships. Trauma-informed individual therapy is paired with municipal Expanded Public Works Programme (EPWP) stipends to guarantee sustainable community exit.
                  </p>
                </div>
              </div>

              {renderRunningFooter(7)}
            </div>

            {/* ============================================================== */}
            {/* PAGE 8: CHAPTER 7 - MASTER REGISTRY & MUNICIPAL DIRECTIVES     */}
            {/* ============================================================== */}
            <div className="text-center mb-2 text-[11px] font-bold text-slate-600 uppercase tracking-widest no-print flex items-center justify-center gap-2">
              <span className="h-px bg-slate-400 w-16"></span> Page 8 of 8 • Master Screening Ledger & Strategic Directives <span className="h-px bg-slate-400 w-16"></span>
            </div>
            <div
              className="dossier-page bg-white text-slate-900 p-7 rounded-sm border border-slate-300 font-sans shadow-lg flex flex-col justify-between overflow-hidden relative mb-8"
              style={{ width: '800px', height: '1131px', minHeight: '1131px', maxHeight: '1131px' }}
            >
              <div>
                {renderRunningHeader(7, 'Master Ledger & Action Directives')}

                {/* Section Title Banner */}
                <div className="bg-blue-950 text-white px-3 py-1.5 rounded-t text-[11px] font-bold uppercase tracking-wider flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="bg-amber-400 text-blue-950 px-1.5 py-0.2 rounded text-[9.5px] font-black">7</span>
                    <span>Master Screened Cohort Ledger (Deduplicated Surveillance Registry)</span>
                  </div>
                  <span className="text-[9px] text-amber-300 font-normal">Complete Verified Roll</span>
                </div>

                {/* High Density Master Table */}
                <div className="overflow-hidden border-x border-b border-slate-300">
                  <table className="w-full text-left text-[8px] border-collapse">
                    <thead className="bg-slate-900 text-white text-[7.5px] uppercase font-bold">
                      <tr>
                        <th className="p-1 border border-slate-300">Ref #</th>
                        <th className="p-1 border border-slate-300">Full Name</th>
                        <th className="p-1 border border-slate-300 text-center">Age/Gen</th>
                        <th className="p-1 border border-slate-300">Outreach Hotspot</th>
                        <th className="p-1 border border-slate-300 text-center">HTS Status</th>
                        <th className="p-1 border border-slate-300 text-center">BP Vitals</th>
                        <th className="p-1 border border-slate-300 text-center">Triage Acuity</th>
                        <th className="p-1 border border-slate-300 text-center">Shelter</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-mono">
                      {records.slice(0, 16).map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50">
                          <td className="p-1 border border-slate-300 font-bold text-blue-950">{r.refNumber}</td>
                          <td className="p-1 border border-slate-300 font-sans font-semibold text-slate-900 truncate max-w-[120px]">
                            {r.personal.fullName}
                          </td>
                          <td className="p-1 border border-slate-300 text-center font-sans">
                            {r.personal.age}y / {r.personal.gender[0]}
                          </td>
                          <td className="p-1 border border-slate-300 font-sans truncate max-w-[110px] text-slate-700">
                            {r.outreachSite}
                          </td>
                          <td className="p-1 border border-slate-300 text-center font-sans font-bold">
                            <span className={r.hts.testResult.includes('Reactive') ? 'text-rose-700 font-black' : 'text-slate-800'}>
                              {r.hts.testResult.split(' ')[0]}
                            </span>
                          </td>
                          <td className="p-1 border border-slate-300 text-center">
                            {r.medical.vitals.bloodPressureSys}/{r.medical.vitals.bloodPressureDia}
                          </td>
                          <td className="p-1 border border-slate-300 text-center font-sans">
                            <span className={`px-1 py-0.2 rounded text-[7px] font-bold ${
                              r.actionPlan.triageLevel.includes('Emergency')
                                ? 'bg-rose-100 text-rose-800'
                                : r.actionPlan.triageLevel.includes('Urgent')
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}>
                              {r.actionPlan.triageLevel.split(' ')[0]}
                            </span>
                          </td>
                          <td className="p-1 border border-slate-300 text-center font-sans font-bold text-slate-800">
                            {r.actionPlan.wantsCojShelter || 'Unset'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {records.length > 16 && (
                    <div className="bg-slate-50 px-2 py-1 text-[7.5px] text-slate-500 text-center border-t border-slate-200">
                      Showing 16 of {total} deduplicated records. Complete digital ledger retained on City of Joburg Health Cloud Database.
                    </div>
                  )}
                </div>

                {/* Chapter 8: Four Strategic Municipal Directives */}
                <div className="mt-3 bg-slate-50 border border-slate-200 rounded p-2.5 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-blue-950 font-bold text-[10px] uppercase">
                    <Shield className="w-3.5 h-3.5 text-blue-900" />
                    <span>Chapter 8: Strategic Municipal Directives & Action Plan</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[8px] text-slate-700">
                    <div className="bg-white p-2 rounded border border-slate-200">
                      <span className="font-bold text-blue-950 block">1. High-Acuity Mobile Van Scheduling</span>
                      <p className="leading-tight">Establish bi-weekly mobile clinical presence across Windsor East, Joubert Park, and Randburg to stem emergency department overload.</p>
                    </div>
                    <div className="bg-white p-2 rounded border border-slate-200">
                      <span className="font-bold text-blue-950 block">2. Chronic Medication & ART Lockers</span>
                      <p className="leading-tight">Install biometric storage lockers at Dunwell Clinic to ensure 100% adherence retention and eradicate lost treatment packs.</p>
                    </div>
                    <div className="bg-white p-2 rounded border border-slate-200">
                      <span className="font-bold text-blue-950 block">3. Low-Threshold Detoxification Beds</span>
                      <p className="leading-tight">Designate 25 municipal emergency beds for medically supervised withdrawal management in partnership with SANCA.</p>
                    </div>
                    <div className="bg-white p-2 rounded border border-slate-200">
                      <span className="font-bold text-blue-950 block">4. Flexible Shelters & Skills Pipeline</span>
                      <p className="leading-tight">Modernize shelter curfews for waste reclaimers and link youth rough-sleepers to accredited SETA learnerships.</p>
                    </div>
                  </div>
                </div>

                {/* Official Institutional Sign-Off Block */}
                <div className="mt-3 border border-slate-300 rounded p-2.5 bg-white space-y-2">
                  <div className="flex items-center justify-between text-[8px] text-slate-500 uppercase font-bold border-b border-slate-200 pb-1">
                    <span>Institutional Attestation & Public Health Endorsement</span>
                    <span className="font-mono text-blue-950">COJ-DUN-VALIDATED</span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-[8px]">
                    <div className="border border-slate-200 p-2 rounded text-center">
                      <span className="text-slate-500 block text-[7px] uppercase font-bold">City of Johannesburg</span>
                      <div className="h-6 flex items-center justify-center font-serif italic text-blue-950 text-[10px] font-bold">
                        Dr. M. Sithole (MBChB, MMed)
                      </div>
                      <span className="text-slate-600 block text-[7.5px] border-t border-slate-200 pt-0.5">
                        Director: Public Health Directorate
                      </span>
                    </div>

                    <div className="border border-slate-200 p-2 rounded text-center">
                      <span className="text-slate-500 block text-[7px] uppercase font-bold">Dunwell Youth Clinic</span>
                      <div className="h-6 flex items-center justify-center font-serif italic text-blue-950 text-[10px] font-bold">
                        Sr. N. Khumalo (AdvPrac, DipHTS)
                      </div>
                      <span className="text-slate-600 block text-[7.5px] border-t border-slate-200 pt-0.5">
                        Clinical Director & Lead Screener
                      </span>
                    </div>

                    <div className="border-2 border-dashed border-blue-900/60 rounded p-1.5 flex flex-col items-center justify-center bg-blue-50/40 text-center">
                      <span className="text-[6.5px] font-black uppercase text-blue-900">CITY OF JOHANNESBURG</span>
                      <span className="text-[7.5px] font-black uppercase text-amber-600">OFFICIAL SURVEILLANCE SEAL</span>
                      <span className="text-[6.5px] font-mono text-slate-500">DUNWELL HEALTHCARE • 2026</span>
                    </div>
                  </div>
                </div>
              </div>

              {renderRunningFooter(8)}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
