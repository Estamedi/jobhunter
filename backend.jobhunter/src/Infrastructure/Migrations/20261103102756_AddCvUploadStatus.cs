using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.jobhunter.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCvUploadStatus : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "LastUploadAttemptAt",
                table: "Cvs",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LastUploadError",
                table: "Cvs",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "UploadAttempts",
                table: "Cvs",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "UploadStatus",
                table: "Cvs",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_Cvs_UploadStatus",
                table: "Cvs",
                column: "UploadStatus");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Cvs_UploadStatus",
                table: "Cvs");

            migrationBuilder.DropColumn(
                name: "LastUploadAttemptAt",
                table: "Cvs");

            migrationBuilder.DropColumn(
                name: "LastUploadError",
                table: "Cvs");

            migrationBuilder.DropColumn(
                name: "UploadAttempts",
                table: "Cvs");

            migrationBuilder.DropColumn(
                name: "UploadStatus",
                table: "Cvs");
        }
    }
}
