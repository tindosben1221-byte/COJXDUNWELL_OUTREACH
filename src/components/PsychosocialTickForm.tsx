import React from 'react';
import {
  PsychosocialSymptoms,
  PsychosocialScreening,
  PsychosocialDistressLevel,
} from '../types';
import {
  PSYCHOSOCIAL_SYMPTOM_ITEMS,
  DEFAULT_PSYCHOSOCIAL_SYMPTOMS,
  calculatePsychosocialAnalysis,
} from '../utils/psychosocial';
import {
  Brain,
  CheckSquare,
  Square,
  AlertTriangle,
  HeartHandshake,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  FileText,
  HelpCircle,
  RotateCcw,
  Zap,
} from 'lucide-react';

interface PsychosocialTickFormProps {
  value: PsychosocialScreening;
  onChange: (updated: PsychosocialScreening) => void;
  clientName?: string;
  readOnly?: boolean;
}

export const PsychosocialTickForm: React.FC<PsychosocialTickFormProps> = ({
  value,
  onChange,
  clientName = 'Client',
  readOnly = false,
}) => {
  const { symptoms, analysis, counselingAccepted, socialWorkerReferral, safetyPlanInitiated, screenerNotes } = value;

  const handleToggleSymptom = (key: keyof PsychosocialSymptoms) => {
    if (readOnly) return;
    const nextSymptoms: PsychosocialSymptoms = {
      ...symptoms,
      [key]: !symptoms[key],
    };
    const nextAnalysis = calculatePsychosocialAnalysis(nextSymptoms);

    // If suicide or psychosis ticked, auto-flag safety plan if not set
    const shouldAutoSafety = nextSymptoms.suicidalIdeation || nextSymptoms.hallucinationsOrParanoia;

    onChange({
      ...value,
      symptoms: nextSymptoms,
      analysis: nextAnalysis,
      safetyPlanInitiated: shouldAutoSafety ? true : safetyPlanInitiated,
      socialWorkerReferral: nextAnalysis.distressLevel !== 'Mild / Minimal' ? true : socialWorkerReferral,
    });
  };

  const handleApplyPreset = (preset: 'minimal' | 'moderate' | 'trauma' | 'crisis') => {
    if (readOnly) return;
    let next: PsychosocialSymptoms = { ...DEFAULT_PSYCHOSOCIAL_SYMPTOMS };
    if (preset === 'minimal') {
      next = { ...DEFAULT_PSYCHOSOCIAL_SYMPTOMS };
    } else if (preset === 'moderate') {
      next = {
        ...DEFAULT_PSYCHOSOCIAL_SYMPTOMS,
        anxiety: true,
        sleepDisturbance: true,
        extremeIsolation: true,
      };
    } else if (preset === 'trauma') {
      next = {
        ...DEFAULT_PSYCHOSOCIAL_SYMPTOMS,
        depressedMood: true,
        anhedonia: true,
        anxiety: true,
        sleepDisturbance: true,
        traumaFlashbacks: true,
        recentGbvOrAssault: true,
      };
    } else if (preset === 'crisis') {
      next = {
        ...DEFAULT_PSYCHOSOCIAL_SYMPTOMS,
        depressedMood: true,
        anxiety: true,
        sleepDisturbance: true,
        appetiteLoss: true,
        traumaFlashbacks: true,
        suicidalIdeation: true,
        extremeIsolation: true,
      };
    }

    const nextAnalysis = calculatePsychosocialAnalysis(next);
    onChange({
      ...value,
      symptoms: next,
      analysis: nextAnalysis,
      safetyPlanInitiated: next.suicidalIdeation || next.hallucinationsOrParanoia,
      socialWorkerReferral: nextAnalysis.distressLevel !== 'Mild / Minimal',
      counselingAccepted: true,
    });
  };

  const getDistressBadgeColor = (level: PsychosocialDistressLevel) => {
    switch (level) {
      case 'Severe Crisis':
        return 'bg-rose-600 text-white border-rose-700';
      case 'High':
        return 'bg-amber-500 text-slate-950 border-amber-600 font-black';
      case 'Moderate':
        return 'bg-blue-600 text-white border-blue-700';
      case 'Mild / Minimal':
      default:
        return 'bg-emerald-600 text-white border-emerald-700';
    }
  };

  const categories = [
    { title: 'Mood & Affect', keys: ['depressedMood', 'anhedonia'] },
    { title: 'Anxiety & Somatic Distress', keys: ['anxiety', 'panicSymptoms', 'sleepDisturbance', 'appetiteLoss'] },
    { title: 'Trauma & Life Hardship', keys: ['traumaFlashbacks', 'recentGbvOrAssault'] },
    { title: 'Social & Cognitive Function', keys: ['extremeIsolation', 'cognitiveConfusion'] },
    { title: '⚠️ Critical Safety & Psychiatric Risk (Red Flags)', keys: ['suicidalIdeation', 'hallucinationsOrParanoia'] },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-indigo-950 via-blue-900 to-slate-900 text-white p-5 rounded-2xl border border-indigo-800 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider">
                Standardized Psychosocial Tick Form
              </span>
              <span className="text-xs text-indigo-200">
                Patient: <strong className="text-white">{clientName}</strong>
              </span>
              <span className="text-[10px] bg-indigo-800 text-indigo-100 px-2 py-0.5 rounded font-mono">
                SRQ-10 / PHQ-4 Adapted
              </span>
            </div>
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Brain className="w-5 h-5 text-amber-400" />
              Psychosocial & Mental Health Screening Checklist
            </h3>
            <p className="text-xs text-indigo-200 max-w-2xl">
              Tick observed or client-reported symptoms during the past 2–4 weeks. The engine computes real-time severity scoring, risk analysis, and automated clinical referral pathways.
            </p>
          </div>

          {/* Quick Presets */}
          {!readOnly && (
            <div className="flex flex-wrap gap-1.5 self-start md:self-auto">
              <span className="text-[10px] text-indigo-300 font-bold uppercase w-full">Quick Clinical Presets:</span>
              <button
                type="button"
                onClick={() => handleApplyPreset('minimal')}
                className="px-2.5 py-1 rounded-lg bg-indigo-900 hover:bg-indigo-800 text-white text-[11px] font-bold border border-indigo-700 transition"
              >
                Stable / Mild
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('moderate')}
                className="px-2.5 py-1 rounded-lg bg-blue-800 hover:bg-blue-700 text-white text-[11px] font-bold border border-blue-600 transition"
              >
                Moderate Street Anxiety
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('trauma')}
                className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 text-[11px] font-black border border-amber-500 transition"
              >
                High Trauma / GBV
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('crisis')}
                className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-black border border-rose-500 transition flex items-center gap-1"
              >
                <AlertTriangle className="w-3 h-3 text-amber-300" /> Critical Crisis
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid: Tick Form on Left / Top, Live Analysis on Right / Bottom */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left / Main: The Tick Form Checkboxes */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <CheckSquare className="w-4 h-4 text-blue-800" />
              Tick Observed / Reported Symptoms (Past 2–4 Weeks)
            </span>
            {!readOnly && (
              <button
                type="button"
                onClick={() => handleApplyPreset('minimal')}
                className="text-[11px] text-slate-500 hover:text-slate-900 flex items-center gap-1 font-semibold"
              >
                <RotateCcw className="w-3 h-3" /> Reset Checks
              </button>
            )}
          </div>

          <div className="space-y-4">
            {categories.map((cat) => {
              const items = PSYCHOSOCIAL_SYMPTOM_ITEMS.filter((i) => cat.keys.includes(i.key));
              const isRedFlagGroup = cat.title.includes('Red Flags');

              return (
                <div
                  key={cat.title}
                  className={`p-4 rounded-2xl border transition ${
                    isRedFlagGroup
                      ? 'bg-rose-50/70 border-rose-300 shadow-sm'
                      : 'bg-white border-slate-300 shadow-sm'
                  }`}
                >
                  <h4
                    className={`text-xs font-black uppercase tracking-wide mb-3 flex items-center gap-1.5 ${
                      isRedFlagGroup ? 'text-rose-900' : 'text-slate-800'
                    }`}
                  >
                    {isRedFlagGroup && <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />}
                    <span>{cat.title}</span>
                  </h4>

                  <div className="space-y-2.5">
                    {items.map((item) => {
                      const isChecked = !!symptoms[item.key];
                      return (
                        <div
                          key={item.key}
                          onClick={() => handleToggleSymptom(item.key)}
                          className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                            isChecked
                              ? item.isRedFlag
                                ? 'bg-rose-100/80 border-rose-500 text-rose-950 font-bold shadow-sm'
                                : 'bg-blue-50 border-blue-600 text-blue-950 font-bold shadow-sm'
                              : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          <div className="mt-0.5 shrink-0">
                            {isChecked ? (
                              <CheckSquare
                                className={`w-5 h-5 ${
                                  item.isRedFlag ? 'text-rose-600' : 'text-blue-700'
                                }`}
                              />
                            ) : (
                              <Square className="w-5 h-5 text-slate-400" />
                            )}
                          </div>
                          <div className="space-y-0.5 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className={`text-xs font-black ${isChecked ? 'text-slate-950' : 'text-slate-800'}`}>
                                {item.label}
                              </span>
                              {item.isRedFlag && (
                                <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-rose-200 text-rose-900 border border-rose-400">
                                  Critical Red Flag
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-600 leading-snug font-normal">
                              {item.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right / Side: Real-Time Scoring, Automated Clinical Analysis & Action Plan */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-xl space-y-4 sticky top-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-400" />
                Live Automated Analysis & Results
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Real-time Engine</span>
            </div>

            {/* Score & Distress Level Meter */}
            <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Screening Tally Score</span>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-3xl font-black text-white">{analysis.score}</span>
                    <span className="text-xs text-slate-400 font-semibold">/ 12 symptoms</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Distress Severity</span>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wide border ${getDistressBadgeColor(
                      analysis.distressLevel
                    )}`}
                  >
                    {analysis.distressLevel}
                  </span>
                </div>
              </div>

              {/* Visual Progress Bar */}
              <div className="space-y-1">
                <div className="w-full bg-slate-700 h-2.5 rounded-full overflow-hidden flex">
                  <div
                    className={`h-full transition-all duration-300 ${
                      analysis.distressLevel === 'Severe Crisis'
                        ? 'bg-rose-500'
                        : analysis.distressLevel === 'High'
                        ? 'bg-amber-400'
                        : analysis.distressLevel === 'Moderate'
                        ? 'bg-blue-500'
                        : 'bg-emerald-400'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(5, (analysis.score / 12) * 100))}%` }}
                  />
                </div>
                <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                  <span>0 (Stable)</span>
                  <span>3 (Moderate)</span>
                  <span>6 (High)</span>
                  <span>9+ (Severe)</span>
                </div>
              </div>
            </div>

            {/* Red Flag Warning Box if Crisis */}
            {analysis.crisisAlert && (
              <div className="bg-rose-950/90 border-2 border-rose-500 p-3.5 rounded-xl text-rose-100 text-xs space-y-1 animate-pulse">
                <div className="flex items-center gap-2 font-black text-rose-300 uppercase tracking-wider text-[11px]">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  <span>CRITICAL CRISIS ALERT: Immediate Safety Protocol Triggered</span>
                </div>
                <p className="text-[11px] text-rose-200">
                  Client has endorsed active suicidal ideation or severe acute psychotic/hallucinatory distress. Immediate non-punitive crisis de-escalation and clinical safety escort required.
                </p>
              </div>
            )}

            {/* Identified Clinical Domains */}
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Identified Symptom Clusters:</span>
              <div className="flex flex-wrap gap-1.5">
                {analysis.identifiedDomains.map((domain) => (
                  <span
                    key={domain}
                    className={`text-[11px] px-2 py-0.5 rounded-md font-bold ${
                      domain.includes('CRITICAL') || domain.includes('⚠️')
                        ? 'bg-rose-900/90 text-rose-200 border border-rose-700'
                        : 'bg-slate-800 text-blue-200 border border-slate-700'
                    }`}
                  >
                    {domain}
                  </span>
                ))}
              </div>
            </div>

            {/* Clinical Impression */}
            <div className="space-y-1 bg-slate-800/50 p-3 rounded-xl border border-slate-700/80 text-xs">
              <span className="text-[10px] uppercase font-bold text-amber-300 block flex items-center gap-1">
                <FileText className="w-3 h-3 text-amber-400" />
                Automated Clinical Impression:
              </span>
              <p className="text-slate-200 text-xs leading-relaxed">{analysis.clinicalImpression}</p>
            </div>

            {/* Actionable Referral & Clinical Pathway */}
            <div className="space-y-1 bg-indigo-950/60 p-3.5 rounded-xl border border-indigo-800/80 text-xs">
              <span className="text-[10px] uppercase font-bold text-indigo-300 block flex items-center gap-1">
                <HeartHandshake className="w-3.5 h-3.5 text-indigo-400" />
                Recommended Clinical Action Plan:
              </span>
              <p className="text-indigo-100 text-xs font-medium leading-relaxed">{analysis.recommendedAction}</p>
            </div>

            {/* Screener Care Action Checkboxes */}
            <div className="pt-3 border-t border-slate-800 space-y-2.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Outreach Mental Health Action Taken:
              </span>

              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-200">
                <input
                  type="checkbox"
                  disabled={readOnly}
                  checked={counselingAccepted}
                  onChange={(e) => onChange({ ...value, counselingAccepted: e.target.checked })}
                  className="rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-600 w-4 h-4"
                />
                <span className="font-semibold">Client receptive & accepted counseling referral</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-200">
                <input
                  type="checkbox"
                  disabled={readOnly}
                  checked={socialWorkerReferral}
                  onChange={(e) => onChange({ ...value, socialWorkerReferral: e.target.checked })}
                  className="rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-600 w-4 h-4"
                />
                <span className="font-semibold">Referred to Dunwell Clinic Social Worker / Case Manager</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-200">
                <input
                  type="checkbox"
                  disabled={readOnly}
                  checked={safetyPlanInitiated}
                  onChange={(e) => onChange({ ...value, safetyPlanInitiated: e.target.checked })}
                  className="rounded border-slate-600 bg-slate-800 text-rose-500 focus:ring-rose-600 w-4 h-4"
                />
                <span className={`font-semibold ${safetyPlanInitiated ? 'text-amber-300' : ''}`}>
                  Immediate Suicide / Violence Safety Plan completed on site
                </span>
              </label>
            </div>

            {/* Screener Mental Health Qualitative Notes */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-400 block">
                Screener Qualitative Mental Health Notes:
              </label>
              <textarea
                rows={2}
                disabled={readOnly}
                value={screenerNotes || ''}
                onChange={(e) => onChange({ ...value, screenerNotes: e.target.value })}
                placeholder="Observed affect, eye contact, speech rate, street vulnerability factors, family contacts..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
