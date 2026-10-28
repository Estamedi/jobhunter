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
  /** Optional file shown as a download button */
  download?: { href: string; label: string };
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
    related: ["job-search-crm", "resume-tracker", "interview-tracker", "job-application-tracker-spreadsheet-template"],
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
    related: ["job-application-tracker", "resume-tracker", "interview-tracker"],
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
    related: ["job-application-tracker", "job-search-crm", "interview-tracker"],
  },
  {
    slug: "interview-tracker",
    label: "Interview tracker",
    title: "Interview Tracker: Notes, Rounds and Questions",
    description:
      "Track every interview round, note and question in a timeline. ApplyLadder links interviews to the application, company and recruiter so you can prepare and follow up.",
    h1: "An interview tracker that remembers every round",
    intro:
      "By the third interview with a company, you're expected to remember what you said in the first one. ApplyLadder keeps every interview, note and question on a timeline linked to the application, so you can prepare in minutes instead of digging through your inbox.",
    sections: [
      {
        heading: "Why interviews are easy to lose track of",
        body: [
          "A single role can involve an HR screen, a technical round and a final conversation, each with different people. Multiply that by a dozen active applications and the details blur: who interviewed you, what they asked and what you promised to send afterwards.",
        ],
      },
      {
        heading: "What the interview timeline captures",
        body: [
          "Each application has its own interview timeline. You record what happened as it happens and revisit it before the next round.",
        ],
        bullets: [
          "Every interview round in order, from HR to technical to final.",
          "Your notes from each conversation.",
          "The questions you were asked, so you can prepare better answers next time.",
          "The recruiter and company the interview belongs to, one click away.",
        ],
      },
      {
        heading: "Connected to the rest of your search",
        body: [
          "An interview isn't an isolated event. In ApplyLadder it belongs to an application that moves through the pipeline, uses a specific resume version and has a recruiter attached. When you open the application before a call, you see the full picture.",
          "On the Pro plan, follow-up reminders nudge you when a thread goes quiet after an interview, and the AI assistant helps with interview preparation.",
        ],
      },
      {
        heading: "Plans",
        body: [
          "The interview timeline is included in the Free plan, which also covers up to 25 active applications. Pro is $9 per month.",
        ],
      },
    ],
    faq: [
      {
        q: "What should I track for each interview?",
        a: "Record the round, who you spoke with, the questions you were asked, your notes and any follow-up you promised. ApplyLadder keeps these on a timeline attached to the application.",
      },
      {
        q: "Is the interview timeline free?",
        a: "Yes. The interview timeline is part of the Free plan.",
      },
      {
        q: "Can ApplyLadder help me prepare for interviews?",
        a: "The AI assistant on the Pro plan helps with interview preparation, and your timeline shows the questions and notes from earlier rounds.",
      },
    ],
    related: ["job-application-tracker", "job-search-crm", "resume-tracker"],
  },
  {
    slug: "job-application-tracker-spreadsheet-template",
    label: "Job application tracker template",
    title: "Free Job Application Tracker Spreadsheet Template",
    description:
      "Download a free job application tracker template (CSV) for Excel or Google Sheets, with columns for status, recruiter, resume version and follow-up date.",
    h1: "Free job application tracker spreadsheet template",
    intro:
      "A spreadsheet is a fine way to start tracking your job search. This free CSV template opens in Excel, Google Sheets and Numbers, with the columns most job seekers end up adding anyway.",
    download: {
      href: "/templates/job-application-tracker-template.csv",
      label: "Download the template (CSV)",
    },
    sections: [
      {
        heading: "What's in the template",
        body: [
          "The file has one row per application and these columns:",
        ],
        bullets: [
          "Company, Role and Job URL",
          "Status (Wishlist, Preparing, Applied, HR, Technical, Offer, Accepted or Rejected)",
          "Date Applied",
          "Recruiter and Recruiter Email",
          "Resume Version",
          "Next Step and Follow-up Date",
          "Notes",
        ],
      },
      {
        heading: "How to use it",
        body: [
          "Open the CSV in Excel or Google Sheets (File, then Import in Sheets), delete the example row and add one row per role. Sort by Follow-up Date to see what needs attention, and filter by Status to see your pipeline.",
        ],
      },
      {
        heading: "When a spreadsheet stops being enough",
        body: [
          "A spreadsheet works well for a small search. Around a few dozen applications the cracks show: nothing reminds you to follow up, recruiter details are copied between rows, you can't attach the resume you sent, and interview notes end up in a different file.",
          "ApplyLadder keeps the same information in a connected workspace: a pipeline with the same stages, linked company and recruiter profiles, resume versions, an interview timeline and reminders. You can import your spreadsheet as a CSV, so the work you did in the template carries over.",
        ],
      },
    ],
    faq: [
      {
        q: "Does the template work in Google Sheets and Excel?",
        a: "Yes. It's a plain CSV file that opens in Excel, Google Sheets, Numbers and LibreOffice.",
      },
      {
        q: "Can I import the template into ApplyLadder?",
        a: "ApplyLadder can import companies and applications from a CSV, so you can move over from a spreadsheet without starting from scratch.",
      },
      {
        q: "Is the template really free?",
        a: "Yes. There is nothing to sign up for to download it.",
      },
    ],
    related: ["job-application-tracker", "job-search-crm", "interview-tracker"],
  },
];

export function getContentPage(slug: string): ContentPage | undefined {
  return contentPages.find((p) => p.slug === slug);
}

/** Content pages are English-only; other locales get the home page only. */
export const CONTENT_LOCALE = "en";
