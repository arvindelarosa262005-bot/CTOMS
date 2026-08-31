using CTOMS.Application.Common;

namespace CTOMS.Application.Features.Settings.Dtos;

public record ChurchSettingsDto(string ChurchName, string Address, string Contact, string Email, string LogoUrl);

public record UpdateChurchSettingsRequest(string ChurchName, string Address, string Contact, string Email, string LogoUrl);

public record BackupResult(string FileName, long SizeBytes, DateTime CreatedAt);

public interface ISettingsService
{
    Task<ApiResponse<ChurchSettingsDto>> GetAsync(CancellationToken ct = default);
    Task<ApiResponse<ChurchSettingsDto>> UpdateAsync(UpdateChurchSettingsRequest request, CancellationToken ct = default);
    Task<ApiResponse<BackupResult>> CreateBackupAsync(CancellationToken ct = default);
}
