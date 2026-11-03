using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.jobhunter.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCvDraftGenerationStatus : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "GenerationAttempts",
                table: "CvDrafts",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "GenerationError",
                table: "CvDrafts",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "GenerationNotes",
                table: "CvDrafts",
                type: "character varying(20000)",
                maxLength: 20000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "GenerationWarningsJson",
                table: "CvDrafts",
                type: "jsonb",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "CvDrafts",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "Completed");

            migrationBuilder.CreateIndex(
                name: "IX_CvDrafts_Status",
                table: "CvDrafts",
                column: "Status");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_CvDrafts_Status",
                table: "CvDrafts");

            migrationBuilder.DropColumn(
                name: "GenerationAttempts",
                table: "CvDrafts");

            migrationBuilder.DropColumn(
                name: "GenerationError",
                table: "CvDrafts");

            migrationBuilder.DropColumn(
                name: "GenerationNotes",
                table: "CvDrafts");

            migrationBuilder.DropColumn(
                name: "GenerationWarningsJson",
                table: "CvDrafts");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "CvDrafts");
        }
    }
}
