using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.jobhunter.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class ChangeJobApplicationPriorityToEnum : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                ALTER TABLE "Applications"
                ALTER COLUMN "Priority" TYPE integer
                USING (CASE "Priority"
                    WHEN 'None' THEN 0
                    WHEN 'Low' THEN 1
                    WHEN 'Medium' THEN 2
                    WHEN 'High' THEN 3
                    ELSE 2
                END);
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                ALTER TABLE "Applications"
                ALTER COLUMN "Priority" TYPE character varying(50)
                USING (CASE "Priority"
                    WHEN 0 THEN 'None'
                    WHEN 1 THEN 'Low'
                    WHEN 2 THEN 'Medium'
                    WHEN 3 THEN 'High'
                    ELSE 'Medium'
                END);
                """);
        }
    }
}
