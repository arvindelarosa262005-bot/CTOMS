using CTOMS.Application.Common;

namespace CTOMS.Application.Features.Sessions.Dtos;

public record SessionDto(
    Guid Id,
    string Name,
    string ServiceType,
    DateTime Date,
    TimeSpan StartTime,
    TimeSpan EndTime,
    int Status,
    string? CreatedByName,
    DateTime CreatedAt,
    DateTime? StartedAt,
    DateTime? ClosedAt,
    int TransactionCount,
    decimal TithesTotal,
    decimal OfferingTotal,
    decimal GrandTotal,
    bool IsArchived);

public record CreateSessionRequest(string Name, string ServiceType, DateTime Date, TimeSpan StartTime, TimeSpan EndTime);

public record UpdateSessionRequest(string Name, string ServiceType, DateTime Date, TimeSpan StartTime, TimeSpan EndTime);

public record SessionQuery(int Page = 1, int PageSize = 20, string? Search = null, int? Status = null, DateTime? From = null, DateTime? To = null, bool? IncludeArchived = null);

public interface ISessionService
{
    Task<ApiResponse<List<SessionDto>>> GetAllAsync(SessionQuery query, CancellationToken ct = default);
    Task<ApiResponse<SessionDto>> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<ApiResponse<SessionDto>> CreateAsync(CreateSessionRequest request, CancellationToken ct = default);
    Task<ApiResponse<SessionDto>> UpdateAsync(Guid id, UpdateSessionRequest request, CancellationToken ct = default);
    Task<ApiResponse<SessionDto>> StartAsync(Guid id, CancellationToken ct = default);
    Task<ApiResponse<SessionDto>> CloseAsync(Guid id, CancellationToken ct = default);
    Task<ApiResponse<SessionDto?>> GetActiveAsync(CancellationToken ct = default);
    Task<ApiResponse<bool>> SetArchivedAsync(Guid id, bool archived, CancellationToken ct = default);
}
