import React from 'react';
import { X, ClipboardCheck, HeartPulse, Flame, FileSignature, CheckCircle2 } from 'lucide-react';

export const ProtocolGuideModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-300 w-full max-w-2xl rounded-2xl shadow-2xl p-6 text-slate-800 my-auto">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3.5 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">
                Dunwell & COJ Field Intake Protocol Reference
              </h3>
              <p className="text-xs text-slate-500">
                Standard operating procedures for mobile homelessness health screenings
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3.5 text-xs">
          <p className="text-slate-600 leading-relaxed font-medium">
            This tool strictly digitizes the outreach intake ledger used across Johannesburg inner-city locations (Hillbrow, Joubert Park, Braamfontein, Marshalltown, Selby):
          </p>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5">
            <h4 className="font-extrabold text-blue-900 uppercase text-[11px] flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center text-[10px] font-black">1</span>
              Section 1: Personal Details
            </h4>
            <p className="text-slate-600 leading-relaxed">
              Captures <strong>Full Name</strong>, <strong>Gender</strong>, <strong>DOB / Age</strong> (with automated Dunwell Youth Priority flag for ≤35 years), <strong>Nationality</strong> (ID verified or undocumented for Home Affairs linkage), <strong>Physical Address / Shelter</strong>, and <strong>Race</strong>.
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5">
            <h4 className="font-extrabold text-blue-900 uppercase text-[11px] flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center text-[10px] font-black">2</span>
              Section 2: Medical Screening & HTS
            </h4>
            <p className="text-slate-600 leading-relaxed">
              Evaluates <strong>Baseline Vitals</strong> (Blood pressure with staging, pulse, temperature, blood glucose, weight), <strong>Chronic Conditions</strong> (Hypertension, Diabetes, Asthma, TB, Epilepsy), and acute <strong>Present Complaints</strong> (e.g. <em>Injury</em>, <em>Difficult Breathing</em>, open lacerations, trench foot).
            </p>
            <p className="text-blue-900 font-bold mt-1">
              • HTS / HIV Screening: Status known (Y/N), Accept HIV Rapid Test (Y/N), Result (Reactive/Non-reactive), and On ART adherence verification.
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5">
            <h4 className="font-extrabold text-blue-900 uppercase text-[11px] flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center text-[10px] font-black">3</span>
              Section 3: Substance Use Screening
            </h4>
            <p className="text-slate-600 leading-relaxed">
              Evaluates <strong>Alcohol use & frequency</strong>, <strong>Drug use & frequency</strong>, and specific <strong>Types of Substance</strong> (Nyaope / Whoonga, Crystal Meth / Tik, Cannabis / Dagga, Glue / Inhalants, Mandrax), plus <strong>Interest in Rehab Support (Y/N)</strong> for direct transfer to SANCA or COJ social development facilities.
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5">
            <h4 className="font-extrabold text-blue-900 uppercase text-[11px] flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center text-[10px] font-black">4</span>
              Section 4: Informed Consent & Digital Signature
            </h4>
            <p className="text-slate-600 leading-relaxed">
              Captures legally valid client electronic signature via touch screen, stylus, or adopted legal name in full screen, embedded straight into the printable/downloadable medical card.
            </p>
          </div>
        </div>

        <div className="mt-5 pt-3.5 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow transition"
          >
            Understood & Close
          </button>
        </div>
      </div>
    </div>
  );
};
