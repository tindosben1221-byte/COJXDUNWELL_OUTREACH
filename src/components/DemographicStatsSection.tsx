import React, { useState } from 'react';
import {
  MapPin,
  Users,
  Calendar,
  Globe,
  Languages,
  ShieldCheck,
  HeartPulse,
  Flame,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  Activity,
} from 'lucide-react';

export interface AddressStatItem {
  address: string;
  total: number;
  pct: number;
  youth: number;
  youthPct: number;
  male: number;
  female: number;
  htsPos: number;
  substance: number;
  rehab: number;
  acute: number;
}

export interface GenderStatItem {
  gender: string;
  count: number;
  pct: number;
  avgAge: number;
  youthCount: number;
  youthPct: number;
  htsTestedPct: number;
  htsPos: number;
  substancePct: number;
  rehab: number;
  acute: number;
}

export interface AgeStatItem {
  key: string;
  label: string;
  desc: string;
  priority: string;
  count: number;
  pct: number;
  htsUptakePct: number;
  htsPos: number;
  substancePct: number;
  rehab: number;
  chronicPct: number;
  acute: number;
}

export interface RaceStatItem {
  race: string;
  count: number;
  pct: number;
  youthCount: number;
  htsPos: number;
  substancePct: number;
  highBp: number;
  rehab: number;
}

export interface NationalityStatItem {
  nationality: string;
  count: number;
  pct: number;
  undocumented: number;
  htsPos: number;
  substancePct: number;
  acute: number;
  isForeign: boolean;
}

export interface LanguageStatItem {
  language: string;
  count: number;
  pct: number;
  youth: number;
  htsDone: number;
  htsRate: number;
  consentCompliant: number;
}

interface DemographicStatsSectionProps {
  totalScreened: number;
  addressStatsTable: AddressStatItem[];
  genderStatsTable: GenderStatItem[];
  ageStatsTable: AgeStatItem[];
  raceStatsTable: RaceStatItem[];
  nationalityStatsTable: NationalityStatItem[];
  languageStatsTable: LanguageStatItem[];
}

