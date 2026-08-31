using CTOMS.Application.Common;

namespace CTOMS.Application.Features.Auth.Dtos;

public record LoginRequest(string Username, string Password, string? DeviceInfo);

public record RefreshTokenRequest(string RefreshToken, string? DeviceInfo);

public record RegisterRequest(
    string FullName,
    string Username,
    string Email,
    string Password,
    int RoleId,
    string? DeviceInfo);

public record TokenResponse(
    string AccessToken,
    string RefreshToken,
    DateTime ExpiresAt,
    Guid UserId,
    string FullName,
    string Username,
    string Role);

public record CurrentUserDto(
    Guid Id,
    string FullName,
    string Username,
    string Email,
    string Role,
    UserStatusDto Status);

public enum UserStatusDto
{
    Active = 1,
    Disabled = 2,
    Pending = 3
}
