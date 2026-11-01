using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.jobhunter.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddUserCreated : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "Created",
                table: "AspNetUsers",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Created",
                table: "AspNetUsers");
        }
    }
}
