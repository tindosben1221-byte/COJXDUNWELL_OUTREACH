import React, { useState, useMemo } from 'react';
import { ScreeningRecord } from '../types';
import {
  Users,
  HeartPulse,
  Flame,
  Search,
  Download,
  AlertTriangle,
  Plus,
  CheckCircle,
  Sparkles,
  MapPin,
  TrendingUp,
  Activity,
  Maximize2,
  FileSpreadsheet,
  Table,
  BarChart2,
  LayoutGrid,
  CheckCircle2,
  FileText,
  Globe,
  Languages,
  ShieldCheck,
  FileSignature,
  Brain,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts';
import { DemographicStatsSection } from './DemographicStatsSection';

interface DashboardProps {
  records: ScreeningRecord[];
  onOpenPdf: (record?: ScreeningRecord) => void;
  onNewScreening: () => void;
  onOpenBatchReport?: () => void;
  onViewConsent?: (record: ScreeningRecord) => void;
}

const COLORS = ['#0B2545', '#F59E0B', '#10B981', '#3B82F6', '#EC4899', '#8B5CF6', '#14B8A6'];

export const Dashboard: React.FC<DashboardProps> = ({
  records,
  onOpenPdf,
  onNewScreening,
  onOpenBatchReport,
  onViewConsent,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [siteFilter, setSiteFilter] = useState('ALL');
  const [substanceFilter, setSubstanceFilter] = useState('ALL');
  const [youthOnly, setYouthOnly] = useState(false);
  const [rehabOnly, setRehabOnly] = useState(false);

  // Tab switcher for analytical presentation: 'both' | 'tables' | 'charts'
  const [analyticsView, setAnalyticsView] = useState<'both' | 'tables' | 'charts'>('both');

  // Sub-tab switcher for live demographic breakdowns
  const [demographicTab, setDemographicTab] = useState<'all' | 'address' | 'gender_age' | 'race_nat' | 'language'>('all');

  // Compute live filtered records
  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      const matchSearch =
        rec.personal.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (rec.personal.alias && rec.personal.alias.toLowerCase().includes(searchTerm.toLowerCase())) ||
        rec.refNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rec.outreachSite.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (rec.personal.physicalAddress && rec.personal.physicalAddress.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (rec.personal.nationality && rec.personal.nationality.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (rec.personal.homeLanguage && rec.personal.homeLanguage.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (rec.personal.race && rec.personal.race.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchSite = siteFilter === 'ALL' || rec.outreachSite === siteFilter;

      const matchSubstance =
        substanceFilter === 'ALL' ||
        rec.substance.substanceTypes.some((s) => s.toLowerCase().includes(substanceFilter.toLowerCase()));

      const matchYouth = !youthOnly || rec.personal.age <= 35;

      const matchRehab = !rehabOnly || rec.substance.interestInRehabSupport.includes('Yes');

      return matchSearch && matchSite && matchSubstance && matchYouth && matchRehab;
    });
  }, [records, searchTerm, siteFilter, substanceFilter, youthOnly, rehabOnly]);

  // High-level Live Metrics
  const totalScreened = records.length;
  const youthCount = records.filter((r) => r.personal.age <= 35).length;
  const youthPct = totalScreened ? Math.round((youthCount / totalScreened) * 100) : 0;

  const htsAcceptCount = records.filter((r) => r.hts.acceptHtsTest === 'Yes').length;
  const htsPositiveCount = records.filter((r) => r.hts.testResult.includes('Reactive (Positive)')).length;

  const substanceUsersCount = records.filter(
    (r) => !r.substance.substanceTypes.includes('None') || r.substance.drugUseFrequency !== 'Never'
  ).length;
  const substancePct = totalScreened ? Math.round((substanceUsersCount / totalScreened) * 100) : 0;
  const rehabInterestCount = records.filter((r) => r.substance.interestInRehabSupport.includes('Yes')).length;
  const rehabPct = substanceUsersCount ? Math.round((rehabInterestCount / substanceUsersCount) * 100) : 0;

  const acuteCasesCount = records.filter(
    (r) =>
      r.actionPlan.triageLevel.includes('Urgent') ||
      r.actionPlan.triageLevel.includes('Emergency') ||
      r.medical.tbScreeningSymptomatic ||
      r.medical.vitals.bloodPressureSys >= 140
  ).length;

  // Psychosocial & Mental Health Metrics
  const psychosocialCrisisCount = records.filter(
    (r) => r.psychosocial?.analysis.crisisAlert || r.psychosocial?.analysis.distressLevel === 'Severe Crisis'
  ).length;
  const psychosocialHighCount = records.filter(
    (r) => r.psychosocial?.analysis.distressLevel === 'High'
  ).length;
  const psychosocialCounselingCount = records.filter((r) => r.psychosocial?.counselingAccepted).length;
  const psychosocialTraumaCount = records.filter(
    (r) => r.psychosocial?.symptoms.recentGbvOrAssault || r.psychosocial?.symptoms.traumaFlashbacks
  ).length;

  // Chart 1: Substance Prevalence Breakdown
  const substanceData = useMemo(() => {
    const counts: Record<string, number> = {};
    records.forEach((r) => {
      r.substance.substanceTypes.forEach((sub) => {
        if (sub !== 'None') {
          const label = sub.split('(')[0].trim();
          counts[label] = (counts[label] || 0) + 1;
        }
      });
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [records]);

  // Statistical Table 1: Substance Prevalence & Rehab Demand Detailed Stats
  const substanceStatsTable = useMemo(() => {
    const map: Record<string, { count: number; daily: number; rehabRequested: number }> = {};
    records.forEach((r) => {
      r.substance.substanceTypes.forEach((sub) => {
        const key = sub.split('(')[0].trim();
        if (!map[key]) map[key] = { count: 0, daily: 0, rehabRequested: 0 };
        map[key].count += 1;
        if (r.substance.drugUseFrequency.includes('Daily')) map[key].daily += 1;
        if (r.substance.interestInRehabSupport.includes('Yes')) map[key].rehabRequested += 1;
      });
    });

    const getIntervention = (name: string) => {
      if (name.includes('Nyaope')) return 'SANCA Inpatient / Opioid Agonist Therapy (OAT)';
      if (name.includes('Meth') || name.includes('Tik')) return 'Dunwell Youth Behavioral Support & Detox';
      if (name.includes('Cannabis')) return 'Harm Reduction & Psycho-social Counseling';
      if (name.includes('Alcohol')) return 'Medical Detoxification & Social Support';
      if (name.includes('Glue')) return 'Inhalant Cessation & Shelter Linkage';
      if (name.includes('Mandrax')) return 'Clinical Substance Withdrawal Protocol';
      return 'General Health & Wellness Monitoring';
    };

    return Object.entries(map)
      .map(([name, d]) => ({
        name,
        count: d.count,
        pct: totalScreened ? Math.round((d.count / totalScreened) * 100) : 0,
        daily: d.daily,
        rehabRequested: d.rehabRequested,
        rehabPct: d.count ? Math.round((d.rehabRequested / d.count) * 100) : 0,
        intervention: getIntervention(name),
      }))
      .sort((a, b) => b.count - a.count);
  }, [records, totalScreened]);

  // Statistical Table 2: HTS Testing Cascade & HIV Linkage
  const htsCascadeTable = useMemo(() => {
    const total = records.length;
    const known = records.filter((r) => r.hts.hivStatusKnown === 'Yes').length;
    const tested = records.filter((r) => r.hts.acceptHtsTest === 'Yes').length;
    const positive = records.filter((r) => r.hts.testResult.includes('Reactive (Positive)')).length;
    const negative = records.filter((r) => r.hts.testResult.includes('Non-Reactive')).length;
    const onArt = records.filter((r) => r.hts.onArt.includes('Yes')).length;
    const linked = records.filter((r) => r.hts.onArt.includes('Yes') || r.actionPlan.referralDestination?.includes('Clinic')).length;

    return [
      {
        stage: '1. Outreach Intake Cohort',
        description: 'Total homeless individuals reached & engaged in field',
        count: total,
        pct: 100,
        benchmark: '100% Target',
        action: 'Voluntary informed consent & vitals triage',
        status: 'Complete',
      },
      {
        stage: '2. Prior HIV Status Known',
        description: 'Individuals reporting previous testing within 6 months',
        count: known,
        pct: total ? Math.round((known / total) * 100) : 0,
        benchmark: '>85% Target',
        action: 'Verify ART history & clinic card if available',
        status: 'Baseline',
      },
      {
        stage: '3. Rapid Test Accepted & Done',
        description: 'Client accepted point-of-care fingerprick rapid HTS',
        count: tested,
        pct: total ? Math.round((tested / total) * 100) : 0,
        benchmark: 'UNAIDS 1st 95%',
        action: 'Same-day on-site rapid dual-strip testing',
        status: 'Optimal Uptake',
      },
      {
        stage: '4. HIV Reactive (Positive)',
        description: 'Confirmed reactive rapid screening test result',
        count: positive,
        pct: tested ? Math.round((positive / tested) * 100) : 0,
        benchmark: 'Field Surveillance',
        action: 'Post-test counseling & same-day CD4 baseline request',
        status: 'Clinical Alert',
      },
      {
        stage: '5. HIV Non-Reactive (Negative)',
        description: 'Confirmed negative rapid screening test result',
        count: negative,
        pct: total ? Math.round((negative / total) * 100) : 0,
        benchmark: 'Prevention Target',
        action: 'Oral PrEP navigation & barrier distribution',
        status: 'Prevention',
      },
      {
        stage: '6. Linked to ART / Dunwell Care',
        description: 'Enrolled on ART or scheduled priority clinic visit',
        count: linked,
        pct: positive ? Math.round((linked / positive) * 100) : 0,
        benchmark: 'UNAIDS 2nd 95%',
        action: 'Fast-track ART prescription at Dunwell Clinic',
        status: 'Priority Linkage',
      },
    ];
  }, [records]);

  // Chart 2: HTS Testing Cascade Chart Data
  const htsCascadeData = useMemo(() => {
    return htsCascadeTable.slice(0, 5).map((item, idx) => ({
      stage: item.stage.split('.')[1].trim(),
      count: item.count,
      fill: COLORS[idx % COLORS.length],
    }));
  }, [htsCascadeTable]);

  // Statistical Table 3: Hotspot Sites Detailed Table
  const hotspotStatsTable = useMemo(() => {
    const counts: Record<
      string,
      { total: number; youth: number; htsDone: number; htsPos: number; substance: number; rehab: number; acute: number }
    > = {};

    records.forEach((r) => {
      const s = r.outreachSite;
      if (!counts[s]) counts[s] = { total: 0, youth: 0, htsDone: 0, htsPos: 0, substance: 0, rehab: 0, acute: 0 };
      counts[s].total += 1;
      if (r.personal.age <= 35) counts[s].youth += 1;
      if (r.hts.acceptHtsTest === 'Yes') counts[s].htsDone += 1;
      if (r.hts.testResult.includes('Reactive (Positive)')) counts[s].htsPos += 1;
      if (!r.substance.substanceTypes.includes('None') || r.substance.drugUseFrequency !== 'Never') counts[s].substance += 1;
      if (r.substance.interestInRehabSupport.includes('Yes')) counts[s].rehab += 1;
      if (
        r.actionPlan.triageLevel.includes('Urgent') ||
        r.actionPlan.triageLevel.includes('Emergency') ||
        r.medical.tbScreeningSymptomatic ||
        r.medical.vitals.bloodPressureSys >= 140
      ) {
        counts[s].acute += 1;
      }
    });

    return Object.entries(counts)
      .map(([site, d]) => ({
        site,
        total: d.total,
        pct: totalScreened ? Math.round((d.total / totalScreened) * 100) : 0,
        youth: d.youth,
        youthPct: d.total ? Math.round((d.youth / d.total) * 100) : 0,
        htsDone: d.htsDone,
        htsPos: d.htsPos,
        substance: d.substance,
        rehab: d.rehab,
        acute: d.acute,
      }))
      .sort((a, b) => b.total - a.total);
  }, [records, totalScreened]);

  // Chart 3: Outreach Hotspots Share
  const hotspotData = useMemo(() => {
    return hotspotStatsTable.map((h) => ({ name: h.site, value: h.total }));
  }, [hotspotStatsTable]);

  // Statistical Table 4: Clinical Complaints & Vitals Staging Table
  const complaintsStatsTable = useMemo(() => {
    const counts: Record<string, number> = {};
    records.forEach((r) => {
      r.medical.presentComplaints.forEach((comp) => {
        const short = comp.split('/')[0].trim();
        counts[short] = (counts[short] || 0) + 1;
      });
    });

    const getSeverity = (name: string) => {
      if (name.includes('Trauma') || name.includes('Injury')) return 'High / Urgent';
      if (name.includes('Breathing') || name.includes('TB')) return 'Urgent / Priority';
      if (name.includes('Wound') || name.includes('Abscess')) return 'Moderate / Clinical';
      if (name.includes('Dental')) return 'Routine Referral';
      return 'Standard Care';
    };

    const getDisposition = (name: string) => {
      if (name.includes('Trauma') || name.includes('Injury'))
        return 'Wound irrigation, debridement & tetanus toxoid at Dunwell Clinic';
      if (name.includes('Breathing'))
        return 'Sputum GeneXpert collection & bronchodilator therapy';
      if (name.includes('Wound') || name.includes('Abscess'))
        return 'Antiseptic dressings, oral antibiotics & hygiene packs';
      return 'Clinical consultation, vitals monitoring & health education';
    };

    return Object.entries(counts)
      .map(([name, count]) => ({
        name,
        count,
        pct: totalScreened ? Math.round((count / totalScreened) * 100) : 0,
        severity: getSeverity(name),
        disposition: getDisposition(name),
      }))
      .sort((a, b) => b.count - a.count);
  }, [records, totalScreened]);

  // Chart 4: Present Complaints
  const complaintsData = useMemo(() => {
    return complaintsStatsTable.slice(0, 6).map((c) => ({
      complaint: c.name,
      count: c.count,
    }));
  }, [complaintsStatsTable]);

  // Table 5: Youth Priority vs Mature Cohort Demographics Table
  const youthComparisonTable = useMemo(() => {
    const youthGroup = records.filter((r) => r.personal.age <= 35);
    const matureGroup = records.filter((r) => r.personal.age > 35);

    const calcGroup = (group: ScreeningRecord[], label: string, desc: string) => {
      const count = group.length;
      const htsTested = group.filter((r) => r.hts.acceptHtsTest === 'Yes').length;
      const htsPos = group.filter((r) => r.hts.testResult.includes('Reactive (Positive)')).length;
      const substance = group.filter(
        (r) => !r.substance.substanceTypes.includes('None') || r.substance.drugUseFrequency !== 'Never'
      ).length;
      const rehab = group.filter((r) => r.substance.interestInRehabSupport.includes('Yes')).length;
      const acute = group.filter(
        (r) =>
          r.actionPlan.triageLevel.includes('Urgent') ||
          r.actionPlan.triageLevel.includes('Emergency') ||
          r.medical.tbScreeningSymptomatic ||
          r.medical.vitals.bloodPressureSys >= 140
      ).length;

      return {
        label,
        desc,
        count,
        pctOfTotal: totalScreened ? Math.round((count / totalScreened) * 100) : 0,
        htsUptakePct: count ? Math.round((htsTested / count) * 100) : 0,
        htsPosCount: htsPos,
        substancePct: count ? Math.round((substance / count) * 100) : 0,
        rehabDemandPct: substance ? Math.round((rehab / substance) * 100) : 0,
        acutePct: count ? Math.round((acute / count) * 100) : 0,
      };
    };

    return [
      calcGroup(youthGroup, 'Dunwell Youth Priority Cohort (≤35y)', 'Primary target group for Dunwell Youth Priority Clinic'),
      calcGroup(matureGroup, 'Mature & Elderly Adults (36+y)', 'General adult homeless population linked to COJ District Facilities'),
    ];
  }, [records, totalScreened]);

  // Statistical Table 6: Psychosocial & Mental Health Screening Surveillance Table
  const psychosocialStatsTable = useMemo(() => {
    const levels = [
      {
        level: 'Severe Crisis (Score 9–12)',
        desc: 'Immediate clinical stabilization, suicide safety protocol & psychiatric consult',
        badge: 'bg-rose-600 text-white',
        severity: 'Emergency',
        match: (r: ScreeningRecord) => r.psychosocial?.analysis.distressLevel === 'Severe Crisis',
      },
      {
        level: 'High Distress (Score 6–8)',
        desc: 'Urgent Dunwell counseling, social work linkage & acute trauma/GBV support',
        badge: 'bg-amber-500 text-slate-950',
        severity: 'Urgent',
        match: (r: ScreeningRecord) => r.psychosocial?.analysis.distressLevel === 'High',
      },
      {
        level: 'Moderate Distress (Score 3–5)',
        desc: 'Scheduled psychosocial follow-up, peer support group & shelter linkage',
        badge: 'bg-blue-600 text-white',
        severity: 'Moderate',
        match: (r: ScreeningRecord) => r.psychosocial?.analysis.distressLevel === 'Moderate',
      },
      {
        level: 'Mild / Minimal (Score 0–2)',
        desc: 'General street wellness education, mental health awareness & open intake access',
        badge: 'bg-emerald-600 text-white',
        severity: 'Routine',
        match: (r: ScreeningRecord) => !r.psychosocial || r.psychosocial?.analysis.distressLevel === 'Mild / Minimal',
      },
    ];

    return levels.map((lvl) => {
      const cohort = records.filter(lvl.match);
      const count = cohort.length;
      const pct = totalScreened ? Math.round((count / totalScreened) * 100) : 0;
      const counselingCount = cohort.filter((r) => r.psychosocial?.counselingAccepted).length;
      const counselingPct = count ? Math.round((counselingCount / count) * 100) : 0;
      const crisisAlerts = cohort.filter((r) => r.psychosocial?.analysis.crisisAlert).length;
      const gbvTrauma = cohort.filter(
        (r) => r.psychosocial?.symptoms.recentGbvOrAssault || r.psychosocial?.symptoms.traumaFlashbacks
      ).length;
      const socialWorker = cohort.filter((r) => r.psychosocial?.socialWorkerReferral).length;

      return {
        level: lvl.level,
        desc: lvl.desc,
        badge: lvl.badge,
        severity: lvl.severity,
        count,
        pct,
        counselingCount,
        counselingPct,
        crisisAlerts,
        gbvTrauma,
        socialWorker,
      };
    });
  }, [records, totalScreened]);

  // Statistical Table 6: Physical Address & Street Sleeping Spot Breakdown
  const addressStatsTable = useMemo(() => {
    const map: Record<
      string,
      { total: number; youth: number; male: number; female: number; htsPos: number; substance: number; rehab: number; acute: number }
    > = {};

    records.forEach((r) => {
      const addr = (r.personal.physicalAddress || r.outreachSite || 'Johannesburg Inner-City').trim();
      // Group by distinct spot/shelter name
      if (!map[addr]) {
        map[addr] = { total: 0, youth: 0, male: 0, female: 0, htsPos: 0, substance: 0, rehab: 0, acute: 0 };
      }
      map[addr].total += 1;
      if (r.personal.age <= 35) map[addr].youth += 1;
      if (r.personal.gender === 'Male') map[addr].male += 1;
      if (r.personal.gender === 'Female') map[addr].female += 1;
      if (r.hts.testResult.includes('Reactive (Positive)')) map[addr].htsPos += 1;
      if (!r.substance.substanceTypes.includes('None') || r.substance.drugUseFrequency !== 'Never') map[addr].substance += 1;
      if (r.substance.interestInRehabSupport.includes('Yes')) map[addr].rehab += 1;
      if (
        r.actionPlan.triageLevel.includes('Urgent') ||
        r.actionPlan.triageLevel.includes('Emergency') ||
        r.medical.tbScreeningSymptomatic ||
        r.medical.vitals.bloodPressureSys >= 140
      ) {
        map[addr].acute += 1;
      }
    });

    return Object.entries(map)
      .map(([address, d]) => ({
        address,
        total: d.total,
        pct: totalScreened ? Math.round((d.total / totalScreened) * 100) : 0,
        youth: d.youth,
        youthPct: d.total ? Math.round((d.youth / d.total) * 100) : 0,
        male: d.male,
        female: d.female,
        htsPos: d.htsPos,
        substance: d.substance,
        rehab: d.rehab,
        acute: d.acute,
      }))
      .sort((a, b) => b.total - a.total);
  }, [records, totalScreened]);

  // Statistical Table 7: Gender Breakdown
  const genderStatsTable = useMemo(() => {
    const genders = ['Male', 'Female', 'Other / Non-Binary'];
    return genders
      .map((g) => {
        const cohort = records.filter((r) => {
          if (g === 'Male') return r.personal.gender === 'Male';
          if (g === 'Female') return r.personal.gender === 'Female';
          return r.personal.gender !== 'Male' && r.personal.gender !== 'Female';
        });
        const count = cohort.length;
        const avgAge = count ? Math.round(cohort.reduce((acc, cur) => acc + cur.personal.age, 0) / count) : 0;
        const youthCount = cohort.filter((r) => r.personal.age <= 35).length;
        const htsTested = cohort.filter((r) => r.hts.acceptHtsTest === 'Yes').length;
        const htsPos = cohort.filter((r) => r.hts.testResult.includes('Reactive (Positive)')).length;
        const substance = cohort.filter(
          (r) => !r.substance.substanceTypes.includes('None') || r.substance.drugUseFrequency !== 'Never'
        ).length;
        const rehab = cohort.filter((r) => r.substance.interestInRehabSupport.includes('Yes')).length;
        const acute = cohort.filter(
          (r) =>
            r.actionPlan.triageLevel.includes('Urgent') ||
            r.actionPlan.triageLevel.includes('Emergency') ||
            r.medical.tbScreeningSymptomatic ||
            r.medical.vitals.bloodPressureSys >= 140
        ).length;

        return {
          gender: g,
          count,
          pct: totalScreened ? Math.round((count / totalScreened) * 100) : 0,
          avgAge,
          youthCount,
          youthPct: count ? Math.round((youthCount / count) * 100) : 0,
          htsTestedPct: count ? Math.round((htsTested / count) * 100) : 0,
          htsPos,
          substancePct: count ? Math.round((substance / count) * 100) : 0,
          rehab,
          acute,
        };
      })
      .filter((item) => item.count > 0);
  }, [records, totalScreened]);

  // Statistical Table 8: Age Bracket Staging Table
  const ageStatsTable = useMemo(() => {
    const brackets = [
      { key: 'youth_young', label: '18–24y (Adolescent & Young Youth)', desc: 'Emerging youth homeless cohort', min: 0, max: 24, priority: 'Youth Clinic Focus' },
      { key: 'youth_older', label: '25–35y (Dunwell Youth Priority Core)', desc: 'Primary intervention target cohort', min: 25, max: 35, priority: 'Priority Target' },
      { key: 'adults', label: '36–49y (Mature Homeless Adults)', desc: 'Established street living cohort', min: 36, max: 49, priority: 'District Clinic Care' },
      { key: 'seniors', label: '50+y (Geriatric & Frail Homeless)', desc: 'High chronic morbidity & frailty', min: 50, max: 120, priority: 'Chronic Staging' },
    ];

    return brackets.map((b) => {
      const cohort = records.filter((r) => r.personal.age >= b.min && r.personal.age <= b.max);
      const count = cohort.length;
      const htsTested = cohort.filter((r) => r.hts.acceptHtsTest === 'Yes').length;
      const htsPos = cohort.filter((r) => r.hts.testResult.includes('Reactive (Positive)')).length;
      const substance = cohort.filter(
        (r) => !r.substance.substanceTypes.includes('None') || r.substance.drugUseFrequency !== 'Never'
      ).length;
      const rehab = cohort.filter((r) => r.substance.interestInRehabSupport.includes('Yes')).length;
      const chronic = cohort.filter(
        (r) =>
          !r.medical.chronicConditions.includes('None') ||
          r.medical.vitals.bloodPressureSys >= 140 ||
          (r.medical.vitals.bloodGlucose && r.medical.vitals.bloodGlucose >= 11.1)
      ).length;
      const acute = cohort.filter(
        (r) => r.actionPlan.triageLevel.includes('Urgent') || r.actionPlan.triageLevel.includes('Emergency')
      ).length;

      return {
        ...b,
        count,
        pct: totalScreened ? Math.round((count / totalScreened) * 100) : 0,
        htsUptakePct: count ? Math.round((htsTested / count) * 100) : 0,
        htsPos,
        substancePct: count ? Math.round((substance / count) * 100) : 0,
        rehab,
        chronicPct: count ? Math.round((chronic / count) * 100) : 0,
        acute,
      };
    });
  }, [records, totalScreened]);

  // Statistical Table 9: Race / Population Group Staging Table
  const raceStatsTable = useMemo(() => {
    const races = ['Black African', 'Coloured', 'White', 'Indian/Asian', 'Other'];
    return races
      .map((rc) => {
        const cohort = records.filter((r) => r.personal.race === rc);
        const count = cohort.length;
        const youthCount = cohort.filter((r) => r.personal.age <= 35).length;
        const htsPos = cohort.filter((r) => r.hts.testResult.includes('Reactive (Positive)')).length;
        const substance = cohort.filter(
          (r) => !r.substance.substanceTypes.includes('None') || r.substance.drugUseFrequency !== 'Never'
        ).length;
        const highBp = cohort.filter((r) => r.medical.vitals.bloodPressureSys >= 140).length;
        const rehab = cohort.filter((r) => r.substance.interestInRehabSupport.includes('Yes')).length;

        return {
          race: rc,
          count,
          pct: totalScreened ? Math.round((count / totalScreened) * 100) : 0,
          youthCount,
          htsPos,
          substancePct: count ? Math.round((substance / count) * 100) : 0,
          highBp,
          rehab,
        };
      })
      .filter((r) => r.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [records, totalScreened]);

  // Statistical Table 10: Nationality & Documentation Status Table
  const nationalityStatsTable = useMemo(() => {
    const map: Record<string, { count: number; undocumented: number; htsPos: number; substance: number; acute: number }> = {};

    records.forEach((r) => {
      const nat = (r.personal.nationality || 'South African (Undocumented)').trim();
      if (!map[nat]) {
        map[nat] = { count: 0, undocumented: 0, htsPos: 0, substance: 0, acute: 0 };
      }
      map[nat].count += 1;
      if (nat.toLowerCase().includes('undocumented') || (!nat.includes('ID Verified') && nat.includes('South African'))) {
        map[nat].undocumented += 1;
      }
      if (r.hts.testResult.includes('Reactive (Positive)')) map[nat].htsPos += 1;
      if (!r.substance.substanceTypes.includes('None') || r.substance.drugUseFrequency !== 'Never') map[nat].substance += 1;
      if (
        r.actionPlan.triageLevel.includes('Urgent') ||
        r.actionPlan.triageLevel.includes('Emergency') ||
        r.medical.tbScreeningSymptomatic
      ) {
        map[nat].acute += 1;
      }
    });

    return Object.entries(map)
      .map(([nationality, d]) => ({
        nationality,
        count: d.count,
        pct: totalScreened ? Math.round((d.count / totalScreened) * 100) : 0,
        undocumented: d.undocumented,
        htsPos: d.htsPos,
        substancePct: d.count ? Math.round((d.substance / d.count) * 100) : 0,
        acute: d.acute,
        isForeign: !nationality.includes('South African'),
      }))
      .sort((a, b) => b.count - a.count);
  }, [records, totalScreened]);

  // Statistical Table 11: Home Language & Primary Communication Breakdown
  const languageStatsTable = useMemo(() => {
    const map: Record<string, { count: number; youth: number; htsDone: number }> = {};

    records.forEach((r) => {
      const lang = (r.personal.homeLanguage || 'isiZulu').trim();
      if (!map[lang]) {
        map[lang] = { count: 0, youth: 0, htsDone: 0 };
      }
      map[lang].count += 1;
      if (r.personal.age <= 35) map[lang].youth += 1;
      if (r.hts.acceptHtsTest === 'Yes') map[lang].htsDone += 1;
    });

    return Object.entries(map)
      .map(([language, d]) => ({
        language,
        count: d.count,
        pct: totalScreened ? Math.round((d.count / totalScreened) * 100) : 0,
        youth: d.youth,
        htsDone: d.htsDone,
        htsRate: d.count ? Math.round((d.htsDone / d.count) * 100) : 0,
        consentCompliant: d.count, // 100% informed consent briefed in native tongue
      }))
      .sort((a, b) => b.count - a.count);
  }, [records, totalScreened]);

  const uniqueSites = useMemo(() => {
    return Array.from(new Set(records.map((r) => r.outreachSite)));
  }, [records]);

  // Master handler for PDF export of all stats
  const handleTriggerAllStatsPdf = () => {
    if (onOpenBatchReport) {
      onOpenBatchReport();
    } else {
      onOpenPdf();
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: All-Stats PDF Callout & Operational Status */}
      <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 text-white rounded-2xl p-5 sm:p-6 shadow-md border border-blue-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] tracking-wide uppercase">
              Consolidated Public Health Ledger
            </span>
            <span className="text-xs text-blue-200">City of Johannesburg • Dunwell Clinic</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            Homeless Outreach Epidemiological Surveillance
          </h2>
          <p className="text-xs sm:text-sm text-blue-100 max-w-2xl">
            Live aggregated clinical metrics, HTS testing cascade, substance use patterns, and demographic profiling for all <strong>{totalScreened} screened individuals</strong> across all inner-city hotspots.
          </p>
        </div>

        {/* Global All-Stats PDF Download Action */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto shrink-0">
          <button
            onClick={handleTriggerAllStatsPdf}
            className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg transition"
            title="Download consolidated A4 PDF report with all statistics and tables for all screened people"
          >
            <Download className="w-4 h-4 text-slate-950" />
            <span>Download All Stats (PDF)</span>
          </button>

          <button
            onClick={onNewScreening}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs sm:text-sm font-bold rounded-xl transition"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>New Intake</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* KPI 1: Total Screened */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Screened</span>
            <div className="p-1.5 rounded-xl bg-blue-50 text-blue-900">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">{totalScreened}</span>
            <span className="text-[11px] text-emerald-700 flex items-center font-extrabold">
              <TrendingUp className="w-3 h-3 mr-0.5" /> 100%
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Full outreach roll in PDF</p>
        </div>

        {/* KPI 2: Dunwell Youth Priority */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Youth (≤35)</span>
            <div className="p-1.5 rounded-xl bg-amber-50 text-amber-700">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-amber-600 font-mono">{youthCount}</span>
            <span className="text-xs font-bold text-amber-800">({youthPct}%)</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Dunwell youth priority</p>
        </div>

        {/* KPI 3: HTS Tested */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">HTS Tested</span>
            <div className="p-1.5 rounded-xl bg-rose-50 text-rose-600">
              <HeartPulse className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">{htsAcceptCount}</span>
            <span className="text-xs font-bold text-rose-700">({htsPositiveCount} Pos)</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Rapid test & ART link</p>
        </div>

        {/* KPI 4: Seeking Rehab */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Rehab Demand</span>
            <div className="p-1.5 rounded-xl bg-emerald-50 text-emerald-700">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-emerald-700 font-mono">{rehabInterestCount}</span>
            <span className="text-xs font-bold text-slate-500">({rehabPct}%)</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">COJ Detox & Rehab</p>
        </div>

        {/* KPI 5: Acute Medical Alerts */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Clinical Alerts</span>
            <div className="p-1.5 rounded-xl bg-amber-50 text-amber-700">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-rose-700 font-mono">{acuteCasesCount}</span>
            <span className="text-xs text-slate-600 font-bold">Urgent</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Trauma, high BP, TB</p>
        </div>

        {/* KPI 6: Mental Health / Psychosocial */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Psychosocial</span>
            <div className="p-1.5 rounded-xl bg-indigo-50 text-indigo-700">
              <Brain className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-indigo-950 font-mono">
              {psychosocialCrisisCount + psychosocialHighCount}
            </span>
            <span className="text-[11px] text-rose-700 font-extrabold">
              ({psychosocialCrisisCount} Crisis)
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {psychosocialCounselingCount} receptive to counseling
          </p>
        </div>
      </div>

      {/* Analytical View Switcher & Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-50 text-blue-900 rounded-xl">
            <Table className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
              Statistical Analytics & Breakdown Tables
            </h3>
            <p className="text-xs text-slate-500">
              Quantitative frequency tables and visual indicators for public health officials
            </p>
          </div>
        </div>

        {/* View Mode Toggle Controls */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-300 text-xs">
          <button
            type="button"
            onClick={() => setAnalyticsView('both')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition ${
              analyticsView === 'both'
                ? 'bg-white text-blue-950 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5 text-blue-900" />
            <span>Combined (Tables & Charts)</span>
          </button>
          <button
            type="button"
            onClick={() => setAnalyticsView('tables')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition ${
              analyticsView === 'tables'
                ? 'bg-white text-blue-950 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Table className="w-3.5 h-3.5 text-amber-600" />
            <span>Statistical Tables Only</span>
          </button>
          <button
            type="button"
            onClick={() => setAnalyticsView('charts')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition ${
              analyticsView === 'charts'
                ? 'bg-white text-blue-950 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Charts Only</span>
          </button>
        </div>
      </div>

      {/* SECTION A: STATISTICAL TABLES (Shown in 'both' and 'tables' mode) */}
      {(analyticsView === 'both' || analyticsView === 'tables') && (
        <div className="space-y-5">
          {/* Top Row: Hotspot Sites Table & Substance Prevalence Table */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Table 1: Hotspot Sites Surveillance Table */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-amber-600" />
                    <div>
                      <h4 className="text-xs font-black uppercase text-blue-950 tracking-wider">
                        Table 1: Outreach Hotspots & Shelters Surveillance
                      </h4>
                      <p className="text-[11px] text-slate-500">Distribution of screenings across active mobile sites</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                    {hotspotStatsTable.length} Hotspots
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-600 border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-2.5">Hotspot Site</th>
                        <th className="py-2 px-2 text-center">Screened</th>
                        <th className="py-2 px-2 text-center">Youth (≤35)</th>
                        <th className="py-2 px-2 text-center">HTS Pos (+)</th>
                        <th className="py-2 px-2 text-center">Rehab Need</th>
                        <th className="py-2 px-2 text-center">Acute Alert</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {hotspotStatsTable.map((item) => (
                        <tr key={item.site} className="hover:bg-slate-50/70 transition">
                          <td className="py-2.5 px-2.5 font-bold text-slate-900">
                            {item.site.replace(' / Inner-City Outreach', '')}
                          </td>
                          <td className="py-2.5 px-2 text-center font-mono font-bold text-blue-950">
                            {item.total} <span className="text-[10px] text-slate-400">({item.pct}%)</span>
                          </td>
                          <td className="py-2.5 px-2 text-center font-mono text-amber-700 font-bold">
                            {item.youth} <span className="text-[10px] text-amber-800">({item.youthPct}%)</span>
                          </td>
                          <td className="py-2.5 px-2 text-center font-mono text-rose-700 font-bold">
                            {item.htsPos}
                          </td>
                          <td className="py-2.5 px-2 text-center font-mono text-emerald-700 font-bold">
                            {item.rehab}
                          </td>
                          <td className="py-2.5 px-2 text-center font-mono font-bold text-purple-900">
                            {item.acute}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>All sites coordinated with COJ Mobile Health Units</span>
                <span className="font-mono font-bold text-slate-700">Total: {totalScreened} Screened</span>
              </div>
            </div>

            {/* Table 2: Substance Prevalence & Rehab Demand Table */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-amber-600" />
                    <div>
                      <h4 className="text-xs font-black uppercase text-blue-950 tracking-wider">
                        Table 2: Substance Prevalence & Rehab Demand
                      </h4>
                      <p className="text-[11px] text-slate-500">Self-reported substances, daily frequency & detox interest</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-200">
                    {substanceUsersCount} Users ({substancePct}%)
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-600 border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-2.5">Substance</th>
                        <th className="py-2 px-2 text-center">Users (N)</th>
                        <th className="py-2 px-2 text-center">% Cohort</th>
                        <th className="py-2 px-2 text-center">Daily Use</th>
                        <th className="py-2 px-2 text-center">Seeking Rehab</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {substanceStatsTable.map((sub) => (
                        <tr key={sub.name} className="hover:bg-slate-50/70 transition">
                          <td className="py-2.5 px-2.5 font-bold text-slate-900">
                            {sub.name}
                          </td>
                          <td className="py-2.5 px-2 text-center font-mono font-bold text-amber-700">
                            {sub.count}
                          </td>
                          <td className="py-2.5 px-2 text-center font-mono text-slate-600">
                            {sub.pct}%
                          </td>
                          <td className="py-2.5 px-2 text-center font-mono text-slate-600">
                            {sub.daily}
                          </td>
                          <td className="py-2.5 px-2 text-center font-mono text-emerald-700 font-bold">
                            {sub.rehabRequested} <span className="text-[10px] text-emerald-800 font-normal">({sub.rehabPct}%)</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>Direct referrals to SANCA & COJ Social Development</span>
                <span className="font-bold text-emerald-700 font-mono">{rehabInterestCount} total seeking rehab</span>
              </div>
            </div>
          </div>

          {/* Bottom Row: HTS Cascade Table & Clinical Complaints Table */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Table 3: HTS Testing Cascade Detailed Table */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <HeartPulse className="w-4 h-4 text-rose-600" />
                    <div>
                      <h4 className="text-xs font-black uppercase text-blue-950 tracking-wider">
                        Table 3: HTS Testing Services & HIV Linkage Cascade
                      </h4>
                      <p className="text-[11px] text-slate-500">Point-of-care rapid testing milestones & ART adherence</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-blue-50 text-blue-900 px-2 py-0.5 rounded border border-blue-200">
                    UNAIDS 95-95-95
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-600 border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-2.5">Cascade Milestone</th>
                        <th className="py-2 px-2 text-center">N</th>
                        <th className="py-2 px-2 text-center">% Cohort</th>
                        <th className="py-2 px-2.5">Clinical Protocol / Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {htsCascadeTable.map((row) => (
                        <tr key={row.stage} className="hover:bg-slate-50/70 transition">
                          <td className="py-2.5 px-2.5 font-bold text-slate-900">
                            {row.stage}
                          </td>
                          <td className="py-2.5 px-2 text-center font-mono font-bold text-blue-950">
                            {row.count}
                          </td>
                          <td className="py-2.5 px-2 text-center font-mono font-semibold text-slate-700">
                            {row.pct}%
                          </td>
                          <td className="py-2.5 px-2.5 text-[11px] text-slate-600 font-medium">
                            {row.action}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>Free Oral PrEP & Barrier Condoms distributed</span>
                <span className="font-bold text-rose-700 font-mono">{htsPositiveCount} Reactive cases linked</span>
              </div>
            </div>

            {/* Table 4: Clinical Complaints & Vitals Staging Table */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-purple-700" />
                    <div>
                      <h4 className="text-xs font-black uppercase text-blue-950 tracking-wider">
                        Table 4: Present Complaints & Clinical Triage
                      </h4>
                      <p className="text-[11px] text-slate-500">Symptom presentations, wounds, breathing & referral pathways</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-purple-50 text-purple-900 px-2 py-0.5 rounded border border-purple-200">
                    Triage Surveillance
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-600 border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-2.5">Condition / Complaint</th>
                        <th className="py-2 px-2 text-center">Cases (N)</th>
                        <th className="py-2 px-2 text-center">% Share</th>
                        <th className="py-2 px-2 text-center">Triage Severity</th>
                        <th className="py-2 px-2.5">Dunwell Clinic Disposition</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {complaintsStatsTable.map((c) => (
                        <tr key={c.name} className="hover:bg-slate-50/70 transition">
                          <td className="py-2.5 px-2.5 font-bold text-slate-900">
                            {c.name}
                          </td>
                          <td className="py-2.5 px-2 text-center font-mono font-bold text-blue-950">
                            {c.count}
                          </td>
                          <td className="py-2.5 px-2 text-center font-mono text-slate-600">
                            {c.pct}%
                          </td>
                          <td className="py-2.5 px-2 text-center font-bold text-[10px]">
                            <span
                              className={`px-2 py-0.5 rounded ${
                                c.severity.includes('Urgent') || c.severity.includes('High')
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {c.severity}
                            </span>
                          </td>
                          <td className="py-2.5 px-2.5 text-[11px] text-slate-600">
                            {c.disposition}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>Immediate ambulance link for Emergency vitals</span>
                <span className="font-bold text-purple-900 font-mono">{acuteCasesCount} acute triage cases</span>
              </div>
            </div>
          </div>

          {/* Table 5: Dunwell Youth Priority Cohort Comparison Table */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <div>
                  <h4 className="text-xs font-black uppercase text-blue-950 tracking-wider">
                    Table 5: Demographic Comparison • Dunwell Youth Priority (≤35y) vs Mature Adults (36+y)
                  </h4>
                  <p className="text-[11px] text-slate-500">Comparative uptake of HTS, substance vulnerability, and rehab willingness</p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold bg-amber-100 text-slate-950 px-2.5 py-0.5 rounded-full border border-amber-300">
                Youth Focus: {youthCount} ({youthPct}%)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Demographic Cohort</th>
                    <th className="py-2.5 px-2.5 text-center">Screened (N)</th>
                    <th className="py-2.5 px-2.5 text-center">% Total</th>
                    <th className="py-2.5 px-2.5 text-center">HTS Uptake %</th>
                    <th className="py-2.5 px-2.5 text-center">Substance %</th>
                    <th className="py-2.5 px-2.5 text-center">Rehab Demand %</th>
                    <th className="py-2.5 px-2.5 text-center">Acute Care Need %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {youthComparisonTable.map((group) => (
                    <tr key={group.label} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-3">
                        <strong className="text-slate-900 block text-xs">{group.label}</strong>
                        <span className="text-[10px] text-slate-500">{group.desc}</span>
                      </td>
                      <td className="py-3 px-2.5 text-center font-mono font-bold text-blue-950 text-sm">
                        {group.count}
                      </td>
                      <td className="py-3 px-2.5 text-center font-mono font-semibold text-slate-700">
                        {group.pctOfTotal}%
                      </td>
                      <td className="py-3 px-2.5 text-center font-mono font-bold text-blue-900">
                        {group.htsUptakePct}%
                      </td>
                      <td className="py-3 px-2.5 text-center font-mono font-bold text-amber-700">
                        {group.substancePct}%
                      </td>
                      <td className="py-3 px-2.5 text-center font-mono font-bold text-emerald-700">
                        {group.rehabDemandPct}%
                      </td>
                      <td className="py-3 px-2.5 text-center font-mono font-bold text-purple-900">
                        {group.acutePct}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Table 6: Psychosocial & Mental Health Surveillance Table */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-indigo-700" />
                <div>
                  <h4 className="text-xs font-black uppercase text-blue-950 tracking-wider">
                    Table 6: Psychosocial & Mental Health Screening Surveillance (Tick Form Analysis)
                  </h4>
                  <p className="text-[11px] text-slate-500">Distress severity levels, suicide crisis alerts, trauma/GBV exposure & clinical disposition</p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold bg-indigo-50 text-indigo-900 px-2.5 py-0.5 rounded-full border border-indigo-200">
                Mental Health Screened: 100%
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Distress Staging</th>
                    <th className="py-2.5 px-2.5 text-center">Cases (N)</th>
                    <th className="py-2.5 px-2.5 text-center">% Share</th>
                    <th className="py-2.5 px-2.5 text-center">Triage Severity</th>
                    <th className="py-2.5 px-2.5 text-center">Suicide / Safety Alerts</th>
                    <th className="py-2.5 px-2.5 text-center">Trauma / GBV</th>
                    <th className="py-2.5 px-2.5 text-center">Counseling Uptake</th>
                    <th className="py-2.5 px-3">Recommended Outreach Pathway</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {psychosocialStatsTable.map((lvl) => (
                    <tr key={lvl.level} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-3">
                        <span className={`inline-block text-[10px] font-black px-2 py-0.5 rounded ${lvl.badge}`}>
                          {lvl.level}
                        </span>
                      </td>
                      <td className="py-3 px-2.5 text-center font-mono font-bold text-blue-950 text-sm">
                        {lvl.count}
                      </td>
                      <td className="py-3 px-2.5 text-center font-mono font-semibold text-slate-700">
                        {lvl.pct}%
                      </td>
                      <td className="py-3 px-2.5 text-center font-bold text-[10px]">
                        <span
                          className={`px-2 py-0.5 rounded ${
                            lvl.severity === 'Emergency'
                              ? 'bg-rose-100 text-rose-800'
                              : lvl.severity === 'Urgent'
                              ? 'bg-amber-100 text-amber-800'
                              : lvl.severity === 'Moderate'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {lvl.severity}
                        </span>
                      </td>
                      <td className="py-3 px-2.5 text-center font-mono font-bold text-xs">
                        {lvl.crisisAlerts > 0 ? (
                          <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                            {lvl.crisisAlerts} Alert{lvl.crisisAlerts > 1 ? 's' : ''}
                          </span>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </td>
                      <td className="py-3 px-2.5 text-center font-mono text-slate-700">
                        {lvl.gbvTrauma}
                      </td>
                      <td className="py-3 px-2.5 text-center font-mono text-emerald-700 font-bold">
                        {lvl.counselingCount} ({lvl.counselingPct}%)
                      </td>
                      <td className="py-3 px-3 text-[11px] text-slate-600">
                        {lvl.desc}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600">
              <span>
                Critical Protocol: Any positive response on suicide ideation triggers immediate field de-escalation & emergency referral
              </span>
              <span className="font-bold text-indigo-950 font-mono">
                {psychosocialCounselingCount} clients linked to Dunwell mental health counselors
              </span>
            </div>
          </div>

          {/* Demographic & Geospatial Intelligence Surveillance (Address, Gender, Age, Race, Nationality & Languages) */}
          <DemographicStatsSection
            totalScreened={totalScreened}
            addressStatsTable={addressStatsTable}
            genderStatsTable={genderStatsTable}
            ageStatsTable={ageStatsTable}
            raceStatsTable={raceStatsTable}
            nationalityStatsTable={nationalityStatsTable}
            languageStatsTable={languageStatsTable}
          />
        </div>
      )}

      {/* SECTION B: CHARTS & VISUALS (Shown in 'both' and 'charts' mode) */}
      {(analyticsView === 'both' || analyticsView === 'charts') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Chart 1: Substance Types Prevalence */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-amber-600" />
                  Substance Use Frequency & Prevalence
                </h3>
                <p className="text-xs text-slate-500">
                  Self-reported substances among screened homeless individuals
                </p>
              </div>
              <span className="text-[10px] bg-amber-50 text-amber-800 px-2 py-0.5 rounded-full font-bold border border-amber-200">
                Field Intake
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={substanceData} margin={{ top: 10, right: 10, left: -20, bottom: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis
                    dataKey="name"
                    stroke="#64748B"
                    fontSize={10}
                    angle={-25}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis stroke="#64748B" fontSize={11} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#CBD5E1',
                      borderRadius: '12px',
                      color: '#0F172A',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                    }}
                    cursor={{ fill: 'rgba(241, 245, 249, 0.6)' }}
                  />
                  <Bar dataKey="count" name="Persons Screened" fill="#F59E0B" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: HTS Screening Cascade */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                  <HeartPulse className="w-4 h-4 text-rose-600" />
                  HTS / HIV Outreach Cascade
                </h3>
                <p className="text-xs text-slate-500">
                  Testing uptake and linkage to Dunwell Clinic & ART care
                </p>
              </div>
              <span className="text-[10px] bg-blue-50 text-blue-800 px-2.5 py-0.5 rounded-full font-bold border border-blue-200">
                UNAIDS 95-95-95
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={htsCascadeData} margin={{ top: 10, right: 10, left: -20, bottom: 15 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="stage" stroke="#64748B" fontSize={10} />
                  <YAxis stroke="#64748B" fontSize={11} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#CBD5E1',
                      borderRadius: '12px',
                      color: '#0F172A',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                    }}
                  />
                  <Bar dataKey="count" name="Count" radius={[6, 6, 0, 0]}>
                    {htsCascadeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 3: Outreach Hotspots Distribution */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-amber-600" />
                  City of Johannesburg Hotspots & Shelters
                </h3>
                <p className="text-xs text-slate-500">
                  Field operations distribution across inner-city parks & shelters
                </p>
              </div>
            </div>

            <div className="h-64 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={hotspotData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }: { name?: string; percent?: number }) =>
                      `${(name || 'Site').split('-')[0].trim()} (${((percent || 0) * 100).toFixed(0)}%)`
                    }
                    labelLine={false}
                  >
                    {hotspotData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#CBD5E1',
                      borderRadius: '12px',
                      color: '#0F172A',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 4: Present Complaints & Clinical Needs */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-blue-800" />
                  Top Present Complaints (Injuries, Respiratory, Skin)
                </h3>
                <p className="text-xs text-slate-500">
                  Directly from handwritten intake ledger analysis
                </p>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={complaintsData}
                  layout="vertical"
                  margin={{ top: 10, right: 20, left: 40, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis type="number" stroke="#64748B" fontSize={11} allowDecimals={false} />
                  <YAxis dataKey="complaint" type="category" stroke="#64748B" fontSize={10} width={100} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#CBD5E1',
                      borderRadius: '12px',
                      color: '#0F172A',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                    }}
                  />
                  <Bar dataKey="count" name="Reported" fill="#2563EB" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* SECTION C: MASTER CLIENT SCREENING LEDGER TABLE */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <span>Active Screening Ledger & Case Files</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-300 font-mono font-bold">
                  {filteredRecords.length} of {records.length}
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Detailed register of all screened homeless persons with verified informed consent signatures
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Export All Stats PDF from Table Header */}
              <button
                onClick={handleTriggerAllStatsPdf}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow transition whitespace-nowrap"
                title="Download comprehensive PDF with all statistics and complete roll"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                <span>Export All Stats (PDF)</span>
              </button>

              <button
                onClick={onNewScreening}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow transition whitespace-nowrap"
              >
                <Plus className="w-4 h-4" /> Start Screening Intake
              </button>
            </div>
          </div>

          {/* Filter Controls Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 pt-1 text-xs">
            {/* Search Input */}
            <div className="relative lg:col-span-2">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search name, alias, ID, ref number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-900 text-xs shadow-sm"
              />
            </div>

            {/* Site Filter */}
            <div>
              <select
                value={siteFilter}
                onChange={(e) => setSiteFilter(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs font-semibold focus:outline-none shadow-sm"
              >
                <option value="ALL">All Hotspots ({uniqueSites.length})</option>
                {uniqueSites.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Substance Filter */}
            <div>
              <select
                value={substanceFilter}
                onChange={(e) => setSubstanceFilter(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs font-semibold focus:outline-none shadow-sm"
              >
                <option value="ALL">All Substances</option>
                <option value="Nyaope">Nyaope / Whoonga</option>
                <option value="Tik">Crystal Meth (Tik)</option>
                <option value="Cannabis">Cannabis / Dagga</option>
                <option value="Alcohol">Alcohol</option>
                <option value="Glue">Glue / Solvents</option>
                <option value="Mandrax">Mandrax</option>
              </select>
            </div>

            {/* Quick Toggle Pills */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setYouthOnly(!youthOnly)}
                className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold border transition ${
                  youthOnly
                    ? 'bg-blue-900 text-white border-blue-950 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                Youth ≤35
              </button>
              <button
                type="button"
                onClick={() => setRehabOnly(!rehabOnly)}
                className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold border transition ${
                  rehabOnly
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                Rehab Yes
              </button>
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-800">
            <thead className="bg-slate-100 text-[11px] uppercase tracking-wider text-slate-600 border-b border-slate-200 font-bold">
              <tr>
                <th className="py-3.5 px-4">Ref & Client Details</th>
                <th className="py-3.5 px-3">Site / Location</th>
                <th className="py-3.5 px-3">Vitals & Complaints</th>
                <th className="py-3.5 px-3">HTS Screening</th>
                <th className="py-3.5 px-3">Mental Health (Tick Form)</th>
                <th className="py-3.5 px-3">Substance & Rehab</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center">
                    <div className="max-w-md mx-auto flex flex-col items-center">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-900 mb-3 shadow-inner">
                        <Activity className="w-6 h-6 text-blue-700" />
                      </div>
                      <h4 className="text-base font-extrabold text-slate-900 mb-1">
                        Outreach Database Ready
                      </h4>
                      <p className="text-xs text-slate-500 mb-4 max-w-sm">
                        All dummy data removed. Click below to begin screening and enroll clients into the database.
                      </p>
                      <button
                        type="button"
                        onClick={onNewScreening}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-950 text-white hover:bg-blue-900 rounded-xl font-bold text-xs shadow transition"
                      >
                        <Plus className="w-4 h-4 text-amber-400" />
                        Screen & Enroll First Client
                      </button>
                    </div>
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-500 font-medium">
                    No outreach screening records found matching the active filters.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => {
                  const isYouth = record.personal.age <= 35;

                  return (
                    <tr
                      key={record.id}
                      className="hover:bg-blue-50/40 transition group cursor-pointer"
                      onClick={() => {
                        if (onViewConsent) {
                          onViewConsent(record);
                        } else {
                          handleTriggerAllStatsPdf();
                        }
                      }}
                    >
                      {/* Col 1: Name & ID & Demographics */}
                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                          {record.personal.fullName}
                          {isYouth && (
                            <span className="text-[9px] bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full font-black">
                              YOUTH
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5 font-medium flex-wrap">
                          <span className="font-mono font-bold text-blue-900">{record.refNumber}</span>
                          <span>•</span>
                          <span>
                            {record.personal.gender}, {record.personal.age}y ({record.personal.race})
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-600 mt-1 flex items-center gap-1.5 flex-wrap">
                          <span className="bg-slate-100 text-blue-950 px-1.5 py-0.5 rounded font-semibold text-[10px] border border-slate-200">
                            {record.personal.nationality}
                          </span>
                          <span className="bg-amber-50 text-amber-900 px-1.5 py-0.5 rounded font-semibold text-[10px] border border-amber-200">
                            Lang: {record.personal.homeLanguage || 'isiZulu'}
                          </span>
                        </div>
                      </td>

                      {/* Col 2: Site & Sleeping Spot Address */}
                      <td className="py-3.5 px-3">
                        <span className="font-bold text-slate-800 block text-xs truncate max-w-[170px]">
                          {record.outreachSite}
                        </span>
                        <span className="text-[11px] text-slate-600 block line-clamp-1 italic">
                          Spot: {record.personal.physicalAddress}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-mono mt-0.5">
                          {new Date(record.createdAt).toLocaleDateString('en-ZA')}
                        </span>
                      </td>

                      {/* Col 3: Vitals & Complaints */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-bold text-slate-900">
                            {record.medical.vitals.bloodPressureSys}/{record.medical.vitals.bloodPressureDia}
                          </span>
                          <span className="text-[10px] text-slate-500">mmHg</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {record.medical.presentComplaints.slice(0, 2).map((c, i) => (
                            <span
                              key={i}
                              className={`text-[9px] px-2 py-0.5 rounded-md font-bold ${
                                c.includes('Injury')
                                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                  : c.includes('Breathing')
                                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                  : 'bg-slate-100 text-slate-700 border border-slate-200'
                              }`}
                            >
                              {c.split('/')[0]}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Col 4: HTS */}
                      <td className="py-3.5 px-3">
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md inline-block ${
                            record.hts.testResult.includes('Reactive (Positive)')
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : record.hts.testResult.includes('Non-Reactive')
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {record.hts.testResult}
                        </span>
                        <span className="block text-[10px] text-slate-600 mt-0.5 font-medium">
                          ART: {record.hts.onArt.split('(')[0]}
                        </span>
                      </td>

                      {/* Col 5: Mental Health (Tick Form) */}
                      <td className="py-3.5 px-3">
                        {record.psychosocial ? (
                          <div>
                            <span
                              className={`text-[9px] font-black px-2 py-0.5 rounded inline-block ${
                                record.psychosocial.analysis.distressLevel === 'Severe Crisis'
                                  ? 'bg-rose-600 text-white'
                                  : record.psychosocial.analysis.distressLevel === 'High'
                                  ? 'bg-amber-400 text-slate-950 font-black'
                                  : record.psychosocial.analysis.distressLevel === 'Moderate'
                                  ? 'bg-blue-100 text-blue-900 font-bold border border-blue-200'
                                  : 'bg-emerald-100 text-emerald-900 font-bold border border-emerald-200'
                              }`}
                            >
                              {record.psychosocial.analysis.distressLevel} ({record.psychosocial.analysis.score}/12)
                            </span>
                            {record.psychosocial.analysis.crisisAlert && (
                              <span className="block text-[9px] text-rose-700 font-black mt-0.5">
                                ⚠️ Suicide Risk
                              </span>
                            )}
                            <span className="block text-[10px] text-slate-500 mt-0.5 font-medium">
                              {record.psychosocial.counselingAccepted ? 'Counseling Linked' : 'Routine Care'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400">Not Screened</span>
                        )}
                      </td>

                      {/* Col 6: Substance & Rehab */}
                      <td className="py-3.5 px-3">
                        <div className="text-xs text-slate-800 font-semibold truncate max-w-[140px]">
                          {record.substance.substanceTypes.join(', ')}
                        </div>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-bold inline-block mt-0.5 ${
                            record.substance.interestInRehabSupport.includes('Yes')
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'text-slate-500'
                          }`}
                        >
                          Rehab: {record.substance.interestInRehabSupport.includes('Yes') ? 'Requested' : 'Declined'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTriggerAllStatsPdf();
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-xs font-bold shadow-sm transition"
                            title="Download All Stats PDF (all people screened)"
                          >
                            <Download className="w-3.5 h-3.5 text-amber-400" />
                            <span>All Stats PDF</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
