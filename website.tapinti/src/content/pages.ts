// English-only content pages. Keep every claim consistent with
// messages/en.json (features, plan limits, FAQ): no invented stats or ratings.

export type ContentSection = {
  heading: string;
  body: string[];
  bullets?: string[];
};

export type ContentPage = {
  slug: string;
  /** <title> without the site suffix */
  title: string;
  description: string;
  h1: string;
  intro: string;
  sections: ContentSection[];
  faq: { q: string; a: string }[];
  related: string[];
  /** Short label for navigation and link lists */
  label: string;
};

export const contentPages: ContentPage[] = [
  {
    slug: "job-application-tracker",
    label: "Job application tracker",
    title: "Job Application Tracker for Serious Job Searches",
    description:
      "ApplyLadder is a job application tracker that replaces spreadsheets. Move each role through a pipeline, attach the resume you sent and never miss a follow-up.",
    h1: "A job application tracker that doesn't fall apart at application #40",
    intro:
      "Most job searches start in a spreadsheet and slowly turn into a mess of tabs, emails and half-remembered conversations. ApplyLadder is a job application tracker built for people who apply to many roles: every application, company, recruiter and interview lives in one connected workspace.",
    sections: [
      {
        heading: "What a job application tracker should do",
        body: [
          "A list of company names isn't enough. When you have dozens of applications open, you need to know three things at a glance: where each application stands, what you sent, and what you need to do next.",
        ],
        bullets: [
          "Show the status of every application in a pipeline, not a flat list.",
          "Remember which resume version went to which company.",
          "Keep the recruiter, the notes and the interview history attached to the application.",
          "Tell you when a conversation has gone quiet and a follow-up is due.",
        ],
      },
      {
        heading: "How ApplyLadder tracks your applications",
        body: [
          "Each role moves through a pipeline: Wishlist, Preparing, Applied, HR, Technical, Offer, Accepted and Rejected. You see the whole search at a glance and can open any role for its full history.",
          "Every application links to its company profile, the recruiters who own the role, the resume you sent and its interview timeline. Nothing floats on its own, so you never have to search your inbox to remember where you stand.",
        ],
        bullets: [
          "Job pipeline with eight stages",
          "Company and recruiter profiles linked to each role",
          "Interview timeline with notes and questions",
          "Attachments for resumes, cover letters and portfolios",
          "Follow-up reminders and career analytics on the Pro plan",
        ],
      },
      {
        heading: "Moving over from a spreadsheet or Notion",
        body: [
          "You don't have to start from scratch. ApplyLadder can import companies and applications from a CSV or a Notion export, so your existing search carries over.",
        ],
      },
      {
        heading: "Free to start",
        body: [
          "The Free plan covers up to 25 active applications, company and recruiter profiles, the job pipeline, the interview timeline and one resume version, with no credit card and no time limit. Pro is $9 per month and adds unlimited applications, unlimited resume versions, follow-up reminders and analytics, and the AI assistant.",
        ],
      },
    ],
    faq: [
      {
        q: "What is a job application tracker?",
        a: "A job application tracker is a tool that records every job you apply to, its current stage, the documents you sent and your next steps, so you can run a large job search without losing track of anything.",
      },
      {
        q: "Is ApplyLadder better than a spreadsheet for tracking job applications?",
        a: "A spreadsheet works for a handful of applications. ApplyLadder adds a pipeline, linked company and recruiter profiles, resume versions, an interview timeline and reminders, which a spreadsheet can't do without a lot of manual work.",
      },
      {
        q: "Is the job application tracker free?",
        a: "Yes. The Free plan includes up to 25 active applications with no credit card and no time limit. Pro costs $9 per month for unlimited applications and extra tools.",
      },
      {
        q: "Can I import my existing applications?",
        a: "Yes. You can import companies and applications from a CSV or a Notion export.",
      },
    ],
    related: ["job-search-crm", "resume-tracker"],
  },
  {
    slug: "job-search-crm",
    label: "Job search CRM",
    title: "Job Search CRM: Manage Your Career Pipeline",
    description:
      "ApplyLadder is a personal CRM for your job search. Manage companies, recruiters, applications and interviews in one place, and follow up at the right time.",
    h1: "A job search CRM: manage your career like sales teams manage customers",
    intro:
      "Sales teams don't track deals in loose notes. They use a CRM that links every contact, conversation and deal. A job search has the same shape: companies, recruiters, roles and follow-ups. ApplyLadder is a personal career CRM that gives your search the same structure.",
    sections: [
      {
        heading: "Why a job search needs a CRM",
        body: [
          "A serious job search involves many relationships at once. A recruiter contacts you about one role, a hiring manager about another, and a company you applied to months ago comes back. Spreadsheets and notes keep these separate, so context gets lost.",
          "A CRM keeps the relationships and the work together: who you talked to, about which role, what was said and what happens next.",
        ],
      },
      {
        heading: "The pieces of a career CRM",
        body: [
          "ApplyLadder connects the parts of your search instead of treating them as separate lists.",
        ],
        bullets: [
          "Companies: every company you've researched or applied to, with notes, links and history in one profile.",
          "Recruiters: contacts linked to the roles and conversations they own, so you never walk into a call without context.",
          "Jobs: each application with its status and history in a pipeline.",
          "Resumes: the exact version you sent, attached to the application.",
          "Interviews: rounds, notes and questions on a timeline you can revisit.",
          "Follow-ups: reminders so a quiet thread doesn't turn into a missed opportunity (Pro).",
        ],
      },
      {
        heading: "From tracking jobs to managing a career",
        body: [
          "A tracker answers \"where did I apply?\". A CRM answers \"who do I know there, what did we discuss and what should I do next?\". Over time the record compounds: you can see which applications led to responses and interviews, and adjust. Career analytics on the Pro plan show application, response, interview and offer rates.",
        ],
      },
      {
        heading: "Pricing",
        body: [
          "Start on the Free plan with up to 25 active applications, company and recruiter profiles, the job pipeline, the interview timeline and one resume version. Upgrade to Pro for $9 per month when you want unlimited applications, unlimited resume versions, reminders, analytics and the AI assistant.",
        ],
      },
    ],
    faq: [
      {
        q: "What is a job search CRM?",
        a: "A job search CRM is a personal customer-relationship-management tool applied to your career. It links companies, recruiters, applications, documents and interviews so you can manage a job search the way a sales team manages leads.",
      },
      {
        q: "Does ApplyLadder keep track of recruiters?",
        a: "Yes. Every recruiter contact is linked to the roles and conversations they own, so you have the full history before a call.",
      },
      {
        q: "Who is ApplyLadder for?",
        a: "Anyone running a real job search, from recent graduates to experienced professionals. A Team plan for career coaches and bootcamps is planned and open for a waitlist.",
      },
      {
        q: "Is my data private?",
        a: "Your career data is yours. It's encrypted, never sold, and you can export or delete everything at any time.",
      },
    ],
    related: ["job-application-tracker", "resume-tracker"],
  },
  {
    slug: "resume-tracker",
    label: "Resume tracker",
    title: "Resume Tracker: Which Resume Went Where",
    description:
      "Track every resume version and which company received it. ApplyLadder stores, tags and attaches the exact resume to each job application.",
    h1: "A resume tracker so you always know which version you sent",
    intro:
      "Tailoring your resume for each role is good practice, and it's also how you end up with ten files called final_v3 and no idea which one a company received. ApplyLadder records every resume version and attaches the exact one to each application.",
    sections: [
      {
        heading: "The resume problem in a big job search",
        body: [
          "When you tailor a resume per role, the questions pile up. Which version did you send to that company? Did the recruiter see the one with the new project? Is the recruiter call tomorrow about the data role or the product role?",
          "Without a record, you open the wrong file, repeat answers or contradict your own resume in an interview.",
        ],
      },
      {
        heading: "How ApplyLadder tracks resume versions",
        body: [
          "Store each resume version, give it a tag and attach it to the application it was sent with. Open any application later and you see exactly what the company saw.",
        ],
        bullets: [
          "Keep multiple resume versions in one place.",
          "Tag versions by role type, industry or date.",
          "See which resume went to which company at a glance.",
          "Keep cover letters, certificates and portfolios attached to the same application.",
        ],
      },
      {
        heading: "Learn which version works",
        body: [
          "Because each application is linked to its resume, you can compare outcomes. Career analytics on the Pro plan show application, response, interview and offer rates so you can see what is actually working and adjust your resume strategy.",
        ],
      },
      {
        heading: "Plans",
        body: [
          "The Free plan includes one resume version. Pro ($9 per month) includes unlimited resume versions, follow-up reminders, analytics and the AI assistant for resume optimization and tailored cover letters.",
        ],
      },
    ],
    faq: [
      {
        q: "Can I upload and track multiple resumes?",
        a: "Yes. Store every resume version, tag it, and ApplyLadder records exactly which one you sent to each company. The Free plan includes one resume version and Pro includes unlimited versions.",
      },
      {
        q: "Can I attach a cover letter too?",
        a: "Yes. Resumes, cover letters, certificates and portfolios can be attached to the application they belong to.",
      },
      {
        q: "Does ApplyLadder help improve my resume?",
        a: "The AI assistant on the Pro plan helps with resume optimization, tailored cover letters and interview preparation.",
      },
    ],
    related: ["job-application-tracker", "job-search-crm"],
  },
];

export function getContentPage(slug: string): ContentPage | undefined {
  return contentPages.find((p) => p.slug === slug);
}

/** Content pages are English-only; other locales get the home page only. */
export const CONTENT_LOCALE = "en";
