using CTOMS.Application.Common;
using CTOMS.Application.Features.Sessions.Dtos;
using CTOMS.Application.Interfaces;
using CTOMS.Domain.Entities;
using CTOMS.Infrastructure.Persistence;
using CTOMS.Infrastructure.Realtime;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace CTOMS.Infrastructure.Services;

public class SessionService : ISessionService
{
    private readonly AppDbContext _db;
    private readonly ICurrentUserService _currentUser;
    private readonly IAuditService _audit;
    private readonly IRealtimeService _realtime;

    public SessionService(AppDbContext db, ICurrentUserService currentUser, IAuditService audit, IRealtimeService realtime)
    {
        _db = db;
        _currentUser = currentUser;
        _audit = audit;
        _realtime = realtime;
    }

    public async Task<ApiResponse<List<SessionDto>>> GetAllAsync(SessionQuery query, CancellationToken ct = default)
    {
        var q = _db.CollectionSessions.Include(cs => cs.CreatedBy).AsNoTracking().AsQueryable();
        if (query.IncludeArchived == true)
            q = q.IgnoreQueryFilters();
        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var s = query.Search.Trim().ToLower();
            q = q.Where(cs => cs.Name.ToLower().Contains(s) || cs.ServiceType.ToLower().Contains(s));
        }
        if (query.Status.HasValue)
            q = q.Where(cs => (int)cs.Status == query.Status.Value);
        if (query.From.HasValue)
            q = q.Where(cs => cs.Date >= query.From.Value.Date);
        if (query.To.HasValue)
            q = q.Where(cs => cs.Date <= query.To.Value);

        var sessions = await q
            .OrderByDescending(cs => cs.Date)
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .ToListAsync(ct);

        var ids = sessions.Select(s => s.Id).ToList();
        var counts = await _db.Transactions.AsNoTracking()
            .Where(t => ids.Contains(t.CollectionSessionId) && t.Status == TransactionStatus.Completed)
            .GroupBy(t => t.CollectionSessionId)
            .Select(g => new { g.Key, Count = g.Count(), Tithes = g.Sum(x => x.TithesAmount), Offering = g.Sum(x => x.OfferingAmount) })
            .ToListAsync(ct);

        var result = sessions.Select(s =>
        {
            var info = counts.FirstOrDefault(c => c.Key == s.Id);
            return ToDto(s, info?.Count ?? 0, info?.Tithes ?? 0, info?.Offering ?? 0);
        }).ToList();

