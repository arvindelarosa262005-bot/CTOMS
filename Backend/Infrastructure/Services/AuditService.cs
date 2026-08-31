using CTOMS.Application.Interfaces;
using CTOMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using CTOMS.Infrastructure.Persistence;

namespace CTOMS.Infrastructure.Services;

public class AuditService : IAuditService
{
    private readonly AppDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public AuditService(AppDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task LogAsync(string action, string category, string? details = null,
        string? affectedRecordType = null, string? affectedRecordId = null,
        CancellationToken ct = default)
    {
        var log = new AuditLog
        {
            UserId = _currentUser.UserId,
            Action = action,
            Category = category,
            Details = details,
            DeviceInfo = _currentUser.DeviceInfo,
            IpAddress = _currentUser.IpAddress,
            AffectedRecordType = affectedRecordType,
            AffectedRecordId = affectedRecordId,
            CreatedAt = DateTime.UtcNow
        };

        _db.AuditLogs.Add(log);
        await _db.SaveChangesAsync(ct);
    }
}
