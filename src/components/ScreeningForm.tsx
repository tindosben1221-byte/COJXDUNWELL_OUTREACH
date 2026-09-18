import React, { useState, useEffect } from 'react';
import {
  ScreeningRecord,
  ScreeningToolId,
  Gender,
  Nationality,
  Race,
  ChronicCondition,
  PresentComplaint,
  HtsStatusKnown,
  AcceptHtsTest,
  HtsResult,
  ArtStatus,
  AlcoholFrequency,
  DrugFrequency,
  SubstanceType,
  RehabInterest,
  TriageLevel,
  SUGGESTED_NATIONALITIES,
  OFFICIAL_LANGUAGES_SA,
  PsychosocialScreening,
} from '../types';
import { OUTREACH_SITES } from '../data/mockData';
import {
  savePersonDetails,
  saveToolForPerson,
  saveFullRecord,
  getCachedRecords,
  subscribeToDatabase,
} from '../data/db';
import { DEFAULT_PSYCHOSOCIAL_SYMPTOMS, calculatePsychosocialAnalysis } from '../utils/psychosocial';
import { PsychosocialTickForm } from './PsychosocialTickForm';
import { PersonSelectorBar } from './PersonSelectorBar';
import {
  User,
  HeartPulse,
  Flame,
  ShieldCheck,
  Stethoscope,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  CheckCircle,
  AlertTriangle,
  Activity,
  Calendar,
  FileCheck,
  HelpCircle,
  Globe,
  Languages,
  MapPin,
  Brain,
  Save,
  Database,
  Users,
  UserPlus,
  RefreshCw,
  Check,
  X,
  Pill,
  Building,
  Share2,
} from 'lucide-react';


interface ScreeningFormProps {
  onSaveRecord: (record: ScreeningRecord) => void;
  onCancel: () => void;
  defaultSite?: string;
  activeOutreachSite?: string;
}

