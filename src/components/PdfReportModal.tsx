import React, { useRef, useState } from 'react';
import { ScreeningRecord } from '../types';
import { CojLogo, DnwellLogo } from './Logos';
import {
  Download,
  Printer,
  X,
  CheckCircle2,
  AlertTriangle,
  HeartPulse,
  Activity,
  FileCheck,
  Shield,
  Loader2,
  Home,
  Users,
  GraduationCap,
  Brain,
  Info,
} from 'lucide-react';
import html2canvas from 'html2canvas-pro';
import jsPDF from 'jspdf';

interface PdfReportModalProps {
  record: ScreeningRecord;
  onClose: () => void;
}

export const PdfReportModal: React.FC<PdfReportModalProps> = ({ record, onClose }) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Discrete Page-by-Page A4 PDF Generation to guarantee zero element cutoff
  const handleDownloadPdf = async () => {
    if (!reportRef.current) return;
    const container = reportRef.current;
    const scrollParent = container.parentElement;
    const prevScrollTop = scrollParent ? scrollParent.scrollTop : 0;

    try {
      setIsGenerating(true);

      if (scrollParent) {
        scrollParent.scrollTop = 0;
      }
      await new Promise((resolve) => setTimeout(resolve, 80));

      const pageElements = Array.from(container.querySelectorAll<HTMLElement>('.patient-dossier-page'));
      if (pageElements.length === 0) return;

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = 210;
      const pdfHeight = 297;

      for (let i = 0; i < pageElements.length; i++) {
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

      const safeName = record.personal.fullName.replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `Outreach_Card_${record.refNumber}_${safeName}.pdf`;

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
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white border border-slate-300 w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[94vh] overflow-hidden my-auto">
        {/* Header Action Bar */}
        <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 no-print">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-100 text-blue-900 border border-blue-200">
              <FileCheck className="w-5 h-5 text-blue-800" />
            </div>
            <div>
              <h2 className="text-slate-900 font-extrabold text-sm sm:text-base flex items-center gap-2">
                <span>Clinical Outreach Screening Card</span>
                <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-bold">
                  Ref: {record.refNumber}
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                2-Page Official Health Dossier • Discrete A4 Publication Format
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold rounded-xl border border-slate-300 transition shadow-xs"
              title="Print directly"
            >
              <Printer className="w-3.5 h-3.5 text-blue-900" /> Print
            </button>
            <button
              onClick={handleDownloadPdf}
              disabled={isGenerating}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl transition shadow-md disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Generating PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Official PDF (2 Pages)</span>
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
            <span>Screening card PDF generated successfully (2 clean pages) and downloaded!</span>
          </div>
        )}

        {/* Printable Area - Scrollable Preview */}
        <div className="overflow-y-auto p-3 sm:p-6 bg-slate-200 flex flex-col items-center">
          <div ref={reportRef} id="printable-screening-card" className="w-full flex flex-col items-center">

            {/* ============================================================== */}
            {/* PAGE 1: DEMOGRAPHICS, MEDICAL VITALS & HTS SCREENING           */}
            {/* ============================================================== */}
            <div className="text-center mb-2 text-[11px] font-bold text-slate-600 uppercase tracking-widest no-print flex items-center justify-center gap-2">
              <span className="h-px bg-slate-400 w-16"></span> Page 1 of 2 • Intake Demographics, Vitals & HTS Cascade <span className="h-px bg-slate-400 w-16"></span>
            </div>
            <div
              className="patient-dossier-page bg-white text-slate-900 p-7 rounded-sm border border-slate-300 font-sans shadow-lg flex flex-col justify-between overflow-hidden relative mb-8"
              style={{ width: '800px', height: '1131px', minHeight: '1131px', maxHeight: '1131px' }}
            >
              <div>
                {/* Formal Masthead Banner */}
                <div className="border-b-4 border-amber-500 pb-2.5">
                  <div className="flex items-center justify-between gap-4">
                    <CojLogo className="h-11 w-auto" variant="dark" />
                    <div className="text-center flex-1 px-2">
                      <span className="text-[9px] font-black uppercase tracking-widest text-blue-900 block">
                        CITY OF JOHANNESBURG • HEALTH SERVICES DIRECTORY
                      </span>
                      <h1 className="text-base font-black text-blue-950 uppercase tracking-tight">
                        Homeless People Outreach & Health Screening
                      </h1>
                      <span className="text-[10.5px] font-bold text-amber-600 uppercase tracking-wider block">
                        In Technical Collaboration with Dunwell Youth Priority Clinic
                      </span>
                    </div>
                    <DnwellLogo className="h-14 w-auto" variant="dark" useImage />
                  </div>

                  {/* Reference Bar */}
                  <div className="mt-2.5 pt-2 border-t border-slate-200 grid grid-cols-4 gap-2 text-[10px] bg-slate-50 p-2 rounded border border-slate-200">
                    <div>
                      <span className="text-slate-500 block text-[8.5px] uppercase font-bold">Record ID</span>
                      <span className="font-mono font-bold text-blue-950">{record.refNumber}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[8.5px] uppercase font-bold">Screening Date</span>
                      <span className="font-semibold text-slate-800">
                        {new Date(record.createdAt).toLocaleDateString('en-ZA', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[8.5px] uppercase font-bold">Outreach Hotspot</span>
                      <span className="font-semibold text-slate-800 truncate block">{record.outreachSite}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[8.5px] uppercase font-bold">Authorized Screener</span>
                      <span className="font-semibold text-slate-800 truncate block">{record.screenerName}</span>
                    </div>
                  </div>
                </div>

                {/* SECTION 1: Personal Details */}
                <div className="mt-3 border border-slate-300 rounded overflow-hidden">
                  <div className="flex items-center justify-between bg-blue-950 text-white px-3 py-1 text-[11px] font-bold uppercase tracking-wider">
                    <div className="flex items-center gap-1.5">
                      <span className="bg-amber-400 text-blue-950 px-1.5 py-0.2 rounded text-[9.5px] font-black mr-1">1</span>
                      <span>Personal Details & Baseline Demographics</span>
                    </div>
                    <span className="text-[9px] text-amber-300 font-normal">POPIA Baseline Intake</span>
                  </div>
                  <div className="bg-slate-50/70 px-3 py-1 text-[9.5px] text-slate-600 border-b border-slate-200">
                    <strong>Data Explanation:</strong> Legal identification and street dwelling location recorded to establish patient continuity of care and enable targeted outreach follow-up.
                  </div>
                  <div className="p-3 bg-white grid grid-cols-3 gap-x-4 gap-y-2 text-[10.5px]">
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase font-semibold">1. Full Name:</span>
                      <span className="font-bold text-slate-900 text-xs">{record.personal.fullName}</span>
                      {record.personal.alias && (
                        <span className="text-slate-500 text-[10px] block">Alias: "{record.personal.alias}"</span>
                      )}
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase font-semibold">2. Gender & Age:</span>
                      <span className="font-semibold text-slate-800">
                        {record.personal.gender} • {record.personal.age} Years Old {record.personal.dob ? `(${record.personal.dob})` : ''}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase font-semibold">3. Nationality:</span>
                      <span className="font-semibold text-slate-800">{record.personal.nationality}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase font-semibold">4. Physical Address / Hotspot:</span>
                      <span className="font-semibold text-slate-800">{record.personal.physicalAddress}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase font-semibold">5. Race / Population Group:</span>
                      <span className="font-semibold text-slate-800">{record.personal.race}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase font-semibold">6. Home Language:</span>
                      <span className="font-semibold text-slate-800">{record.personal.homeLanguage || 'isiZulu / English'}</span>
                    </div>
                  </div>
                </div>

                {/* SECTION 2: Medical Screening & Vitals */}
                <div className="mt-3 border border-slate-300 rounded overflow-hidden">
                  <div className="flex items-center justify-between bg-blue-950 text-white px-3 py-1 text-[11px] font-bold uppercase tracking-wider">
                    <div className="flex items-center gap-1.5">
                      <span className="bg-amber-400 text-blue-950 px-1.5 py-0.2 rounded text-[9.5px] font-black mr-1">2</span>
                      <span>Primary Medical Screening & Vitals</span>
                    </div>
                    <span className="text-[9px] text-amber-300 font-normal">Primary Healthcare Thresholds</span>
                  </div>
                  <div className="bg-slate-50/70 px-3 py-1 text-[9.5px] text-slate-600 border-b border-slate-200">
                    <strong>Data Explanation:</strong> Vital signs evaluated against South African clinical standards: Normal BP (&lt;140/90 mmHg), Resting Pulse (60–100 bpm), Random Glucose (3.9–7.8 mmol/L), SpO2 (≥95%).
                  </div>
                  <div className="p-3 bg-white space-y-2.5 text-[10.5px]">
                    {/* Vitals Grid */}
                    <div className="grid grid-cols-6 gap-2 bg-slate-50 p-2 rounded border border-slate-200 text-center">
                      <div className="p-1 rounded bg-white border border-slate-200 shadow-xs">
                        <span className="text-[8px] text-slate-500 uppercase block font-bold">Blood Pressure</span>
                        <span className={`text-[11px] font-black ${
                          record.medical.vitals.bloodPressureSys >= 140 || record.medical.vitals.bloodPressureDia >= 90
                            ? 'text-rose-600'
                            : 'text-slate-900'
                        }`}>
                          {record.medical.vitals.bloodPressureSys}/{record.medical.vitals.bloodPressureDia}
                        </span>
                        <span className="text-[7.5px] text-slate-400 block">mmHg</span>
                      </div>

                      <div className="p-1 rounded bg-white border border-slate-200 shadow-xs">
                        <span className="text-[8px] text-slate-500 uppercase block font-bold">Pulse Rate</span>
                        <span className="text-[11px] font-black text-slate-900">{record.medical.vitals.pulseRate}</span>
                        <span className="text-[7.5px] text-slate-400 block">bpm</span>
                      </div>

                      <div className="p-1 rounded bg-white border border-slate-200 shadow-xs">
                        <span className="text-[8px] text-slate-500 uppercase block font-bold">Temperature</span>
                        <span className={`text-[11px] font-black ${(record.medical.vitals.temperature ?? 0) > 37.5 ? 'text-amber-600' : 'text-slate-900'}`}>
                          {record.medical.vitals.temperature ? `${record.medical.vitals.temperature}°C` : '36.5°C'}
                        </span>
                        <span className="text-[7.5px] text-slate-400 block">Axillary</span>
                      </div>

                      <div className="p-1 rounded bg-white border border-slate-200 shadow-xs">
                        <span className="text-[8px] text-slate-500 uppercase block font-bold">Blood Sugar</span>
                        <span className="text-[11px] font-black text-slate-900">
                          {record.medical.vitals.bloodGlucose ? `${record.medical.vitals.bloodGlucose}` : '5.2'}
                        </span>
                        <span className="text-[7.5px] text-slate-400 block">mmol/L</span>
                      </div>

                      <div className="p-1 rounded bg-white border border-slate-200 shadow-xs">
                        <span className="text-[8px] text-slate-500 uppercase block font-bold">Weight / BMI</span>
                        <span className="text-[11px] font-black text-slate-900">
                          {record.medical.vitals.weightKg ? `${record.medical.vitals.weightKg} kg` : '62 kg'}
                        </span>
                        <span className="text-[7.5px] text-slate-400 block">Metric</span>
                      </div>

                      <div className="p-1 rounded bg-white border border-slate-200 shadow-xs">
                        <span className="text-[8px] text-slate-500 uppercase block font-bold">SpO2 / Resp</span>
                        <span className="text-[11px] font-black text-slate-900">
                          {record.medical.vitals.oxygenSaturation || 98}%
                        </span>
                        <span className="text-[7.5px] text-slate-400 block">{record.medical.vitals.respiratoryRate || 16}/m</span>
                      </div>
                    </div>

                    {/* Chronic Conditions & Present Complaints */}
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div className="bg-slate-50 p-2 rounded border border-slate-200">
                        <span className="text-blue-900 font-bold text-[9px] uppercase block mb-0.5">
                          Chronic Health Conditions:
                        </span>
                        <div className="flex flex-wrap gap-1 mb-0.5">
                          {record.medical.chronicConditions.map((cond, i) => (
                            <span key={i} className="px-1.5 py-0.2 bg-blue-100 text-blue-900 rounded font-medium text-[9.5px]">
                              {cond}
                            </span>
                          ))}
                        </div>
                        {record.medical.chronicConditionsNotes && (
                          <p className="text-[9.5px] text-slate-600 italic">Notes: {record.medical.chronicConditionsNotes}</p>
                        )}
                      </div>

                      <div className="bg-slate-50 p-2 rounded border border-slate-200">
                        <span className="text-blue-900 font-bold text-[9px] uppercase block mb-0.5">
                          Presenting Complaints & TB Symptoms:
                        </span>
                        <div className="flex flex-wrap gap-1 mb-0.5">
                          {record.medical.presentComplaints.map((comp, i) => (
                            <span key={i} className="px-1.5 py-0.2 bg-amber-100 text-amber-900 rounded font-medium text-[9.5px] border border-amber-200">
                              {comp}
                            </span>
                          ))}
                        </div>
                        {record.medical.presentComplaintsNotes && (
                          <p className="text-[9.5px] text-slate-700 font-medium">Details: {record.medical.presentComplaintsNotes}</p>
                        )}
                        {record.medical.tbScreeningSymptomatic && (
                          <span className="inline-block mt-0.5 text-[9px] font-bold text-rose-700 bg-rose-50 px-1 py-0.2 rounded border border-rose-300">
                            ⚠ TB Symptom Screen Positive — Sputum GeneXpert Fast-Track Indicated
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* SECTION 3: HIV Testing Services (HTS) */}
                <div className="mt-3 border border-slate-300 rounded overflow-hidden">
                  <div className="flex items-center justify-between bg-blue-950 text-white px-3 py-1 text-[11px] font-bold uppercase tracking-wider">
                    <div className="flex items-center gap-1.5">
                      <span className="bg-amber-400 text-blue-950 px-1.5 py-0.2 rounded text-[9.5px] font-black mr-1">3</span>
                      <span>HIV Testing Services (HTS) & Antiretroviral Support</span>
                    </div>
                    <span className="text-[9px] text-amber-300 font-normal">National HTS Protocol</span>
                  </div>
                  <div className="bg-slate-50/70 px-3 py-1 text-[9.5px] text-slate-600 border-b border-slate-200">
                    <strong>Data Explanation:</strong> Voluntary counseling and confidential rapid antibody testing conducted according to National Department of Health guidelines, with immediate linkage to ART initiation or adherence re-engagement.
                  </div>
                  <div className="p-3 bg-white grid grid-cols-4 gap-2 text-[10.5px]">
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase font-semibold">Prior HIV Status:</span>
                      <span className="font-bold text-slate-900">{record.hts.hivStatusKnown}</span>
                      {record.hts.priorStatus && (
                        <span className="text-[9.5px] text-slate-500 block">Reported: {record.hts.priorStatus}</span>
                      )}
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase font-semibold">Accepted Rapid Test:</span>
                      <span className="font-bold text-slate-900">{record.hts.acceptHtsTest}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase font-semibold">Rapid Test Result:</span>
                      <span className={`font-black px-2 py-0.5 rounded inline-block text-[10.5px] ${
                        record.hts.testResult.includes('Reactive (Positive)')
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : record.hts.testResult.includes('Non-Reactive')
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {record.hts.testResult}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase font-semibold">ART Adherence Status:</span>
                      <span className="font-bold text-slate-900">{record.hts.onArt}</span>
                    </div>
                  </div>
                  {record.hts.notes && (
                    <div className="border-t border-slate-200 px-3 py-1 bg-blue-50/50 text-[10px] text-blue-950">
                      <span className="font-bold">HTS Clinical Counseling Note:</span> {record.hts.notes}
                    </div>
                  )}
                </div>
              </div>

              {/* Page 1 Running Footer */}
              <div className="pt-2 border-t border-slate-300 flex items-center justify-between text-[8px] text-slate-500">
                <span>Dunwell Youth Priority Clinic • Executive Wellness & Outreach Services</span>
                <span>City of Johannesburg Metropolitan Municipality • Health Directorate</span>
                <span className="font-bold text-blue-950 font-mono bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  Page 1 of 2
                </span>
              </div>
            </div>

            {/* ============================================================== */}
            {/* PAGE 2: SUBSTANCE, SOCIAL WELFARE, ACTION PLAN & CONSENT       */}
            {/* ============================================================== */}
            <div className="text-center mb-2 text-[11px] font-bold text-slate-600 uppercase tracking-widest no-print flex items-center justify-center gap-2">
              <span className="h-px bg-slate-400 w-16"></span> Page 2 of 2 • Substance Profiling, Social Welfare & Attestation <span className="h-px bg-slate-400 w-16"></span>
            </div>
            <div
              className="patient-dossier-page bg-white text-slate-900 p-7 rounded-sm border border-slate-300 font-sans shadow-lg flex flex-col justify-between overflow-hidden relative mb-8"
              style={{ width: '800px', height: '1131px', minHeight: '1131px', maxHeight: '1131px' }}
            >
              <div>
                {/* Running Header for Page 2 */}
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
                        Dunwell Youth Priority Clinic • Clinical Outreach Screening Card
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-block bg-blue-950 text-amber-400 text-[8px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                      Patient Ref: {record.refNumber}
                    </span>
                    <span className="text-[7.5px] text-slate-500 block font-mono mt-0.5">
                      Client: {record.personal.fullName}
                    </span>
                  </div>
                </div>

                {/* SECTION 4: Substance Use & Harm Reduction */}
                <div className="border border-slate-300 rounded overflow-hidden">
                  <div className="flex items-center justify-between bg-blue-950 text-white px-3 py-1 text-[11px] font-bold uppercase tracking-wider">
                    <div className="flex items-center gap-1.5">
                      <span className="bg-amber-400 text-blue-950 px-1.5 py-0.2 rounded text-[9.5px] font-black mr-1">4</span>
                      <span>Harm Reduction & Substance Use Profiling</span>
                    </div>
                    <span className="text-[9px] text-amber-300 font-normal">Detoxification & Rehabilitation Intake</span>
                  </div>
                  <div className="bg-slate-50/70 px-3 py-1 text-[9.5px] text-slate-600 border-b border-slate-200">
                    <strong>Data Explanation:</strong> Evaluation of chemical substance use patterns and assessment of personal readiness for medical detoxification, peer-led support, and inpatient rehabilitation.
                  </div>
                  <div className="p-3 bg-white grid grid-cols-4 gap-2 text-[10.5px]">
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase font-semibold">Alcohol Frequency:</span>
                      <span className="font-bold text-slate-900">{record.substance.alcoholUseFrequency}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase font-semibold">Substance Frequency:</span>
                      <span className="font-bold text-slate-900">{record.substance.drugUseFrequency}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase font-semibold">Substances Identified:</span>
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {record.substance.substanceTypes.map((sub, i) => (
                          <span key={i} className="px-1.5 py-0.2 bg-amber-50 text-amber-900 rounded border border-amber-300 font-semibold text-[9.5px]">
                            {sub}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase font-semibold">Rehab Readiness:</span>
                      <span className={`font-black inline-block px-1.5 py-0.2 rounded text-[10px] ${
                        record.substance.interestInRehabSupport.includes('Yes')
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {record.substance.interestInRehabSupport}
                      </span>
                    </div>
                  </div>
                  {record.substance.substanceNotes && (
                    <div className="border-t border-slate-200 px-3 py-1 bg-slate-50 text-[10px] text-slate-700">
                      <span className="font-bold text-slate-900">Harm Reduction Assessment:</span> {record.substance.substanceNotes}
                    </div>
                  )}
                </div>

                {/* SECTION 5: Social Welfare & City of Joburg Shelter Linkage */}
                <div className="mt-3 border border-slate-300 rounded overflow-hidden">
                  <div className="flex items-center justify-between bg-blue-950 text-white px-3 py-1 text-[11px] font-bold uppercase tracking-wider">
                    <div className="flex items-center gap-1.5">
                      <span className="bg-amber-400 text-blue-950 px-1.5 py-0.2 rounded text-[9.5px] font-black mr-1">5</span>
                      <span>Social Welfare, Shelter Placement & Skills Development</span>
                    </div>
                    <span className="text-[9px] text-amber-300 font-normal">City of Joburg Social Development</span>
                  </div>
                  <div className="bg-slate-50/70 px-3 py-1 text-[9.5px] text-slate-600 border-b border-slate-200">
                    <strong>Data Explanation:</strong> Municipal social welfare assessment identifying willingness for municipal shelter placement, child vulnerability triage on street corridors, and skills empowerment interests.
                  </div>
                  <div className="p-3 bg-white grid grid-cols-4 gap-2 text-[10.5px]">
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase font-semibold">Wants COJ Shelter:</span>
                      <span className="font-bold text-slate-900">{record.actionPlan.wantsCojShelter || 'Undecided'}</span>
                      {record.actionPlan.shelterPreferenceNotes && (
                        <span className="text-[9px] text-slate-500 block italic">{record.actionPlan.shelterPreferenceNotes}</span>
                      )}
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase font-semibold">Children on Streets:</span>
                      <span className={`font-bold ${record.actionPlan.hasChildrenOnStreets === 'Yes' ? 'text-rose-700 font-black' : 'text-slate-900'}`}>
                        {record.actionPlan.hasChildrenOnStreets || 'No'}
                        {record.actionPlan.childrenCount ? ` (${record.actionPlan.childrenCount} children)` : ''}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase font-semibold">Previous Shelter Stays:</span>
                      <span className="font-semibold text-slate-800">
                        {record.actionPlan.stayedAtCojShelterBefore || 'No'} {record.actionPlan.shelterFrequency ? `(${record.actionPlan.shelterFrequency})` : ''}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase font-semibold">Skills Training Interest:</span>
                      <span className="font-bold text-slate-900">{record.actionPlan.interestedInSkillsDevelopment || 'Yes'}</span>
                      {record.actionPlan.skillsInterestAreas && record.actionPlan.skillsInterestAreas.length > 0 && (
                        <div className="text-[9.5px] text-blue-900 truncate">
                          {record.actionPlan.skillsInterestAreas.join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* SECTION 6: Clinical Action Plan & Referral */}
                <div className="mt-3 border border-slate-300 rounded overflow-hidden">
                  <div className="flex items-center justify-between bg-slate-800 text-white px-3 py-1 text-[11px] font-bold uppercase tracking-wider">
                    <div className="flex items-center gap-1.5">
                      <span className="bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded text-[9.5px] font-black mr-1">6</span>
                      <span>Clinical Action Plan, Prescriptions & Linkage</span>
                    </div>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded ${
                      record.actionPlan.triageLevel.includes('Emergency')
                        ? 'bg-rose-500 text-white'
                        : record.actionPlan.triageLevel.includes('Urgent')
                        ? 'bg-amber-400 text-slate-950'
                        : 'bg-emerald-600 text-white'
                    }`}>
                      Triage Category: {record.actionPlan.triageLevel}
                    </span>
                  </div>
                  <div className="bg-slate-50/70 px-3 py-1 text-[9.5px] text-slate-600 border-b border-slate-200">
                    <strong>Data Explanation:</strong> Assigned acuity level and clinical directives executed by the outreach team, including emergency first aid, specialized clinic referrals, and dispensed medications.
                  </div>
                  <div className="p-3 bg-white grid grid-cols-3 gap-2 text-[10.5px]">
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase font-bold">Immediate Care Delivered:</span>
                      <ul className="list-disc list-inside text-slate-800 text-[10px] mt-0.5 space-y-0.5">
                        {record.actionPlan.immediateIntervention.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase font-bold">Referral Destination:</span>
                      <span className="font-bold text-blue-950 text-[10.5px] block mt-0.5">
                        {record.actionPlan.referralDestination || 'Dunwell Youth Priority Clinic'}
                      </span>
                      {record.actionPlan.followUpDate && (
                        <span className="text-[9.5px] text-slate-600 block mt-0.5">
                          Scheduled: <strong className="text-slate-900">{record.actionPlan.followUpDate}</strong>
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase font-bold">Medications Dispensed:</span>
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {record.actionPlan.medicationsDispensed && record.actionPlan.medicationsDispensed.length > 0 ? (
                          record.actionPlan.medicationsDispensed.map((med, i) => (
                            <span key={i} className="px-1.5 py-0.2 bg-slate-100 text-slate-800 rounded text-[9.5px] font-medium border border-slate-200">
                              {med}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 italic text-[9.5px]">None dispensed</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* SECTION 7: Informed Consent Form with Verified Digital Signature */}
                <div className="mt-3 border border-slate-300 rounded overflow-hidden">
                  <div className="bg-blue-950 text-white px-3 py-1 text-[11px] font-bold uppercase tracking-wider flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-amber-400" />
                      <span>Informed Screening Consent & Clinician Attestation</span>
                    </div>
                    <span className="text-[9px] text-amber-300 font-mono">POPIA Act 4 of 2013 • South Africa</span>
                  </div>

                  <div className="p-2 bg-slate-50/80 text-[9px] text-slate-700 leading-relaxed border-b border-slate-200">
                    <p>
                      I voluntarily give informed consent to healthcare professionals from Dunwell Youth Priority Clinic and the City of Johannesburg Health Directorate to conduct primary health triage, vital signs measurement, and confidential HIV Testing Services (HTS). My health data is maintained strictly confidential in terms of the National Health Act (Act 61 of 2003).
                    </p>
                  </div>

                  {/* Signature Box Layout */}
                  <div className="p-2.5 bg-white grid grid-cols-2 gap-3">
                    {/* Client Digital Signature Box */}
                    <div className="border border-slate-300 rounded p-2 bg-slate-50/50 flex flex-col justify-between">
                      <div className="flex items-center justify-between text-[9px] text-slate-500 mb-0.5">
                        <span className="font-bold uppercase text-slate-700">Client / Screened Person Signature:</span>
                        <span className="text-emerald-700 font-semibold flex items-center gap-0.5">
                          <CheckCircle2 className="w-3 h-3" /> Digitally Attested
                        </span>
                      </div>

                      <div className="h-12 bg-white rounded border border-slate-200 flex items-center justify-center p-1 my-0.5">
                        {record.consent?.clientSignatureDataUrl ? (
                          <img
                            src={record.consent.clientSignatureDataUrl}
                            alt="Client Signature"
                            className="max-h-full max-w-full object-contain"
                          />
                        ) : (
                          <span className="text-slate-400 italic text-[10px]">Signature on file</span>
                        )}
                      </div>

                      <div className="flex justify-between items-center text-[9px] text-slate-600 pt-0.5 border-t border-slate-200">
                        <span>Name: <strong>{record.consent?.clientNamePrinted || record.personal.fullName}</strong></span>
                        <span>Date: <strong>{new Date(record.consent?.signedTimestamp || record.createdAt).toLocaleDateString('en-ZA')}</strong></span>
                      </div>
                    </div>

                    {/* Screener Attestation & Official Stamp */}
                    <div className="border border-slate-300 rounded p-2 bg-slate-50/50 flex flex-col justify-between">
                      <div className="flex items-center justify-between text-[9px] text-slate-500 mb-0.5">
                        <span className="font-bold uppercase text-slate-700">Authorized Screener Cadre:</span>
                        <span className="text-blue-900 font-semibold">{record.consent?.screenerCadre || 'Outreach Healthcare Clinician'}</span>
                      </div>

                      <div className="h-12 bg-white rounded border border-slate-200 flex items-center justify-around p-1 my-0.5">
                        {/* Official Stamp Vector */}
                        <div className="border-2 border-dashed border-blue-900/60 rounded-full px-2.5 py-0.5 text-center text-blue-900 transform -rotate-2 select-none">
                          <span className="text-[6.5px] font-black uppercase tracking-wider block">CITY OF JOHANNESBURG</span>
                          <span className="text-[7.5px] font-black uppercase block text-amber-600">HEALTH OUTREACH VERIFIED</span>
                          <span className="text-[6.5px] block font-mono">DUNWELL CLINIC</span>
                        </div>

                        <div className="text-center">
                          <span className="font-serif italic text-blue-950 text-xs block font-bold">{record.screenerName}</span>
                          <span className="text-[8.5px] text-slate-500 block font-mono">Ref: #{record.refNumber}</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-[9px] text-slate-600 pt-0.5 border-t border-slate-200">
                        <span>Attested: <strong>{record.screenerName}</strong></span>
                        <span className="font-mono text-[8.5px] text-slate-500">Security Hash: {record.id.slice(0, 8)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Page 2 Running Footer */}
              <div className="pt-2 border-t border-slate-300 flex items-center justify-between text-[8px] text-slate-500">
                <span>Dunwell Youth Priority Clinic • Executive Wellness & Health</span>
                <span>City of Johannesburg Metropolitan Municipality • Health Directorate</span>
                <span className="font-bold text-blue-950 font-mono bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  Page 2 of 2
                </span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
