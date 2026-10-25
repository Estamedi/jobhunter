export type Option = { value: string; label: string; description?: string }

export type Answers = {
  workStatus?: string
  searchIntensity?: string
  primaryGoal?: string
  targetRoles: string[]
  minSalary: number
  salaryCurrency: string
  employmentTypes: string[]
  workModes: string[]
  willingToRelocate?: boolean
  remoteRegions: string[]
  commuteCities: string[]
  workAuthorization?: string
  industries: string[]
}

export const initialAnswers: Answers = {
  targetRoles: [],
  minSalary: 120000,
  salaryCurrency: 'USD',
  employmentTypes: [],
  workModes: [],
  remoteRegions: [],
  commuteCities: [],
  industries: [],
}

export const workStatusOptions: Option[] = [
  { value: 'unemployed', label: "I'm unemployed" },
  { value: 'employed', label: "I'm employed" },
  { value: 'freelance', label: "I'm self-employed / freelancing" },
  { value: 'student', label: "I'm a student / looking for my first job" },
]

export const searchIntensityOptions: Option[] = [
  { value: 'active', label: 'Actively searching' },
  { value: 'open', label: 'Open to opportunities' },
  { value: 'exploring', label: 'Just exploring' },
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

export const employmentTypeOptions: Option[] = [
  { value: 'full-time', label: 'Full-time' },
  { value: 'part-time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
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

export const industryOptions: Option[] = [
  { value: 'any', label: 'Open to any industry' },
  { value: 'it', label: 'Information Technology & Telecommunications' },
  { value: 'finance', label: 'Financial Services & Insurance' },
  { value: 'healthcare', label: 'Healthcare & Life Sciences' },
  { value: 'government', label: 'Government & Public Sector' },
  { value: 'energy', label: 'Energy, Oil & Gas' },
  { value: 'education', label: 'Education' },
  { value: 'retail', label: 'Retail & E-commerce' },
  { value: 'manufacturing', label: 'Manufacturing & Logistics' },
  { value: 'media', label: 'Media & Entertainment' },
  { value: 'consulting', label: 'Consulting & Professional Services' },
]

export const currencies = ['USD', 'EUR', 'GBP', 'OMR', 'AED', 'SAR'] as const

export const MAX_SALARY = 500000
export const SALARY_STEP = 5000

export type QuestionId =
  | 'workStatus'
  | 'searchIntensity'
  | 'primaryGoal'
  | 'targetRoles'
  | 'minSalary'
  | 'employmentTypes'
  | 'workModes'
  | 'willingToRelocate'
  | 'remoteRegions'
  | 'commuteCities'
  | 'workAuthorization'
  | 'industries'

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
    id: 'searchIntensity',
    title: 'How are you approaching your job search right now?',
    key: true,
    isValid: (a) => !!a.searchIntensity,
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
    id: 'minSalary',
    title: "What's the minimum salary worth considering?",
    subtitle: 'Just a starting point. You can adjust it later.',
    key: true,
    isValid: () => true,
  },
  {
    id: 'employmentTypes',
    title: 'What kind of work are you open to?',
    key: true,
    isValid: (a) => a.employmentTypes.length > 0,
  },
  {
    id: 'workModes',
    title: 'How would you like to work?',
    key: true,
    isValid: (a) => a.workModes.length > 0,
  },
  {
    id: 'willingToRelocate',
    title: 'Are you willing to relocate for a job?',
    key: true,
    isValid: (a) => a.willingToRelocate !== undefined,
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
    id: 'commuteCities',
    title: 'Which cities would you commute to?',
    subtitle: 'You can change these anytime in your preferences.',
    key: true,
    when: (a) => a.workModes.includes('hybrid') || a.workModes.includes('on-site'),
    isValid: (a) => a.commuteCities.length > 0,
  },
  {
    id: 'workAuthorization',
    title: "What's your work authorization status?",
    subtitle: 'Only used to match you with roles you can take. Editable anytime.',
    key: true,
    isValid: (a) => !!a.workAuthorization,
  },
  {
    id: 'industries',
    title: 'Select industry preference',
    subtitle: 'You can change these anytime in your preferences.',
    key: true,
    isValid: (a) => a.industries.length > 0,
  },
]
