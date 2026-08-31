using CTOMS.Application.Common;

namespace CTOMS.Application.Features.Dashboard.Dtos;

public record DashboardSummary(
    decimal TodayTithes,
    decimal TodayOffering,
    decimal TodayGrandTotal,
    int TodayTransactions,
    int ActiveUshers,
    Guid? ActiveSessionId,
    string? ActiveSessionName);

public record LiveCollection(
    Guid SessionId,
    string SessionName,
    decimal Tithes,
    decimal Offering,
    decimal GrandTotal,
    int Transactions,
    List<LiveTransaction> Activity);

public record LiveTransaction(
    Guid Id,
    string DonorName,
    decimal Tithes,
    decimal Offering,
    decimal Total,
    string? UsherName,
    DateTime CreatedAt);

public interface IDashboardService
{
    Task<ApiResponse<DashboardSummary>> GetSummaryAsync(CancellationToken ct = default);
    Task<ApiResponse<LiveCollection>> GetLiveCollectionAsync(CancellationToken ct = default);
    Task<ApiResponse<int>> GetActiveUsherCountAsync(CancellationToken ct = default);
}
