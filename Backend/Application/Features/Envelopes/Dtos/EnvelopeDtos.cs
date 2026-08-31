using CTOMS.Application.Common;

namespace CTOMS.Application.Features.Envelopes.Dtos;

public record EnvelopeDto(
    Guid Id,
    string Code,
    string QrToken,
    string? MemberName,
    int Status,
    DateTime CreatedAt,
    bool IsArchived);

public record CreateEnvelopesRequest(int Count, string? MemberName);

public record EnvelopeQuery(int Page = 1, int PageSize = 20, string? Search = null, int? Status = null, bool? IncludeArchived = null);

public record EnvelopeScanResult(
    Guid EnvelopeId,
    string Code,
    bool IsActive,
    bool AlreadyUsedInSession,
    string? PreviousMemberName,
    Guid? PreviousTransactionId,
    bool HasHistory);

public record GenerateEnvelopeResult(EnvelopeDto Envelope, string QrPngBase64);

public interface IEnvelopeService
{
    Task<ApiResponse<List<EnvelopeDto>>> CreateEnvelopesAsync(CreateEnvelopesRequest request, CancellationToken ct = default);
    Task<ApiResponse<PagedResult<EnvelopeDto>>> QueryEnvelopesAsync(EnvelopeQuery query, CancellationToken ct = default);
    Task<ApiResponse<EnvelopeScanResult>> ScanAsync(string qrToken, Guid? sessionId, CancellationToken ct = default);
    Task<ApiResponse<GenerateEnvelopeResult>> GetQrAsync(Guid envelopeId, CancellationToken ct = default);
    Task<ApiResponse<bool>> SetStatusAsync(Guid envelopeId, bool activate, CancellationToken ct = default);
    Task<ApiResponse<bool>> SetArchivedAsync(Guid envelopeId, bool archived, CancellationToken ct = default);
}
