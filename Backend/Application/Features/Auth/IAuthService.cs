using CTOMS.Application.Common;
using CTOMS.Application.Features.Auth.Dtos;

namespace CTOMS.Application.Features.Auth;

public interface IAuthService
{
    Task<ApiResponse<TokenResponse>> LoginAsync(LoginRequest request, CancellationToken ct = default);
    Task<ApiResponse<TokenResponse>> RefreshAsync(RefreshTokenRequest request, CancellationToken ct = default);
    Task<ApiResponse<bool>> LogoutAsync(string refreshToken, CancellationToken ct = default);
    Task<ApiResponse<CurrentUserDto>> MeAsync(CancellationToken ct = default);
    Task<ApiResponse<bool>> ChangePasswordAsync(string currentPassword, string newPassword, CancellationToken ct = default);
    Task SeedAsync(CancellationToken ct = default);
}
