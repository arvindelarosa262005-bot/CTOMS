using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CTOMS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddArchiveFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "ArchivedAt",
                table: "Users",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsArchived",
                table: "Users",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "ArchivedAt",
                table: "Transactions",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsArchived",
                table: "Transactions",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "ArchivedAt",
                table: "Envelopes",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsArchived",
                table: "Envelopes",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "ArchivedAt",
                table: "CollectionSessions",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsArchived",
                table: "CollectionSessions",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ArchivedAt",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "IsArchived",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "ArchivedAt",
                table: "Transactions");

            migrationBuilder.DropColumn(
                name: "IsArchived",
                table: "Transactions");

            migrationBuilder.DropColumn(
                name: "ArchivedAt",
                table: "Envelopes");

            migrationBuilder.DropColumn(
                name: "IsArchived",
                table: "Envelopes");

            migrationBuilder.DropColumn(
                name: "ArchivedAt",
                table: "CollectionSessions");

            migrationBuilder.DropColumn(
                name: "IsArchived",
                table: "CollectionSessions");
        }
    }
}
