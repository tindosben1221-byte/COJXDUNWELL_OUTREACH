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
  Calendar,
  MapPin,
  User,
  Loader2,
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface PdfReportModalProps {
  record: ScreeningRecord;
  onClose: () => void;
}

export const PdfReportModal: React.FC<PdfReportModalProps> = ({ record, onClose }) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleDownloadPdf = async () => {
    if (!reportRef.current) return;
    try {
      setIsGenerating(true);
      const element = reportRef.current;
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#FFFFFF',
        windowWidth: 1024,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Dunwell_COJ_Screening_${record.refNumber}.pdf`);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      window.print();
    } finally {
      setIsGenerating(false);
    }
  };

  const handleNativePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white border border-slate-300 w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden my-auto">
        {/* Modal Top Bar */}
        <div className="bg-slate-50 px-5 py-3.5 border-b border-slate-200 flex items-center justify-between no-print">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-800 border border-amber-300">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-slate-900 font-extrabold text-base flex items-center gap-2">
                Official Clinical Outreach Card & Screening PDF
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-300 font-mono font-bold">
                  {record.refNumber}
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                City of Joburg Health Department & Dunwell Youth Priority Clinic
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleNativePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold rounded-xl transition border border-slate-300 shadow-sm"
            >
              <Printer className="w-4 h-4 text-blue-900" />
              Print / Save A4
            </button>
            <button
              onClick={handleDownloadPdf}
              disabled={isGenerating}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl shadow-md transition disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating PDF...
                </>
              ) : downloadSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-950" />
                  Downloaded!
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Download PDF
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-200 transition"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Container */}
        <div className="overflow-y-auto p-4 sm:p-6 bg-slate-100 flex justify-center">
          {/* A4 Paper Canvas */}
          <div
            ref={reportRef}
            id="printable-screening-card"
            className="w-full max-w-[800px] bg-white text-slate-900 shadow-2xl p-7 rounded-sm border border-slate-300 font-sans print:shadow-none print:border-none print:p-0"
            style={{ minHeight: '1050px' }}
          >
            {/* Top Navy Blue Header Banner */}
            <div className="border-b-4 border-amber-500 pb-4 mb-4">
              <div className="flex items-center justify-between gap-4">
                <CojLogo className="h-12" variant="dark" />
                <div className="text-center flex-1 px-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-blue-900 block">
                    CITY OF JOHANNESBURG • HEALTH SERVICES DIRECTORY
                  </span>
                  <h1 className="text-lg sm:text-xl font-extrabold text-blue-950 uppercase tracking-tight">
                    Homeless People Outreach & Health Screening
                  </h1>
                  <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">
                    In Collaboration with Dunwell Youth Priority Clinic
                  </span>
                </div>
                <DnwellLogo className="h-12" variant="dark" />
              </div>

              {/* Reference Bar */}
              <div className="mt-3.5 pt-2.5 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] bg-slate-50 p-2 rounded border border-slate-200">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Record ID</span>
                  <span className="font-mono font-bold text-blue-950">{record.refNumber}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Screening Date</span>
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
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Outreach Site / Hotspot</span>
                  <span className="font-semibold text-slate-800 truncate block">{record.outreachSite}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Screener</span>
                  <span className="font-semibold text-slate-800 truncate block">{record.screenerName}</span>
                </div>
              </div>
            </div>

            {/* SECTION 1: Personal Details */}
            <div className="mb-4">
              <div className="flex items-center gap-1.5 bg-blue-950 text-white px-3 py-1 rounded-t text-xs font-bold uppercase tracking-wider">
                <span className="bg-amber-400 text-blue-950 px-1.5 py-0.5 rounded text-[10px] font-black mr-1">1</span>
                Personal Details
              </div>
              <div className="border border-t-0 border-slate-300 p-3 bg-white grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">1. Full Name:</span>
                  <span className="font-bold text-slate-900 text-sm">{record.personal.fullName}</span>
                  {record.personal.alias && (
                    <span className="text-slate-500 text-[11px] block">Alias: "{record.personal.alias}"</span>
                  )}
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">2. Gender:</span>
                  <span className="font-semibold text-slate-800">{record.personal.gender}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">3. DOB / Age:</span>
                  <span className="font-semibold text-slate-800">
                    {record.personal.dob || 'Not Stated'} ({record.personal.age} Years Old)
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">4. Nationality:</span>
                  <span className="font-semibold text-slate-800">{record.personal.nationality}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">5. Physical Address / Shelter:</span>
                  <span className="font-semibold text-slate-800">{record.personal.physicalAddress}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">6. Race:</span>
                  <span className="font-semibold text-slate-800">{record.personal.race}</span>
                </div>
              </div>
            </div>

            {/* SECTION 2: Medical Screening */}
            <div className="mb-4">
              <div className="flex items-center justify-between bg-blue-950 text-white px-3 py-1 rounded-t text-xs font-bold uppercase tracking-wider">
                <div className="flex items-center gap-1.5">
                  <span className="bg-amber-400 text-blue-950 px-1.5 py-0.5 rounded text-[10px] font-black mr-1">2</span>
                  Medical Screening
                </div>
                <span className="text-[10px] text-amber-300 font-normal">Primary Triage & Vitals</span>
              </div>
              <div className="border border-t-0 border-slate-300 p-3 bg-white space-y-3 text-xs">
                {/* Vitals Grid */}
                <div>
                  <span className="text-blue-900 font-bold text-[11px] block mb-1 uppercase tracking-wide">
                    1. Baseline Vitals
                  </span>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 bg-slate-50 p-2.5 rounded border border-slate-200 text-center">
                    <div className="p-1 rounded bg-white border border-slate-200">
                      <span className="text-[9px] text-slate-500 uppercase block font-semibold">Blood Pressure</span>
                      <span className={`text-xs font-bold ${
                        record.medical.vitals.bloodPressureSys >= 140 || record.medical.vitals.bloodPressureDia >= 90
                          ? 'text-rose-600'
                          : 'text-slate-900'
                      }`}>
                        {record.medical.vitals.bloodPressureSys}/{record.medical.vitals.bloodPressureDia}
                      </span>
                      <span className="text-[8px] text-slate-400 block">mmHg</span>
                    </div>

                    <div className="p-1 rounded bg-white border border-slate-200">
                      <span className="text-[9px] text-slate-500 uppercase block font-semibold">Pulse Rate</span>
                      <span className="text-xs font-bold text-slate-900">{record.medical.vitals.pulseRate}</span>
                      <span className="text-[8px] text-slate-400 block">bpm</span>
                    </div>

                    <div className="p-1 rounded bg-white border border-slate-200">
                      <span className="text-[9px] text-slate-500 uppercase block font-semibold">Temp</span>
                      <span className={`text-xs font-bold ${(record.medical.vitals.temperature ?? 0) > 37.5 ? 'text-amber-600' : 'text-slate-900'}`}>
                        {record.medical.vitals.temperature ? `${record.medical.vitals.temperature}°C` : 'N/A'}
                      </span>
                      <span className="text-[8px] text-slate-400 block">Axillary</span>
                    </div>

                    <div className="p-1 rounded bg-white border border-slate-200">
                      <span className="text-[9px] text-slate-500 uppercase block font-semibold">Blood Sugar</span>
                      <span className="text-xs font-bold text-slate-900">
                        {record.medical.vitals.bloodGlucose ? `${record.medical.vitals.bloodGlucose} mmol/L` : 'N/A'}
                      </span>
                      <span className="text-[8px] text-slate-400 block">Random</span>
                    </div>

                    <div className="p-1 rounded bg-white border border-slate-200">
                      <span className="text-[9px] text-slate-500 uppercase block font-semibold">Weight / BMI</span>
                      <span className="text-xs font-bold text-slate-900">
                        {record.medical.vitals.weightKg ? `${record.medical.vitals.weightKg} kg` : 'N/A'}
                      </span>
                      <span className="text-[8px] text-slate-400 block">kg</span>
                    </div>

                    <div className="p-1 rounded bg-white border border-slate-200">
                      <span className="text-[9px] text-slate-500 uppercase block font-semibold">Resp. Rate / SpO2</span>
                      <span className="text-xs font-bold text-slate-900">
                        {record.medical.vitals.respiratoryRate || 16}/min ({record.medical.vitals.oxygenSaturation || 98}%)
                      </span>
                      <span className="text-[8px] text-slate-400 block">Air</span>
                    </div>
                  </div>
                </div>

                {/* Chronic Conditions & Present Complaints */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                    <span className="text-blue-900 font-bold text-[10px] uppercase block mb-1">
                      2. Chronic Conditions:
                    </span>
                    <div className="flex flex-wrap gap-1 mb-1">
                      {record.medical.chronicConditions.map((cond, i) => (
                        <span key={i} className="px-2 py-0.5 bg-blue-100 text-blue-900 rounded font-medium text-[11px]">
                          {cond}
                        </span>
                      ))}
                    </div>
                    {record.medical.chronicConditionsNotes && (
                      <p className="text-[11px] text-slate-600 italic">Notes: {record.medical.chronicConditionsNotes}</p>
                    )}
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                    <span className="text-blue-900 font-bold text-[10px] uppercase block mb-1">
                      3. Present Complaints (e.g. Injury, Difficult Breathing):
                    </span>
                    <div className="flex flex-wrap gap-1 mb-1">
                      {record.medical.presentComplaints.map((comp, i) => (
                        <span key={i} className="px-2 py-0.5 bg-amber-100 text-amber-900 rounded font-medium text-[11px] border border-amber-200">
                          {comp}
                        </span>
                      ))}
                    </div>
                    {record.medical.presentComplaintsNotes && (
                      <p className="text-[11px] text-slate-700 font-medium">Details: {record.medical.presentComplaintsNotes}</p>
                    )}
                    {record.medical.tbScreeningSymptomatic && (
                      <span className="inline-block mt-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-300">
                        ⚠ TB Symptom Screen Positive (GeneXpert Indicated)
                      </span>
                    )}
                  </div>
                </div>

                {/* 4. HTS / HIV Screening */}
                <div className="bg-blue-50/70 p-2.5 rounded border border-blue-200">
                  <span className="text-blue-950 font-bold text-[11px] uppercase block mb-1.5 flex items-center justify-between">
                    <span>4. HTS / HIV Screening</span>
                    <span className="text-[10px] font-mono text-blue-700">South Africa HTS Guidelines</span>
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[10px]">• HIV Status Known:</span>
                      <span className="font-bold text-slate-900">{record.hts.hivStatusKnown}</span>
                      {record.hts.priorStatus && (
                        <span className="text-[10px] text-slate-500 block">Prior: {record.hts.priorStatus}</span>
                      )}
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">• Accepted HIV Test:</span>
                      <span className="font-bold text-slate-900">{record.hts.acceptHtsTest}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">• Test Result:</span>
                      <span className={`font-bold px-2 py-0.5 rounded inline-block text-[11px] ${
                        record.hts.testResult.includes('Reactive (Positive)')
                          ? 'bg-rose-100 text-rose-800 font-extrabold border border-rose-300'
                          : record.hts.testResult.includes('Non-Reactive')
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {record.hts.testResult}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">• On ART:</span>
                      <span className="font-bold text-slate-900">{record.hts.onArt}</span>
                    </div>
                  </div>
                  {record.hts.notes && (
                    <p className="text-[11px] text-blue-900 mt-1.5 font-medium border-t border-blue-200 pt-1">
                      HTS Counseling Note: {record.hts.notes}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* SECTION 3: Substance Use Screening */}
            <div className="mb-4">
              <div className="flex items-center justify-between bg-blue-950 text-white px-3 py-1 rounded-t text-xs font-bold uppercase tracking-wider">
                <div className="flex items-center gap-1.5">
                  <span className="bg-amber-400 text-blue-950 px-1.5 py-0.5 rounded text-[10px] font-black mr-1">3</span>
                  Substance Use Screening
                </div>
                <span className="text-[10px] text-amber-300 font-normal">Harm Reduction & Rehabilitation Intake</span>
              </div>
              <div className="border border-t-0 border-slate-300 p-3 bg-white grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">1. Alcohol Use & Frequency:</span>
                  <span className="font-bold text-slate-900">{record.substance.alcoholUseFrequency}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">2. Drug Use & Frequency:</span>
                  <span className="font-bold text-slate-900">{record.substance.drugUseFrequency}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">3. Type of Substance:</span>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {record.substance.substanceTypes.map((sub, i) => (
                      <span key={i} className="px-1.5 py-0.5 bg-amber-50 text-amber-900 rounded border border-amber-300 font-semibold text-[10px]">
                        {sub}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">4. Interest in Rehab Support:</span>
                  <span className={`font-bold inline-block px-2 py-0.5 rounded text-[11px] ${
                    record.substance.interestInRehabSupport.includes('Yes')
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 font-extrabold'
                      : 'bg-slate-100 text-slate-700'
                  }`}>
                    {record.substance.interestInRehabSupport}
                  </span>
                </div>
              </div>
              {record.substance.substanceNotes && (
                <div className="border-x border-b border-slate-300 px-3 py-1.5 bg-slate-50 text-[11px] text-slate-700">
                  <span className="font-semibold text-slate-900">Substance Profile Notes: </span>
                  {record.substance.substanceNotes}
                </div>
              )}
            </div>

            {/* SECTION 4: Clinical Action Plan & Referral */}
            <div className="mb-4">
              <div className="flex items-center justify-between bg-slate-800 text-white px-3 py-1 rounded-t text-xs font-bold uppercase tracking-wider">
                <div className="flex items-center gap-1.5">
                  <span className="bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded text-[10px] font-black mr-1">4</span>
                  Clinical Action Plan & Linkage
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  record.actionPlan.triageLevel.includes('Emergency')
                    ? 'bg-rose-500 text-white'
                    : record.actionPlan.triageLevel.includes('Urgent')
                    ? 'bg-amber-400 text-slate-950'
                    : 'bg-blue-600 text-white'
                }`}>
                  Triage: {record.actionPlan.triageLevel}
                </span>
              </div>
              <div className="border border-t-0 border-slate-300 p-3 bg-white grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Immediate Care Given:</span>
                  <ul className="list-disc list-inside text-slate-800 text-[11px] mt-0.5 space-y-0.5">
                    {record.actionPlan.immediateIntervention.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Referral Destination:</span>
                  <span className="font-bold text-blue-950 text-[11px] block mt-0.5">
                    {record.actionPlan.referralDestination || 'Dunwell Youth Priority Clinic'}
                  </span>
                  {record.actionPlan.followUpDate && (
                    <span className="text-[10px] text-slate-600 block mt-1">
                      Follow-up Date: <strong className="text-slate-900">{record.actionPlan.followUpDate}</strong>
                    </span>
                  )}
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Medications Dispensed:</span>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {record.actionPlan.medicationsDispensed && record.actionPlan.medicationsDispensed.length > 0 ? (
                      record.actionPlan.medicationsDispensed.map((med, i) => (
                        <span key={i} className="px-1.5 py-0.5 bg-slate-100 text-slate-800 rounded text-[10px] font-medium border border-slate-200">
                          {med}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-400 italic text-[10px]">None dispensed</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 5: Informed Consent Form with Verified Digital Signature */}
            <div className="border border-slate-300 rounded overflow-hidden mb-2">
              <div className="bg-blue-950 text-white px-3 py-1.5 text-xs font-bold uppercase tracking-wider flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                  <span>Informed Screening Consent & Digital Signature Record</span>
                </div>
                <span className="text-[10px] text-amber-300 font-mono">POPIA Act 4 of 2013</span>
              </div>

              <div className="p-3 bg-slate-50/80 text-[10px] text-slate-700 leading-relaxed border-b border-slate-200">
                <p>
                  I hereby give voluntary, informed consent to healthcare professionals from Dunwell Youth Priority Clinic and the City of Johannesburg to conduct primary health triage, vital signs measurement, and confidential HIV Testing Services (HTS). I acknowledge that my details are stored confidentially for clinical continuity and referral support.
                </p>
              </div>

              {/* Signature Box Layout */}
              <div className="p-3 bg-white grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Client Digital Signature Box */}
                <div className="border border-slate-300 rounded p-2.5 bg-slate-50/50 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                    <span className="font-bold uppercase text-slate-700">Client / Screened Person Signature:</span>
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Digitally Attested
                    </span>
                  </div>

                  <div className="h-20 bg-white rounded border border-slate-200 flex items-center justify-center p-1 my-1">
                    {record.consent?.clientSignatureDataUrl ? (
                      <img
                        src={record.consent.clientSignatureDataUrl}
                        alt="Client Signature"
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <span className="text-slate-400 italic text-xs">Signature on file</span>
                    )}
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-slate-600 pt-1 border-t border-slate-200">
                    <span>Name: <strong>{record.consent?.clientNamePrinted || record.personal.fullName}</strong></span>
                    <span>Date: <strong>{new Date(record.consent?.signedTimestamp || record.createdAt).toLocaleDateString('en-ZA')}</strong></span>
                  </div>
                </div>

                {/* Screener Attestation & Official Stamp */}
                <div className="border border-slate-300 rounded p-2.5 bg-slate-50/50 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                    <span className="font-bold uppercase text-slate-700">Authorized Healthcare Worker:</span>
                    <span className="text-blue-900 font-semibold">{record.consent?.screenerCadre || 'Outreach Healthcare Worker'}</span>
                  </div>

                  <div className="h-20 bg-white rounded border border-slate-200 flex items-center justify-around p-1 my-1">
                    {/* Official Stamp Vector */}
                    <div className="border-2 border-dashed border-blue-900/60 rounded-full p-2 text-center text-blue-900 transform -rotate-3 select-none">
                      <span className="text-[7px] font-black uppercase tracking-wider block">CITY OF JOHANNESBURG</span>
                      <span className="text-[9px] font-black uppercase block text-amber-600">OUTREACH VERIFIED</span>
                      <span className="text-[7px] block font-mono">DUNWELL CLINIC</span>
                    </div>

                    <div className="text-center">
                      <span className="font-serif italic text-blue-950 text-sm block">{record.screenerName}</span>
                      <span className="text-[9px] text-slate-500 block font-mono">Clinician Ref: #JHBOUT-88</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-slate-600 pt-1 border-t border-slate-200">
                    <span>Verified: <strong>{record.screenerName}</strong></span>
                    <span className="font-mono text-[9px] text-slate-500">Security Hash: {record.id.slice(0, 8)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* PDF Footer */}
            <div className="pt-2 border-t border-slate-300 flex items-center justify-between text-[9px] text-slate-500">
              <span>Dunwell Youth Priority Clinic • Executive Wellness & Health</span>
              <span>City of Johannesburg Metropolitan Municipality • Health Directorate</span>
              <span>Page 1 of 1 • Official Outreach Dossier</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
