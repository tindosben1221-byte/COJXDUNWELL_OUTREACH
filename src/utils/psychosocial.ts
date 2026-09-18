import {
  PsychosocialSymptoms,
  PsychosocialAnalysis,
  PsychosocialDistressLevel,
} from '../types';

export interface SymptomDefinition {
  key: keyof PsychosocialSymptoms;
  label: string;
  category: 'Mood & Affect' | 'Anxiety & Somatic' | 'Trauma & Stress' | 'Psychosis & Risk' | 'Social & Safety';
  description: string;
  isRedFlag?: boolean;
}

export const PSYCHOSOCIAL_SYMPTOM_ITEMS: SymptomDefinition[] = [
  {
    key: 'depressedMood',
    label: 'Depressed Mood / Persistent Sadness',
    category: 'Mood & Affect',
    description: 'Feeling down, tearful, hopeless, or empty most of the day for the past 2 weeks.',
  },
  {
    key: 'anhedonia',
    label: 'Loss of Interest / Anhedonia',
    category: 'Mood & Affect',
    description: 'Little or no interest, pleasure, or motivation in daily survival or hygiene.',
  },
  {
    key: 'anxiety',
    label: 'Generalized Anxiety / Excessive Worry',
    category: 'Anxiety & Somatic',
    description: 'Feeling constantly nervous, restless, irritable, or unable to sit still.',
  },
  {
    key: 'panicSymptoms',
    label: 'Panic Attacks / Acute Paroxysms',
    category: 'Anxiety & Somatic',
    description: 'Sudden surges of overwhelming fear, pounding heartbeat, shortness of breath, or trembling.',
  },
  {
    key: 'sleepDisturbance',
    label: 'Severe Sleep Loss / Nightmares',
    category: 'Anxiety & Somatic',
    description: 'Severe difficulty sleeping rough, insomnia, night terrors, or waking in panic.',
  },
  {
    key: 'appetiteLoss',
    label: 'Severe Appetite Loss / Somatic Wasting',
    category: 'Anxiety & Somatic',
    description: 'Loss of appetite unrelated to food scarcity, unexplained dramatic weight loss, or stomach pain.',
  },
  {
    key: 'traumaFlashbacks',
    label: 'Intrusive Flashbacks / Street PTSD',
    category: 'Trauma & Stress',
    description: 'Reliving terrifying street attacks, police raids, muggings, or past abuse through vivid flashbacks.',
  },
  {
    key: 'suicidalIdeation',
    label: 'Suicidal Thoughts / Self-Harm Urges',
    category: 'Psychosis & Risk',
    description: 'Thoughts of giving up on life, wishing not to wake up, or active urge to harm oneself.',
    isRedFlag: true,
  },
  {
    key: 'hallucinationsOrParanoia',
    label: 'Auditory Hallucinations / Severe Paranoia',
    category: 'Psychosis & Risk',
    description: 'Hearing voices when alone, believing people are spying/poisoning them, or acute psychosis.',
    isRedFlag: true,
  },
  {
    key: 'extremeIsolation',
    label: 'Severe Social Isolation / Estrangement',
    category: 'Social & Safety',
    description: 'Completely cut off from family, no trusted friend on the street, profound despair.',
  },
  {
    key: 'cognitiveConfusion',
    label: 'Disorientation / Severe Memory Lapses',
    category: 'Social & Safety',
    description: 'Difficulty knowing time/place, losing belongings, blackouts, or severe confusion.',
  },
  {
    key: 'recentGbvOrAssault',
    label: 'Recent GBV / Physical or Sexual Assault',
    category: 'Social & Safety',
    description: 'Victim of physical beating, mugging, or sexual violence within the past 30 days.',
  },
];

export const DEFAULT_PSYCHOSOCIAL_SYMPTOMS: PsychosocialSymptoms = {
  depressedMood: false,
  anhedonia: false,
  anxiety: false,
  panicSymptoms: false,
  sleepDisturbance: false,
  appetiteLoss: false,
  traumaFlashbacks: false,
  suicidalIdeation: false,
  hallucinationsOrParanoia: false,
  extremeIsolation: false,
  cognitiveConfusion: false,
  recentGbvOrAssault: false,
};

