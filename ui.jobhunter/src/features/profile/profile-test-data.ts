import { type CandidateProfile } from './api'

// Synthetic candidate and profile for the page tests. No real person or data.
export const CANDIDATE = {
  id: 2,
  fullName: 'Alex Example',
  email: 'alex@example.test',
  phone: '+000 0000 0000',
  currentLocation: 'Testville, Oman',
  availability: 'Immediately',
  preferredWorkType: 'Any',
  isActive: true,
  created: '2025-01-01T00:00:00Z',
}

const LONG_ABOUT =
  'Senior software engineer with 13+ years of experience designing, building, and leading production-grade systems across multiple industries. ' +
  'I focus on architecture, problem-solving, and pragmatic technical decisions that deliver real business value, and I like to mentor other developers along the way.'

export const PROFILE = {
  id: 1,
  candidateId: 2,
  headline: 'Software engineer | 13+ years experience',
  summary: LONG_ABOUT,
  experiences: [
    {
      id: 1,
      title: 'Technical Lead',
      company: 'Acme Consultancy',
      employmentType: null,
      isCurrent: true,
      startDate: '2026-01-01',
      endDate: null,
      location: 'Testville, Oman',
      workplaceType: 'OnSite',
      description:
        'Led development planning and task management, coordinated engineers, and defined project milestones for a national prediction project. ' +
        'Automated server management across 20+ servers and set up one place to monitor system health.',
      skills: ['DevOps', 'Ansible', 'Terraform'],
    },
    {
      id: 2,
      title: 'Full Stack Developer',
      company: 'Acme Consultancy',
      employmentType: 'FullTime',
      isCurrent: true,
      startDate: '2025-01-01',
      endDate: null,
      location: 'Testville, Oman',
      workplaceType: 'OnSite',
      description:
        'Defined a standard reference architecture with Clean Architecture and CI/CD across all teams.',
      skills: ['Architecture'],
    },
    {
      id: 3,
      title: 'Full Stack Developer',
      company: 'Globex Software',
      employmentType: 'FullTime',
      isCurrent: false,
      startDate: '2023-07-01',
      endDate: '2025-01-31',
      location: 'Testville, Oman',
      workplaceType: null,
      description:
        'Designed and managed a legacy application with 18 services.',
      skills: ['PostgreSQL', 'Docker'],
    },
  ],
  educations: [
    {
      id: 1,
      institution: 'Example Institute of Higher Education',
      degree: "Bachelor's Degree",
      fieldOfStudy: 'Computer Software Engineering',
      startDate: '2010-01-01',
      endDate: '2012-01-01',
    },
    {
      id: 2,
      institution: 'Example Azad University',
      degree: "Associate's Degree",
      fieldOfStudy: 'Computer Software Engineering',
      startDate: '2006-01-01',
      endDate: '2009-01-01',
    },
  ],
  skills: [
    { id: 1, name: 'C#', category: 'Backend', evidenceLevel: 'Worked' },
    { id: 2, name: 'Docker', category: 'DevOps' },
    {
      id: 3,
      name: 'Java',
      category: 'Backend',
      evidenceLevel: 'Claimed',
      note: 'learned with AI tools',
    },
    {
      id: 4,
      name: 'Kubernetes',
      category: 'DevOps',
      evidenceLevel: 'Learning',
    },
  ],
  projects: [
    {
      id: 1,
      name: 'Light Clean Architecture',
      description: 'A template for scenarios where user input is limited.',
      url: 'https://example.test/lca',
    },
  ],
  certifications: [],
  languages: [{ id: 1, name: 'English', proficiency: 'FullProfessional' }],
  links: [
    {
      id: 1,
      label: 'LinkedIn',
      url: 'https://www.linkedin.com/in/alex-example/',
    },
  ],
} as unknown as CandidateProfile