        return ApiResponse<List<SessionDto>>.Ok(result);
    }

    public async Task<ApiResponse<SessionDto>> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        var s = await _db.CollectionSessions.Include(cs => cs.CreatedBy).AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, ct);
        if (s is null)
            return ApiResponse<SessionDto>.Fail("Session not found.");

        var info = await _db.Transactions.AsNoTracking()
            .Where(t => t.CollectionSessionId == id && t.Status == TransactionStatus.Completed)
            .GroupBy(t => t.CollectionSessionId)
            .Select(g => new { Count = g.Count(), Tithes = g.Sum(x => x.TithesAmount), Offering = g.Sum(x => x.OfferingAmount) })
            .FirstOrDefaultAsync(ct);

        return ApiResponse<SessionDto>.Ok(ToDto(s, info?.Count ?? 0, info?.Tithes ?? 0, info?.Offering ?? 0));
    }

    public async Task<ApiResponse<SessionDto>> CreateAsync(CreateSessionRequest request, CancellationToken ct = default)
    {
        var session = new CollectionSession
        {
            Name = request.Name.Trim(),
            ServiceType = request.ServiceType.Trim(),
            Date = request.Date.Date,
            StartTime = request.StartTime,
            EndTime = request.EndTime,
            Status = SessionStatus.Upcoming,
            CreatedByUserId = _currentUser.UserId,
            CreatedAt = DateTime.UtcNow
        };
        _db.CollectionSessions.Add(session);
        await _db.SaveChangesAsync(ct);

        await _audit.LogAsync("Admin created Collection Session", "Session", details: $"Session '{session.Name}' created",
            affectedRecordType: "CollectionSession", affectedRecordId: session.Id.ToString(), ct: ct);

        return ApiResponse<SessionDto>.Ok(ToDto(session, 0, 0, 0), "Session created.");
    }

    public async Task<ApiResponse<SessionDto>> UpdateAsync(Guid id, UpdateSessionRequest request, CancellationToken ct = default)
    {
        var session = await _db.CollectionSessions.FirstOrDefaultAsync(s => s.Id == id, ct);
        if (session is null)
            return ApiResponse<SessionDto>.Fail("Session not found.");

        session.Name = request.Name.Trim();
        session.ServiceType = request.ServiceType.Trim();
        session.Date = request.Date.Date;
        session.StartTime = request.StartTime;
        session.EndTime = request.EndTime;
        await _db.SaveChangesAsync(ct);

        await _audit.LogAsync("Admin updated Collection Session", "Session", details: $"Session '{session.Name}' updated",
            affectedRecordType: "CollectionSession", affectedRecordId: session.Id.ToString(), ct: ct);

        return ApiResponse<SessionDto>.Ok(ToDto(session, 0, 0, 0), "Session updated.");
    }

    public async Task<ApiResponse<SessionDto>> StartAsync(Guid id, CancellationToken ct = default)
    {
        var session = await _db.CollectionSessions.FirstOrDefaultAsync(s => s.Id == id, ct);
        if (session is null)
            return ApiResponse<SessionDto>.Fail("Session not found.");

        // Close any other active session first
        var active = await _db.CollectionSessions.Where(s => s.Status == SessionStatus.Active && s.Id != id).ToListAsync(ct);
        foreach (var a in active)
        {
            a.Status = SessionStatus.Closed;
            a.ClosedAt = DateTime.UtcNow;
        }

        session.Status = SessionStatus.Active;
        session.StartedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        await _audit.LogAsync("Admin started Collection Session", "Session", details: $"Session '{session.Name}' started",
            affectedRecordType: "CollectionSession", affectedRecordId: session.Id.ToString(), ct: ct);
        await _realtime.SendSessionStartedAsync(new { Id = session.Id, Name = session.Name }, ct);

        return ApiResponse<SessionDto>.Ok(ToDto(session, 0, 0, 0), "Session started.");
    }

    public async Task<ApiResponse<SessionDto>> CloseAsync(Guid id, CancellationToken ct = default)
    {
        var session = await _db.CollectionSessions.FirstOrDefaultAsync(s => s.Id == id, ct);
        if (session is null)
            return ApiResponse<SessionDto>.Fail("Session not found.");

        session.Status = SessionStatus.Closed;
        session.ClosedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        await _audit.LogAsync("Admin closed Collection Session", "Session", details: $"Session '{session.Name}' closed",
            affectedRecordType: "CollectionSession", affectedRecordId: session.Id.ToString(), ct: ct);
        await _realtime.SendSessionClosedAsync(new { Id = session.Id, Name = session.Name }, ct);

        return ApiResponse<SessionDto>.Ok(ToDto(session, 0, 0, 0), "Session closed.");
    }

    public async Task<ApiResponse<SessionDto?>> GetActiveAsync(CancellationToken ct = default)
    {
        var s = await _db.CollectionSessions.AsNoTracking().FirstOrDefaultAsync(x => x.Status == SessionStatus.Active, ct);
        if (s is null)
            return ApiResponse<SessionDto?>.Ok(null, "No active session.");

        var info = await _db.Transactions.AsNoTracking()
            .Where(t => t.CollectionSessionId == s.Id && t.Status == TransactionStatus.Completed)
            .GroupBy(t => t.CollectionSessionId)
            .Select(g => new { Count = g.Count(), Tithes = g.Sum(x => x.TithesAmount), Offering = g.Sum(x => x.OfferingAmount) })
            .FirstOrDefaultAsync(ct);

        return ApiResponse<SessionDto?>.Ok(ToDto(s, info?.Count ?? 0, info?.Tithes ?? 0, info?.Offering ?? 0));
    }

    public async Task<ApiResponse<bool>> SetArchivedAsync(Guid id, bool archived, CancellationToken ct = default)
    {
        var session = await _db.CollectionSessions.FirstOrDefaultAsync(s => s.Id == id, ct);
        if (session is null)
            return ApiResponse<bool>.Fail("Session not found.");
        if (session.Status == SessionStatus.Active)
            return ApiResponse<bool>.Fail("Cannot archive an active session. Close the session first.");

        session.IsArchived = archived;
        session.ArchivedAt = archived ? DateTime.UtcNow : null;
        await _db.SaveChangesAsync(ct);

        await _audit.LogAsync(archived ? "Session archived" : "Session restored", "Session",
            details: $"Session '{session.Name}' {(archived ? "archived" : "restored")}",
            affectedRecordType: "CollectionSession", affectedRecordId: session.Id.ToString(), ct: ct);

        return ApiResponse<bool>.Ok(true, archived ? "Session archived." : "Session restored.");
    }

    private static SessionDto ToDto(CollectionSession s, int count, decimal tithes, decimal offering) =>
        new(s.Id, s.Name, s.ServiceType, s.Date, s.StartTime, s.EndTime, (int)s.Status,
            s.CreatedBy?.FullName, s.CreatedAt, s.StartedAt, s.ClosedAt,
            count, tithes, offering, tithes + offering, s.IsArchived);
}
