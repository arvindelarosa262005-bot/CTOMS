using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CTOMS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RemoveEnvelopeSessionUnique : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Transactions_EnvelopeId_CollectionSessionId",
                table: "Transactions");

            migrationBuilder.CreateIndex(
                name: "IX_Transactions_EnvelopeId_CollectionSessionId",
                table: "Transactions",
                columns: new[] { "EnvelopeId", "CollectionSessionId" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Transactions_EnvelopeId_CollectionSessionId",
                table: "Transactions");

            migrationBuilder.CreateIndex(
                name: "IX_Transactions_EnvelopeId_CollectionSessionId",
                table: "Transactions",
                columns: new[] { "EnvelopeId", "CollectionSessionId" },
                unique: true);
        }
    }
}
