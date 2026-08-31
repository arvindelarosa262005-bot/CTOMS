using System.Security.Cryptography;
using CTOMS.Application.Common;
using CTOMS.Application.Features.Envelopes.Dtos;
using CTOMS.Application.Interfaces;
using CTOMS.Domain.Entities;
using CTOMS.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using QRCoder;

namespace CTOMS.Infrastructure.Services;

public class EnvelopeService : IEnvelopeService
{
    private readonly AppDbContext _db;
    private readonly ICurrentUserService _currentUser;
    private readonly IAuditService _audit;

    public EnvelopeService(AppDbContext db, ICurrentUserService currentUser, IAuditService audit)
    {
        _db = db;
        _currentUser = currentUser;
        _audit = audit;
    }

    public async Task<ApiResponse<List<EnvelopeDto>>> CreateEnvelopesAsync(CreateEnvelopesRequest request, CancellationToken ct = default)
    {
        if (request.Count < 1 || request.Count > 500)
            return ApiResponse<List<EnvelopeDto>>.Fail("Count must be between 1 and 500.");

        var lastCode = await _db.Envelopes
            .OrderByDescending(e => e.CreatedAt)
            .Select(e => e.Code)
            .FirstOrDefaultAsync(ct);

        var created = new List<EnvelopeDto>();
        for (int i = 0; i < request.Count; i++)
        {
            var code = GenerateNextCode();
            var envelope = new Envelope
            {
                Code = code,
                QrToken = GenerateSecureToken(code),
                MemberName = request.MemberName,
                Status = EnvelopeStatus.Active,
                CreatedAt = DateTime.UtcNow
            };
            _db.Envelopes.Add(envelope);
            created.Add(ToDto(envelope));
        }

        await _db.SaveChangesAsync(ct);
        await _audit.LogAsync("Generated QR Codes", "Envelope", details: $"{request.Count} envelope(s) generated", affectedRecordType: "Envelope", ct: ct);

        return ApiResponse<List<EnvelopeDto>>.Ok(created, $"{created.Count} envelope(s) created.");
    }

    public async Task<ApiResponse<PagedResult<EnvelopeDto>>> QueryEnvelopesAsync(EnvelopeQuery query, CancellationToken ct = default)
    {
        var q = _db.Envelopes.AsNoTracking().AsQueryable();
        if (query.IncludeArchived == true)
            q = q.IgnoreQueryFilters();
        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var s = query.Search.Trim().ToLower();
            q = q.Where(e => e.Code.ToLower().Contains(s) || (e.MemberName != null && e.MemberName.ToLower().Contains(s)));
        }
        if (query.Status.HasValue)
            q = q.Where(e => (int)e.Status == query.Status.Value);

        var total = await q.CountAsync(ct);
        var items = await q
            .OrderByDescending(e => e.CreatedAt)
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(e => ToDto(e))
            .ToListAsync(ct);