export function calculatePsychosocialAnalysis(symptoms: PsychosocialSymptoms): PsychosocialAnalysis {
  let score = 0;
  const identifiedDomains: string[] = [];

  if (symptoms.depressedMood) score++;
  if (symptoms.anhedonia) score++;
  if (symptoms.anxiety) score++;
  if (symptoms.panicSymptoms) score++;
  if (symptoms.sleepDisturbance) score++;
  if (symptoms.appetiteLoss) score++;
  if (symptoms.traumaFlashbacks) score++;
  if (symptoms.suicidalIdeation) score++;
  if (symptoms.hallucinationsOrParanoia) score++;
  if (symptoms.extremeIsolation) score++;
  if (symptoms.cognitiveConfusion) score++;
  if (symptoms.recentGbvOrAssault) score++;

  if (symptoms.depressedMood || symptoms.anhedonia) {
    identifiedDomains.push('Depressive Symptoms');
  }
  if (symptoms.anxiety || symptoms.panicSymptoms) {
    identifiedDomains.push('Anxiety & Panic');
  }
  if (symptoms.sleepDisturbance || symptoms.appetiteLoss) {
    identifiedDomains.push('Somatic Distress & Insomnia');
  }
  if (symptoms.traumaFlashbacks) {
    identifiedDomains.push('Street Trauma & PTSD Signs');
  }
  if (symptoms.suicidalIdeation) {
    identifiedDomains.push('⚠️ Suicide & Self-Harm Risk (CRITICAL)');
  }
  if (symptoms.hallucinationsOrParanoia) {
    identifiedDomains.push('⚠️ Psychosis & Severe Paranoia');
  }
  if (symptoms.extremeIsolation) {
    identifiedDomains.push('Severe Social Isolation');
  }
  if (symptoms.cognitiveConfusion) {
    identifiedDomains.push('Cognitive Disorientation');
  }
  if (symptoms.recentGbvOrAssault) {
    identifiedDomains.push('Recent GBV / Physical Trauma');
  }

  const crisisAlert = symptoms.suicidalIdeation || symptoms.hallucinationsOrParanoia || score >= 9;

  let distressLevel: PsychosocialDistressLevel = 'Mild / Minimal';
  if (crisisAlert || score >= 9) {
    distressLevel = 'Severe Crisis';
  } else if (score >= 6) {
    distressLevel = 'High';
  } else if (score >= 3) {
    distressLevel = 'Moderate';
  } else {
    distressLevel = 'Mild / Minimal';
  }

  // Clinical Impression
  let clinicalImpression = '';
  if (crisisAlert) {
    clinicalImpression = `High-acuity crisis screening (Score: ${score}/12). Imminent safety risk detected (${
      symptoms.suicidalIdeation ? 'Suicidal ideation present' : 'Severe psychosis/crisis state'
    }). Immediate clinical stabilization and protective care required.`;
  } else if (distressLevel === 'High') {
    clinicalImpression = `Significant psychological distress (Score: ${score}/12). High burden of ${identifiedDomains.join(
      ', '
    )}. Compounding hardship of street homelessness necessitates prompt mental health and social worker intervention.`;
  } else if (distressLevel === 'Moderate') {
    clinicalImpression = `Moderate psychosocial distress (Score: ${score}/12) presenting with ${identifiedDomains.join(
      ', '
    )}. Client is functionally coping but shows emerging vulnerability to decompensation under street conditions.`;
  } else {
    clinicalImpression = `Low psychological distress score (${score}/12). No acute psychiatric red flags identified at current assessment. Stable coping mechanisms observed.`;
  }

  // Recommended Action
  let recommendedAction = '';
  if (crisisAlert) {
    recommendedAction =
      'CRITICAL CRISIS PROTOCOL: Do not leave client unattended. Initiate immediate suicide/safety de-escalation protocol. Contact Dunwell Clinic Crisis Nurse and arrange urgent escorted transfer to Charlotte Maxeke / Helen Joseph Psychiatric Emergency Unit or designated stabilization center.';
  } else if (distressLevel === 'High') {
    recommendedAction =
      'Fast-track referral to Dunwell Youth Priority Clinic for comprehensive clinical psychologist evaluation. Mobilize social worker for emergency shelter placement and enroll in trauma-informed counseling & harm-reduction support.';
  } else if (distressLevel === 'Moderate') {
    recommendedAction =
      'Schedule primary counseling session at Dunwell Clinic with mental health counselor. Provide psychoeducation, link with community peer support worker, and review during next scheduled outreach visit.';
  } else {
    recommendedAction =
      'Provide supportive listening and reassurance. Provide City of Joburg toll-free crisis helpline card and Dunwell Clinic walk-in details. Routine follow-up during regular hotspot outreach.';
  }

  return {
    score,
    distressLevel,
    crisisAlert,
    identifiedDomains: identifiedDomains.length > 0 ? identifiedDomains : ['Normal / Subclinical Coping'],
    clinicalImpression,
    recommendedAction,
  };
}
