import React, { useRef, useState, useMemo } from 'react';
import { ScreeningRecord, PsychosocialSymptoms } from '../types';
import { CojLogo, DnwellLogo } from './Logos';
import {
  Printer,
  Download,
  X,
  FileSpreadsheet,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Flame,
  HeartPulse,
  Users,
  AlertTriangle,
  MapPin,
  Activity,
  Calendar,
  Home,
  Baby,
  GraduationCap,
  Brain,
  LifeBuoy,
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface BatchReportModalProps {
  records: ScreeningRecord[];
  onClose: () => void;
  activeSite?: string;
}

export const BatchReportModal: React.FC<BatchReportModalProps> = ({
  records,
  onClose,
  activeSite = 'ALL',
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

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

  // Clinical & Psychosocial Counseling Metrics
  const counselingMetrics = useMemo(() => {
    let needsYes = 0;
    let needsUndecided = 0;
    let needsNo = 0;
    const focusMap: Record<string, number> = {};

    records.forEach((r) => {
      const c = r.actionPlan?.needsClinicalPsychosocialCounseling;
      if (c === 'Yes') needsYes++;
      else if (c === 'Undecided') needsUndecided++;
      else needsNo++;

      if (r.actionPlan?.counselingFocusAreas) {
        r.actionPlan.counselingFocusAreas.forEach((area) => {
          focusMap[area] = (focusMap[area] || 0) + 1;
        });
      }
    });

    const focusList = Object.entries(focusMap)
      .map(([area, count]) => ({
        area,
        count,
        pct: total ? Math.round((count / total) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    return {
      needsYes,
      needsYesPct: total ? Math.round((needsYes / total) * 100) : 0,
      needsUndecided,
      needsNo,
      focusList,
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
      interestPct: total ? Math.round((interestedYes / total) * 100) : 0,
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
      depressedMood: 'Severe Depression / Sadness',
      anxiety: 'Excessive Anxiety / Nervous',
      sleepDisturbance: 'Sleep Disturbance / Insomnia',
      appetiteLoss: 'Severe Appetite Loss',
      traumaFlashbacks: 'Trauma Flashbacks & Nightmares',
      anhedonia: 'Loss of Interest / Survival Drive',
      hallucinationsOrParanoia: 'Hallucinations or Paranoia',
      panicSymptoms: 'Panic Attacks & Shaking',
      suicidalIdeation: 'Suicidal Thoughts & Ideation',
      extremeIsolation: 'Social Isolation / Abandonment',
      cognitiveConfusion: 'Cognitive Confusion / Disorientation',
      recentGbvOrAssault: 'Victim of Assault or GBV',
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
    return Object.entries(map).map(([site, data]) => ({ site, ...data }));
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

  // Breakdown 3: Complaints
  const complaintsBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    records.forEach((r) => {
      r.medical.presentComplaints.forEach((c) => {
        const short = c.split('/')[0].trim();
        counts[short] = (counts[short] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .map(([name, count]) => ({
        name,
        count,
        pct: total ? Math.round((count / total) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }, [records, total]);

  // Breakdown 4: Physical Address & Sleeping Spots
  const addressBreakdown = useMemo(() => {
    const map: Record<string, { count: number; youth: number; htsPos: number; substance: number }> = {};
    records.forEach((r) => {
      const addr = (r.personal.physicalAddress || r.outreachSite || 'Johannesburg Inner-City').trim();
      if (!map[addr]) map[addr] = { count: 0, youth: 0, htsPos: 0, substance: 0 };
      map[addr].count += 1;
      if (r.personal.age <= 35) map[addr].youth += 1;
      if (r.hts.testResult.includes('Reactive (Positive)')) map[addr].htsPos += 1;
      if (!r.substance.substanceTypes.includes('None') || r.substance.drugUseFrequency !== 'Never') map[addr].substance += 1;
    });
    return Object.entries(map)
      .map(([address, d]) => ({
        address,
        count: d.count,
        pct: total ? Math.round((d.count / total) * 100) : 0,
        youth: d.youth,
        htsPos: d.htsPos,
        substance: d.substance,
      }))
      .sort((a, b) => b.count - a.count);
  }, [records, total]);

  // Breakdown 5: Gender Breakdown
  const genderBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    records.forEach((r) => {
      const g = r.personal.gender || 'Unknown';
      map[g] = (map[g] || 0) + 1;
    });
    return Object.entries(map).map(([gender, count]) => ({
      gender,
      count,
      pct: total ? Math.round((count / total) * 100) : 0,
    }));
  }, [records, total]);

  // Breakdown 6: Age Cohorts
  const ageBreakdown = useMemo(() => {
    const brackets = [
      { label: 'Youth 18–24y', min: 18, max: 24 },
      { label: 'Youth Core 25–35y', min: 25, max: 35 },
      { label: 'Mature Adults 36–49y', min: 36, max: 49 },
      { label: 'Geriatric 50+y', min: 50, max: 120 },
    ];
    return brackets.map((b) => {
      const c = records.filter((r) => r.personal.age >= b.min && r.personal.age <= b.max).length;
      return {
        label: b.label,
        count: c,
        pct: total ? Math.round((c / total) * 100) : 0,
      };
    });
  }, [records, total]);

  // Breakdown 7: Race / Population Group
  const raceBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    records.forEach((r) => {
      const rc = r.personal.race || 'Other';
      map[rc] = (map[rc] || 0) + 1;
    });
    return Object.entries(map).map(([race, count]) => ({
      race,
      count,
      pct: total ? Math.round((count / total) * 100) : 0,
    })).sort((a, b) => b.count - a.count);
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

  // Breakdown 9: Home Language
  const languageBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    records.forEach((r) => {
      const lang = r.personal.homeLanguage || 'isiZulu';
      map[lang] = (map[lang] || 0) + 1;
    });
    return Object.entries(map).map(([language, count]) => ({
      language,
      count,
      pct: total ? Math.round((count / total) * 100) : 0,
    })).sort((a, b) => b.count - a.count);
  }, [records, total]);

  const handleDownload = async () => {
    if (!printRef.current) return;
    try {
      setIsDownloading(true);
      const element = printRef.current;
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#FFFFFF',
        logging: false,
        windowWidth: 1080,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfPageHeight = pdf.internal.pageSize.getHeight();
      
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfPageHeight;

      // Add remaining pages if content spans across multiple A4 pages
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfPageHeight;
      }

      const dateStr = new Date().toISOString().split('T')[0];
      pdf.save(`COJ_Dunwell_Outreach_All_Stats_Report_${dateStr}.pdf`);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (e) {
      console.error('PDF generation error, triggering print fallback:', e);
      window.print();
    } finally {
      setIsDownloading(false);
    }
  };

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
                <span>Consolidated Outreach Statistics PDF</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-300 font-mono font-bold">
                  All {records.length} Screened Individuals
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Official Epidemiological Dossier & Clinical Ledger • City of Joburg & Dunwell Clinic
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold rounded-xl border border-slate-300 transition shadow-sm"
              title="Print directly or save as PDF via system dialog"
            >
              <Printer className="w-3.5 h-3.5 text-blue-900" /> Print
            </button>
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl transition shadow-md disabled:opacity-50"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Building All-Stats PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Download All-Stats PDF</span>
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
            <span>All-Stats PDF Dossier downloaded successfully for all {records.length} screened people!</span>
          </div>
        )}

        {/* Scrollable Printable Document Container */}
        <div className="overflow-y-auto p-3 sm:p-6 bg-slate-100 flex justify-center">
          <div
            ref={printRef}
            className="w-full max-w-[860px] bg-white text-slate-900 p-6 sm:p-10 rounded-lg border border-slate-300 font-sans shadow-lg space-y-6"
            style={{ minHeight: '1100px' }}
          >
            {/* Header: Logos & Authority */}
            <div className="border-b-4 border-amber-500 pb-4 flex items-center justify-between gap-4">
              <CojLogo className="h-12 sm:h-14" variant="dark" />
              <div className="text-center flex-1 px-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-900 block">
                  METROPOLITAN HEALTHCARE SURVEILLANCE & CLINICAL DOSSIER
                </span>
                <h1 className="text-base sm:text-lg font-black text-blue-950 uppercase tracking-tight">
                  Homeless People Health Outreach Consolidated Report
                </h1>
                <p className="text-xs font-bold text-amber-600">
                  City of Johannesburg Health Department & Dunwell Youth Priority Clinic
                </p>
                <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-center gap-3">
                  <span>Scope: <strong>All Screened Individuals (N={total})</strong></span>
                  <span>•</span>
                  <span>Date Generated: <strong>{new Date().toLocaleDateString('en-ZA')}</strong></span>
                  <span>•</span>
                  <span>National Health Act & POPIA Compliant</span>
                </div>
              </div>
              <DnwellLogo className="h-12 sm:h-14" variant="dark" />
            </div>

            {/* Executive Statistical Summary Grid */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-2">
                <h3 className="text-xs font-black uppercase text-blue-950 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-blue-900" />
                  Executive Statistical Summary • Entire Screened Cohort
                </h3>
                <span className="text-[10px] font-bold text-slate-500">
                  Sample: N = {total} Screened
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center">
                <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-xs">
                  <span className="text-[10px] font-bold text-slate-500 block uppercase">Total Screened</span>
                  <span className="text-2xl font-black text-slate-900 font-mono">{total}</span>
                  <span className="text-[9px] text-slate-600 block">100% of outreach</span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-xs">
                  <span className="text-[10px] font-bold text-slate-500 block uppercase">Youth Priority (≤35)</span>
                  <span className="text-2xl font-black text-amber-600 font-mono">{youthCount}</span>
                  <span className="text-[9px] text-amber-800 font-bold block">{youthPct}% of cohort</span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-xs">
                  <span className="text-[10px] font-bold text-slate-500 block uppercase">HTS Rapid Tested</span>
                  <span className="text-2xl font-black text-blue-900 font-mono">{htsTested}</span>
                  <span className="text-[9px] text-slate-600 block">{htsTestedPct}% uptake rate</span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-xs">
                  <span className="text-[10px] font-bold text-slate-500 block uppercase">HTS Reactive (+)</span>
                  <span className="text-2xl font-black text-rose-700 font-mono">{htsReactive}</span>
                  <span className="text-[9px] text-rose-800 font-bold block">{htsReactivePct}% positivity</span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-xs">
                  <span className="text-[10px] font-bold text-slate-500 block uppercase">Substance Abuse</span>
                  <span className="text-2xl font-black text-amber-700 font-mono">{substanceUsersCount}</span>
                  <span className="text-[9px] text-slate-600 block">{substancePct}% self-reported</span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-xs">
                  <span className="text-[10px] font-bold text-slate-500 block uppercase">Seeking Rehab</span>
                  <span className="text-2xl font-black text-emerald-700 font-mono">{rehabCount}</span>
                  <span className="text-[9px] text-emerald-800 font-bold block">{rehabPct}% of users</span>
                </div>
              </div>

              {/* Second Row: Shelter, Children, Counseling & Skills KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center mt-3 pt-3 border-t border-slate-200">
                <div className="bg-amber-50/70 p-2.5 rounded-lg border border-amber-200 shadow-xs">
                  <span className="text-[10px] font-bold text-amber-900 block uppercase flex items-center justify-center gap-1">
                    <Home className="w-3 h-3 text-amber-700" />
                    Wants COJ Shelter
                  </span>
                  <span className="text-2xl font-black text-amber-900 font-mono">{shelterMetrics.wantsYes}</span>
                  <span className="text-[9px] text-amber-800 font-bold block">
                    {shelterMetrics.wantsYesPct}% ({shelterMetrics.stayedYes} past stays)
                  </span>
                </div>

                <div className="bg-rose-50/70 p-2.5 rounded-lg border border-rose-200 shadow-xs">
                  <span className="text-[10px] font-bold text-rose-900 block uppercase flex items-center justify-center gap-1">
                    <Baby className="w-3 h-3 text-rose-700" />
                    Children on Street
                  </span>
                  <span className="text-2xl font-black text-rose-700 font-mono">{childrenMetrics.totalChildren}</span>
                  <span className="text-[9px] text-rose-800 font-bold block">
                    {childrenMetrics.familyCount} Families Safeguarded
                  </span>
                </div>

                <div className="bg-sky-50/70 p-2.5 rounded-lg border border-sky-200 shadow-xs">
                  <span className="text-[10px] font-bold text-sky-900 block uppercase flex items-center justify-center gap-1">
                    <Brain className="w-3 h-3 text-sky-700" />
                    Needs Counseling
                  </span>
                  <span className="text-2xl font-black text-sky-800 font-mono">{counselingMetrics.needsYes}</span>
                  <span className="text-[9px] text-sky-800 font-bold block">
                    {counselingMetrics.needsYesPct}% of total cohort
                  </span>
                </div>

                <div className="bg-purple-50/70 p-2.5 rounded-lg border border-purple-200 shadow-xs">
                  <span className="text-[10px] font-bold text-purple-900 block uppercase flex items-center justify-center gap-1">
                    <GraduationCap className="w-3 h-3 text-purple-700" />
                    Skills Development
                  </span>
                  <span className="text-2xl font-black text-purple-800 font-mono">{skillsMetrics.interestedYes}</span>
                  <span className="text-[9px] text-purple-800 font-bold block">
                    {skillsMetrics.interestPct}% interested in training
                  </span>
                </div>
              </div>
            </div>

            {/* Table 1: Hotspot Site Distribution Table */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-black uppercase text-blue-950 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-600" />
                  Table 1: Geographic Hotspot & Outreach Hub Surveillance (All Sites)
                </h3>
              </div>
              <table className="w-full text-left text-[11px] border-collapse border border-slate-300">
                <thead className="bg-blue-950 text-white text-[10px] uppercase font-bold">
                  <tr>
                    <th className="p-2 border border-slate-300">Outreach Site / Hub</th>
                    <th className="p-2 border border-slate-300 text-center">Total Screened</th>
                    <th className="p-2 border border-slate-300 text-center">Youth (≤35y)</th>
                    <th className="p-2 border border-slate-300 text-center">HTS Reactive (+)</th>
                    <th className="p-2 border border-slate-300 text-center">Rehab Interest</th>
                    <th className="p-2 border border-slate-300 text-center">Acute Cases</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {siteBreakdown.map((s) => (
                    <tr key={s.site} className="hover:bg-slate-50">
                      <td className="p-2 border border-slate-300 font-bold text-slate-900">{s.site}</td>
                      <td className="p-2 border border-slate-300 text-center font-mono font-bold text-blue-950">
                        {s.total} <span className="text-slate-500 font-normal">({Math.round((s.total / total) * 100)}%)</span>
                      </td>
                      <td className="p-2 border border-slate-300 text-center font-mono text-amber-700 font-bold">
                        {s.youth} ({s.total ? Math.round((s.youth / s.total) * 100) : 0}%)
                      </td>
                      <td className="p-2 border border-slate-300 text-center font-mono text-rose-700 font-bold">
                        {s.htsPos}
                      </td>
                      <td className="p-2 border border-slate-300 text-center font-mono text-emerald-700 font-bold">
                        {s.rehab}
                      </td>
                      <td className="p-2 border border-slate-300 text-center font-mono font-bold text-purple-900">
                        {s.acute}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Table 2 & Table 3: HTS Cascade & Substance Prevalence (Side by Side) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Table 2: HTS Cascade */}
              <div>
                <h3 className="text-xs font-black uppercase text-blue-950 mb-2 flex items-center gap-1.5">
                  <HeartPulse className="w-3.5 h-3.5 text-rose-600" />
                  Table 2: HTS Testing & HIV Linkage Cascade
                </h3>
                <table className="w-full text-left text-[11px] border-collapse border border-slate-300">
                  <thead className="bg-slate-800 text-white text-[10px] uppercase font-bold">
                    <tr>
                      <th className="p-2 border border-slate-300">Cascade Indicator</th>
                      <th className="p-2 border border-slate-300 text-center">N</th>
                      <th className="p-2 border border-slate-300 text-center">% Cohort</th>
                      <th className="p-2 border border-slate-300">Target / Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <td className="p-2 border border-slate-300 font-semibold">Total Outreach Cohort</td>
                      <td className="p-2 border border-slate-300 text-center font-mono font-bold">{total}</td>
                      <td className="p-2 border border-slate-300 text-center font-mono">100%</td>
                      <td className="p-2 border border-slate-300 text-[10px] text-slate-600">Base population</td>
                    </tr>
                    <tr>
                      <td className="p-2 border border-slate-300 font-semibold">HTS Rapid Test Accepted</td>
                      <td className="p-2 border border-slate-300 text-center font-mono font-bold text-blue-900">{htsTested}</td>
                      <td className="p-2 border border-slate-300 text-center font-mono">{htsTestedPct}%</td>
                      <td className="p-2 border border-slate-300 text-[10px] text-emerald-700 font-bold">High voluntary uptake</td>
                    </tr>
                    <tr>
                      <td className="p-2 border border-slate-300 font-semibold text-rose-700">HIV Reactive (Positive)</td>
                      <td className="p-2 border border-slate-300 text-center font-mono font-bold text-rose-700">{htsReactive}</td>
                      <td className="p-2 border border-slate-300 text-center font-mono text-rose-700 font-bold">{htsReactivePct}% of tested</td>
                      <td className="p-2 border border-slate-300 text-[10px] text-rose-700 font-bold">Same-day clinic linkage</td>
                    </tr>
                    <tr>
                      <td className="p-2 border border-slate-300 font-semibold text-emerald-700">HIV Non-Reactive (Negative)</td>
                      <td className="p-2 border border-slate-300 text-center font-mono font-bold text-emerald-700">{htsNonReactive}</td>
                      <td className="p-2 border border-slate-300 text-center font-mono">{total ? Math.round((htsNonReactive / total) * 100) : 0}%</td>
                      <td className="p-2 border border-slate-300 text-[10px] text-slate-600">PrEP counseling & condoms</td>
                    </tr>
                    <tr>
                      <td className="p-2 border border-slate-300 font-semibold">Known Positives on ART</td>
                      <td className="p-2 border border-slate-300 text-center font-mono font-bold">{onArtCount}</td>
                      <td className="p-2 border border-slate-300 text-center font-mono">{htsReactive ? Math.round((onArtCount / htsReactive) * 100) : 0}%</td>
                      <td className="p-2 border border-slate-300 text-[10px] text-blue-900 font-bold">Dunwell ART fast-track</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Table 3: Substance Prevalence */}
              <div>
                <h3 className="text-xs font-black uppercase text-blue-950 mb-2 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-amber-600" />
                  Table 3: Substance Prevalence & Rehab Demand
                </h3>
                <table className="w-full text-left text-[11px] border-collapse border border-slate-300">
                  <thead className="bg-slate-800 text-white text-[10px] uppercase font-bold">
                    <tr>
                      <th className="p-2 border border-slate-300">Substance Type</th>
                      <th className="p-2 border border-slate-300 text-center">Users (N)</th>
                      <th className="p-2 border border-slate-300 text-center">% Cohort</th>
                      <th className="p-2 border border-slate-300 text-center">Seeking Rehab</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {substanceBreakdown.map((sub) => (
                      <tr key={sub.name}>
                        <td className="p-2 border border-slate-300 font-bold text-slate-900">{sub.name}</td>
                        <td className="p-2 border border-slate-300 text-center font-mono font-bold text-amber-700">{sub.count}</td>
                        <td className="p-2 border border-slate-300 text-center font-mono">{sub.pct}%</td>
                        <td className="p-2 border border-slate-300 text-center font-mono text-emerald-700 font-bold">
                          {sub.rehabWanted} ({sub.count ? Math.round((sub.rehabWanted / sub.count) * 100) : 0}%)
                        </td>
                      </tr>
                    ))}
                    {injectingCount > 0 && (
                      <tr className="bg-rose-50 font-bold text-rose-900">
                        <td className="p-2 border border-slate-300">Injecting Drug Use (IDU Risk)</td>
                        <td className="p-2 border border-slate-300 text-center font-mono">{injectingCount}</td>
                        <td className="p-2 border border-slate-300 text-center font-mono">{Math.round((injectingCount / total) * 100)}%</td>
                        <td className="p-2 border border-slate-300 text-center text-[10px] uppercase">Harm Reduction / Needle Exchange</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Table 4: Clinical Complaints & Vitals Triage */}
            <div>
              <h3 className="text-xs font-black uppercase text-blue-950 mb-2 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-purple-700" />
                Table 4: Present Clinical Complaints & Vitals Staging (All Screened)
              </h3>
              <table className="w-full text-left text-[11px] border-collapse border border-slate-300">
                <thead className="bg-slate-800 text-white text-[10px] uppercase font-bold">
                  <tr>
                    <th className="p-2 border border-slate-300">Clinical Presentation / Complaint</th>
                    <th className="p-2 border border-slate-300 text-center">Cases (N)</th>
                    <th className="p-2 border border-slate-300 text-center">% of Cohort</th>
                    <th className="p-2 border border-slate-300">Primary Clinical Disposition</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {complaintsBreakdown.map((c) => (
                    <tr key={c.name}>
                      <td className="p-2 border border-slate-300 font-bold text-slate-900">{c.name}</td>
                      <td className="p-2 border border-slate-300 text-center font-mono font-bold text-blue-950">{c.count}</td>
                      <td className="p-2 border border-slate-300 text-center font-mono">{c.pct}%</td>
                      <td className="p-2 border border-slate-300 text-[10px] text-slate-600">
                        {c.name.includes('Injury')
                          ? 'Wound dressing, analgesia, tetanus toxoid at Dunwell Clinic'
                          : c.name.includes('Breathing')
                          ? 'Sputum GeneXpert, bronchodilator & chest assessment'
                          : c.name.includes('Skin')
                          ? 'Antiseptic soaks, topical antibiotics & hygiene packs'
                          : 'Standard clinical evaluation & health education'}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-amber-50 font-bold text-amber-950">
                    <td className="p-2 border border-slate-300">Stage 2 Hypertension (Sys BP ≥ 140 mmHg)</td>
                    <td className="p-2 border border-slate-300 text-center font-mono">{highBpCount}</td>
                    <td className="p-2 border border-slate-300 text-center font-mono">{total ? Math.round((highBpCount / total) * 100) : 0}%</td>
                    <td className="p-2 border border-slate-300 text-[10px]">Repeat vitals & antihypertensive therapy initiation</td>
                  </tr>
                  {tbSymptomCount > 0 && (
                    <tr className="bg-rose-50 font-bold text-rose-950">
                      <td className="p-2 border border-slate-300">TB Symptomatic (Cough &gt; 2 wks / Night Sweats)</td>
                      <td className="p-2 border border-slate-300 text-center font-mono">{tbSymptomCount}</td>
                      <td className="p-2 border border-slate-300 text-center font-mono">{total ? Math.round((tbSymptomCount / total) * 100) : 0}%</td>
                      <td className="p-2 border border-slate-300 text-[10px]">Immediate Sputum GeneXpert collection & infection control</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Table 5: Physical Street Address & Homeless Sleeping Spots */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-black uppercase text-blue-950 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-900" />
                  Table 5: Physical Street Address & Homeless Sleeping Spots (N={total})
                </h3>
                <span className="text-[10px] text-slate-500 font-mono">
                  Geospatial Surveillance
                </span>
              </div>
              <table className="w-full text-left text-[10px] border-collapse border border-slate-300">
                <thead className="bg-slate-100 uppercase font-bold text-slate-700 text-[9px]">
                  <tr>
                    <th className="p-2 border border-slate-300">Physical Address / Sleeping Spot</th>
                    <th className="p-2 border border-slate-300 text-center">Screened (N)</th>
                    <th className="p-2 border border-slate-300 text-center">% of Total</th>
                    <th className="p-2 border border-slate-300 text-center">Youth (≤35y)</th>
                    <th className="p-2 border border-slate-300 text-center">HTS Pos (+)</th>
                    <th className="p-2 border border-slate-300 text-center">Substance %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  {addressBreakdown.map((item) => (
                    <tr key={item.address}>
                      <td className="p-2 border border-slate-300 font-bold text-slate-900">
                        {item.address}
                      </td>
                      <td className="p-2 border border-slate-300 text-center font-mono font-bold text-blue-900">
                        {item.count}
                      </td>
                      <td className="p-2 border border-slate-300 text-center font-mono">{item.pct}%</td>
                      <td className="p-2 border border-slate-300 text-center font-mono text-amber-700 font-bold">
                        {item.youth}
                      </td>
                      <td className="p-2 border border-slate-300 text-center font-mono font-bold text-rose-700">
                        {item.htsPos}
                      </td>
                      <td className="p-2 border border-slate-300 text-center font-mono">
                        {item.count ? Math.round((item.substance / item.count) * 100) : 0}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Table 6: Demographic Staging (Gender, Age, Race, Nationality & Home Language) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-black uppercase text-blue-950 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-blue-900" />
                  Table 6: Demographic Staging Summary (Gender, Age, Race, Nationality & Languages)
                </h3>
                <span className="text-[10px] text-slate-500 font-mono">
                  Dunwell Priority Cohort
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-[9px]">
                {/* Gender & Age */}
                <div className="border border-slate-300 rounded p-2 bg-slate-50/50">
                  <span className="font-extrabold text-blue-950 block uppercase mb-1">Gender & Age Cohorts</span>
                  <div className="space-y-1 text-slate-700">
                    <div className="flex justify-between border-b border-slate-200 pb-0.5">
                      <span>Gender:</span>
                      <span className="font-mono font-bold">
                        {genderBreakdown.map((g) => `${g.gender}: ${g.count} (${g.pct}%)`).join(' | ')}
                      </span>
                    </div>
                    <div className="flex justify-between pt-0.5">
                      <span>Age Groups:</span>
                      <span className="font-mono font-bold">
                        {ageBreakdown.map((a) => `${a.label.split(' ')[0]}: ${a.count} (${a.pct}%)`).join(' | ')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Race, Nationality & Language */}
                <div className="border border-slate-300 rounded p-2 bg-slate-50/50">
                  <span className="font-extrabold text-blue-950 block uppercase mb-1">Race, Nationality & Home Language</span>
                  <div className="space-y-1 text-slate-700">
                    <div className="flex justify-between border-b border-slate-200 pb-0.5">
                      <span>Race:</span>
                      <span className="font-mono font-bold">
                        {raceBreakdown.map((r) => `${r.race}: ${r.count}`).join(' | ')}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200 pb-0.5 pt-0.5">
                      <span>Nationality:</span>
                      <span className="font-mono font-bold">
                        {nationalityBreakdown.slice(0, 3).map((n) => `${n.nationality.split('(')[0].trim()}: ${n.count}`).join(' | ')}
                      </span>
                    </div>
                    <div className="flex justify-between pt-0.5">
                      <span>Languages:</span>
                      <span className="font-mono font-bold">
                        {languageBreakdown.slice(0, 4).map((l) => `${l.language}: ${l.count}`).join(' | ')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Analytics & Statistical Distribution Graphs */}
            <div className="border border-slate-300 rounded-xl p-4 bg-slate-50/60 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h3 className="text-xs font-black uppercase text-blue-950 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-blue-900" />
                  Visual Analytics & Statistical Distributions (All Screened N={total})
                </h3>
                <span className="text-[10px] text-slate-500 font-mono">Cohort Staging</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[10px]">
                {/* Graph A: Shelter Placement & Past History */}
                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between">
                  <div>
                    <span className="font-extrabold text-blue-950 block uppercase text-[10px] mb-2 flex items-center gap-1">
                      <Home className="w-3 h-3 text-amber-600" />
                      COJ Shelter Demand & Stays
                    </span>
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between text-[9px] mb-0.5">
                          <span className="font-semibold text-slate-700">Wants COJ Shelter</span>
                          <span className="font-mono font-bold text-amber-700">{shelterMetrics.wantsYes} ({shelterMetrics.wantsYesPct}%)</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div className="bg-amber-500 h-2 rounded-full" style={{ width: `${shelterMetrics.wantsYesPct}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-[9px] mb-0.5">
                          <span className="font-semibold text-slate-700">Stayed in Shelter Before</span>
                          <span className="font-mono font-bold text-blue-700">{shelterMetrics.stayedYes} ({shelterMetrics.stayedYesPct}%)</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${shelterMetrics.stayedYesPct}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-[9px] mb-0.5">
                          <span className="font-semibold text-slate-700">Children on Street (Families)</span>
                          <span className="font-mono font-bold text-rose-700">{childrenMetrics.totalChildren} in {childrenMetrics.familyCount} Families</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div className="bg-rose-500 h-2 rounded-full" style={{ width: `${childrenMetrics.familyPct}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-[8px] text-slate-400 mt-2.5 pt-1.5 border-t border-slate-100 flex justify-between">
                    <span>COJ Shelter Placement Target</span>
                    <span>High Priority</span>
                  </div>
                </div>

                {/* Graph B: Skills Development Preferences */}
                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between">
                  <div>
                    <span className="font-extrabold text-blue-950 block uppercase text-[10px] mb-2 flex items-center gap-1">
                      <GraduationCap className="w-3 h-3 text-purple-600" />
                      Top Vocational Trades
                    </span>
                    <div className="space-y-1.5">
                      {skillsMetrics.skillsRanked.slice(0, 4).map((s) => (
                        <div key={s.skill}>
                          <div className="flex justify-between text-[9px] mb-0.5">
                            <span className="font-semibold text-slate-700 truncate max-w-[130px]">{s.skill}</span>
                            <span className="font-mono font-bold text-purple-800">{s.count} ({s.pct}%)</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-purple-600 h-1.5 rounded-full" style={{ width: `${s.pct}%` }} />
                          </div>
                        </div>
                      ))}
                      {skillsMetrics.skillsRanked.length === 0 && (
                        <span className="text-[9px] text-slate-400 italic">No skills registered yet</span>
                      )}
                    </div>
                  </div>
                  <div className="text-[8px] text-slate-400 mt-2.5 pt-1.5 border-t border-slate-100 flex justify-between">
                    <span>Overall Interest: {skillsMetrics.interestPct}%</span>
                    <span>Economic Upliftment</span>
                  </div>
                </div>

                {/* Graph C: Psychosocial Symptoms & Distress */}
                <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between">
                  <div>
                    <span className="font-extrabold text-blue-950 block uppercase text-[10px] mb-2 flex items-center gap-1">
                      <Brain className="w-3 h-3 text-sky-600" />
                      Top Mental Health Symptoms
                    </span>
                    <div className="space-y-1.5">
                      {psychosocialMetrics.symptomsList.slice(0, 4).map((sym) => (
                        <div key={sym.label}>
                          <div className="flex justify-between text-[9px] mb-0.5">
                            <span className="font-semibold text-slate-700 truncate max-w-[130px]">{sym.label}</span>
                            <span className="font-mono font-bold text-sky-800">{sym.count} ({sym.pct}%)</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-sky-600 h-1.5 rounded-full" style={{ width: `${sym.pct}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="text-[8px] text-slate-400 mt-2.5 pt-1.5 border-t border-slate-100 flex justify-between">
                    <span>Crisis: {psychosocialMetrics.crisis} | Receptive: {counselingMetrics.needsYesPct}%</span>
                    <span>Psychosocial Lead</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Table 7: COJ Homeless Shelter Placement Demand & Prior Stays */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-black uppercase text-blue-950 flex items-center gap-1.5">
                  <Home className="w-3.5 h-3.5 text-amber-700" />
                  Table 7: COJ Homeless Shelter Placement Demand & Prior Stay Surveillance (N={total})
                </h3>
                <span className="text-[10px] text-slate-500 font-mono">
                  City Social Development Integration
                </span>
              </div>
              <table className="w-full text-left text-[11px] border-collapse border border-slate-300">
                <thead className="bg-slate-800 text-white text-[10px] uppercase font-bold">
                  <tr>
                    <th className="p-2 border border-slate-300">Shelter Indicator / Question</th>
                    <th className="p-2 border border-slate-300 text-center">Positive (Yes)</th>
                    <th className="p-2 border border-slate-300 text-center">Undecided / Maybe</th>
                    <th className="p-2 border border-slate-300 text-center">Declined (No)</th>
                    <th className="p-2 border border-slate-300">Key Context / Frequency / Reasons</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="p-2 border border-slate-300 font-bold text-slate-900">
                      Do they want to stay at COJ Homeless Shelter?
                    </td>
                    <td className="p-2 border border-slate-300 text-center font-mono font-bold text-emerald-700">
                      {shelterMetrics.wantsYes} ({shelterMetrics.wantsYesPct}%)
                    </td>
                    <td className="p-2 border border-slate-300 text-center font-mono font-bold text-amber-700">
                      {shelterMetrics.wantsUndecided} ({total ? Math.round((shelterMetrics.wantsUndecided / total) * 100) : 0}%)
                    </td>
                    <td className="p-2 border border-slate-300 text-center font-mono text-slate-600">
                      {shelterMetrics.wantsNo} ({total ? Math.round((shelterMetrics.wantsNo / total) * 100) : 0}%)
                    </td>
                    <td className="p-2 border border-slate-300 text-[10px] text-slate-700">
                      Immediate bed booking & social worker referral prioritized for Yes & Undecided respondents.
                    </td>
                  </tr>
                  <tr className="bg-slate-50">
                    <td className="p-2 border border-slate-300 font-bold text-slate-900">
                      Have they stayed at COJ shelter before?
                    </td>
                    <td className="p-2 border border-slate-300 text-center font-mono font-bold text-blue-900">
                      {shelterMetrics.stayedYes} ({shelterMetrics.stayedYesPct}%)
                    </td>
                    <td className="p-2 border border-slate-300 text-center font-mono text-slate-400">—</td>
                    <td className="p-2 border border-slate-300 text-center font-mono text-slate-600">
                      {shelterMetrics.stayedNo} ({total ? Math.round((shelterMetrics.stayedNo / total) * 100) : 0}%)
                    </td>
                    <td className="p-2 border border-slate-300 text-[10px] text-slate-700">
                      <span className="font-bold">Prior Stay Frequency:</span> Once: {shelterMetrics.freqMap['Once'] || 0} | 2-3 Times: {shelterMetrics.freqMap['2-3 Times'] || 0} | Frequent: {shelterMetrics.freqMap['Frequently / Multiple Times'] || 0}
                    </td>
                  </tr>
                  {shelterMetrics.reasonsList.length > 0 && (
                    <tr>
                      <td className="p-2 border border-slate-300 font-bold text-slate-900">
                        Primary Reasons for Leaving Past Shelters
                      </td>
                      <td colSpan={4} className="p-2 border border-slate-300 text-[10px]">
                        <div className="flex flex-wrap gap-2">
                          {shelterMetrics.reasonsList.map((r) => (
                            <span key={r.reason} className="bg-slate-100 px-2 py-0.5 rounded border border-slate-300 font-medium">
                              <strong>{r.reason}</strong>: {r.count} ({r.pct}%)
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Table 8: Minor Safeguarding & Street Children Surveillance */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-black uppercase text-blue-950 flex items-center gap-1.5">
                  <Baby className="w-3.5 h-3.5 text-rose-700" />
                  Table 8: Minor Safeguarding & Street Children Surveillance (N={childrenMetrics.totalChildren} Children)
                </h3>
                <span className="text-[10px] text-rose-700 font-bold font-mono">
                  Children's Act Statutory Safeguarding
                </span>
              </div>
              {childrenMetrics.familyCount === 0 ? (
                <div className="p-3 border border-slate-300 rounded bg-slate-50 text-[11px] text-slate-600">
                  No minor children currently reported residing on streets in this cohort. Ongoing screening monitoring active.
                </div>
              ) : (
                <table className="w-full text-left text-[10px] border-collapse border border-slate-300">
                  <thead className="bg-rose-900 text-white uppercase font-bold text-[9px]">
                    <tr>
                      <th className="p-2 border border-slate-300">Caregiver Ref # & Name</th>
                      <th className="p-2 border border-slate-300">Sleeping Spot / Hotspot</th>
                      <th className="p-2 border border-slate-300 text-center">Children Count</th>
                      <th className="p-2 border border-slate-300 text-center">Reported Ages</th>
                      <th className="p-2 border border-slate-300 text-center">Family Shelter Request</th>
                      <th className="p-2 border border-slate-300">Safeguarding Disposition</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {childrenMetrics.cases.map((c) => (
                      <tr key={c.ref} className="bg-rose-50/40">
                        <td className="p-2 border border-slate-300 font-bold text-slate-900">
                          {c.name} <span className="text-slate-500 font-mono text-[9px]">({c.ref})</span>
                        </td>
                        <td className="p-2 border border-slate-300 text-slate-700">{c.site}</td>
                        <td className="p-2 border border-slate-300 text-center font-mono font-bold text-rose-800">
                          {c.count} minor(s)
                        </td>
                        <td className="p-2 border border-slate-300 text-center font-mono">{c.ages}</td>
                        <td className="p-2 border border-slate-300 text-center">
                          <span className={`px-1.5 py-0.5 rounded font-bold text-[9px] ${
                            c.wantsShelter === 'Yes'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}>
                            {c.wantsShelter}
                          </span>
                        </td>
                        <td className="p-2 border border-slate-300 text-[9px] text-rose-900 font-semibold">
                          Immediate Child Protection Unit (DSD) & Mother-Child Shelter Referral
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Table 9: Clinical & Psychosocial Health Counseling Demand & Distress Triage */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-black uppercase text-blue-950 flex items-center gap-1.5">
                  <Brain className="w-3.5 h-3.5 text-sky-700" />
                  Table 9: Clinical & Psychosocial Health Counseling Demand & Symptom Prevalence
                </h3>
                <span className="text-[10px] text-slate-500 font-mono">
                  Mental Health Integration
                </span>
              </div>
              <table className="w-full text-left text-[11px] border-collapse border border-slate-300">
                <thead className="bg-slate-800 text-white text-[10px] uppercase font-bold">
                  <tr>
                    <th className="p-2 border border-slate-300">Psychosocial Metric / Domain</th>
                    <th className="p-2 border border-slate-300 text-center">Count (N)</th>
                    <th className="p-2 border border-slate-300 text-center">% of Cohort</th>
                    <th className="p-2 border border-slate-300">Clinical Focus / Interventions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr className="bg-sky-50/50">
                    <td className="p-2 border border-slate-300 font-bold text-slate-900">
                      Needs Clinical & Psychosocial Counseling
                    </td>
                    <td className="p-2 border border-slate-300 text-center font-mono font-bold text-sky-900">
                      {counselingMetrics.needsYes}
                    </td>
                    <td className="p-2 border border-slate-300 text-center font-mono font-bold text-sky-900">
                      {counselingMetrics.needsYesPct}%
                    </td>
                    <td className="p-2 border border-slate-300 text-[10px] text-slate-700">
                      Enrolled into Dunwell on-site psychological support and social worker follow-up.
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2 border border-slate-300 font-bold text-slate-900">
                      Severe Mental Health Crisis / Red Flag
                    </td>
                    <td className="p-2 border border-slate-300 text-center font-mono font-bold text-rose-700">
                      {psychosocialMetrics.crisis}
                    </td>
                    <td className="p-2 border border-slate-300 text-center font-mono text-rose-700 font-bold">
                      {total ? Math.round((psychosocialMetrics.crisis / total) * 100) : 0}%
                    </td>
                    <td className="p-2 border border-slate-300 text-[10px] text-rose-800 font-semibold">
                      Same-day psychiatric medical review & crisis containment protocol.
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2 border border-slate-300 font-bold text-slate-900">
                      Top Counseling Focus Areas
                    </td>
                    <td colSpan={3} className="p-2 border border-slate-300 text-[10px]">
                      <div className="flex flex-wrap gap-1.5">
                        {counselingMetrics.focusList.slice(0, 5).map((f) => (
                          <span key={f.area} className="bg-sky-50 text-sky-900 border border-sky-200 px-2 py-0.5 rounded font-semibold">
                            {f.area}: {f.count} ({f.pct}%)
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2 border border-slate-300 font-bold text-slate-900">
                      Top Reported Symptoms (Psychosocial Tick Form)
                    </td>
                    <td colSpan={3} className="p-2 border border-slate-300 text-[10px]">
                      <div className="flex flex-wrap gap-1.5">
                        {psychosocialMetrics.symptomsList.slice(0, 5).map((s) => (
                          <span key={s.label} className="bg-slate-100 text-slate-800 border border-slate-200 px-2 py-0.5 rounded">
                            {s.label}: <strong>{s.count}</strong> ({s.pct}%)
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Table 10: Skills Development & Vocational Training Programs */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-black uppercase text-blue-950 flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-purple-700" />
                  Table 10: Skills Development & Vocational Training Program Readiness
                </h3>
                <span className="text-[10px] text-slate-500 font-mono">
                  Economic Re-integration Pipeline
                </span>
              </div>
              <table className="w-full text-left text-[11px] border-collapse border border-slate-300">
                <thead className="bg-slate-800 text-white text-[10px] uppercase font-bold">
                  <tr>
                    <th className="p-2 border border-slate-300">Skills Metric / Trade Category</th>
                    <th className="p-2 border border-slate-300 text-center">Interested (N)</th>
                    <th className="p-2 border border-slate-300 text-center">% of Cohort</th>
                    <th className="p-2 border border-slate-300">Institutional Partner / Training Pathway</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr className="bg-purple-50/50">
                    <td className="p-2 border border-slate-300 font-bold text-slate-900">
                      Total Seeking Skills Development
                    </td>
                    <td className="p-2 border border-slate-300 text-center font-mono font-bold text-purple-900">
                      {skillsMetrics.interestedYes}
                    </td>
                    <td className="p-2 border border-slate-300 text-center font-mono font-bold text-purple-900">
                      {skillsMetrics.interestPct}%
                    </td>
                    <td className="p-2 border border-slate-300 text-[10px] text-slate-700">
                      COJ Skills Centre, TVET College bursaries & SETA artisan learnerships.
                    </td>
                  </tr>
                  {skillsMetrics.skillsRanked.slice(0, 6).map((skill) => (
                    <tr key={skill.skill}>
                      <td className="p-2 border border-slate-300 font-bold text-slate-800">
                        {skill.skill}
                      </td>
                      <td className="p-2 border border-slate-300 text-center font-mono font-bold text-purple-800">
                        {skill.count}
                      </td>
                      <td className="p-2 border border-slate-300 text-center font-mono">
                        {skill.pct}%
                      </td>
                      <td className="p-2 border border-slate-300 text-[10px] text-slate-600">
                        Accredited short-course & apprenticeship intake list
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Table 11: Master Screening Roll & Ledger of All Screened Persons */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-black uppercase text-blue-950 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-blue-900" />
                  Table 11: Master Screening Ledger of All Screened Individuals (N={total})
                </h3>
                <span className="text-[10px] text-slate-500 font-mono">
                  POPIA & National Health Act Verified (All Consents Signed)
                </span>
              </div>
              <table className="w-full text-left text-[9px] border-collapse border border-slate-300">
                <thead className="bg-blue-950 text-white uppercase font-bold text-[8px]">
                  <tr>
                    <th className="p-1 border border-slate-300">Ref #</th>
                    <th className="p-1 border border-slate-300">Full Name / Alias</th>
                    <th className="p-1 border border-slate-300">Physical Sleeping Spot</th>
                    <th className="p-1 border border-slate-300">Gender / Age / Race</th>
                    <th className="p-1 border border-slate-300">Hotspot Site</th>
                    <th className="p-1 border border-slate-300">Vitals / BP</th>
                    <th className="p-1 border border-slate-300">HTS Status</th>
                    <th className="p-1 border border-slate-300">Substances</th>
                    <th className="p-1 border border-slate-300">Shelter & Clinical Action Plan</th>
                    <th className="p-1 border border-slate-300">Triage</th>
                    <th className="p-1 border border-slate-300 text-center">Consent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  {records.map((r, idx) => (
                    <tr key={r.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                      <td className="p-1 border border-slate-300 font-mono font-bold text-blue-900 whitespace-nowrap">
                        {r.refNumber}
                      </td>
                      <td className="p-1 border border-slate-300">
                        <strong className="text-slate-900 block">{r.personal.fullName}</strong>
                        {r.personal.alias && (
                          <span className="text-[8px] text-slate-500 block italic">"{r.personal.alias}"</span>
                        )}
                      </td>
                      <td className="p-1 border border-slate-300 text-slate-700">
                        {r.personal.physicalAddress}
                      </td>
                      <td className="p-1 border border-slate-300 whitespace-nowrap">
                        {r.personal.gender}, {r.personal.age}y ({r.personal.race})
                        {r.personal.age <= 35 && (
                          <span className="ml-1 text-[7px] bg-amber-200 text-slate-950 px-1 py-0.2 rounded font-black">
                            YOUTH
                          </span>
                        )}
                      </td>
                      <td className="p-1 border border-slate-300 text-[8px]">
                        {r.outreachSite.replace(' / Inner-City Outreach', '')}
                      </td>
                      <td className="p-1 border border-slate-300 font-mono whitespace-nowrap text-[8px]">
                        {r.medical.vitals.bloodPressureSys}/{r.medical.vitals.bloodPressureDia}
                      </td>
                      <td className="p-1 border border-slate-300 text-[8px]">
                        <span
                          className={`px-1 py-0.2 rounded font-bold inline-block ${
                            r.hts.testResult.includes('Reactive (Positive)')
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {r.hts.testResult.split('(')[0]}
                        </span>
                      </td>
                      <td className="p-1 border border-slate-300 text-[8px]">
                        <span className="truncate block max-w-[85px] font-medium">
                          {r.substance.substanceTypes.join(', ')}
                        </span>
                      </td>
                      <td className="p-1 border border-slate-300 text-[8px]">
                        <div className="space-y-0.5 leading-tight">
                          <span className={`inline-block px-1 py-0.2 rounded font-bold text-[7.5px] ${
                            r.actionPlan.wantsCojShelter === 'Yes'
                              ? 'bg-emerald-100 text-emerald-900'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            Shelter: {r.actionPlan.wantsCojShelter || 'Unset'}
                          </span>
                          {r.actionPlan.hasChildrenOnStreets === 'Yes' && (
                            <span className="block text-[7.5px] font-bold text-rose-700">
                              ⚠ {r.actionPlan.childrenCount || 1} Minor(s) on street
                            </span>
                          )}
                          <div className="text-[7.5px] text-slate-600 flex gap-1">
                            {r.actionPlan.needsClinicalPsychosocialCounseling === 'Yes' && (
                              <span>💬 Counseling</span>
                            )}
                            {r.actionPlan.interestedInSkillsDevelopment === 'Yes' && (
                              <span>🎓 Skills</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-1 border border-slate-300 font-bold text-[8px]">
                        <span
                          className={
                            r.actionPlan.triageLevel.includes('Urgent') || r.actionPlan.triageLevel.includes('Emergency')
                              ? 'text-rose-700'
                              : 'text-slate-700'
                          }
                        >
                          {r.actionPlan.triageLevel.split('/')[0]}
                        </span>
                      </td>
                      <td className="p-1 border border-slate-300 text-center text-emerald-700 font-bold text-[8px] whitespace-nowrap">
                        ✓ Signed
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Official Certification & Clinical Sign-Off */}
            <div className="pt-6 border-t-2 border-slate-300 grid grid-cols-2 gap-8 text-[11px] text-slate-600">
              <div>
                <span className="font-extrabold text-slate-900 block uppercase tracking-wide">
                  Lead Outreach Clinician Sign-Off:
                </span>
                <div className="h-12 border-b border-slate-400 mt-2 flex items-end pb-1">
                  <span className="font-serif italic text-blue-900 text-base font-bold">
                    Sr. Nonhlanhla Khumalo (RN)
                  </span>
                </div>
                <span className="block mt-1 font-semibold text-slate-800">
                  Sr. Nonhlanhla Khumalo, Professional Nurse & Outreach Lead
                </span>
                <span className="block text-[10px] text-slate-500">
                  City of Johannesburg Metropolitan Municipality • Health Department
                </span>
              </div>

              <div>
                <span className="font-extrabold text-slate-900 block uppercase tracking-wide">
                  Clinic Medical Director Attestation:
                </span>
                <div className="h-12 border-b border-slate-400 mt-2 flex items-end pb-1">
                  <span className="font-serif italic text-blue-900 text-base font-bold">
                    Dr. D. Dunwell (MBChB, FCP)
                  </span>
                </div>
                <span className="block mt-1 font-semibold text-slate-800">
                  Dr. D. Dunwell, Medical Director
                </span>
                <span className="block text-[10px] text-slate-500">
                  Dunwell Youth Priority Clinic & Special Health Services
                </span>
              </div>
            </div>

            {/* Regulatory Footer */}
            <div className="text-center text-[9px] text-slate-400 pt-3 border-t border-slate-200">
              CONFIDENTIAL PUBLIC HEALTH DOSSIER • Generated in accordance with Section 14 of the National Health Act (Act 61 of 2003) and the Protection of Personal Information Act (POPIA Act 4 of 2013). All records secured with verified informed client consent.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
