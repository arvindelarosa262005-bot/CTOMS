using CTOMS.Application.Common;
using CTOMS.Application.Features.Dashboard.Dtos;
using CTOMS.Application.Interfaces;
using CTOMS.Domain.Entities;
using CTOMS.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CTOMS.Infrastructure.Services;

public class DashboardService : IDashboardService
{
    private readonly AppDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public DashboardService(AppDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<ApiResponse<DashboardSummary>> GetSummaryAsync(CancellationToken ct = default)
    {
        var today = DateTime.UtcNow.Date;

        var active = await _db.CollectionSessions.FirstOrDefaultAsync(s => s.Status == SessionStatus.Active, ct);

        var todayTx = await _db.Transactions.AsNoTracking()
            .Where(t => t.CreatedAt >= today && t.Status == TransactionStatus.Completed)
            .ToListAsync(ct);

        var tithes = todayTx.Sum(t => t.TithesAmount);
        var offering = todayTx.Sum(t => t.OfferingAmount);

        // Only online ushers count
        var activeUshers = await _db.Users.AsNoTracking()
            .CountAsync(u => u.IsOnline && u.Role!.Type == RoleType.Usher, ct);

        return ApiResponse<DashboardSummary>.Ok(new DashboardSummary(
            tithes, offering, tithes + offering, todayTx.Count, activeUshers,
            active?.Id, active?.Name));
    }

    public async Task<ApiResponse<LiveCollection>> GetLiveCollectionAsync(CancellationToken ct = default)
    {
        var active = await _db.CollectionSessions.AsNoTracking().FirstOrDefaultAsync(s => s.Status == SessionStatus.Active, ct);
        if (active is null)
            return ApiResponse<LiveCollection>.Ok(new LiveCollection(Guid.Empty, "No active session", 0, 0, 0, 0, new List<LiveTransaction>()), "No active session.");

        var tx = await _db.Transactions.AsNoTracking()
            .Include(t => t.Usher)
            .Where(t => t.CollectionSessionId == active.Id && t.Status == TransactionStatus.Completed)
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync(ct);

        var tithes = tx.Sum(t => t.TithesAmount);
        var offering = tx.Sum(t => t.OfferingAmount);

        var activity = tx.Take(20).Select(t => new LiveTransaction(
            t.Id, t.DonorName, t.TithesAmount, t.OfferingAmount, t.TotalAmount,
            t.Usher?.Username, t.CreatedAt)).ToList();

        return ApiResponse<LiveCollection>.Ok(new LiveCollection(
            active.Id, active.Name, tithes, offering, tithes + offering, tx.Count, activity));
    }

    public async Task<ApiResponse<int>> GetActiveUsherCountAsync(CancellationToken ct = default)
    {
        var count = await _db.Users.AsNoTracking()
            .CountAsync(u => u.IsOnline && u.Role!.Type == RoleType.Usher, ct);
        return ApiResponse<int>.Ok(count);
    }
}
