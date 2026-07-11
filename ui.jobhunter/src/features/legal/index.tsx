import { Link } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'

type LegalSection = {
  title: string
  paragraphs: string[]
  items?: string[]
}

type LegalPageProps = {
  title: string
  description: string
  lastUpdated: string
  sections: LegalSection[]
}

const lastUpdated = 'July 11, 2026'

const termsSections: LegalSection[] = [
  {
    title: '1. Agreement to these terms',
    paragraphs: [
      'These Terms of Service govern your access to and use of Tapinti, a personal career CRM for tracking companies, recruiters, applications, resume versions, interviews, follow-ups, notes, and related job-search activity.',
      'By creating an account, accessing Tapinti, or using any Tapinti product, website, API, or browser extension, you agree to these terms. If you use Tapinti on behalf of an organization, you represent that you have authority to bind that organization.',
    ],
  },
  {
    title: '2. Your account',
    paragraphs: [
      'You are responsible for keeping your account credentials secure and for all activity under your account. Tell us promptly if you believe your account has been compromised.',
      'You must provide accurate account information and use Tapinti only if you are legally allowed to enter into these terms.',
    ],
  },
  {
    title: '3. Your content and career data',
    paragraphs: [
      'You keep ownership of the information you add to Tapinti, including job records, contact details, interview notes, resumes, files, and other career-search content.',
      'You grant Tapinti a limited license to host, process, transmit, display, and back up your content only as needed to provide, maintain, secure, and improve the service.',
    ],
  },
  {
    title: '4. Acceptable use',
    paragraphs: [
      'Tapinti is built for legitimate career organization and job-search workflows. You may not misuse the service or interfere with other users, infrastructure, or third-party systems.',
    ],
    items: [
      'Do not upload unlawful, harmful, infringing, or malicious content.',
      'Do not attempt to access accounts, data, APIs, or systems that you are not authorized to access.',
      'Do not reverse engineer, scrape, overload, resell, or abuse Tapinti except as permitted by law or written agreement.',
      'Do not use Tapinti to spam recruiters, impersonate others, or violate employment-platform terms.',
    ],
  },
  {
    title: '5. Third-party services and browser extension',
    paragraphs: [
      'Tapinti may connect with third-party websites, job boards, email providers, browser APIs, AI services, or other integrations. Those services are governed by their own terms and privacy policies.',
      'If you use the Tapinti browser extension or integrations, you are responsible for ensuring your use complies with the websites and services you connect to Tapinti.',
    ],
  },
  {
    title: '6. Plans, billing, and changes',
    paragraphs: [
      'Some Tapinti features may be free, paid, usage-based, or offered as beta features. If paid plans are introduced or changed, payment terms will be shown before purchase or renewal.',
      'We may add, modify, suspend, or discontinue features to improve the service, comply with law, or protect Tapinti and its users.',
    ],
  },
  {
    title: '7. Intellectual property',
    paragraphs: [
      'Tapinti and its software, design, branding, documentation, and related materials are owned by Tapinti or its licensors. These terms do not transfer any Tapinti intellectual property to you.',
      'Feedback you send us may be used without restriction or compensation, but we will not treat private career data as public feedback.',
    ],
  },
  {
    title: '8. Privacy',
    paragraphs: [
      'Our Privacy Policy explains how we collect, use, share, and protect personal information. By using Tapinti, you also agree to the practices described in the Privacy Policy.',
    ],
  },
  {
    title: '9. Suspension and termination',
    paragraphs: [
      'You may stop using Tapinti at any time. We may suspend or terminate access if you violate these terms, create risk for Tapinti or others, fail to pay applicable fees, or if required by law.',
      'After termination, we may retain limited information as needed for legal, security, backup, fraud-prevention, or legitimate business purposes.',
    ],
  },
  {
    title: '10. Disclaimers',
    paragraphs: [
      'Tapinti is provided on an “as is” and “as available” basis. We do not promise that the service will be uninterrupted, error-free, or that it will guarantee interviews, offers, employment, or career outcomes.',
      'Job-search decisions, communications, applications, and employment outcomes remain your responsibility.',
    ],
  },
  {
    title: '11. Limitation of liability',
    paragraphs: [
      'To the fullest extent permitted by law, Tapinti will not be liable for indirect, incidental, special, consequential, exemplary, or punitive damages, or for lost profits, lost opportunities, lost data, or business interruption.',
      'To the fullest extent permitted by law, Tapinti’s total liability for claims relating to the service will not exceed the amount you paid to Tapinti for the service in the twelve months before the claim, or USD $100 if you used a free service.',
    ],
  },
  {
    title: '12. Contact',
    paragraphs: [
      'Questions about these terms can be sent to support@tapinti.com. We may update these terms from time to time, and the “Last updated” date will show the latest version.',
    ],
  },
]