export const DemographicStatsSection: React.FC<DemographicStatsSectionProps> = ({
  totalScreened,
  addressStatsTable,
  genderStatsTable,
  ageStatsTable,
  raceStatsTable,
  nationalityStatsTable,
  languageStatsTable,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'address' | 'gender_age' | 'race_nat' | 'language'>('all');

  return (
    <div className="space-y-4 pt-2">
      {/* Section Header & Sub-Navigation */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 bg-blue-900 text-white rounded-lg">
              <Activity className="w-4 h-4" />
            </div>
            <h3 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-tight">
              Demographic & Geospatial Intelligence Surveillance
            </h3>
            <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-2 py-0.5 rounded-full">
              LIVE EPIDEMIOLOGY
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Granular surveillance cross-tabulated across physical sleeping spots, gender, age cohorts, race, nationality, and home language
          </p>
        </div>

        {/* Tab Pills */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap ${
              activeTab === 'all'
                ? 'bg-blue-950 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Demographics (6)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('address')}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap ${
              activeTab === 'address'
                ? 'bg-blue-950 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MapPin className="w-3.5 h-3.5 text-amber-400" />
            <span>Physical Address / Spots</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('gender_age')}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap ${
              activeTab === 'gender_age'
                ? 'bg-blue-950 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-blue-400" />
            <span>Gender & Age</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('race_nat')}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap ${
              activeTab === 'race_nat'
                ? 'bg-blue-950 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            <span>Race & Nationality</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('language')}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap ${
              activeTab === 'language'
                ? 'bg-blue-950 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Languages className="w-3.5 h-3.5 text-amber-400" />
            <span>Home Languages</span>
          </button>
        </div>
      </div>

      {/* 1. PHYSICAL ADDRESS / STREET SLEEPING SPOTS TABLE */}
      {(activeTab === 'all' || activeTab === 'address') && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-amber-50 text-amber-700 rounded-lg">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase text-blue-950 tracking-wider">
                  Table 6: Physical Street Address & Homeless Sleeping Spots
                </h4>
                <p className="text-[11px] text-slate-500">
                  Exact street corners, park pavilions, bridge underpasses, and municipal shelters identified during intakes
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full border border-slate-200">
              {addressStatsTable.length} Sleeping Spots Tracked
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Physical Address / Sleeping Spot</th>
                  <th className="py-2.5 px-2 text-center">Screened</th>
                  <th className="py-2.5 px-2 text-center">% Cohort</th>
                  <th className="py-2.5 px-2 text-center">Youth (≤35y)</th>
                  <th className="py-2.5 px-2 text-center">Gender Split (M / F)</th>
                  <th className="py-2.5 px-2 text-center">HTS Pos (+)</th>
                  <th className="py-2.5 px-2 text-center">Substance %</th>
                  <th className="py-2.5 px-2 text-center">Rehab Need</th>
                  <th className="py-2.5 px-2 text-center">Acute Alerts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {addressStatsTable.map((item) => (
                  <tr key={item.address} className="hover:bg-slate-50/70 transition">
                    <td className="py-2.5 px-3">
                      <strong className="text-slate-900 block text-xs">{item.address}</strong>
                      <span className="text-[10px] text-slate-500">Johannesburg Inner-City Outreach</span>
                    </td>
                    <td className="py-2.5 px-2 text-center font-mono font-black text-blue-950 text-sm">
                      {item.total}
                    </td>
                    <td className="py-2.5 px-2 text-center font-mono text-slate-700 font-semibold">
                      <div className="flex items-center justify-center gap-1.5">
                        <span>{item.pct}%</span>
                        <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden hidden sm:block">
                          <div className="h-full bg-blue-900 rounded-full" style={{ width: `${item.pct}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-2 text-center font-mono font-bold text-amber-700">
                      {item.youth} <span className="text-[10px] text-slate-500 font-normal">({item.youthPct}%)</span>
                    </td>
                    <td className="py-2.5 px-2 text-center font-mono text-slate-700 font-medium">
                      <span className="text-blue-900 font-bold">{item.male}M</span>
                      <span className="text-slate-400 mx-1">/</span>
                      <span className="text-rose-700 font-bold">{item.female}F</span>
                    </td>
                    <td className="py-2.5 px-2 text-center font-mono font-black text-rose-700">
                      {item.htsPos > 0 ? (
                        <span className="bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full border border-rose-200">
                          {item.htsPos}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-normal">0</span>
                      )}
                    </td>
                    <td className="py-2.5 px-2 text-center font-mono font-bold text-amber-800">
                      {item.total ? Math.round((item.substance / item.total) * 100) : 0}%
                    </td>
                    <td className="py-2.5 px-2 text-center font-mono font-bold text-emerald-700">
                      {item.rehab}
                    </td>
                    <td className="py-2.5 px-2 text-center font-mono font-bold">
                      {item.acute > 0 ? (
                        <span className="bg-purple-50 text-purple-900 px-2 py-0.5 rounded-full border border-purple-200">
                          {item.acute}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-normal">0</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. GENDER & AGE BREAKDOWNS (Side by Side or stacked) */}
      {(activeTab === 'all' || activeTab === 'gender_age') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Table 7: Gender Staging Table */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-50 text-blue-900 rounded-lg">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase text-blue-950 tracking-wider">
                    Table 7: Gender Breakdown & Clinical Staging
                  </h4>
                  <p className="text-[11px] text-slate-500">Gender distribution, HTS uptake, and acute service needs</p>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-2.5">Gender Cohort</th>
                    <th className="py-2 px-2 text-center">Count</th>
                    <th className="py-2 px-2 text-center">% Total</th>
                    <th className="py-2 px-2 text-center">Avg Age</th>
                    <th className="py-2 px-2 text-center">Youth (≤35)</th>
                    <th className="py-2 px-2 text-center">HTS Pos</th>
                    <th className="py-2 px-2 text-center">Substance %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {genderStatsTable.map((g) => (
                    <tr key={g.gender} className="hover:bg-slate-50/70 transition">
                      <td className="py-2.5 px-2.5">
                        <strong className="text-slate-900 block text-xs">{g.gender}</strong>
                        <span className="text-[10px] text-slate-500">
                          HTS Uptake: {g.htsTestedPct}%
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono font-black text-blue-950 text-sm">
                        {g.count}
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono text-slate-700 font-semibold">
                        {g.pct}%
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono text-slate-800 font-bold">
                        {g.avgAge} yrs
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono text-amber-700 font-bold">
                        {g.youthCount} ({g.youthPct}%)
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono text-rose-700 font-bold">
                        {g.htsPos}
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono font-bold text-amber-800">
                        {g.substancePct}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Table 8: Age Cohorts & Life-Stage Staging Table */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-amber-50 text-amber-700 rounded-lg">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase text-blue-950 tracking-wider">
                    Table 8: Age Brackets (Dunwell Youth Staging)
                  </h4>
                  <p className="text-[11px] text-slate-500">Adolescents (18-24), Youth Core (25-35) vs Mature/Elderly</p>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-2.5">Age Bracket</th>
                    <th className="py-2 px-2 text-center">Screened</th>
                    <th className="py-2 px-2 text-center">% Total</th>
                    <th className="py-2 px-2 text-center">HTS Pos</th>
                    <th className="py-2 px-2 text-center">Substance %</th>
                    <th className="py-2 px-2 text-center">Chronic %</th>
                    <th className="py-2 px-2 text-center">Acute</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ageStatsTable.map((a) => (
                    <tr key={a.key} className="hover:bg-slate-50/70 transition">
                      <td className="py-2.5 px-2.5">
                        <strong className="text-slate-900 block text-xs">{a.label}</strong>
                        <span className="text-[10px] text-slate-500">{a.desc}</span>
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono font-black text-blue-950 text-sm">
                        {a.count}
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono text-slate-700 font-semibold">
                        {a.pct}%
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono text-rose-700 font-bold">
                        {a.htsPos}
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono text-amber-700 font-bold">
                        {a.substancePct}%
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono text-purple-900 font-bold">
                        {a.chronicPct}%
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono font-bold text-slate-800">
                        {a.acute}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. RACE & NATIONALITY BREAKDOWNS (Side by Side) */}
      {(activeTab === 'all' || activeTab === 'race_nat') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Table 9: Race / Population Group Staging */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase text-blue-950 tracking-wider">
                    Table 9: Race / Population Group Surveillance
                  </h4>
                  <p className="text-[11px] text-slate-500">Demographic cohorts and clinical risk prevalence</p>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-2.5">Population Group</th>
                    <th className="py-2 px-2 text-center">Screened</th>
                    <th className="py-2 px-2 text-center">% Total</th>
                    <th className="py-2 px-2 text-center">Youth (≤35)</th>
                    <th className="py-2 px-2 text-center">HTS Pos</th>
                    <th className="py-2 px-2 text-center">Substance %</th>
                    <th className="py-2 px-2 text-center">High BP (≥140)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {raceStatsTable.map((r) => (
                    <tr key={r.race} className="hover:bg-slate-50/70 transition">
                      <td className="py-2.5 px-2.5 font-bold text-slate-900">
                        {r.race}
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono font-black text-blue-950 text-sm">
                        {r.count}
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono text-slate-700 font-semibold">
                        {r.pct}%
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono text-amber-700 font-bold">
                        {r.youthCount}
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono text-rose-700 font-bold">
                        {r.htsPos}
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono text-amber-700 font-bold">
                        {r.substancePct}%
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono font-bold text-purple-900">
                        {r.highBp}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Table 10: Nationality & Documentation Breakdown */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-50 text-blue-900 rounded-lg">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase text-blue-950 tracking-wider">
                    Table 10: Nationality & Documentation Status
                  </h4>
                  <p className="text-[11px] text-slate-500">Citizenship, undocumented homeless, and foreign national clients</p>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-2.5">Nationality & Status</th>
                    <th className="py-2 px-2 text-center">Screened</th>
                    <th className="py-2 px-2 text-center">% Total</th>
                    <th className="py-2 px-2 text-center">Undocumented</th>
                    <th className="py-2 px-2 text-center">HTS Pos</th>
                    <th className="py-2 px-2 text-center">Substance %</th>
                    <th className="py-2 px-2 text-center">Acute Alerts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {nationalityStatsTable.map((n) => (
                    <tr key={n.nationality} className="hover:bg-slate-50/70 transition">
                      <td className="py-2.5 px-2.5">
                        <strong className="text-slate-900 block text-xs">{n.nationality}</strong>
                        <span className="text-[10px] text-slate-500">
                          {n.isForeign ? 'Foreign National' : 'Domestic Resident'}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono font-black text-blue-950 text-sm">
                        {n.count}
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono text-slate-700 font-semibold">
                        {n.pct}%
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono font-bold text-amber-700">
                        {n.undocumented}
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono text-rose-700 font-bold">
                        {n.htsPos}
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono text-amber-700 font-bold">
                        {n.substancePct}%
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono font-bold text-purple-900">
                        {n.acute}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. HOME LANGUAGE & COMMUNICATION BREAKDOWN TABLE */}
      {(activeTab === 'all' || activeTab === 'language') && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-amber-50 text-amber-700 rounded-lg">
                <Languages className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase text-blue-950 tracking-wider">
                  Table 11: Home Language & Primary Communication Breakdown
                </h4>
                <p className="text-[11px] text-slate-500">
                  Linguistic diversity across homeless community and informed consent briefing verification (POPIA)
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>100% Briefed in Client's Primary Language</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Primary Home Language</th>
                  <th className="py-2.5 px-2 text-center">Screened (N)</th>
                  <th className="py-2.5 px-2 text-center">% of Cohort</th>
                  <th className="py-2.5 px-2 text-center">Youth Share (≤35y)</th>
                  <th className="py-2.5 px-2 text-center">HTS Uptake Rate</th>
                  <th className="py-2.5 px-3">Consent Verification Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {languageStatsTable.map((l) => (
                  <tr key={l.language} className="hover:bg-slate-50/70 transition">
                    <td className="py-2.5 px-3 font-bold text-slate-900 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
                      <span>{l.language}</span>
                    </td>
                    <td className="py-2.5 px-2 text-center font-mono font-black text-blue-950 text-sm">
                      {l.count}
                    </td>
                    <td className="py-2.5 px-2 text-center font-mono text-slate-700 font-semibold">
                      <div className="flex items-center justify-center gap-1.5">
                        <span>{l.pct}%</span>
                        <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden hidden sm:block">
                          <div className="h-full bg-amber-500 rounded-full" style={{ width: `${l.pct}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-2 text-center font-mono font-bold text-amber-700">
                      {l.youth} ({l.count ? Math.round((l.youth / l.count) * 100) : 0}%)
                    </td>
                    <td className="py-2.5 px-2 text-center font-mono font-bold text-blue-900">
                      {l.htsRate}%
                    </td>
                    <td className="py-2.5 px-3 text-emerald-700 font-medium text-xs">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>All {l.consentCompliant} clients verbally briefed & consent signed</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
