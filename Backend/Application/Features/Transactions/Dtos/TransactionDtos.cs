using CTOMS.Application.Common;

namespace CTOMS.Application.Features.Transactions.Dtos;

public record CreateTransactionRequest(
    Guid EnvelopeId,
    Guid? CollectionSessionId,
    string DonorName,
    decimal TithesAmount,
    decimal OfferingAmount,
    string? Notes,
    Guid TransactionUuid);

public record TransactionDto(
    Guid Id,
    Guid TransactionUUID,
    Guid EnvelopeId,
    string EnvelopeCode,
    Guid CollectionSessionId,
    string? CollectionSessionName,
    string DonorName,
    decimal TithesAmount,
    decimal OfferingAmount,
    decimal TotalAmount,
    string? Notes,
    Guid UsherId,
    string? UsherName,
    int Status,
    DateTime CreatedAt,
    DateTime? VoidedAt,
    string? VoidReason,
    bool IsArchived);

public record TransactionQuery(
    int Page = 1,
    int PageSize = 20,
    string? Search = null,
    Guid? SessionId = null,
    Guid? UsherId = null,
    DateTime? From = null,
    DateTime? To = null,
    int? Status = null,
    bool? IncludeArchived = null,
    string? SortBy = "CreatedAt",
    string? SortOrder = "desc");

public record VoidTransactionRequest(Guid Id, string Reason);

public interface ITransactionService
{
    Task<ApiResponse<TransactionDto>> CreateAsync(CreateTransactionRequest request, CancellationToken ct = default);
    Task<ApiResponse<PagedResult<TransactionDto>>> QueryAsync(TransactionQuery query, CancellationToken ct = default);
    Task<ApiResponse<TransactionDto>> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<ApiResponse<PagedResult<TransactionDto>>> GetMyHistoryAsync(TransactionQuery query, CancellationToken ct = default);
    Task<ApiResponse<TransactionDto>> VoidAsync(Guid id, string reason, CancellationToken ct = default);
    Task<ApiResponse<bool>> SetArchivedAsync(Guid id, bool archived, CancellationToken ct = default);
}
