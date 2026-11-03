using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.jobhunter.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddSkillEvidenceLevelAndNote : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "EvidenceLevel",
                table: "ProfileSkills",
                type: "character varying(30)",
                maxLength: 30,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Note",
                table: "ProfileSkills",
                type: "character varying(300)",
                maxLength: 300,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EvidenceLevel",
                table: "ProfileSkills");

            migrationBuilder.DropColumn(
                name: "Note",
                table: "ProfileSkills");
        }
    }
}
