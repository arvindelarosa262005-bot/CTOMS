using CTOMS.Application.Common;
using CTOMS.Application.Features.Transactions.Dtos;
using CTOMS.Application.Interfaces;
using CTOMS.Domain.Entities;
using CTOMS.Infrastructure.Persistence;
using CTOMS.Infrastructure.Realtime;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace CTOMS.Infrastructure.Services;

public class TransactionService : ITransactionService
{
    private readonly AppDbContext _db;
    private readonly ICurrentUserService _currentUser;
    private readonly IAuditService _audit;
    private readonly IRealtimeService _realtime;

    public TransactionService(AppDbContext db, ICurrentUserService currentUser, IAuditService audit, IRealtimeService realtime)
    {
        _db = db;
        _currentUser = currentUser;
        _audit = audit;
        _realtime = realtime;
    }

    public async Task<ApiResponse<TransactionDto>> CreateAsync(CreateTransactionRequest request, CancellationToken ct = default)
    {
        // Validate amounts
        if (request.TithesAmount < 0)
            return ApiResponse<TransactionDto>.Fail("Tithes cannot be negative.");
        if (request.OfferingAmount < 0)
            return ApiResponse<TransactionDto>.Fail("Offering cannot be negative.");
        if (request.TithesAmount + request.OfferingAmount <= 0)
            return ApiResponse<TransactionDto>.Fail("At least one amount must be greater than zero.");
        if (string.IsNullOrWhiteSpace(request.DonorName))
            return ApiResponse<TransactionDto>.Fail("Donor name is required.");

        // Find envelope
        var envelope = await _db.Envelopes.FirstOrDefaultAsync(e => e.Id == request.EnvelopeId, ct);
        if (envelope is null)
            return ApiResponse<TransactionDto>.Fail("Envelope not found.");
        if (envelope.Status == EnvelopeStatus.Disabled)
            return ApiResponse<TransactionDto>.Fail("This envelope is disabled.");

        // Determine session
        var sessionId = request.CollectionSessionId;
        CollectionSession? session = null;
        if (sessionId.HasValue)
        {
            session = await _db.CollectionSessions.FirstOrDefaultAsync(s => s.Id == sessionId.Value, ct);
            if (session is null)
                return ApiResponse<TransactionDto>.Fail("Collection session not found.");
            if (session.Status != SessionStatus.Active)
                return ApiResponse<TransactionDto>.Fail("Collection session is not active. Only active sessions can accept transactions.");
        }
        else
        {
            session = await _db.CollectionSessions.FirstOrDefaultAsync(s => s.Status == SessionStatus.Active, ct);
            if (session is null)
                return ApiResponse<TransactionDto>.Fail("No active collection session. Please contact the administrator.");
            sessionId = session.Id;
        }

        // Idempotency: if this UUID was already processed, return the existing transaction (prevent duplicates on sync)
        var existing = await _db.Transactions.AsNoTracking()
            .FirstOrDefaultAsync(t => t.TransactionUUID == request.TransactionUuid, ct);
        if (existing is not null)
            return ApiResponse<TransactionDto>.Ok(ToDto(existing), "Duplicate detected. Transaction already recorded.");

        var usherId = _currentUser.UserId ?? Guid.Empty;

        // Server-side total calculation - never trust the client
        var total = request.TithesAmount + request.OfferingAmount;

        var transaction = new Transaction
        {
            TransactionUUID = request.TransactionUuid,
            EnvelopeId = request.EnvelopeId,
            CollectionSessionId = sessionId.Value,
            DonorName = request.DonorName.Trim(),
            TithesAmount = request.TithesAmount,
            OfferingAmount = request.OfferingAmount,
            TotalAmount = total,
            Notes = request.Notes,
            UsherId = usherId,
            Status = TransactionStatus.Completed,
            SyncStatus = SyncStatus.Synced,
            CreatedAt = DateTime.UtcNow
        };

        _db.Transactions.Add(transaction);

        try
        {
            await _db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException)
        {
            // Only remaining unique constraint is TransactionUUID (sync idempotency).
            return ApiResponse<TransactionDto>.Fail("This transaction could not be saved. Please try again.");
        }

        var dto = ToDto(transaction);

        await _audit.LogAsync("Usher created Transaction", "Transaction",
            details: $"Donor '{transaction.DonorName}', total {transaction.TotalAmount:N2}",
            affectedRecordType: "Transaction", affectedRecordId: transaction.Id.ToString(), ct: ct);

        // Real-time notification to admin dashboard (unauthorized for ushers)
        await _realtime.SendTransactionCreatedAsync(new
        {
            transaction.Id,
            transaction.DonorName,
            transaction.TithesAmount,
            transaction.OfferingAmount,
            transaction.TotalAmount,
            EnvelopeCode = envelope.Code,
            SessionName = session.Name,
            UsherName = _currentUser.Username,
            transaction.CreatedAt
        }, ct);

        return ApiResponse<TransactionDto>.Ok(dto, "Collection saved successfully.");
    }

