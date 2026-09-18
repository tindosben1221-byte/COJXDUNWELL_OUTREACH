export type Gender = 'Male' | 'Female' | 'Transgender' | 'Non-Binary' | 'Other';

export type Race = 'Black African' | 'Coloured' | 'White' | 'Indian/Asian' | 'Other';

export type Nationality = string;

export const SUGGESTED_NATIONALITIES = [
  'South African (ID Verified)',
  'South African (Undocumented)',
  'Zimbabwean',
  'Mozambican',
  'Lesotho',
  'Malawian',
  'Congolese (DRC)',
  'Namibian',
  'Swazi / Eswatini',
  'Nigerian',
  'Other Foreign National',
];

export const OFFICIAL_LANGUAGES_SA = [
  'isiZulu',
  'Sesotho',
  'isiXhosa',
  'Setswana',
  'English',
  'Afrikaans',
  'Sepedi (Northern Sotho)',
  'Xitsonga',
  'Tshivenda',
  'siSwati',
  'isiNdebele',
  'Shona',
  'Chichewa / Nyanja',
  'Portuguese',
  'French',
  'Other / Lingala',
];

export type ChronicCondition =
  | 'Hypertension'
  | 'Type 2 Diabetes'
  | 'Asthma / COPD'
  | 'Tuberculosis (TB)'
  | 'Epilepsy'
  | 'Mental Health (Depression/Bipolar)'
  | 'STI / Genital Ulcers'
  | 'Physical Disability / Mobility Impairment'
  | 'None'
  | 'Other';

export type PresentComplaint =
  | 'Acute Injury / Trauma'
  | 'Difficult Breathing / Wheezing'
  | 'Persistent Cough (> 2 weeks)'
  | 'Open Wounds / Abscess / Ulcers'
  | 'Skin Rash / Scabies / Itching'
  | 'Chest Pain'
  | 'Abdominal Pain / Diarrhea'
  | 'Severe Dental Pain'
  | 'Fever / Night Sweats / Chills'
  | 'Foot Swelling / Trench Foot'
  | 'None / General Checkup'
  | 'Other';

export type HtsStatusKnown = 'Yes' | 'No';
export type AcceptHtsTest = 'Yes' | 'No';
export type HtsResult = 'Non-Reactive (Negative)' | 'Reactive (Positive)' | 'Declined' | 'Indeterminate' | 'Not Done';
export type ArtStatus = 'Yes (Adherent)' | 'Yes (Defaulted / Lost to follow-up)' | 'No (Never started)' | 'Not Applicable (HIV Negative)';

export type AlcoholFrequency = 'None / Abstinent' | 'Occasionally / Socially' | 'Weekly (1-3 days)' | 'Frequent (4-6 days)' | 'Daily / Heavy';
export type DrugFrequency = 'Never' | 'Occasional / Binge' | 'Weekly' | 'Daily (1-2 times)' | 'Daily (Multiple times/Severe)';

export type SubstanceType =
  | 'Nyaope / Whoonga (Heroin mix)'
  | 'Crystal Meth (Tik)'
  | 'Cannabis (Dagga / Weed)'
  | 'Glue / Solvents / Inhalants'
  | 'Mandrax (Buttons)'
  | 'Cocaine / Crack'
  | 'Alcohol'
  | 'Codeine / Cough Syrup'
  | 'Prescription Sedatives (Benzos)'
  | 'Multiple / Polysubstance'
  | 'None';

export type RehabInterest = 'Yes (Eager for Rehab)' | 'Yes (Wants Detox only)' | 'Undecided / Needs Counseling' | 'No / Not interested';

export type VitalsOutcome = 'NORMAL' | 'REVIEW' | 'URGENT';
export type PulseRhythm = 'regular' | 'irregular';

export interface Vitals {
  pulseRate: number; // bpm
  pulseRhythm?: PulseRhythm; // regular / irregular
  oxygenSaturation: number; // SpO2 %
  bloodPressureSys: number; // mmHg
  bloodPressureDia: number; // mmHg
  map?: number; // Mean Arterial Pressure = Diastolic + (Systolic - Diastolic) / 3 mmHg
  weightKg?: number; // kg
  heightCm?: number; // cm
  bmi?: number; // calculated BMI
  vitalsOutcome?: VitalsOutcome; // NORMAL | REVIEW | URGENT
  actionTakenNotes?: string;
  temperature?: number;
  bloodGlucose?: number; // mmol/L
  respiratoryRate?: number;
}

export interface PersonalDetails {
  fullName: string;
  alias?: string;
  gender: Gender;
  dob?: string;
  age: number;
  nationality: string; // Manual text entry (e.g. South African, Zimbabwean, Mozambican, etc.)
  homeLanguage: string; // Home / Primary Language (e.g. isiZulu, Sesotho, isiXhosa, etc.)
  physicalAddress: string; // Homeless sleeping spot / shelter / address (e.g. "Joubert Park Pavilion", "3 Kotze Shelter", "Braamfontein Bridge")
  race: Race;
  phone?: string;
  saIdNumber?: string;
  emergencyContact?: string;
}

export interface MedicalScreening {
  vitals: Vitals;
  chronicConditions: ChronicCondition[];
  chronicConditionsNotes?: string;
  presentComplaints: PresentComplaint[];
  presentComplaintsNotes?: string;
  tbScreeningSymptomatic: boolean; // Cough, night sweats, fever, weight loss
}

