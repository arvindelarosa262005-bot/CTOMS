using CTOMS.Application.Common;

namespace CTOMS.Application.Features.Audit.Dtos;

public record AuditLogDto(
    Guid Id,
    Guid? UserId,
    string? UserName,
    string Action,
    string Category,
    string? Details,
    string? DeviceInfo,
    string? IpAddress,
    string? AffectedRecordType,
    string? AffectedRecordId,
    DateTime CreatedAt);

public record AuditQuery(int Page = 1, int PageSize = 20, string? Search = null, Guid? UserId = null, DateTime? From = null, DateTime? To = null);

public interface IAuditQueryService
{
    Task<ApiResponse<PagedResult<AuditLogDto>>> QueryAsync(AuditQuery query, CancellationToken ct = default);
}
