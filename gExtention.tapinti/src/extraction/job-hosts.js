// Hostnames of known job boards / ATS platforms. Pages on these hosts are
// treated as job-related without needing to first confirm JobPosting markup
// (see page-reader.js). Kept in its own file for easy maintenance.
const RAW_KNOWN_JOB_HOSTS = [
  // ============================================================
  // GLOBAL / INTERNATIONAL
  // ============================================================
  "linkedin.com",
  "indeed.com",
  "glassdoor.com",
  "monster.com",
  "simplyhired.com",
  "careerjet.com",
  "jooble.org",
  "talent.com",
  "jobrapido.com",
  "adzuna.com",
  "jora.com",
  "whatjobs.com",
  "grabjobs.co",
  "jobisjob.com",
  "learn4good.com",

  // ============================================================
  // ATS / COMPANY CAREER HOSTING PLATFORMS
  // ============================================================
  "greenhouse.io",
  "boards.greenhouse.io",
  "lever.co",
  "jobs.lever.co",
  "myworkdayjobs.com",
  "workday.com",
  "smartrecruiters.com",
  "jobs.smartrecruiters.com",
  "workable.com",
  "apply.workable.com",
  "ashbyhq.com",
  "jobs.ashbyhq.com",
  "jobvite.com",
  "icims.com",
  "careers.icims.com",
  "bamboohr.com",
  "jobappnetwork.com",
  "successfactors.com",
  "successfactors.eu",
  "oraclecloud.com",
  "taleo.net",
  "recruitee.com",
  "teamtailor.com",
  "personio.com",
  "personio.de",
  "comeet.com",
  "pinpointhq.com",
  "applytojob.com",
  "paylocity.com",
  "ultipro.com",
  "ukg.com",
  "dayforcehcm.com",
  "breezy.hr",
  "jazz.co",
  "trakstar.com",

  // ============================================================
  // GCC / MIDDLE EAST
  // ============================================================
  "bayt.com",
  "naukrigulf.com",
  "gulftalent.com",
  "founditgulf.com",
  "laimoon.com",
  "gulfjobs.com",
  "akhtaboot.com",
  "wuzzuf.net",
  "mihnati.com",
  "tanqeeb.com",
  "drjobpro.com",
  "job4u.ae",

  // UAE
  "dubizzle.com",
  "careers.gov.ae",
  "dubaicareers.ae",

  // Saudi Arabia
  "jadarat.sa",
  "hrsd.gov.sa",

  // Oman
  "mol.gov.om",

  // Qatar
  "qatarenergy.qa",

  // ============================================================
  // TURKEY
  // ============================================================
  "kariyer.net",
  "yenibiris.com",
  "eleman.net",
  "secretcv.com",
  "iskur.gov.tr",
  "lescard.com",
  "elemanonline.com.tr",
  "cvbenim.com",

  // ============================================================
  // IRAN
  // ============================================================
  "jobinja.ir",
  "jobvision.ir",
  "iranestekhdam.ir",
  "e-estekhdam.com",
  "karboom.io",
  "quera.org",
  "irantalent.com",

  // ============================================================
  // EASTERN / CENTRAL EUROPE
  // ============================================================

  // Poland
  "pracuj.pl",
  "praca.pl",
  "jobs.pl",
  "nofluffjobs.com",
  "justjoin.it",
  "bulldogjob.pl",

  // Czech Republic
  "jobs.cz",
  "prace.cz",
  "startupjobs.cz",

  // Slovakia
  "profesia.sk",
  "kariera.zoznam.sk",

  // Hungary
  "profession.hu",
  "jobline.hu",
  "cvonline.hu",

  // Romania
  "ejobs.ro",
  "bestjobs.eu",
  "hipo.ro",

  // Bulgaria
  "jobs.bg",
  "jobtiger.bg",
  "zaplata.bg",

  // Croatia
  "moj-posao.net",
  "posao.hr",

  // Serbia
  "poslovi.infostud.com",
  "helloworld.rs",

  // Slovenia
  "mojedelo.com",
  "optius.com",

  // Estonia
  "cvkeskus.ee",
  "cv.ee",

  // Latvia
  "cv.lv",
  "visidarbi.lv",

  // Lithuania
  "cvonline.lt",
  "cvbankas.lt",

  // Ukraine
  "work.ua",
  "robota.ua",
  "jobs.ua",
  "djinni.co",

  // Moldova
  "rabota.md",
  "delucru.md",

  // ============================================================
  // NORTH AMERICA — USA
  // ============================================================
  "ziprecruiter.com",
  "careerbuilder.com",
  "dice.com",
  "wellfound.com",
  "builtin.com",
  "theladders.com",
  "snagajob.com",
  "flexjobs.com",
  "remote.co",
  "weworkremotely.com",
  "remoteok.com",
  "usajobs.gov",
  "higheredjobs.com",
  "idealist.org",
  "handshake.com",

  // ============================================================
  // NORTH AMERICA — CANADA
  // ============================================================
  "jobbank.gc.ca",
  "workopolis.com",
  "eluta.ca",
  "jobillico.com",
  "jobboom.com",
  "bcjobs.ca",
  "workbc.ca",

  // ============================================================
  // NORTH AMERICA — MEXICO
  // ============================================================
  "occ.com.mx",
  "computrabajo.com.mx",
  "bumeran.com.mx",
  "empleonuevo.com",

  // ============================================================
  // NORTH AFRICA
  // ============================================================

  // Egypt
  "forasna.com",
  "shaghalni.com",

  // Morocco
  "rekrute.com",
  "emploi.ma",
  "dreamjob.ma",

  // Algeria
  "emploitic.com",
  "optioncarriere.dz",
  "ouedkniss.com",

  // Tunisia
  "keejob.com",
  "tanitjobs.com",
  "emploi.nat.tn",

  // ============================================================
  // AUSTRALIA
  // ============================================================
  "seek.com.au",
  "careerone.com.au",
  "ethicaljobs.com.au",
  "workforceaustralia.gov.au",
  "apsjobs.gov.au",
  "jobsearch.gov.au",
  "careers.vic.gov.au",
  "iworkfor.nsw.gov.au",
  "smartjobs.qld.gov.au",

  // ============================================================
  // NEW ZEALAND
  // ============================================================
  "seek.co.nz",
  "trademe.co.nz",
  "jobs.govt.nz",
  "kiwihealthjobs.com",
  "jobspace.co.nz",
  "sjs.co.nz",

  // ============================================================
  // TECH / STARTUPS / REMOTE
  // ============================================================
  "stackoverflowjobs.com",
  "remotive.com",
  "workingnomads.com",
  "jobspresso.co",
  "euremotejobs.com",
  "otta.com",
  "cord.co",
  "himalayas.app",
  "arc.dev",
  "turing.com",

  // ============================================================
  // EUROPE-WIDE / EU
  // ============================================================
  "eures.europa.eu",
  "eurojobs.com",
  "eurobrussels.com",
  "jobsinnetwork.com",

  // ============================================================
  // OTHER LARGE JOB NETWORKS
  // ============================================================
  "jobstreet.com",
  "naukri.com",
  "foundit.in",
  "shine.com",
  "timesjobs.com",
];

export const KNOWN_JOB_HOSTS = Array.from(new Set(RAW_KNOWN_JOB_HOSTS));

export function isKnownJobHost(hostname) {
  const host = hostname.replace(/^www\./, "");
  return KNOWN_JOB_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
}