export interface HtsScreening {
  hivStatusKnown: HtsStatusKnown;
  priorStatus?: 'Positive' | 'Negative' | 'Unknown';
  acceptHtsTest: AcceptHtsTest;
  testResult: HtsResult;
  onArt: ArtStatus;
  artFacility?: string; // e.g. "Dunwell Clinic", "Esselen Clinic", "Hillbrow CHC"
  prepOffered: boolean;
  condomsDistributed: number;
  notes?: string;
  // User requested fields:
  referral: 'Yes' | 'No' | ''; // Referral (with tick yes or no)
  referralFacility?: string; // Where client is referred if Yes
  adherence?: string; // Adherence (How they take their meds)
  medicationLocation?: string; // Where they take their meds
}

export interface SubstanceUseScreening {
  alcoholUseFrequency: AlcoholFrequency;
  drugUseFrequency: DrugFrequency;
  substanceTypes: SubstanceType[];
  substanceNotes?: string;
  injectingDrugUse: boolean;
  interestInRehabSupport: RehabInterest;
  referralRequested: boolean;
}

export interface PsychosocialSymptoms {
  depressedMood: boolean; // Feeling sad, down, depressed, or tearful
  anhedonia: boolean; // Little interest or pleasure in daily activities / street survival
  anxiety: boolean; // Feeling excessively nervous, anxious, irritable, on edge
  panicSymptoms: boolean; // Panic attacks, sudden overwhelming fear, shaking, racing heart
  sleepDisturbance: boolean; // Severe insomnia, nightmares, sleeping rough distress
  appetiteLoss: boolean; // Severe appetite loss, skipping meals, malnutrition
  traumaFlashbacks: boolean; // Intrusive memories / nightmares of street violence, mugging (PTSD signs)
  suicidalIdeation: boolean; // Thoughts of giving up, self-harm, or wishing to end life (⚠️ Red Flag)
  hallucinationsOrParanoia: boolean; // Hearing voices, severe paranoia, or hallucinations (⚠️ Red Flag)
  extremeIsolation: boolean; // Feeling completely abandoned, disconnected from family, no trusted support
  cognitiveConfusion: boolean; // Disorientation, severe memory lapses, difficulty concentrating
  recentGbvOrAssault: boolean; // Recent physical assault, gender-based violence (GBV), or abuse
}

export type PsychosocialDistressLevel = 'Mild / Minimal' | 'Moderate' | 'High' | 'Severe Crisis';

export interface PsychosocialAnalysis {
  score: number; // 0 - 12
  distressLevel: PsychosocialDistressLevel;
  crisisAlert: boolean; // True if suicidal ideation, psychosis, or severe distress
  identifiedDomains: string[];
  clinicalImpression: string;
  recommendedAction: string;
}

export interface PsychosocialScreening {
  symptoms: PsychosocialSymptoms;
  analysis: PsychosocialAnalysis;
  counselingAccepted: boolean;
  socialWorkerReferral: boolean;
  safetyPlanInitiated: boolean;
  screenerNotes?: string;
}

export interface ConsentRecord {
  consentGiven: boolean;
  clientSignatureDataUrl: string; // base64 canvas png
  clientNamePrinted: string;
  signedTimestamp: string;
  screenerName: string;
  screenerCadre: 'Outreach Nurse' | 'Community Healthcare Worker (CHW)' | 'Social Worker' | 'Counselor';
  screenerSignatureDataUrl?: string;
  notes?: string;
}

export type TriageLevel = 'Routine / Stable' | 'Moderate / Follow-up Needed' | 'Urgent / Priority Referral' | 'Emergency Medical Care';

export interface ClinicalActionPlan {
  // 1. Do they want to stay at COJ Homeless shelter
  wantsCojShelter: 'Yes' | 'No' | 'Undecided' | 'Other' | string;
  shelterPreferenceNotes?: string;

  // 2. Do they have children staying with them on the streets
  hasChildrenOnStreets: 'Yes' | 'No' | 'Other' | string;
  childrenCount?: number;
  childrenAges?: string;

  // 3. Do they need clinical and psychosocial health like counselling
  needsClinicalPsychosocialCounseling: 'Yes' | 'No' | 'Undecided' | 'Other' | string;
  counselingFocusAreas?: string[];
  counselingDetails?: string;

  // 4. Have they stayed at COJ homeless shelter before and how frequent and reason for leaving
  stayedAtCojShelterBefore: 'Yes' | 'No' | 'Other' | string;
  shelterFrequency?: 'Never' | 'Once' | '2-3 Times' | 'Frequently / Multiple Times' | 'Other' | string;
  shelterReasonForLeaving?: string;

  // 5. Are they interested in skills development programs
  interestedInSkillsDevelopment: 'Yes' | 'No' | 'Undecided' | 'Other' | string;
  skillsInterestAreas?: string[];

  // Clinical disposition fields
  immediateIntervention: string[];
  referralDestination?: string;
  medicationsDispensed?: string[];
  followUpDate?: string;
  screenerNotes?: string;
  triageLevel: TriageLevel;
}

export type ScreeningToolId =
  | 'personal'
  | 'vitals'
  | 'hts'
  | 'substance'
  | 'psychosocial'
  | 'actionPlan';

export interface ScreeningRecord {
  id: string;
  refNumber: string; // e.g. "COJ-DUN-2026-0492"
  createdAt: string;
  updatedAt?: string;
  outreachSite: string; // e.g. "Hillbrow - Highpoint Park", "Joubert Park Clinic Base", "Braamfontein Civic Shelter", "Marshalltown Displaced Center"
  screenerName: string;
  personal: PersonalDetails;
  medical: MedicalScreening;
  hts: HtsScreening;
  substance: SubstanceUseScreening;
  psychosocial?: PsychosocialScreening;
  consent?: ConsentRecord;
  actionPlan: ClinicalActionPlan;
  completedTools?: ScreeningToolId[]; // List of screening tools completed for this person
  isFullyCompleted?: boolean;
}