        return ApiResponse<PagedResult<EnvelopeDto>>.Ok(new PagedResult<EnvelopeDto>
        {
            Items = items,
            TotalCount = total,
            Page = query.Page,
            PageSize = query.PageSize
        });
    }

    public async Task<ApiResponse<EnvelopeScanResult>> ScanAsync(string qrToken, Guid? sessionId, CancellationToken ct = default)
    {
        var envelope = await _db.Envelopes
            .AsNoTracking()
            .FirstOrDefaultAsync(e => e.QrToken == qrToken, ct);

        if (envelope is null)
            return ApiResponse<EnvelopeScanResult>.Fail("Invalid QR code. This envelope is not recognized by the system.");

        if (envelope.Status == EnvelopeStatus.Disabled)
            return ApiResponse<EnvelopeScanResult>.Fail("This envelope has been disabled. Please contact the administrator.");

        var result = new EnvelopeScanResult(envelope.Id, envelope.Code, true, false, null, null, false);

        if (sessionId.HasValue)
        {
            var alreadyUsed = await _db.Transactions
                .AsNoTracking()
                .FirstOrDefaultAsync(t => t.EnvelopeId == envelope.Id && t.CollectionSessionId == sessionId.Value, ct);
            if (alreadyUsed is not null)
            {
                result = result with { AlreadyUsedInSession = true, PreviousTransactionId = alreadyUsed.Id };
                return ApiResponse<EnvelopeScanResult>.Ok(result, "Envelope already recorded for current session.");
            }
        }

        // Smart history: find the most recent transaction for this envelope
        var last = await _db.Transactions
            .AsNoTracking()
            .OrderByDescending(t => t.CreatedAt)
            .FirstOrDefaultAsync(t => t.EnvelopeId == envelope.Id && t.Status == TransactionStatus.Completed, ct);

        if (last is not null)
        {
            result = result with { PreviousMemberName = last.DonorName, HasHistory = true };
        }
        else if (!string.IsNullOrEmpty(envelope.MemberName))
        {
            result = result with { PreviousMemberName = envelope.MemberName, HasHistory = true };
        }

        await _audit.LogAsync("Usher scanned Envelope", "Envelope", details: $"Envelope {envelope.Code} scanned", affectedRecordType: "Envelope", affectedRecordId: envelope.Id.ToString(), ct: ct);

        return ApiResponse<EnvelopeScanResult>.Ok(result, "Envelope verified.");
    }

    public async Task<ApiResponse<GenerateEnvelopeResult>> GetQrAsync(Guid envelopeId, CancellationToken ct = default)
    {
        var envelope = await _db.Envelopes.AsNoTracking().FirstOrDefaultAsync(e => e.Id == envelopeId, ct);
        if (envelope is null)
            return ApiResponse<GenerateEnvelopeResult>.Fail("Envelope not found.");

        var png = GenerateQrPng(envelope.QrToken);
        return ApiResponse<GenerateEnvelopeResult>.Ok(new GenerateEnvelopeResult(ToDto(envelope), png));
    }

    public async Task<ApiResponse<bool>> SetStatusAsync(Guid envelopeId, bool activate, CancellationToken ct = default)
    {
        var envelope = await _db.Envelopes.FirstOrDefaultAsync(e => e.Id == envelopeId, ct);
        if (envelope is null)
            return ApiResponse<bool>.Fail("Envelope not found.");

        envelope.Status = activate ? EnvelopeStatus.Active : EnvelopeStatus.Disabled;
        envelope.DisabledAt = activate ? null : DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        await _audit.LogAsync(activate ? "Envelope reactivated" : "Envelope disabled", "Envelope",
            details: $"Envelope {envelope.Code} {(activate ? "reactivated" : "disabled")}",
            affectedRecordType: "Envelope", affectedRecordId: envelope.Id.ToString(), ct: ct);

        return ApiResponse<bool>.Ok(true, activate ? "Envelope reactivated." : "Envelope disabled.");
    }

    public async Task<ApiResponse<bool>> SetArchivedAsync(Guid envelopeId, bool archived, CancellationToken ct = default)
    {
        var envelope = await _db.Envelopes.FirstOrDefaultAsync(e => e.Id == envelopeId, ct);
        if (envelope is null)
            return ApiResponse<bool>.Fail("Envelope not found.");

        envelope.IsArchived = archived;
        envelope.ArchivedAt = archived ? DateTime.UtcNow : null;
        await _db.SaveChangesAsync(ct);
        await _audit.LogAsync(archived ? "Envelope archived" : "Envelope restored", "Envelope",
            details: $"Envelope {envelope.Code} {(archived ? "archived" : "restored")}",
            affectedRecordType: "Envelope", affectedRecordId: envelope.Id.ToString(), ct: ct);

        return ApiResponse<bool>.Ok(true, archived ? "Envelope archived." : "Envelope restored.");
    }

    private static string GenerateNextCode()
    {
        var code = "ENV-" + GenerateRandomAlphanumeric(6).ToUpper();
        return code;
    }

    private static string GenerateSecureToken(string code)
    {
        // Secure random token that does not contain any personal/financial data
        var random = Convert.ToHexString(RandomNumberGenerator.GetBytes(16));
        return $"CTOMS:{code}:{random}";
    }

    private static string GenerateRandomAlphanumeric(int length)
    {
        const string chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        var data = RandomNumberGenerator.GetBytes(length);
        var sb = new System.Text.StringBuilder(length);
        foreach (var b in data)
            sb.Append(chars[b % chars.Length]);
        return sb.ToString();
    }

    private static string GenerateQrPng(string token)
    {
        using var generator = new QRCodeGenerator();
        using var data = generator.CreateQrCode(token, QRCodeGenerator.ECCLevel.Q);
        using var qrCode = new PngByteQRCode(data);
        var bytes = qrCode.GetGraphic(10);
        return System.Convert.ToBase64String(bytes);
    }

    private static EnvelopeDto ToDto(Envelope e) =>
        new(e.Id, e.Code, e.QrToken, e.MemberName, (int)e.Status, e.CreatedAt, e.IsArchived);
}
