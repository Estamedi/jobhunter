using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace backend.jobhunter.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCandidatePreferences : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CandidatePreferences",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CandidateId = table.Column<int>(type: "integer", nullable: false),
                    WorkStatus = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    SearchIntensity = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    PrimaryGoal = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    MinSalary = table.Column<int>(type: "integer", nullable: true),
                    SalaryCurrency = table.Column<string>(type: "character varying(3)", maxLength: 3, nullable: true),
                    EmploymentTypes = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    WorkModes = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    WillingToRelocate = table.Column<bool>(type: "boolean", nullable: true),
                    RemoteRegions = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CommuteCities = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    WorkAuthorization = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    Industries = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Created = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    LastModified = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true),
                    OwnerId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CandidatePreferences", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CandidatePreferences_Candidates_CandidateId",
                        column: x => x.CandidateId,
                        principalTable: "Candidates",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CandidatePreferences_CandidateId",
                table: "CandidatePreferences",
                column: "CandidateId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CandidatePreferences");
        }
    }
}
