using CTOMS.Application.Common;
using CTOMS.Application.Features.Audit.Dtos;
using CTOMS.Application.Interfaces;
using CTOMS.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CTOMS.Infrastructure.Services;

public class AuditQueryService : IAuditQueryService
{
    private readonly AppDbContext _db;

    public AuditQueryService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<PagedResult<AuditLogDto>>> QueryAsync(AuditQuery query, CancellationToken ct = default)
    {
        var q = _db.AuditLogs.Include(a => a.User).AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var s = query.Search.Trim().ToLower();
            q = q.Where(a => a.Action.ToLower().Contains(s) || (a.Details != null && a.Details.ToLower().Contains(s)));
        }
        if (query.UserId.HasValue)
            q = q.Where(a => a.UserId == query.UserId.Value);
        if (query.From.HasValue)
            q = q.Where(a => a.CreatedAt >= query.From.Value.ToUniversalTime());
        if (query.To.HasValue)
            q = q.Where(a => a.CreatedAt <= query.To.Value.AddDays(1).ToUniversalTime());

        var total = await q.CountAsync(ct);
        var items = await q.OrderByDescending(a => a.CreatedAt)
            .Skip((query.Page - 1) * query.PageSize).Take(query.PageSize)
            .ToListAsync(ct);

        var result = items.Select(a => new AuditLogDto(
            a.Id, a.UserId, a.User?.FullName, a.Action, a.Category, a.Details,
            a.DeviceInfo, a.IpAddress, a.AffectedRecordType, a.AffectedRecordId, a.CreatedAt)).ToList();

        return ApiResponse<PagedResult<AuditLogDto>>.Ok(new PagedResult<AuditLogDto>
        {
            Items = result, TotalCount = total, Page = query.Page, PageSize = query.PageSize
        });
    }
}
