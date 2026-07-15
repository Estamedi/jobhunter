using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.jobhunter.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCvIdToJobApplication : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Cvs_Applications_ApplicationId",
                table: "Cvs");

            migrationBuilder.DropIndex(
                name: "IX_Cvs_ApplicationId",
                table: "Cvs");

            migrationBuilder.DropColumn(
                name: "ApplicationId",
                table: "Cvs");

            migrationBuilder.AddColumn<int>(
                name: "CvId",
                table: "Applications",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Applications_CvId",
                table: "Applications",
                column: "CvId");

            migrationBuilder.AddForeignKey(
                name: "FK_Applications_Cvs_CvId",
                table: "Applications",
                column: "CvId",
                principalTable: "Cvs",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Applications_Cvs_CvId",
                table: "Applications");

            migrationBuilder.DropIndex(
                name: "IX_Applications_CvId",
                table: "Applications");

            migrationBuilder.DropColumn(
                name: "CvId",
                table: "Applications");

            migrationBuilder.AddColumn<int>(
                name: "ApplicationId",
                table: "Cvs",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Cvs_ApplicationId",
                table: "Cvs",
                column: "ApplicationId");

            migrationBuilder.AddForeignKey(
                name: "FK_Cvs_Applications_ApplicationId",
                table: "Cvs",
                column: "ApplicationId",
                principalTable: "Applications",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }
    }
}