const privacySections: LegalSection[] = [
  {
    title: '1. Overview',
    paragraphs: [
      'This Privacy Policy explains how Tapinti collects, uses, shares, and protects personal information when you use Tapinti, including the web app, website, APIs, and browser extension.',
      'Tapinti is designed to help you organize your career search. That means some of the information you store may include sensitive career context, recruiter conversations, resumes, notes, and application history.',
    ],
  },
  {
    title: '2. Information we collect',
    paragraphs: [
      'We collect information you provide directly, information created through your use of Tapinti, and limited technical information needed to operate and secure the service.',
    ],
    items: [
      'Account information such as name, email address, authentication identifiers, preferences, and settings.',
      'Career CRM data such as companies, recruiters, contacts, applications, job roles, resumes, interviews, follow-ups, tasks, notes, files, and status history.',
      'Integration and extension data you choose to save, such as job-posting details from a page you are viewing.',
      'Usage and device data such as log data, IP address, browser type, device information, pages viewed, feature usage, and diagnostic events.',
      'Support communications and feedback you send to us.',
    ],
  },
  {
    title: '3. How we use information',
    paragraphs: [
      'We use information to provide Tapinti, keep your job-search workspace organized, improve product quality, and protect users and infrastructure.',
    ],
    items: [
      'Create and manage your account and workspace.',
      'Store, display, search, sync, and update your career CRM records.',
      'Send service messages such as security, account, billing, support, and product updates.',
      'Debug, analyze, secure, and improve Tapinti and related integrations.',
      'Comply with legal obligations and enforce our terms.',
    ],
  },
  {
    title: '4. AI and automation features',
    paragraphs: [
      'Some Tapinti features may use automation or AI to extract job-posting details, summarize information, or help organize records. When you choose to use those features, relevant content may be processed to provide the requested result.',
      'We do not use your private career CRM content to train third-party foundation models unless we clearly tell you and obtain any consent required by law.',
    ],
  },
  {
    title: '5. Cookies and similar technologies',
    paragraphs: [
      'Tapinti may use cookies, local storage, and similar technologies to keep you signed in, remember preferences, measure product usage, improve performance, and protect against abuse.',
      'You can control cookies through your browser settings, but disabling certain cookies may affect authentication or product functionality.',
    ],
  },
  {
    title: '6. How we share information',
    paragraphs: [
      'We do not sell your personal information. We share information only as needed to operate Tapinti, comply with law, protect rights and safety, or with your direction.',
    ],
    items: [
      'Service providers that help with hosting, storage, analytics, authentication, payments, support, email delivery, security, or AI-enabled functionality.',
      'Third-party integrations you choose to connect or use.',
      'Authorities or other parties when required by law, legal process, or to protect Tapinti, users, or the public.',
      'A successor or affiliate if Tapinti is involved in a merger, acquisition, financing, reorganization, or sale of assets.',
    ],
  },
  {
    title: '7. Data retention',
    paragraphs: [
      'We keep personal information for as long as needed to provide Tapinti, comply with legal obligations, resolve disputes, maintain backups, prevent abuse, and enforce agreements.',
      'You may request deletion of your account or certain data. Some information may remain temporarily in backups or where retention is required for legal, security, or legitimate business reasons.',
    ],
  },
  {
    title: '8. Security',
    paragraphs: [
      'We use administrative, technical, and organizational safeguards designed to protect personal information. No online service can guarantee absolute security, so you should use a strong password and protect your account credentials.',
    ],
  },
  {
    title: '9. Your choices and rights',
    paragraphs: [
      'Depending on where you live, you may have rights to access, correct, export, delete, restrict, or object to certain processing of personal information.',
      'You can update some account and workspace information directly in Tapinti. For other requests, contact support@tapinti.com.',
    ],
  },
  {
    title: '10. Children',
    paragraphs: [
      'Tapinti is not intended for children under 13, and we do not knowingly collect personal information from children under 13. If you believe a child has provided personal information to Tapinti, contact us so we can take appropriate action.',
    ],
  },
  {
    title: '11. International use',
    paragraphs: [
      'Tapinti may process and store information in countries other than where you live. Those countries may have data-protection laws different from your local laws. Where required, we use appropriate safeguards for cross-border transfers.',
    ],
  },
  {
    title: '12. Changes to this policy',
    paragraphs: [
      'We may update this Privacy Policy as Tapinti changes or as legal requirements evolve. The “Last updated” date shows when the latest version took effect.',
    ],
  },
  {
    title: '13. Contact',
    paragraphs: [
      'Questions, privacy requests, or concerns can be sent to support@tapinti.com.',
    ],
  },
]

