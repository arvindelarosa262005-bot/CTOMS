using CTOMS.Application.Common;
using CTOMS.Application.Features.Settings.Dtos;
using CTOMS.Application.Interfaces;
using CTOMS.Domain.Entities;
using CTOMS.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CTOMS.Infrastructure.Services;

public class SettingsService : ISettingsService
{
    private readonly AppDbContext _db;
    private readonly IAuditService _audit;

    public SettingsService(AppDbContext db, IAuditService audit)
    {
        _db = db;
        _audit = audit;
    }

    public async Task<ApiResponse<ChurchSettingsDto>> GetAsync(CancellationToken ct = default)
    {
        var settings = await _db.ChurchSettings.AsNoTracking().ToListAsync(ct);
        return ApiResponse<ChurchSettingsDto>.Ok(Map(settings));
    }

    public async Task<ApiResponse<ChurchSettingsDto>> UpdateAsync(UpdateChurchSettingsRequest request, CancellationToken ct = default)
    {
        var settings = await _db.ChurchSettings.ToListAsync(ct);
        var defaults = new Dictionary<string, string>
        {
            ["ChurchName"] = request.ChurchName,
            ["Address"] = request.Address,
            ["Contact"] = request.Contact,
            ["Email"] = request.Email,
            ["LogoUrl"] = request.LogoUrl
        };

        foreach (var kv in defaults)
        {
            var existing = settings.FirstOrDefault(s => s.Key == kv.Key);
            if (existing is null)
                _db.ChurchSettings.Add(new ChurchSetting { Key = kv.Key, Value = kv.Value, UpdatedAt = DateTime.UtcNow });
            else
            {
                existing.Value = kv.Value;
                existing.UpdatedAt = DateTime.UtcNow;
            }
        }
        await _db.SaveChangesAsync(ct);

        await _audit.LogAsync("Admin updated Church Settings", "Settings", ct: ct);

        return ApiResponse<ChurchSettingsDto>.Ok(Map(await _db.ChurchSettings.AsNoTracking().ToListAsync(ct)), "Settings updated.");
    }

    public async Task<ApiResponse<BackupResult>> CreateBackupAsync(CancellationToken ct = default)
    {
        var dbName = _db.Database.GetDbConnection().Database;
        var fileName = $"CTOMS_Backup_{DateTime.UtcNow:yyyyMMdd_HHmmss}.json";
        var data = new System.Text.StringBuilder();
        data.AppendLine("{");

        var entities = new (string name, object list)[]
        {
            ("Roles", await _db.Roles.AsNoTracking().ToListAsync(ct)),
            ("Users", await _db.Users.AsNoTracking().ToListAsync(ct)),
            ("CollectionSessions", await _db.CollectionSessions.AsNoTracking().ToListAsync(ct)),
            ("Envelopes", await _db.Envelopes.AsNoTracking().ToListAsync(ct)),
            ("Transactions", await _db.Transactions.AsNoTracking().ToListAsync(ct)),
            ("ChurchSettings", await _db.ChurchSettings.AsNoTracking().ToListAsync(ct)),
        };

        data.AppendLine(string.Join("," + Environment.NewLine,
            entities.Select(e => $"  \"{e.name}\": {System.Text.Json.JsonSerializer.Serialize(e.list)}")));
        data.AppendLine("}");

        var bytes = System.Text.Encoding.UTF8.GetBytes(data.ToString());
        var backupFolder = Path.Combine(AppContext.BaseDirectory, "Backups");
        Directory.CreateDirectory(backupFolder);
        var fullPath = Path.Combine(backupFolder, fileName);
        await File.WriteAllBytesAsync(fullPath, bytes, ct);

        await _audit.LogAsync("Admin created database backup", "Backup", details: $"Backup file '{fileName}' created", ct: ct);

        return ApiResponse<BackupResult>.Ok(new BackupResult(fileName, bytes.Length, DateTime.UtcNow), "Backup created.");
    }

    private static ChurchSettingsDto Map(List<ChurchSetting> settings) =>
        new(
            Get(settings, "ChurchName"),
            Get(settings, "Address"),
            Get(settings, "Contact"),
            Get(settings, "Email"),
            Get(settings, "LogoUrl"));

    private static string Get(List<ChurchSetting> settings, string key) =>
        settings.FirstOrDefault(s => s.Key == key)?.Value ?? "";
}
