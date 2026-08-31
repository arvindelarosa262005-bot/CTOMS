using CTOMS.Application.Common;
using CTOMS.Application.Features.Auth.Dtos;

namespace CTOMS.Application.Interfaces;

public interface ITokenService
{
    string GenerateAccessToken(Guid userId, string username, string role, out DateTime expiresAt);
    string GenerateRefreshToken(Guid userId, string jwtId, string deviceInfo, string ipAddress, DateTime expiresAt);
}

public interface IPasswordHasher
{
    string Hash(string password);
    bool Verify(string password, string hash);
}

public interface ICurrentUserService
{
    Guid? UserId { get; }
    string? Username { get; }
    string? Role { get; }
    string? IpAddress { get; }
    string? DeviceInfo { get; }
    bool IsAuthenticated { get; }
}

public interface IAuditService
{
    Task LogAsync(string action, string category, string? details = null,
        string? affectedRecordType = null, string? affectedRecordId = null,
        CancellationToken ct = default);
}

public interface ITokenValidationHelper
{
    bool TryGetPrincipalFromExpiredToken(string token, out System.Security.Claims.ClaimsPrincipal principal);
}