export const ScreeningForm: React.FC<ScreeningFormProps> = ({
  onSaveRecord,
  onCancel,
  defaultSite = 'Joubert Park / Inner-City Outreach',
  activeOutreachSite,
}) => {
  const [currentStep, setCurrentStep] = useState(1);

  // Database records & Station queue management
  const [allDbRecords, setAllDbRecords] = useState<ScreeningRecord[]>(() => getCachedRecords());
  const [selectedPersonId, setSelectedPersonId] = useState<string>('');
  const [showCompletedInDropdown, setShowCompletedInDropdown] = useState<boolean>(false);
  const [isSavingTool, setIsSavingTool] = useState<boolean>(false);
  const [stationNotification, setStationNotification] = useState<string | null>(null);

  // Subscribe to real-time database updates
  useEffect(() => {
    const unsubscribe = subscribeToDatabase((latestRecords) => {
      setAllDbRecords(latestRecords);
    });
    return unsubscribe;
  }, []);

  const showStationNotification = (msg: string) => {
    setStationNotification(msg);
    setTimeout(() => setStationNotification(null), 5000);
  };

  // Metadata
  const [outreachSite, setOutreachSite] = useState(activeOutreachSite || defaultSite);
  const [screenerName, setScreenerName] = useState('Sr. N. Khumalo (Clinical Nurse)');
  const [screenerCadre, setScreenerCadre] = useState<
    'Outreach Nurse' | 'Community Healthcare Worker (CHW)' | 'Social Worker' | 'Counselor'
  >('Outreach Nurse');


  // Step 1: Personal Details
  const [fullName, setFullName] = useState('');
  const [alias, setAlias] = useState('');
  const [gender, setGender] = useState<Gender>('Male');
  const [dob, setDob] = useState('');
  const [age, setAge] = useState<number>(26);
  const [nationality, setNationality] = useState<string>('South African (ID Verified)');
  const [homeLanguage, setHomeLanguage] = useState<string>('isiZulu');
  const [physicalAddress, setPhysicalAddress] = useState('Joubert Park Outer Benches, JHB CBD');
  const [race, setRace] = useState<Race>('Black African');
  const [phone, setPhone] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');

  // Step 2: Medical Screening & Vitals
  const [bpSys, setBpSys] = useState<number>(120);
  const [bpDia, setBpDia] = useState<number>(80);
  const [pulse, setPulse] = useState<number>(75);
  const [pulseRhythm, setPulseRhythm] = useState<'regular' | 'irregular'>('regular');
  const [o2Sat, setO2Sat] = useState<number>(98);
  const [weightKg, setWeightKg] = useState<number | undefined>(65);
  const [heightCm, setHeightCm] = useState<number | undefined>(170);
  const [vitalsOutcome, setVitalsOutcome] = useState<'NORMAL' | 'REVIEW' | 'URGENT'>('NORMAL');
  const [vitalsActionNotes, setVitalsActionNotes] = useState<string>('');

  // Additional vitals for completeness
  const [temp, setTemp] = useState<number>(36.6);
  const [bloodGlucose, setBloodGlucose] = useState<number | undefined>(5.4);
  const [respiratoryRate, setRespiratoryRate] = useState<number>(16);

  // Auto-calculated MAP: Diastolic + (Systolic - Diastolic) / 3
  const calculatedMap = Math.round(bpDia + (bpSys - bpDia) / 3);
  // Auto-calculated BMI: Weight (kg) / [Height (m)]^2
  const calculatedBmi = weightKg && heightCm ? parseFloat((weightKg / Math.pow(heightCm / 100, 2)).toFixed(1)) : undefined;

  const [chronicConditions, setChronicConditions] = useState<ChronicCondition[]>(['None']);
  const [chronicNotes, setChronicNotes] = useState('');

  const [presentComplaints, setPresentComplaints] = useState<PresentComplaint[]>([
    'None / General Checkup',
  ]);
  const [complaintNotes, setComplaintNotes] = useState('');
  const [tbSymptomatic, setTbSymptomatic] = useState(false);

  // HTS (Step 3: HIV Testing Services)
  const [hivStatusKnown, setHivStatusKnown] = useState<HtsStatusKnown>('No');
  const [priorStatus, setPriorStatus] = useState<'Positive' | 'Negative' | 'Unknown' | undefined>(undefined);
  const [acceptHtsTest, setAcceptHtsTest] = useState<AcceptHtsTest>('Yes');
  const [htsResult, setHtsResult] = useState<HtsResult>('Non-Reactive (Negative)');
  const [onArt, setOnArt] = useState<ArtStatus>('Not Applicable (HIV Negative)');
  const [prepOffered, setPrepOffered] = useState(true);
  const [condomsDistributed, setCondomsDistributed] = useState<number>(10);
  const [htsNotes, setHtsNotes] = useState('');
  // User requested HTS additions:
  const [htsReferral, setHtsReferral] = useState<'Yes' | 'No' | ''>('No');
  const [htsReferralFacility, setHtsReferralFacility] = useState<string>('Dunwell Youth Priority Clinic');
  const [htsAdherence, setHtsAdherence] = useState<string>('Takes daily as prescribed (Good Adherence)');
  const [htsMedicationLocation, setHtsMedicationLocation] = useState<string>('Dunwell Youth Priority Clinic');

  // Step 4: Substance Use & Rehab Screening
  const [alcoholFrequency, setAlcoholFrequency] = useState<AlcoholFrequency>('Weekly (1-3 days)');
  const [drugFrequency, setDrugFrequency] = useState<DrugFrequency>('Never');
  const [substanceTypes, setSubstanceTypes] = useState<SubstanceType[]>(['None']);
  const [substanceNotes, setSubstanceNotes] = useState('');
  const [injectingDrugUse, setInjectingDrugUse] = useState(false);
  const [rehabInterest, setRehabInterest] = useState<RehabInterest>('No / Not interested');

  // Step 4: Psychosocial & Mental Health Screening Tick Form
  const [psychosocialScreening, setPsychosocialScreening] = useState<PsychosocialScreening>({
    symptoms: { ...DEFAULT_PSYCHOSOCIAL_SYMPTOMS },
    analysis: calculatePsychosocialAnalysis(DEFAULT_PSYCHOSOCIAL_SYMPTOMS),
    counselingAccepted: true,
    socialWorkerReferral: false,
    safetyPlanInitiated: false,
    screenerNotes: '',
  });

  // Step 5: Clinical Action Plan & Referrals
  const [triageLevel, setTriageLevel] = useState<TriageLevel>('Routine / Stable');
  const [immediateCare, setImmediateCare] = useState<string[]>([
    'Vitals Assessment',
    'General Health Education',
  ]);
  const [referralDestination, setReferralDestination] = useState<string>('Dunwell Youth Priority Clinic (Walk-in)');
  const [medicationsDispensed, setMedicationsDispensed] = useState<string[]>([
    'Multivitamins (30 days)',
    'Condom Pack (10 pcs)',
  ]);
  const [newMedInput, setNewMedInput] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [actionNotes, setActionNotes] = useState('');

  // Auto calculate age from DOB
  const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDob(val);
    if (val) {
      const birth = new Date(val);
      const diff = Date.now() - birth.getTime();
      const calculatedAge = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
      if (!isNaN(calculatedAge) && calculatedAge >= 0 && calculatedAge < 120) {
        setAge(calculatedAge);
      }
    }
  };

  // Toggle chronic condition
  const toggleChronic = (cond: ChronicCondition) => {
    if (cond === 'None') {
      setChronicConditions(['None']);
      return;
    }
    const filtered = chronicConditions.filter((c) => c !== 'None');
    if (filtered.includes(cond)) {
      const next = filtered.filter((c) => c !== cond);
      setChronicConditions(next.length ? next : ['None']);
    } else {
      setChronicConditions([...filtered, cond]);
    }
  };

  // Toggle complaint
  const toggleComplaint = (comp: PresentComplaint) => {
    if (comp === 'None / General Checkup') {
      setPresentComplaints(['None / General Checkup']);
      setTbSymptomatic(false);
      return;
    }
    const filtered = presentComplaints.filter((c) => c !== 'None / General Checkup');
    let next: PresentComplaint[];
    if (filtered.includes(comp)) {
      next = filtered.filter((c) => c !== comp);
    } else {
      next = [...filtered, comp];
    }
    setPresentComplaints(next);

    // Auto flag TB symptom if cough or night sweats
    if (next.includes('Persistent Cough (> 2 weeks)') || next.includes('Fever / Night Sweats / Chills')) {
      setTbSymptomatic(true);
    }
  };

  // Toggle substance
  const toggleSubstance = (sub: SubstanceType) => {
    if (sub === 'None') {
      setSubstanceTypes(['None']);
      return;
    }
    const filtered = substanceTypes.filter((s) => s !== 'None');
    if (filtered.includes(sub)) {
      const next = filtered.filter((s) => s !== sub);
      setSubstanceTypes(next.length ? next : ['None']);
    } else {
      setSubstanceTypes([...filtered, sub]);
    }
  };

  const handleAddMed = () => {
    if (newMedInput.trim()) {
      setMedicationsDispensed([...medicationsDispensed, newMedInput.trim()]);
      setNewMedInput('');
    }
  };

  const handleRemoveMed = (index: number) => {
    setMedicationsDispensed(medicationsDispensed.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      alert('Please enter client full name.');
      setCurrentStep(1);
      return;
    }

    const existingRec = selectedPersonId ? allDbRecords.find((r) => r.id === selectedPersonId) : undefined;
    const uniqueId = existingRec ? existingRec.id : 'rec-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4);
    const refNum = existingRec ? existingRec.refNumber : `COJ-DUN-2026-${Math.floor(100 + Math.random() * 900)}`;
    const createdTimestamp = existingRec ? existingRec.createdAt : new Date().toISOString();

    const newRecord: ScreeningRecord = {
      id: uniqueId,
      refNumber: refNum,
      createdAt: createdTimestamp,
      updatedAt: new Date().toISOString(),
      outreachSite,
      screenerName,
      personal: {
        fullName: fullName.trim(),
        alias: alias.trim() || undefined,
        gender,
        dob: dob || undefined,
        age,
        nationality: nationality.trim() || 'South African (Undocumented)',
        homeLanguage: homeLanguage.trim() || 'isiZulu',
        physicalAddress: physicalAddress.trim() || 'Johannesburg Inner-City Outreach',
        race,
        phone: phone.trim() || undefined,
        emergencyContact: emergencyContact.trim() || undefined,
      },
      medical: {
        vitals: {
          bloodPressureSys: Number(bpSys) || 120,
          bloodPressureDia: Number(bpDia) || 80,
          pulseRate: Number(pulse) || 75,
          pulseRhythm,
          temperature: Number(temp) || 36.6,
          weightKg: weightKg ? Number(weightKg) : undefined,
          heightCm: heightCm ? Number(heightCm) : undefined,
          bmi: calculatedBmi,
          map: calculatedMap,
          bloodGlucose: bloodGlucose ? Number(bloodGlucose) : undefined,
          respiratoryRate: Number(respiratoryRate) || 16,
          oxygenSaturation: Number(o2Sat) || 98,
          vitalsOutcome,
          actionTakenNotes: vitalsActionNotes.trim() || undefined,
        },
        chronicConditions,
        chronicConditionsNotes: chronicNotes.trim() || undefined,
        presentComplaints: presentComplaints.length ? presentComplaints : ['None / General Checkup'],
        presentComplaintsNotes: complaintNotes.trim() || undefined,
        tbScreeningSymptomatic: tbSymptomatic,
      },
      hts: {
        hivStatusKnown,
        priorStatus: hivStatusKnown === 'Yes' ? (priorStatus || 'Unknown') : undefined,
        acceptHtsTest,
        testResult: htsResult,
        onArt,
        prepOffered,
        condomsDistributed: Number(condomsDistributed) || 0,
        notes: htsNotes.trim() || undefined,
        referral: htsReferral,
        referralFacility: htsReferral === 'Yes' ? htsReferralFacility : undefined,
        adherence: htsAdherence.trim() || undefined,
        medicationLocation: htsMedicationLocation.trim() || undefined,
      },
      substance: {
        alcoholUseFrequency: alcoholFrequency,
        drugUseFrequency: drugFrequency,
        substanceTypes,
        substanceNotes: substanceNotes.trim() || undefined,
        injectingDrugUse,
        interestInRehabSupport: rehabInterest,
        referralRequested: rehabInterest.startsWith('Yes'),
      },
      psychosocial: psychosocialScreening,
      actionPlan: {
        immediateIntervention: immediateCare.length ? immediateCare : ['Routine Outreach Assessment'],
        referralDestination,
        medicationsDispensed: medicationsDispensed.length ? medicationsDispensed : undefined,
        followUpDate: followUpDate || undefined,
        screenerNotes: actionNotes.trim() || undefined,
        triageLevel,
      },
      completedTools: ['personal', 'vitals', 'hts', 'substance', 'psychosocial', 'actionPlan'],
      isFullyCompleted: true,
    };

    try {
      setIsSavingTool(true);
      const saved = await saveFullRecord(newRecord);
      showStationNotification(
        `✓ Screening complete & saved for ${saved.personal.fullName} (Ref: ${saved.refNumber})! Added to database ledger.`
      );
      onSaveRecord(saved);
    } catch (err: any) {
      alert(`Error saving completed screening: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsSavingTool(false);
    }
  };

  // Helper to load person's existing data into form fields
  const loadPersonIntoForm = (rec: ScreeningRecord) => {
    // 1. Personal
    setFullName(rec.personal.fullName);
    setAlias(rec.personal.alias || '');
    setGender(rec.personal.gender);
    setDob(rec.personal.dob || '');
    setAge(rec.personal.age);
    setNationality(rec.personal.nationality);
    setHomeLanguage(rec.personal.homeLanguage || 'isiZulu');
    setPhysicalAddress(rec.personal.physicalAddress);
    setRace(rec.personal.race);
    setPhone(rec.personal.phone || '');
    setEmergencyContact(rec.personal.emergencyContact || '');

    // 2. Vitals & Medical
    setBpSys(rec.medical.vitals.bloodPressureSys);
    setBpDia(rec.medical.vitals.bloodPressureDia);
    setPulse(rec.medical.vitals.pulseRate);
    setPulseRhythm(rec.medical.vitals.pulseRhythm || 'regular');
    setTemp(rec.medical.vitals.temperature || 36.6);
    setWeightKg(rec.medical.vitals.weightKg);
    setHeightCm(rec.medical.vitals.heightCm);
    setBloodGlucose(rec.medical.vitals.bloodGlucose);
    setRespiratoryRate(rec.medical.vitals.respiratoryRate || 16);
    setO2Sat(rec.medical.vitals.oxygenSaturation || 98);
    setVitalsOutcome(rec.medical.vitals.vitalsOutcome || 'NORMAL');
    setVitalsActionNotes(rec.medical.vitals.actionTakenNotes || '');
    setChronicConditions(rec.medical.chronicConditions);
    setChronicNotes(rec.medical.chronicConditionsNotes || '');
    setPresentComplaints(rec.medical.presentComplaints);
    setComplaintNotes(rec.medical.presentComplaintsNotes || '');
    setTbSymptomatic(rec.medical.tbScreeningSymptomatic);

    // 3. HTS
    setHivStatusKnown(rec.hts.hivStatusKnown);
    setPriorStatus(rec.hts.priorStatus);
    setAcceptHtsTest(rec.hts.acceptHtsTest);
    setHtsResult(rec.hts.testResult);
    setOnArt(rec.hts.onArt);
    setPrepOffered(rec.hts.prepOffered);
    setCondomsDistributed(rec.hts.condomsDistributed);
    setHtsNotes(rec.hts.notes || '');
    setHtsReferral(rec.hts.referral || 'No');
    setHtsReferralFacility(rec.hts.referralFacility || 'Dunwell Youth Priority Clinic');
    setHtsAdherence(rec.hts.adherence || 'Takes daily as prescribed (Good Adherence)');
    setHtsMedicationLocation(rec.hts.medicationLocation || 'Dunwell Youth Priority Clinic');

    // 4. Substance
    setAlcoholFrequency(rec.substance.alcoholUseFrequency);
    setDrugFrequency(rec.substance.drugUseFrequency);
    setSubstanceTypes(rec.substance.substanceTypes);
    setSubstanceNotes(rec.substance.substanceNotes || '');
    setInjectingDrugUse(rec.substance.injectingDrugUse);
    setRehabInterest(rec.substance.interestInRehabSupport);

    // 4. Psychosocial
    if (rec.psychosocial) {
      setPsychosocialScreening(rec.psychosocial);
    }

    // 5. Action Plan
    setTriageLevel(rec.actionPlan.triageLevel);
    setImmediateCare(rec.actionPlan.immediateIntervention);
    setReferralDestination(rec.actionPlan.referralDestination || 'Dunwell Youth Priority Clinic (Walk-in)');
    setMedicationsDispensed(rec.actionPlan.medicationsDispensed || []);
    setFollowUpDate(rec.actionPlan.followUpDate || '');
    setActionNotes(rec.actionPlan.screenerNotes || '');
  };

  const handleClearForNewClient = () => {
    setSelectedPersonId('');
    setFullName('');
    setAlias('');
    setGender('Male');
    setDob('');
    setAge(26);
    setNationality('South African (ID Verified)');
    setHomeLanguage('isiZulu');
    setPhysicalAddress('Joubert Park Outer Benches, JHB CBD');
    setRace('Black African');
    setPhone('');
    setEmergencyContact('');
    setHtsReferral('No');
    setHtsReferralFacility('Dunwell Youth Priority Clinic');
    setHtsAdherence('Takes daily as prescribed (Good Adherence)');
    setHtsMedicationLocation('Dunwell Youth Priority Clinic');
  };

  const handleSelectPerson = (personId: string) => {
    setSelectedPersonId(personId);
    if (!personId) return;
    const found = allDbRecords.find((r) => r.id === personId);
    if (found) {
      loadPersonIntoForm(found);
    }
  };

  // Tool mapping for the steps (6-tool clinical workflow)
  const toolIdForStep: Record<number, ScreeningToolId> = {
    1: 'personal',
    2: 'vitals',
    3: 'hts',
    4: 'substance',
    5: 'psychosocial',
    6: 'actionPlan',
  };

  const currentToolId = toolIdForStep[currentStep] || 'personal';

  // Get pending / completed lists per tool
  const pendingByTool = (tid: ScreeningToolId) =>
    allDbRecords.filter((r) => !r.completedTools || !r.completedTools.includes(tid));

  const completedByTool = (tid: ScreeningToolId) =>
    allDbRecords.filter((r) => r.completedTools && r.completedTools.includes(tid));

  const currentPendingPersons = pendingByTool(currentToolId);
  const currentCompletedPersons = completedByTool(currentToolId);
  const activeSelectedPerson = allDbRecords.find((r) => r.id === selectedPersonId);

  // When step changes, if selected person is not pending for this step, pick the first pending person
  useEffect(() => {
    if (currentStep > 1) {
      const pending = pendingByTool(currentToolId);
      if (selectedPersonId) {
        const stillPending = pending.some((p) => p.id === selectedPersonId);
        if (!stillPending && pending.length > 0) {
          setSelectedPersonId(pending[0].id);
          loadPersonIntoForm(pending[0]);
        }
      } else if (pending.length > 0) {
        setSelectedPersonId(pending[0].id);
        loadPersonIntoForm(pending[0]);
      }
    }
  }, [currentStep, allDbRecords.length]);

  // SAVE TOOL INFO HANDLER (Core user requirement):
  // "on each screening tool should press save info and it saves on the record of each person
  // meaning after personal details the rest of the tools should have a drop down to select a person
  // after clicking save should remove the name of the drop down because im done with the person"
  const handleSaveToolInfo = async (toolId: ScreeningToolId) => {
    if (toolId === 'personal') {
      if (!fullName.trim()) {
        alert('Please enter client full name before saving personal details.');
        return;
      }
      setIsSavingTool(true);
      try {
        const savedPerson = await savePersonDetails(
          {
            fullName: fullName.trim(),
            alias: alias.trim() || undefined,
            gender,
            dob: dob || undefined,
            age,
            nationality: nationality.trim() || 'South African (ID Verified)',
            homeLanguage: homeLanguage.trim() || 'isiZulu',
            physicalAddress: physicalAddress.trim() || 'Johannesburg Inner-City Outreach',
            race,
            phone: phone.trim() || undefined,
            emergencyContact: emergencyContact.trim() || undefined,
          },
          {
            outreachSite,
            screenerName,
            existingRecordId: selectedPersonId || undefined,
          }
        );

        setSelectedPersonId(savedPerson.id);
        showStationNotification(
          `✓ Client Enrolled: "${savedPerson.personal.fullName}" saved in database! Ready in screening tool dropdowns.`
        );
        onSaveRecord(savedPerson);
      } catch (err: any) {
        alert(`Error saving personal details: ${err?.message || 'Unknown error'}`);
      } finally {
        setIsSavingTool(false);
      }
      return;
    }

    // Steps 2 through 6:
    if (!selectedPersonId) {
      alert('Please select a person from the dropdown first.');
      return;
    }

    const activeRec = allDbRecords.find((r) => r.id === selectedPersonId);
    const clientName = activeRec ? activeRec.personal.fullName : 'Selected Client';

    setIsSavingTool(true);
    try {
      const updated = await saveToolForPerson(selectedPersonId, toolId, {
        ...(toolId === 'vitals'
          ? {
              medical: {
                vitals: {
                  bloodPressureSys: Number(bpSys) || 120,
                  bloodPressureDia: Number(bpDia) || 80,
                  pulseRate: Number(pulse) || 75,
                  pulseRhythm,
                  temperature: Number(temp) || 36.6,
                  weightKg: weightKg ? Number(weightKg) : undefined,
                  heightCm: heightCm ? Number(heightCm) : undefined,
                  bmi: calculatedBmi,
                  map: calculatedMap,
                  bloodGlucose: bloodGlucose ? Number(bloodGlucose) : undefined,
                  respiratoryRate: Number(respiratoryRate) || 16,
                  oxygenSaturation: Number(o2Sat) || 98,
                  vitalsOutcome,
                  actionTakenNotes: vitalsActionNotes.trim() || undefined,
                },
                chronicConditions,
                chronicConditionsNotes: chronicNotes.trim() || undefined,
                presentComplaints: presentComplaints.length ? presentComplaints : ['None / General Checkup'],
                presentComplaintsNotes: complaintNotes.trim() || undefined,
                tbScreeningSymptomatic: tbSymptomatic,
              },
            }
          : {}),
        ...(toolId === 'hts'
          ? {
              hts: {
                hivStatusKnown,
                priorStatus: hivStatusKnown === 'Yes' ? (priorStatus || 'Unknown') : undefined,
                acceptHtsTest,
                testResult: htsResult,
                onArt,
                prepOffered,
                condomsDistributed: Number(condomsDistributed) || 0,
                notes: htsNotes.trim() || undefined,
                referral: htsReferral,
                referralFacility: htsReferral === 'Yes' ? htsReferralFacility : undefined,
                adherence: htsAdherence.trim() || undefined,
                medicationLocation: htsMedicationLocation.trim() || undefined,
              },
            }
          : {}),
        ...(toolId === 'substance'
          ? {
              substance: {
                alcoholUseFrequency: alcoholFrequency,
                drugUseFrequency: drugFrequency,
                substanceTypes,
                substanceNotes: substanceNotes.trim() || undefined,
                injectingDrugUse,
                interestInRehabSupport: rehabInterest,
                referralRequested: rehabInterest.startsWith('Yes'),
              },
            }
          : {}),
        ...(toolId === 'psychosocial'
          ? {
              psychosocial: psychosocialScreening,
            }
          : {}),
        ...(toolId === 'actionPlan'
          ? {
              actionPlan: {
                immediateIntervention: immediateCare.length ? immediateCare : ['Routine Outreach Assessment'],
                referralDestination,
                medicationsDispensed: medicationsDispensed.length ? medicationsDispensed : undefined,
                followUpDate: followUpDate || undefined,
                screenerNotes: actionNotes.trim() || undefined,
                triageLevel,
              },
            }
          : {}),
      });

      // User directive: "after clicking save should remove the name of the drop down because im done with the person"
      // Tool is now marked in completedTools, so getPendingPersonsForTool no longer has this person
      showStationNotification(
        `✓ Info Saved for ${clientName}! ${clientName} marked complete and removed from this dropdown queue.`
      );

      // Auto-advance to next pending person in this tool's queue, or clear
      const remainingPending = allDbRecords.filter(
        (r) => r.id !== selectedPersonId && (!r.completedTools || !r.completedTools.includes(toolId))
      );

      if (remainingPending.length > 0) {
        setSelectedPersonId(remainingPending[0].id);
        loadPersonIntoForm(remainingPending[0]);
      } else {
        setSelectedPersonId('');
      }

      onSaveRecord(updated);
    } catch (err: any) {
      alert(`Error saving screening info: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsSavingTool(false);
    }
  };

  // Steps Navigation with live pending count badges (6-Step Clinical Intake Flow)
  const steps = [
    { num: 1, title: 'Personal Details', toolId: 'personal' as ScreeningToolId, icon: User },
    { num: 2, title: 'Vitals Signs', toolId: 'vitals' as ScreeningToolId, icon: HeartPulse },
    { num: 3, title: 'HTS Screening', toolId: 'hts' as ScreeningToolId, icon: ShieldCheck },
    { num: 4, title: 'Substance & Rehab', toolId: 'substance' as ScreeningToolId, icon: Flame },
    { num: 5, title: 'Psychosocial Tick Form', toolId: 'psychosocial' as ScreeningToolId, icon: Brain },
    { num: 6, title: 'Clinical Action Plan', toolId: 'actionPlan' as ScreeningToolId, icon: Stethoscope },
  ];


  return (
    <div className="bg-white border border-slate-300 rounded-2xl shadow-lg overflow-hidden text-slate-900">
      {/* Header bar */}
      <div className="bg-blue-950 p-5 border-b border-blue-900 flex flex-col md:flex-row md:items-center justify-between gap-4 text-white">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-xs font-black uppercase tracking-wide">
              New Outreach Screening Intake
            </span>
            <span className="text-xs text-blue-200 font-medium">Dunwell Clinic & City of Johannesburg</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1 tracking-tight">
            Homeless Outreach Clinical Intake
          </h2>
          <p className="text-xs text-blue-200/90">
            Easy-to-use clinical screening ledger with touchscreen digital consent attestation
          </p>
        </div>

        {/* Outreach Metadata selectors */}
        <div className="flex flex-wrap gap-2.5 text-xs">
          <div className="bg-blue-900/60 border border-blue-800 px-3 py-1.5 rounded-xl">
            <span className="text-blue-300 block text-[10px] uppercase font-bold">Outreach Hotspot:</span>
            <select
              value={outreachSite}
              onChange={(e) => setOutreachSite(e.target.value)}
              className="bg-transparent text-amber-300 font-bold focus:outline-none cursor-pointer"
            >
              {OUTREACH_SITES.map((site) => (
                <option key={site} value={site} className="bg-slate-900 text-white">
                  {site}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-blue-900/60 border border-blue-800 px-3 py-1.5 rounded-xl">
            <span className="text-blue-300 block text-[10px] uppercase font-bold">Healthcare Nurse / Screener:</span>
            <input
              type="text"
              value={screenerName}
              onChange={(e) => setScreenerName(e.target.value)}
              className="bg-transparent text-white font-medium focus:outline-none w-44"
            />
          </div>
        </div>
      </div>

      {/* Step Tabs indicator with live queue count badges */}
      <div className="bg-slate-100 px-4 py-3 border-b border-slate-300 flex overflow-x-auto gap-2">
        {steps.map((step) => {
          const Icon = step.icon;
          const isActive = currentStep === step.num;
          const isDone = currentStep > step.num;
          const pendingCount = pendingByTool(step.toolId).length;

          return (
            <button
              key={step.num}
              type="button"
              onClick={() => setCurrentStep(step.num)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                isActive
                  ? 'bg-blue-900 text-white shadow-md'
                  : isDone
                  ? 'bg-blue-100 text-blue-950 border border-blue-200 hover:bg-blue-200'
                  : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold ${
                  isActive ? 'bg-amber-400 text-slate-950' : isDone ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {isDone ? '✓' : step.num}
              </span>
              <Icon className="w-3.5 h-3.5" />
              <span>{step.title}</span>
              {step.num > 1 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                    pendingCount > 0
                      ? isActive
                        ? 'bg-amber-400 text-slate-950'
                        : 'bg-amber-200 text-amber-950'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                  title={`${pendingCount} persons waiting for ${step.title}`}
                >
                  {pendingCount} wait
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Station Notification Alert Banner */}
      {stationNotification && (
        <div className="bg-emerald-500 text-slate-950 px-5 py-2.5 text-xs sm:text-sm font-black flex items-center justify-between shadow-md animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-slate-950 shrink-0" />
            <span>{stationNotification}</span>
          </div>
          <button
            type="button"
            onClick={() => setStationNotification(null)}
            className="text-slate-950 hover:opacity-75 font-black text-sm ml-2 cursor-pointer"
          >
            ×
          </button>
        </div>
      )}

      {/* Form Body */}
      <form onSubmit={handleSubmit} className="p-5 sm:p-7 space-y-6">
        {/* STEP 1: PERSONAL DETAILS */}
        {currentStep === 1 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="border-l-4 border-amber-500 pl-3">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <span className="text-amber-600 font-mono">1.</span> Personal Details (From Ledger)
              </h3>
              <p className="text-xs text-slate-600">
                Register person's demographics. Press <strong>"Save Info & Enroll"</strong> to save to database. They will immediately become available in all subsequent screening tool dropdowns!
              </p>
            </div>

            {/* PERSONAL DETAILS DATABASE TOOLBAR */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-amber-800" />
                    <h4 className="text-xs font-black uppercase text-amber-950 tracking-wider">
                      Client Database Registry ({allDbRecords.length} Enrolled Persons)
                    </h4>
                  </div>
                  <p className="text-xs text-amber-900/90 mt-0.5">
                    Enter details below and click <strong>"Save Info & Enroll Person"</strong>.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                  {allDbRecords.length > 0 && (
                    <select
                      value={selectedPersonId}
                      onChange={(e) => {
                        if (!e.target.value) {
                          handleClearForNewClient();
                        } else {
                          handleSelectPerson(e.target.value);
                        }
                      }}
                      className="bg-white border-2 border-amber-400 text-slate-900 font-extrabold text-xs rounded-xl px-3 py-2 shadow-sm focus:outline-none"
                    >
                      <option value="">+ Enroll Brand New Person</option>
                      {allDbRecords.map((p) => (
                        <option key={p.id} value={p.id}>
                          Edit: {p.personal.fullName} ({p.personal.age}y {p.personal.gender}) - {p.refNumber}
                        </option>
                      ))}
                    </select>
                  )}

                  {selectedPersonId && (
                    <button
                      type="button"
                      onClick={handleClearForNewClient}
                      className="text-[11px] text-amber-900 hover:text-amber-950 font-bold underline"
                    >
                      Clear / New
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleSaveToolInfo('personal')}
                    disabled={isSavingTool || !fullName.trim()}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black shadow-md transition ${
                      !fullName.trim() || isSavingTool
                        ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer transform active:scale-95'
                    }`}
                  >
                    <Save className="w-4 h-4" />
                    <span>{selectedPersonId ? 'Update Info in DB' : 'Save Info & Enroll Person'}</span>
                  </button>
                </div>
              </div>

              {activeSelectedPerson && (
                <div className="pt-2 border-t border-amber-200/80 flex flex-wrap items-center gap-2 text-xs text-amber-950">
                  <span className="font-black bg-amber-200 px-2 py-0.5 rounded text-[10px]">CURRENT PERSON:</span>
                  <span className="font-extrabold">{activeSelectedPerson.personal.fullName}</span>
                  <span>• Ref: {activeSelectedPerson.refNumber}</span>
                  <span>• Age: {activeSelectedPerson.personal.age}y ({activeSelectedPerson.personal.gender})</span>
                  <span>• Completed: {activeSelectedPerson.completedTools?.join(', ') || 'personal'}</span>
                </div>
              )}
            </div>


            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* 1. Full Name */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  1. Full Name <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sipho Bongani Mthembu"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-900 focus:ring-2 focus:ring-blue-100 shadow-sm"
                />
              </div>

              {/* Alias / Street name */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Street Alias / Nickname</label>
                <input
                  type="text"
                  placeholder="e.g. Spikes / Bra Joe"
                  value={alias}
                  onChange={(e) => setAlias(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-900 focus:ring-2 focus:ring-blue-100 shadow-sm"
                />
              </div>

              {/* 2. Gender */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">2. Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as Gender)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-900 shadow-sm"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Transgender">Transgender</option>
                  <option value="Non-Binary">Non-Binary</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* 3. DOB / Age */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  3. DOB / Age
                  {age <= 35 && (
                    <span className="ml-2 text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold border border-emerald-300">
                      ★ Dunwell Youth Priority (≤35)
                    </span>
                  )}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={dob}
                    onChange={handleDobChange}
                    className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-900 shadow-sm"
                  />
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={12}
                      max={95}
                      value={age}
                      onChange={(e) => setAge(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-900 shadow-sm font-semibold"
                    />
                    <span className="text-xs text-slate-600 font-bold">yrs</span>
                  </div>
                </div>
              </div>

              {/* 4. Nationality (Manual Entry) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-blue-900" />
                    <span>4. Nationality (Enter Manual)</span>
                  </label>
                  <span className="text-[10px] text-blue-800 font-semibold">Type manually or pick</span>
                </div>
                <input
                  type="text"
                  list="nationality-suggestions"
                  placeholder="Type nationality (e.g. South African, Zimbabwean, Mozambican...)"
                  value={nationality}
                  onChange={(e) => setNationality(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-900 focus:ring-2 focus:ring-blue-100 shadow-sm font-semibold"
                />
                <datalist id="nationality-suggestions">
                  {SUGGESTED_NATIONALITIES.map((nat) => (
                    <option key={nat} value={nat} />
                  ))}
                </datalist>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {['South African (ID Verified)', 'South African (Undocumented)', 'Zimbabwean', 'Mozambican', 'Lesotho', 'Malawian'].map(
                    (quickNat) => (
                      <button
                        key={quickNat}
                        type="button"
                        onClick={() => setNationality(quickNat)}
                        className={`text-[10px] px-2 py-0.5 rounded-md font-bold border transition ${
                          nationality === quickNat
                            ? 'bg-blue-900 text-white border-blue-950'
                            : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        {quickNat.split(' ')[0]}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* 5. Home Language */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Languages className="w-3.5 h-3.5 text-amber-600" />
                    <span>5. Home Language</span>
                  </label>
                  <span className="text-[10px] text-amber-800 font-semibold">Primary communication</span>
                </div>
                <input
                  type="text"
                  list="language-suggestions"
                  placeholder="e.g. isiZulu, Sesotho, isiXhosa, English..."
                  value={homeLanguage}
                  onChange={(e) => setHomeLanguage(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-900 focus:ring-2 focus:ring-blue-100 shadow-sm font-semibold"
                />
                <datalist id="language-suggestions">
                  {OFFICIAL_LANGUAGES_SA.map((lang) => (
                    <option key={lang} value={lang} />
                  ))}
                </datalist>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {['isiZulu', 'Sesotho', 'isiXhosa', 'Setswana', 'English', 'Afrikaans', 'Shona'].map((quickLang) => (
                    <button
                      key={quickLang}
                      type="button"
                      onClick={() => setHomeLanguage(quickLang)}
                      className={`text-[10px] px-2 py-0.5 rounded-md font-bold border transition ${
                        homeLanguage === quickLang
                          ? 'bg-amber-500 text-slate-950 border-amber-600'
                          : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      {quickLang}
                    </button>
                  ))}
                </div>
              </div>

              {/* 6. Physical Address / Shelter / Corner / Park Bench */}
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-600" />
                    <span>6. Physical Address / Shelter / Corner / Park Bench</span>
                  </label>
                  <span className="text-[10px] text-slate-500">Exact street spot for follow-up outreach</span>
                </div>
                <input
                  type="text"
                  placeholder="e.g. Joubert Park Pavilion & Greenhouse, 3 Kotze Shelter Bed #4, Braamfontein Bridge Underpass"
                  value={physicalAddress}
                  onChange={(e) => setPhysicalAddress(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-900 shadow-sm font-medium"
                />
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  <span className="text-[10px] text-slate-500 font-bold self-center">Quick Spots:</span>
                  {[
                    'Joubert Park Pavilion & Greenhouse Corner',
                    'Highpoint Park & Pretorius Street, Hillbrow',
                    '3 Kotze Homeless Assessment Center, Selby',
                    'Nelson Mandela Bridge Underpass, Braamfontein',
                    'Marshalltown Abandoned Building, City Center',
                    'Park Station Wanderers Concourse',
                  ].map((spot) => (
                    <button
                      key={spot}
                      type="button"
                      onClick={() => setPhysicalAddress(spot)}
                      className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 hover:bg-blue-50 hover:text-blue-900 hover:border-blue-300 transition"
                    >
                      {spot.split(',')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* 7. Race */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">7. Population Group / Race</label>
                <select
                  value={race}
                  onChange={(e) => setRace(e.target.value as Race)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-900 shadow-sm"
                >
                  <option value="Black African">Black African</option>
                  <option value="Coloured">Coloured</option>
                  <option value="White">White</option>
                  <option value="Indian/Asian">Indian/Asian</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Contact phone if available */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">Mobile Contact (if active)</label>
                <input
                  type="text"
                  placeholder="e.g. 071 234 5678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-900 shadow-sm"
                />
              </div>

              {/* Emergency Contact */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-800 mb-1">Emergency Contact / Family / Peer Leader</label>
                <input
                  type="text"
                  placeholder="e.g. Sister in Soweto (082 555 1234) or Peer leader John"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-900 shadow-sm"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: MEDICAL SCREENING & HTS */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="border-l-4 border-amber-500 pl-3">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <span className="text-amber-600 font-mono">2.</span> Medical Screening & Vitals
              </h3>
              <p className="text-xs text-slate-600">
                Record baseline physical observations, chronic conditions, acute complaints, and HIV testing services (HTS).
              </p>
            </div>

            {/* TOOL 2 PERSON SELECTOR BAR (Vitals) */}
            <PersonSelectorBar
              toolId="vitals"
              toolTitle="2. Medical Screening & Vitals"
              selectedPersonId={selectedPersonId}
              onSelectPerson={handleSelectPerson}
              onSaveToolInfo={() => handleSaveToolInfo('vitals')}
              isSaving={isSavingTool}
              activePerson={activeSelectedPerson}
              pendingPersons={pendingByTool('vitals')}
              completedPersons={completedByTool('vitals')}
              showCompleted={showCompletedInDropdown}
              onToggleShowCompleted={setShowCompletedInDropdown}
              onGoToPersonalDetails={() => setCurrentStep(1)}
            />


            {/* 1.1 VITAL SIGNS — RECORD MEASUREMENTS (Matching Clinical Field Outreach Chart) */}
            <div className="bg-white rounded-2xl border-2 border-slate-400 overflow-hidden shadow-sm space-y-0">
              {/* Header Bar */}
              <div className="bg-slate-900 text-white px-5 py-3 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-amber-400" />
                  <h4 className="text-sm sm:text-base font-black tracking-wide uppercase">
                    1.1 Vital Signs — Record Measurements
                  </h4>
                </div>
                <span className="text-[11px] font-mono text-slate-300">
                  Standard Clinical Range & Protocol
                </span>
              </div>

              {/* Table Container */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-300 text-[11px] font-black uppercase tracking-wider text-slate-800">
                      <th className="py-3 px-4 w-1/4">Measurement</th>
                      <th className="py-3 px-4 w-1/4">Reading</th>
                      <th className="py-3 px-3 w-16 text-center">Unit</th>
                      <th className="py-3 px-4">Reference Range / Technique</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-xs text-slate-900">
                    {/* 1. PULSE */}
                    <tr className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 font-black text-slate-950 align-top">
                        <div className="flex items-center gap-1.5">
                          <HeartPulse className="w-4 h-4 text-rose-600" />
                          <span>PULSE</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 align-top">
                        <div className="space-y-1.5">
                          <input
                            type="number"
                            min={30}
                            max={220}
                            placeholder="e.g. 75"
                            value={pulse || ''}
                            onChange={(e) => setPulse(Number(e.target.value))}
                            className="w-full sm:w-36 bg-slate-50 focus:bg-white border-2 border-slate-300 focus:border-blue-900 rounded-xl px-3 py-1.5 text-sm font-bold text-slate-950 shadow-inner"
                          />
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-600">Rhythm:</span>
                            <div className="inline-flex rounded-lg border border-slate-300 p-0.5 bg-slate-100 text-[10px] font-bold">
                              <button
                                type="button"
                                onClick={() => setPulseRhythm('regular')}
                                className={`px-2 py-0.5 rounded-md transition cursor-pointer ${
                                  pulseRhythm === 'regular'
                                    ? 'bg-blue-950 text-white shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                Regular
                              </button>
                              <button
                                type="button"
                                onClick={() => setPulseRhythm('irregular')}
                                className={`px-2 py-0.5 rounded-md transition cursor-pointer ${
                                  pulseRhythm === 'irregular'
                                    ? 'bg-rose-700 text-white shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                Irregular
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-center align-top font-bold text-slate-600">
                        bpm
                      </td>
                      <td className="py-3.5 px-4 align-top">
                        <p className="font-extrabold text-slate-900">
                          Child 70-120 • Adol/Adult 60-100
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Count for 60 seconds. Note rhythm: regular / irregular.
                        </p>
                      </td>
                    </tr>

                    {/* 2. SpO2 */}
                    <tr className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 font-black text-slate-950 align-top">
                        <div className="flex items-center gap-1.5">
                          <Activity className="w-4 h-4 text-blue-600" />
                          <span>SpO2</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 align-top">
                        <input
                          type="number"
                          min={50}
                          max={100}
                          placeholder="e.g. 98"
                          value={o2Sat || ''}
                          onChange={(e) => setO2Sat(Number(e.target.value))}
                          className={`w-full sm:w-36 bg-slate-50 focus:bg-white border-2 rounded-xl px-3 py-1.5 text-sm font-bold shadow-inner ${
                            o2Sat < 92
                              ? 'border-rose-500 text-rose-700 bg-rose-50'
                              : 'border-slate-300 focus:border-blue-900 text-slate-950'
                          }`}
                        />
                      </td>
                      <td className="py-3.5 px-3 text-center align-top font-bold text-slate-600">
                        %
                      </td>
                      <td className="py-3.5 px-4 align-top">
                        <p className="font-extrabold text-slate-900">
                          ≥ 95% on room air
                        </p>
                        <p className="text-[11px] font-bold text-rose-600 mt-0.5 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 inline shrink-0" />
                          &lt;92% = urgent: give oxygen and escalate.
                        </p>
                      </td>
                    </tr>

                    {/* 3. BLOOD PRESSURE */}
                    <tr className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 align-top">
                        <p className="font-black text-slate-950">BLOOD PRESSURE</p>
                        <p className="text-[11px] text-slate-500">systolic / diastolic</p>
                      </td>
                      <td className="py-3 px-4 align-top">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min={60}
                            max={260}
                            placeholder="Sys"
                            value={bpSys || ''}
                            onChange={(e) => setBpSys(Number(e.target.value))}
                            className="w-16 sm:w-20 bg-slate-50 focus:bg-white border-2 border-slate-300 focus:border-blue-900 rounded-xl px-2 py-1.5 text-sm font-bold text-slate-950 text-center shadow-inner"
                          />
                          <span className="text-base font-black text-slate-400">/</span>
                          <input
                            type="number"
                            min={40}
                            max={160}
                            placeholder="Dia"
                            value={bpDia || ''}
                            onChange={(e) => setBpDia(Number(e.target.value))}
                            className="w-16 sm:w-20 bg-slate-50 focus:bg-white border-2 border-slate-300 focus:border-blue-900 rounded-xl px-2 py-1.5 text-sm font-bold text-slate-950 text-center shadow-inner"
                          />
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-center align-top font-bold text-slate-600">
                        mmHg
                      </td>
                      <td className="py-3.5 px-4 align-top">
                        <p className="font-extrabold text-slate-900">
                          Child &lt;120/80 • Adol &lt;130/80 • Adult &lt;140/90 mmHg
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Correct cuff size, arm supported at heart level.
                        </p>
                      </td>
                    </tr>

                    {/* 4. MAP */}
                    <tr className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 font-black text-slate-950 align-top">
                        <span>MAP</span>
                      </td>
                      <td className="py-3 px-4 align-top">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            placeholder="MAP"
                            value={calculatedMap || ''}
                            readOnly
                            className="w-full sm:w-36 bg-slate-100 border-2 border-slate-300 rounded-xl px-3 py-1.5 text-sm font-black text-slate-900 font-mono shadow-inner cursor-not-allowed"
                          />
                          <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-mono font-bold">
                            Auto
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-center align-top font-bold text-slate-600">
                        mmHg
                      </td>
                      <td className="py-3.5 px-4 align-top">
                        <p className="font-extrabold text-slate-900">
                          70-100 mmHg
                        </p>
                        <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                          MAP = Diastolic + (Systolic – Diastolic) ÷ 3
                        </p>
                      </td>
                    </tr>

                    {/* 5. WEIGHT */}
                    <tr className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 font-black text-slate-950 align-top">
                        <span>WEIGHT</span>
                      </td>
                      <td className="py-3 px-4 align-top">
                        <input
                          type="number"
                          step="0.5"
                          min={20}
                          max={250}
                          placeholder="e.g. 65"
                          value={weightKg ?? ''}
                          onChange={(e) => setWeightKg(e.target.value ? Number(e.target.value) : undefined)}
                          className="w-full sm:w-36 bg-slate-50 focus:bg-white border-2 border-slate-300 focus:border-blue-900 rounded-xl px-3 py-1.5 text-sm font-bold text-slate-950 shadow-inner"
                        />
                      </td>
                      <td className="py-3.5 px-3 text-center align-top font-bold text-slate-600">
                        kg
                      </td>
                      <td className="py-3.5 px-4 align-top">
                        <p className="font-extrabold text-slate-900">
                          BMI 18.5-24.9 (record height in cm)
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-600">
                          <span>Light clothing, no shoes.</span>
                          <span className="font-bold text-slate-800">Height:</span>
                          <div className="inline-flex items-center gap-1">
                            <input
                              type="number"
                              min={80}
                              max={230}
                              placeholder="cm"
                              value={heightCm ?? ''}
                              onChange={(e) => setHeightCm(e.target.value ? Number(e.target.value) : undefined)}
                              className="w-16 bg-white border border-slate-300 rounded-lg px-2 py-0.5 text-xs font-bold text-center"
                            />
                            <span>cm</span>
                          </div>
                          {calculatedBmi && (
                            <span className="font-bold text-blue-950 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                              BMI: <strong>{calculatedBmi}</strong>
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* SCREENING OUTCOME (tick one) */}
              <div className="p-4 sm:p-5 bg-slate-50 border-t-2 border-slate-300 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-950">
                    SCREENING OUTCOME (tick one)
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* NORMAL */}
                  <label
                    className={`cursor-pointer rounded-2xl p-4 border-2 transition flex items-start gap-3 relative ${
                      vitalsOutcome === 'NORMAL'
                        ? 'bg-emerald-50/80 border-emerald-600 shadow-sm ring-2 ring-emerald-500/20'
                        : 'bg-white border-slate-300 hover:border-slate-400'
                    }`}
                  >
                    <div className="w-2 self-stretch rounded-full bg-emerald-600 shrink-0" />
                    <input
                      type="radio"
                      name="vitalsOutcome"
                      checked={vitalsOutcome === 'NORMAL'}
                      onChange={() => setVitalsOutcome('NORMAL')}
                      className="mt-1 w-4 h-4 text-emerald-600 border-slate-300 focus:ring-emerald-500"
                    />
                    <div className="space-y-0.5">
                      <span className="block text-sm font-black text-emerald-950 tracking-wide">
                        NORMAL
                      </span>
                      <span className="block text-xs text-emerald-800 font-medium">
                        All readings within range
                      </span>
                    </div>
                  </label>

                  {/* REVIEW */}
                  <label
                    className={`cursor-pointer rounded-2xl p-4 border-2 transition flex items-start gap-3 relative ${
                      vitalsOutcome === 'REVIEW'
                        ? 'bg-amber-50/80 border-amber-500 shadow-sm ring-2 ring-amber-500/20'
                        : 'bg-white border-slate-300 hover:border-slate-400'
                    }`}
                  >
                    <div className="w-2 self-stretch rounded-full bg-amber-500 shrink-0" />
                    <input
                      type="radio"
                      name="vitalsOutcome"
                      checked={vitalsOutcome === 'REVIEW'}
                      onChange={() => setVitalsOutcome('REVIEW')}
                      className="mt-1 w-4 h-4 text-amber-600 border-slate-300 focus:ring-amber-500"
                    />
                    <div className="space-y-0.5">
                      <span className="block text-sm font-black text-amber-950 tracking-wide">
                        REVIEW
                      </span>
                      <span className="block text-xs text-amber-800 font-medium">
                        Repeat readings / observe
                      </span>
                    </div>
                  </label>

                  {/* URGENT */}
                  <label
                    className={`cursor-pointer rounded-2xl p-4 border-2 transition flex items-start gap-3 relative ${
                      vitalsOutcome === 'URGENT'
                        ? 'bg-rose-50/90 border-rose-600 shadow-sm ring-2 ring-rose-500/20'
                        : 'bg-white border-slate-300 hover:border-slate-400'
                    }`}
                  >
                    <div className="w-2 self-stretch rounded-full bg-rose-600 shrink-0" />
                    <input
                      type="radio"
                      name="vitalsOutcome"
                      checked={vitalsOutcome === 'URGENT'}
                      onChange={() => setVitalsOutcome('URGENT')}
                      className="mt-1 w-4 h-4 text-rose-600 border-slate-300 focus:ring-rose-500"
                    />
                    <div className="space-y-0.5">
                      <span className="block text-sm font-black text-rose-950 tracking-wide">
                        URGENT
                      </span>
                      <span className="block text-xs text-rose-800 font-medium">
                        Escalate to clinician now
                      </span>
                    </div>
                  </label>
                </div>

                {/* ACTION TAKEN / NOTES */}
                <div className="pt-2 space-y-1.5">
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-900">
                    ACTION TAKEN / NOTES
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Record clinical actions taken, immediate oxygen or rest advised, repeat vitals timestamps..."
                    value={vitalsActionNotes}
                    onChange={(e) => setVitalsActionNotes(e.target.value)}
                    className="w-full bg-white border-2 border-slate-300 focus:border-blue-900 rounded-xl p-3 text-xs text-slate-900 font-medium focus:outline-none shadow-inner"
                  />
                </div>
              </div>
            </div>

            {/* 2. Chronic Conditions */}
            <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-300 space-y-3 shadow-sm">
              <label className="block text-xs font-black uppercase tracking-wider text-blue-950">
                2. Chronic Conditions
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                {[
                  'Hypertension',
                  'Type 2 Diabetes',
                  'Asthma / COPD',
                  'Tuberculosis (TB)',
                  'Epilepsy',
                  'Mental Health (Depression/Bipolar)',
                  'STI / Genital Ulcers',
                  'Physical Disability / Mobility Impairment',
                  'None',
                  'Other',
                ].map((cond) => {
                  const isSelected = chronicConditions.includes(cond as ChronicCondition);
                  return (
                    <button
                      key={cond}
                      type="button"
                      onClick={() => toggleChronic(cond as ChronicCondition)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold text-left border transition ${
                        isSelected
                          ? 'bg-blue-900 border-blue-950 text-white shadow-sm'
                          : 'bg-white border-slate-300 text-slate-700 hover:border-slate-400'
                      }`}
                    >
                      {cond}
                    </button>
                  );
                })}
              </div>
              <input
                type="text"
                placeholder="Additional notes on chronic conditions or past clinic enrollment..."
                value={chronicNotes}
                onChange={(e) => setChronicNotes(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-900"
              />
            </div>

            {/* 3. Present Complaints */}
            <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-300 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-black uppercase tracking-wider text-blue-950">
                  3. Present Complaints (E.g. Injury, Difficult Breathing)
                </label>
                {tbSymptomatic && (
                  <span className="text-[10px] bg-rose-100 text-rose-800 border border-rose-400 px-2.5 py-0.5 rounded-full font-extrabold">
                    TB Fast-track Screening Indicated
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {[
                  'Acute Injury / Trauma',
                  'Difficult Breathing / Wheezing',
                  'Persistent Cough (> 2 weeks)',
                  'Open Wounds / Abscess / Ulcers',
                  'Skin Rash / Scabies / Itching',
                  'Chest Pain',
                  'Severe Dental Pain',
                  'Fever / Night Sweats / Chills',
                  'Foot Swelling / Trench Foot',
                  'None / General Checkup',
                  'Other',
                ].map((comp) => {
                  const isSelected = presentComplaints.includes(comp as PresentComplaint);
                  return (
                    <button
                      key={comp}
                      type="button"
                      onClick={() => toggleComplaint(comp as PresentComplaint)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold text-left border transition ${
                        isSelected
                          ? 'bg-amber-500 border-amber-600 text-slate-950 shadow-sm'
                          : 'bg-white border-slate-300 text-slate-700 hover:border-slate-400'
                      }`}
                    >
                      {comp}
                    </button>
                  );
                })}
              </div>

              <textarea
                rows={2}
                placeholder="Describe current complaint details (e.g. laceration on arm, onset, triggers, severity)..."
                value={complaintNotes}
                onChange={(e) => setComplaintNotes(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-900"
              />
            </div>

            {/* 4. HTS / HIV Screening */}
            <div className="bg-blue-50/70 p-4 sm:p-5 rounded-2xl border border-blue-200 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-blue-950 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-800" /> 4. HTS / HIV Screening
                </span>
                <span className="text-xs font-bold text-blue-900">Confidential Rapid Finger-Prick Testing</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* HIV Status Known */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">HIV Status Known (Y/N)</label>
                  <select
                    value={hivStatusKnown}
                    onChange={(e) => setHivStatusKnown(e.target.value as HtsStatusKnown)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold"
                  >
                    <option value="No">No (Unknown)</option>
                    <option value="Yes">Yes (Known Status)</option>
                  </select>
                </div>

                {/* Accept HIV Test */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Accept HIV Test (Y/N)</label>
                  <select
                    value={acceptHtsTest}
                    onChange={(e) => setAcceptHtsTest(e.target.value as AcceptHtsTest)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold"
                  >
                    <option value="Yes">Yes (Accepted Rapid Test)</option>
                    <option value="No">No (Declined Test)</option>
                  </select>
                </div>

                {/* Rapid Test Result */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">HTS Rapid Result</label>
                  <select
                    value={htsResult}
                    onChange={(e) => {
                      const res = e.target.value as HtsResult;
                      setHtsResult(res);
                      if (res === 'Reactive (Positive)') {
                        setOnArt('No (Never started)');
                      } else if (res === 'Non-Reactive (Negative)') {
                        setOnArt('Not Applicable (HIV Negative)');
                      }
                    }}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold"
                  >
                    <option value="Non-Reactive (Negative)">Non-Reactive (Negative)</option>
                    <option value="Reactive (Positive)">Reactive (Positive)</option>
                    <option value="Declined">Declined</option>
                    <option value="Not Done">Not Done</option>
                  </select>
                </div>

                {/* On ART */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">On ART (Antiretrovirals)</label>
                  <select
                    value={onArt}
                    onChange={(e) => setOnArt(e.target.value as ArtStatus)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold"
                  >
                    <option value="Not Applicable (HIV Negative)">Not Applicable (HIV Negative)</option>
                    <option value="Yes (Adherent)">Yes (Adherent on Treatment)</option>
                    <option value="Yes (Defaulted / Lost to follow-up)">Yes (Defaulted / Needs Restart)</option>
                    <option value="No (Never started)">No (Eligible for Initiation)</option>
                  </select>
                </div>
              </div>

              {/* PrEP & Condoms */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-blue-200 text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-slate-800 font-semibold">
                  <input
                    type="checkbox"
                    checked={prepOffered}
                    onChange={(e) => setPrepOffered(e.target.checked)}
                    className="rounded border-slate-400 text-blue-900 focus:ring-blue-800 w-4 h-4"
                  />
                  <span>Oral PrEP (Pre-Exposure Prophylaxis) Explained & Offered</span>
                </label>

                <div className="flex items-center gap-2">
                  <span className="text-slate-700 font-bold">Condoms Distributed:</span>
                  <input
                    type="number"
                    min={0}
                    value={condomsDistributed}
                    onChange={(e) => setCondomsDistributed(Number(e.target.value))}
                    className="w-16 bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-900 font-mono font-bold"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: SUBSTANCE USE SCREENING */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="border-l-4 border-amber-500 pl-3">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <span className="text-amber-600 font-mono">3.</span> HTS & Substance Screening
              </h3>
              <p className="text-xs text-slate-600">
                Screen alcohol and illicit substance use patterns, identify Nyaope / Tik use, and evaluate interest in rehabilitation and harm reduction support.
              </p>
            </div>

            {/* TOOL 3 PERSON SELECTOR BAR (HTS & Substance) */}
            <PersonSelectorBar
              toolId="hts"
              toolTitle="3. HTS & Substance Screening"
              selectedPersonId={selectedPersonId}
              onSelectPerson={handleSelectPerson}
              onSaveToolInfo={() => handleSaveToolInfo('hts')}
              isSaving={isSavingTool}
              activePerson={activeSelectedPerson}
              pendingPersons={pendingByTool('hts')}
              completedPersons={completedByTool('hts')}
              showCompleted={showCompletedInDropdown}
              onToggleShowCompleted={setShowCompletedInDropdown}
              onGoToPersonalDetails={() => setCurrentStep(1)}
            />


            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* 1. Alcohol use & frequency */}
              <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-300 space-y-2 shadow-sm">
                <label className="block text-xs font-black text-blue-950 uppercase tracking-wide">
                  1. Alcohol Use & Frequency
                </label>
                <select
                  value={alcoholFrequency}
                  onChange={(e) => setAlcoholFrequency(e.target.value as AlcoholFrequency)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 font-semibold"
                >
                  <option value="None / Abstinent">None / Abstinent</option>
                  <option value="Occasionally / Socially">Occasionally / Socially</option>
                  <option value="Weekly (1-3 days)">Weekly (1-3 days)</option>
                  <option value="Frequent (4-6 days)">Frequent (4-6 days)</option>
                  <option value="Daily / Heavy">Daily / Heavy</option>
                </select>
                <p className="text-[11px] text-slate-500">
                  Assess for acute withdrawal signs, tremor, malnutrition, and liver tenderness.
                </p>
              </div>

              {/* 2. Drug use & frequency */}
              <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-300 space-y-2 shadow-sm">
                <label className="block text-xs font-black text-blue-950 uppercase tracking-wide">
                  2. Drug Use & Frequency
                </label>
                <select
                  value={drugFrequency}
                  onChange={(e) => setDrugFrequency(e.target.value as DrugFrequency)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 font-semibold"
                >
                  <option value="Never">Never</option>
                  <option value="Occasional / Binge">Occasional / Binge</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Daily (1-2 times)">Daily (1-2 times)</option>
                  <option value="Daily (Multiple times/Severe)">Daily (Multiple times/Severe)</option>
                </select>
                <label className="flex items-center gap-2 cursor-pointer pt-1 text-xs text-rose-700 font-bold">
                  <input
                    type="checkbox"
                    checked={injectingDrugUse}
                    onChange={(e) => setInjectingDrugUse(e.target.checked)}
                    className="rounded border-slate-400 text-rose-600 focus:ring-rose-500 w-4 h-4"
                  />
                  <span>Injecting drug use reported (Needle harm reduction indicated)</span>
                </label>
              </div>
            </div>

            {/* 3. Type of Substance */}
            <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-300 space-y-3 shadow-sm">
              <label className="block text-xs font-black uppercase tracking-wider text-blue-950">
                3. Type of Substance
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                {[
                  'Nyaope / Whoonga (Heroin mix)',
                  'Crystal Meth (Tik)',
                  'Cannabis (Dagga / Weed)',
                  'Glue / Solvents / Inhalants',
                  'Mandrax (Buttons)',
                  'Cocaine / Crack',
                  'Alcohol',
                  'Codeine / Cough Syrup',
                  'Prescription Sedatives (Benzos)',
                  'Multiple / Polysubstance',
                  'None',
                ].map((sub) => {
                  const isSelected = substanceTypes.includes(sub as SubstanceType);
                  return (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => toggleSubstance(sub as SubstanceType)}
                      className={`px-3 py-2.5 rounded-xl text-xs font-bold text-left border transition ${
                        isSelected
                          ? 'bg-amber-500 border-amber-600 text-slate-950 shadow-sm'
                          : 'bg-white border-slate-300 text-slate-700 hover:border-slate-400'
                      }`}
                    >
                      {sub}
                    </button>
                  );
                })}
              </div>

              <input
                type="text"
                placeholder="Additional notes on street drug slang, duration of dependence, triggers..."
                value={substanceNotes}
                onChange={(e) => setSubstanceNotes(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-900"
              />
            </div>

            {/* 4. Interest in Rehabilitation & Harm Reduction */}
            <div className="bg-amber-50/70 p-4 sm:p-5 rounded-2xl border border-amber-300 space-y-3 shadow-sm">
              <label className="block text-xs font-black text-slate-950 uppercase tracking-wide">
                4. Client Interest in Rehabilitation & Detox Centers
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {[
                  'Yes - Wants immediate detox / rehab',
                  'Yes - Interested in counseling first',
                  'Undecided / Considering',
                  'No / Not currently interested',
                ].map((interest) => (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => setRehabInterest(interest as RehabInterest)}
                    className={`px-3 py-2.5 rounded-xl text-xs font-bold text-left border transition ${
                      rehabInterest === interest
                        ? 'bg-blue-900 border-blue-950 text-white shadow-md'
                        : 'bg-white border-amber-200 text-slate-800 hover:border-amber-400'
                    }`}
                  >
                    {interest}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: PSYCHOSOCIAL / MENTAL HEALTH SCREENING TOOL (TICK FORM) */}
        {currentStep === 4 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="border-l-4 border-indigo-600 pl-3">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <span className="text-indigo-600 font-mono">4.</span> Psychosocial / Mental Health Screening Tool (Tick Form)
              </h3>
              <p className="text-xs text-slate-600">
                Tick form screening checklist covering depressive affect, street anxiety, trauma/PTSD, and critical psychiatric safety red flags with automated clinical scoring and instant care pathways.
              </p>
            </div>

            {/* TOOL 4 PERSON SELECTOR BAR (Psychosocial) */}
            <PersonSelectorBar
              toolId="psychosocial"
              toolTitle="4. Psychosocial / Mental Health (Tick Form)"
              selectedPersonId={selectedPersonId}
              onSelectPerson={handleSelectPerson}
              onSaveToolInfo={() => handleSaveToolInfo('psychosocial')}
              isSaving={isSavingTool}
              activePerson={activeSelectedPerson}
              pendingPersons={pendingByTool('psychosocial')}
              completedPersons={completedByTool('psychosocial')}
              showCompleted={showCompletedInDropdown}
              onToggleShowCompleted={setShowCompletedInDropdown}
              onGoToPersonalDetails={() => setCurrentStep(1)}
            />

            <PsychosocialTickForm
              value={psychosocialScreening}
              onChange={setPsychosocialScreening}
              clientName={fullName || 'Outreach Client'}
            />
          </div>
        )}

        {/* STEP 5: CLINICAL ACTION PLAN */}
        {currentStep === 5 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="border-l-4 border-amber-500 pl-3">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <span className="text-amber-600 font-mono">5.</span> Clinical Action Plan & Referrals
              </h3>
              <p className="text-xs text-slate-600">
                Determine triage severity, select referral destination, dispense essential street health medications, and establish next follow-up.
              </p>
            </div>

            {/* TOOL 5 PERSON SELECTOR BAR (Action Plan) */}
            <PersonSelectorBar
              toolId="actionPlan"
              toolTitle="5. Clinical Action Plan & Referrals"
              selectedPersonId={selectedPersonId}
              onSelectPerson={handleSelectPerson}
              onSaveToolInfo={() => handleSaveToolInfo('actionPlan')}
              isSaving={isSavingTool}
              activePerson={activeSelectedPerson}
              pendingPersons={pendingByTool('actionPlan')}
              completedPersons={completedByTool('actionPlan')}
              showCompleted={showCompletedInDropdown}
              onToggleShowCompleted={setShowCompletedInDropdown}
              onGoToPersonalDetails={() => setCurrentStep(1)}
            />

            {/* Triage Level Selector */}

            <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-300 space-y-3 shadow-sm">
              <label className="block text-xs font-black uppercase tracking-wider text-blue-950">
                Triage Priority Level
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { level: 'Routine', color: 'border-emerald-500 bg-emerald-50 text-emerald-950', desc: 'Standard outreach care' },
                  { level: 'Moderate', color: 'border-blue-500 bg-blue-50 text-blue-950', desc: 'Clinic visit in 48-72 hrs' },
                  { level: 'Urgent', color: 'border-amber-500 bg-amber-50 text-amber-950', desc: 'Same-day clinic referral' },
                  { level: 'Emergency', color: 'border-rose-500 bg-rose-50 text-rose-950', desc: 'Immediate EMS / Hospital' },
                ].map((item) => (
                  <button
                    key={item.level}
                    type="button"
                    onClick={() => setTriageLevel(item.level as TriageLevel)}
                    className={`p-3 rounded-xl text-left border-2 transition ${
                      triageLevel === item.level
                        ? `${item.color} font-black shadow-md ring-2 ring-blue-900`
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <span className="block text-sm font-extrabold">{item.level}</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Referral Facility */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-300 space-y-2 shadow-sm">
                <label className="block text-xs font-bold text-slate-800">Primary Referral Destination</label>
                <select
                  value={referralDestination}
                  onChange={(e) => setReferralDestination(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 font-semibold"
                >
                  <option value="Dunwell Youth Priority Clinic (Walk-in)">Dunwell Youth Priority Clinic (Walk-in)</option>
                  <option value="Esselen Street Clinic (HTS / PrEP / STI)">Esselen Street Clinic (HTS / PrEP / STI)</option>
                  <option value="Charlotte Maxeke Academic Hospital (EMS)">Charlotte Maxeke Academic Hospital (EMS)</option>
                  <option value="COJ Golden Harvest Substance Detox">COJ Golden Harvest Substance Detox</option>
                  <option value="3 Kotze Street Homeless Shelter">3 Kotze Street Homeless Shelter</option>
                  <option value="Hillbrow Community Health Centre">Hillbrow Community Health Centre</option>
                </select>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-300 space-y-2 shadow-sm">
                <label className="block text-xs font-bold text-slate-800">Next Outreach Follow-up Date</label>
                <input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 font-semibold"
                />
              </div>
            </div>

            {/* Medications & Kits Dispensed */}
            <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-300 space-y-3 shadow-sm">
              <label className="block text-xs font-black uppercase tracking-wider text-blue-950">
                Outreach Medications & Hygiene Kits Dispensed
              </label>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Paracetamol 500mg, Wound Dressing Pack, Multivitamins..."
                  value={newMedInput}
                  onChange={(e) => setNewMedInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddMed();
                    }
                  }}
                  className="flex-1 bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-900"
                />
                <button
                  type="button"
                  onClick={handleAddMed}
                  className="bg-blue-900 hover:bg-blue-800 text-white px-4 py-2 rounded-xl text-xs font-bold transition"
                >
                  Add Item
                </button>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {medicationsDispensed.map((med, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-white text-blue-950 border border-slate-300 rounded-xl text-xs font-bold shadow-sm"
                  >
                    {med}
                    <button
                      type="button"
                      onClick={() => handleRemoveMed(index)}
                      className="text-slate-400 hover:text-rose-600 ml-1 font-extrabold"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Screener Summary Notes */}
            <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-300 space-y-2 shadow-sm">
              <label className="block text-xs font-black text-blue-950">Clinical Narrative & Social Case Notes</label>
              <textarea
                rows={3}
                placeholder="Summary of outreach intervention, mental wellness assessment, safety considerations..."
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-900"
              />
            </div>
          </div>
        )}

        {/* Footer Navigation Buttons */}
        <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div>
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep - 1)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition"
              >
                <ChevronLeft className="w-4 h-4" /> Previous Section
              </button>
            ) : (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2.5 text-slate-600 hover:text-slate-900 text-xs font-bold"
              >
                Cancel
              </button>
            )}
          </div>

          {/* Quick Save Info Button for Current Tool */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => handleSaveToolInfo(currentToolId)}
              disabled={isSavingTool || (currentStep > 1 && !selectedPersonId) || (currentStep === 1 && !fullName.trim())}
              className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black shadow-md transition ${
                isSavingTool || (currentStep > 1 && !selectedPersonId) || (currentStep === 1 && !fullName.trim())
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer active:scale-95'
              }`}
              title="Save info for this tool and remove person from dropdown queue"
            >
              <Save className="w-4 h-4" />
              <span>
                {currentStep === 1
                  ? 'Save Info & Enroll Person'
                  : activeSelectedPerson
                  ? `Save Info for ${activeSelectedPerson.personal.fullName}`
                  : 'Save Info (Select Person)'}
              </span>
            </button>

            {currentStep < 5 ? (
              <button
                type="button"
                onClick={() => {
                  if (currentStep === 1 && !fullName.trim()) {
                    alert('Please enter client full name before continuing.');
                    return;
                  }
                  setCurrentStep(currentStep + 1);
                }}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-md transition"
              >
                <span>Continue to Step {currentStep + 1}</span> <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs sm:text-sm font-black shadow-lg transition"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Complete Screening & Save Record</span>
              </button>
            )}
          </div>
        </div>

      </form>
    </div>
  );
};