export function TermsPage() {
  return (
    <LegalPage
      title='Terms of Service'
      description='The rules for using Tapinti and managing your career-search workspace.'
      lastUpdated={lastUpdated}
      sections={termsSections}
    />
  )
}

export function PrivacyPage() {
  return (
    <LegalPage
      title='Privacy Policy'
      description='How Tapinti collects, uses, shares, and protects personal information.'
      lastUpdated={lastUpdated}
      sections={privacySections}
    />
  )
}

function LegalPage({
  title,
  description,
  lastUpdated,
  sections,
}: LegalPageProps) {
  return (
    <main className='min-h-svh bg-tapinti-page text-tapinti-foreground'>
      <div className='mx-auto flex w-full max-w-4xl flex-col gap-8 px-5 py-8 sm:px-8 lg:py-12'>
        <header className='rounded-[18px] border border-tapinti-border bg-tapinti-surface p-6 shadow-sm shadow-black/5 sm:p-8'>
          <Link
            to='/'
            className='mb-8 inline-flex items-center gap-2 text-sm font-medium text-tapinti-muted-foreground transition-colors hover:text-tapinti-primary'
          >
            <ArrowLeft className='size-4' />
            Back to Tapinti
          </Link>
          <p className='text-sm font-semibold text-tapinti-primary'>
            Tapinti Legal
          </p>
          <h1 className='mt-3 text-3xl font-bold tracking-tight sm:text-5xl'>
            {title}
          </h1>
          <p className='mt-4 max-w-2xl text-base leading-7 text-tapinti-muted-foreground'>
            {description}
          </p>
          <p className='mt-6 text-sm text-tapinti-muted-foreground'>
            Last updated: {lastUpdated}
          </p>
        </header>

        <article className='rounded-[18px] border border-tapinti-border bg-tapinti-surface p-6 shadow-sm shadow-black/5 sm:p-8'>
          <div className='space-y-10'>
            {sections.map((section) => (
              <section key={section.title} className='scroll-mt-6'>
                <h2 className='text-lg font-semibold tracking-tight'>
                  {section.title}
                </h2>
                <div className='mt-3 space-y-3 text-sm leading-7 text-tapinti-muted-foreground'>
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                  {section.items && (
                    <ul className='list-disc space-y-2 ps-5'>
                      {section.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            ))}
          </div>
        </article>
      </div>
    </main>
  )
}