    public async Task<ApiResponse<PagedResult<TransactionDto>>> QueryAsync(TransactionQuery query, CancellationToken ct = default)
    {
        var q = _db.Transactions.AsNoTracking()
            .Include(t => t.Envelope).Include(t => t.CollectionSession).Include(t => t.Usher)
            .AsQueryable();

        if (query.IncludeArchived == true)
            q = q.IgnoreQueryFilters();

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var s = query.Search.Trim().ToLower();
            q = q.Where(t => t.DonorName.ToLower().Contains(s) || t.Envelope!.Code.ToLower().Contains(s));
        }
        if (query.SessionId.HasValue)
            q = q.Where(t => t.CollectionSessionId == query.SessionId.Value);
        if (query.UsherId.HasValue)
            q = q.Where(t => t.UsherId == query.UsherId.Value);
        if (query.From.HasValue)
            q = q.Where(t => t.CreatedAt >= query.From.Value.ToUniversalTime());
        if (query.To.HasValue)
            q = q.Where(t => t.CreatedAt <= query.To.Value.AddDays(1).ToUniversalTime());
        if (query.Status.HasValue)
            q = q.Where(t => (int)t.Status == query.Status.Value);

        var total = await q.CountAsync(ct);

        IQueryable<Transaction> ordered = query.SortOrder?.ToLower() == "asc"
            ? q.OrderBy(t => t.CreatedAt)
            : q.OrderByDescending(t => t.CreatedAt);

        var items = await ordered
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .ToListAsync(ct);

        return ApiResponse<PagedResult<TransactionDto>>.Ok(new PagedResult<TransactionDto>
        {
            Items = items.Select(ToDto).ToList(),
            TotalCount = total,
            Page = query.Page,
            PageSize = query.PageSize
        });
    }

    public async Task<ApiResponse<TransactionDto>> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        var t = await _db.Transactions.AsNoTracking()
            .Include(t => t.Envelope).Include(t => t.CollectionSession).Include(t => t.Usher).Include(t => t.VoidedBy)
            .FirstOrDefaultAsync(x => x.Id == id, ct);
        if (t is null)
            return ApiResponse<TransactionDto>.Fail("Transaction not found.");

        return ApiResponse<TransactionDto>.Ok(ToDto(t));
    }

    public async Task<ApiResponse<PagedResult<TransactionDto>>> GetMyHistoryAsync(TransactionQuery query, CancellationToken ct = default)
    {
        var userId = _currentUser.UserId;
        if (userId is null)
            return ApiResponse<PagedResult<TransactionDto>>.Fail("Not authenticated.");

        // Ushers can only see their own transactions
        if (_currentUser.Role == RoleType.Usher.ToString())
            query = query with { UsherId = userId };

        return await QueryAsync(query, ct);
    }

    public async Task<ApiResponse<TransactionDto>> VoidAsync(Guid id, string reason, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(reason))
            return ApiResponse<TransactionDto>.Fail("A reason is required to void a transaction.");

        var t = await _db.Transactions
            .Include(t => t.Envelope).Include(t => t.CollectionSession).Include(t => t.Usher).Include(t => t.VoidedBy)
            .FirstOrDefaultAsync(x => x.Id == id, ct);
        if (t is null)
            return ApiResponse<TransactionDto>.Fail("Transaction not found.");
        if (t.Status == TransactionStatus.Voided)
            return ApiResponse<TransactionDto>.Fail("Transaction is already voided.");
        if (t.UsherId != _currentUser.UserId && _currentUser.Role != RoleType.SuperAdmin.ToString() && _currentUser.Role != RoleType.Admin.ToString())
            return ApiResponse<TransactionDto>.Fail("You are not authorized to void this transaction.");

        t.Status = TransactionStatus.Voided;
        t.VoidedByUserId = _currentUser.UserId;
        t.VoidReason = reason.Trim();
        t.VoidedAt = DateTime.UtcNow;
        t.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        await _audit.LogAsync("Transaction voided", "Transaction",
            details: $"Transaction for '{t.DonorName}' voided. Reason: {reason}",
            affectedRecordType: "Transaction", affectedRecordId: t.Id.ToString(), ct: ct);

        await _realtime.SendTransactionUpdatedAsync(new { t.Id, t.DonorName, Status = "Voided" }, ct);

        return ApiResponse<TransactionDto>.Ok(ToDto(t), "Transaction voided.");
    }

    public async Task<ApiResponse<bool>> SetArchivedAsync(Guid id, bool archived, CancellationToken ct = default)
    {
        var t = await _db.Transactions.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (t is null)
            return ApiResponse<bool>.Fail("Transaction not found.");
        if (_currentUser.Role != RoleType.SuperAdmin.ToString() && _currentUser.Role != RoleType.Admin.ToString())
            return ApiResponse<bool>.Fail("You are not authorized to archive transactions.");

        t.IsArchived = archived;
        t.ArchivedAt = archived ? DateTime.UtcNow : null;
        t.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        await _audit.LogAsync(archived ? "Transaction archived" : "Transaction restored", "Transaction",
            details: $"Transaction for '{t.DonorName}' {(archived ? "archived" : "restored")}",
            affectedRecordType: "Transaction", affectedRecordId: t.Id.ToString(), ct: ct);

        return ApiResponse<bool>.Ok(true, archived ? "Transaction archived." : "Transaction restored.");
    }

    private static TransactionDto ToDto(Transaction t) =>
        new(t.Id, t.TransactionUUID, t.EnvelopeId, t.Envelope?.Code ?? "", t.CollectionSessionId,
            t.CollectionSession?.Name, t.DonorName, t.TithesAmount, t.OfferingAmount, t.TotalAmount,
            t.Notes, t.UsherId, t.Usher?.FullName, (int)t.Status, t.CreatedAt, t.VoidedAt, t.VoidReason, t.IsArchived);
}
