using CTOMS.Application.Common;

namespace CTOMS.Application.Features.Gis.Dtos;

public record DonorMapDto(
    Guid Id,
    string Name,
    double? Latitude,
    double? Longitude,
    decimal TotalAmount,
    int TransactionCount,
    DateTime? LastContributionAt);

public record DonorMapFilters(Guid? SessionId = null, DateTime? From = null, DateTime? To = null);

public record SetDonorLocationRequest(string Name, double Latitude, double Longitude);

public record CreateDonorRequest(string Name);

public interface IGisService
{
    Task<ApiResponse<List<DonorMapDto>>> GetDonorsAsync(DonorMapFilters filters, CancellationToken ct = default);
    Task<ApiResponse<bool>> SetLocationAsync(SetDonorLocationRequest request, CancellationToken ct = default);
    Task<ApiResponse<bool>> CreateDonorAsync(CreateDonorRequest request, CancellationToken ct = default);
}
