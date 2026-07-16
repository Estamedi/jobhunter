using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace backend.jobhunter.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddJobTitle : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "JobTitleId",
                table: "JobRoles",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "JobTitles",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    Created = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    LastModified = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true),
                    OwnerId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_JobTitles", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_JobRoles_JobTitleId",
                table: "JobRoles",
                column: "JobTitleId");

            migrationBuilder.CreateIndex(
                name: "IX_JobTitles_Name",
                table: "JobTitles",
                column: "Name");

            migrationBuilder.AddForeignKey(
                name: "FK_JobRoles_JobTitles_JobTitleId",
                table: "JobRoles",
                column: "JobTitleId",
                principalTable: "JobTitles",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_JobRoles_JobTitles_JobTitleId",
                table: "JobRoles");

            migrationBuilder.DropTable(
                name: "JobTitles");

            migrationBuilder.DropIndex(
                name: "IX_JobRoles_JobTitleId",
                table: "JobRoles");

            migrationBuilder.DropColumn(
                name: "JobTitleId",
                table: "JobRoles");
        }
    }
}
