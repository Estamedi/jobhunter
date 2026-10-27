export type Option = { value: string; label: string; description?: string }

export type Answers = {
  workStatus?: string
  primaryGoal?: string
  targetRoles: string[]
  workModes: string[]
  remoteRegions: string[]
  workAuthorization?: string
}

export const initialAnswers: Answers = {
  targetRoles: [],
  workModes: [],
  remoteRegions: [],
}

export const workStatusOptions: Option[] = [
  { value: 'unemployed', label: "I'm unemployed" },
  { value: 'employed', label: "I'm employed" },
  { value: 'freelance', label: "I'm self-employed / freelancing" },
  { value: 'student', label: "I'm a student / looking for my first job" },
]

// Phase 1 = CRM + smart CV builder. Auto-apply goals come in phase 3.
export const goalOptions: Option[] = [
  {
    value: 'track',
    label: 'Track my applications',
    description: 'Keep every role, status and follow-up in one place',
  },
  {
    value: 'cv',
    label: 'Build a stronger CV',
    description: 'Create and tailor CVs for each role',
  },
  {
    value: 'interviews',
    label: 'Prepare for interviews',
    description: 'Stay organised before and after every interview',
  },
  {
    value: 'followups',
    label: 'Never miss a follow-up',
    description: 'Reminders and tasks for each opportunity',
  },
]

export const workModeOptions: Option[] = [
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'on-site', label: 'On-site' },
]

export const remoteRegionOptions: Option[] = [
  { value: 'anywhere', label: 'Anywhere in the world', description: 'Remote roles from any country' },
  { value: 'north-america', label: 'North America' },
  { value: 'south-america', label: 'South America' },
  { value: 'europe', label: 'Europe' },
  { value: 'asia', label: 'Asia' },
  { value: 'oceania', label: 'Oceania' },
  { value: 'africa', label: 'Africa' },
]

export const workAuthorizationOptions: Option[] = [
  { value: 'citizen', label: 'Citizen' },
  { value: 'permanent-resident', label: 'Permanent resident' },
  { value: 'work-visa', label: 'Work visa (employer-sponsored)' },
  { value: 'authorized', label: 'Authorized, no sponsorship needed' },
  { value: 'not-authorized', label: 'Not yet authorized' },
]

export type QuestionId =
  | 'workStatus'
  | 'primaryGoal'
  | 'targetRoles'
  | 'workModes'
  | 'remoteRegions'
  | 'workAuthorization'

export type Question = {
  id: QuestionId
  title: string
  subtitle?: string
  /** Key questions affect matching / activity (the ⭐ in the question list). */
  key?: boolean
  /** Hide the question when it does not apply. */
  when?: (a: Answers) => boolean
  isValid: (a: Answers) => boolean
}

export const questions: Question[] = [
  {
    id: 'workStatus',
    title: "What's your current work status?",
    isValid: (a) => !!a.workStatus,
  },
  {
    id: 'primaryGoal',
    title: 'What would help most right now?',
    key: true,
    isValid: (a) => !!a.primaryGoal,
  },
  {
    id: 'targetRoles',
    title: 'Which roles are you targeting?',
    subtitle: 'Add one or more job titles. We use them to tailor your CVs.',
    key: true,
    isValid: (a) => a.targetRoles.length > 0,
  },
  {
    id: 'workModes',
    title: 'How would you like to work?',
    key: true,
    isValid: (a) => a.workModes.length > 0,
  },
  {
    id: 'remoteRegions',
    title: 'Where would you like to work remotely?',
    subtitle: 'You can change these anytime in your preferences.',
    key: true,
    when: (a) => a.workModes.includes('remote'),
    isValid: (a) => a.remoteRegions.length > 0,
  },
  {
    id: 'workAuthorization',
    title: "What's your work authorization status?",
    subtitle: 'Only used to match you with roles you can take. Editable anytime.',
    key: true,
    isValid: (a) => !!a.workAuthorization,
  },
]
