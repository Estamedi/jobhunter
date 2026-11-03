using backend.jobhunter.Application.Common.Interfaces;
using backend.jobhunter.Application.CvDrafts;
using NUnit.Framework;
using Shouldly;

namespace backend.jobhunter.Application.UnitTests.CvDrafts;

public class CvJobCopyAndPronounCheckTests
{
    private const string Job = "You will build CI/CD pipelines, manage infrastructure as code with Terraform, automate configuration with Ansible, and run containers on Docker.";

    private static GeneratedCvDto Cv(string summary, params string[] bullets) => new()
    {
        Summary = summary,
        Experience = [new CvExperienceDto { Role = "Lead", Company = "Acme", Bullets = bullets.ToList() }],
    };

    [Test]
    public void ShouldFlagASentenceCopiedFromTheJobDescription()
    {
        var cv = Cv("Engineer.", "Manage infrastructure as code with Terraform, automate configuration with Ansible, and run containers on Docker.");

        var copied = CvJobCopyCheck.FindCopiedRuns(cv, Job);

        copied.ShouldHaveSingleItem().ShouldContain("infrastructure as code with terraform automate configuration with ansible");
    }

    [Test]
    public void ShouldNotFlagAMirroredTerm()
    {
        var cv = Cv("Engineer.", "Built infrastructure as code with **Terraform** for 12 services.", "Automated configuration with Ansible across 20 servers.");

        CvJobCopyCheck.FindCopiedRuns(cv, Job).ShouldBeEmpty();
    }

    [Test]
    public void ShouldCheckTheSummaryToo()
    {
        var cv = Cv("You will build CI/CD pipelines, manage infrastructure as code with Terraform and more.");

        CvJobCopyCheck.FindCopiedRuns(cv, Job).ShouldHaveSingleItem();
    }

    [Test]
    public void ShouldNotFlagWordingThatIsAlsoInTheCandidatesOwnBackground()
    {
        var cv = Cv("Engineer.", "Manage infrastructure as code with Terraform, automate configuration with Ansible, and run containers on Docker.");
        const string background = "- Lead at Acme: manage infrastructure as code with Terraform, automate configuration with Ansible, and run containers on Docker for 20 servers.";

        CvJobCopyCheck.FindCopiedRuns(cv, Job, background).ShouldBeEmpty();
        CvJobCopyCheck.FindCopiedRuns(cv, Job, "- Lead at Acme: built dashboards.").ShouldHaveSingleItem();
    }

    [Test]
    public void ShouldFlagNothingWithoutAJobDescription()
        => CvJobCopyCheck.FindCopiedRuns(Cv("Anything at all here, many many words, enough to pass eight."), null).ShouldBeEmpty();

    [TestCase("He has delivered CI/CD pipelines.", "he")]
    [TestCase("I build reliable systems.", "i")]
    [TestCase("Engineer with her team of 4.", "her")]
    public void ShouldFindPersonalPronounsInTheSummary(string summary, string expected)
        => CvPronounCheck.Find(Cv(summary)).ShouldContain(expected);

    [Test]
    public void ShouldNotTreatDiskIoAsThePronounI()
        => CvPronounCheck.Find(Cv("Reduced disk I/O latency for 12 services.")).ShouldBeEmpty();

    [Test]
    public void ShouldAcceptASummaryWithoutPronouns()
        => CvPronounCheck.Find(Cv("DevOps engineer with 13+ years in delivery and monitoring.")).ShouldBeEmpty();

    [Test]
    public void ShouldNotMistakeWordsContainingAPronounForOne()
        => CvPronounCheck.Find(Cv("Shell scripting and Hershey integration, then thermal checks.")).ShouldBeEmpty();
}
