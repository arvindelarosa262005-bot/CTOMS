using CTOMS.Application.Common;
using CTOMS.Application.Features.Auth;
using CTOMS.Application.Features.Auth.Dtos;
using CTOMS.Application.Interfaces;
using CTOMS.Domain.Entities;
using CTOMS.Infrastructure.Persistence;
using CTOMS.Infrastructure.Realtime;
using CTOMS.Infrastructure.Security;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace CTOMS.Infrastructure.Services;

public class AuthService : IAuthService
{
    private readonly AppDbContext _db;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ITokenService _tokenService;
    private readonly ITokenValidationHelper _tokenValidationHelper;
    private readonly ICurrentUserService _currentUser;
    private readonly IAuditService _audit;
    private readonly IHubContext<CTOMSHub> _hub;
    private readonly IConfiguration _config;
    private readonly JwtSettings _jwtSettings;

    public AuthService(
        AppDbContext db,
        IPasswordHasher passwordHasher,
        ITokenService tokenService,
        ITokenValidationHelper tokenValidationHelper,
        ICurrentUserService currentUser,
        IAuditService audit,
        IHubContext<CTOMSHub> hub,
        IConfiguration config,
        Microsoft.Extensions.Options.IOptions<JwtSettings> jwtOptions)
    {
        _db = db;
        _passwordHasher = passwordHasher;
        _tokenService = tokenService;
        _tokenValidationHelper = tokenValidationHelper;
        _currentUser = currentUser;
        _audit = audit;
        _hub = hub;
        _config = config;
        _jwtSettings = jwtOptions.Value;
    }

    public async Task<ApiResponse<TokenResponse>> LoginAsync(LoginRequest request, CancellationToken ct = default)
    {
        var user = await _db.Users
            .Include(u => u.Role)
            .FirstOrDefaultAsync(u => u.Username == request.Username || u.Email == request.Username, ct);

        if (user is null || !_passwordHasher.Verify(request.Password, user.PasswordHash))
        {
            await _audit.LogAsync("Login failed", "Auth", details: $"Attempt for username '{request.Username}'", ct: ct);
            return ApiResponse<TokenResponse>.Fail("Invalid username or password.");
        }

        if (user.Status == UserStatus.Disabled)
            return ApiResponse<TokenResponse>.Fail("This account has been disabled. Contact the administrator.");

        user.LastLoginAt = DateTime.UtcNow;
        user.IsOnline = true;
        user.DeviceInfo = request.DeviceInfo;
        await _db.SaveChangesAsync(ct);

        var tokens = await IssueTokensAsync(user, request.DeviceInfo, ct);

        await _audit.LogAsync("User logged in", "Auth", details: $"{user.Username} logged in", affectedRecordType: "User", affectedRecordId: user.Id.ToString(), ct: ct);
        await _hub.Clients.All.SendAsync("UsherOnline", new { username = user.Username, fullName = user.FullName, role = user.Role?.Name, at = DateTime.UtcNow }, ct);

        return ApiResponse<TokenResponse>.Ok(tokens, "Login successful.");
    }

    public async Task<ApiResponse<TokenResponse>> RefreshAsync(RefreshTokenRequest request, CancellationToken ct = default)
    {
        var found = await _db.RefreshTokens
            .Include(r => r.User).ThenInclude(u => u!.Role)
            .FirstOrDefaultAsync(r => r.Token == request.RefreshToken && !r.IsUsed && !r.IsRevoked && r.ExpiresAt > DateTime.UtcNow, ct);

        if (found is null || found.User is null)
            return ApiResponse<TokenResponse>.Fail("Invalid or expired refresh token.");

        found.IsUsed = true;
        await _db.SaveChangesAsync(ct);

        var tokens = await IssueTokensAsync(found.User, request.DeviceInfo, ct);
        await _audit.LogAsync("Tokens refreshed", "Auth", details: $"{found.User.Username} refreshed tokens", ct: ct);

        return ApiResponse<TokenResponse>.Ok(tokens, "Tokens refreshed.");
    }

    public async Task<ApiResponse<bool>> LogoutAsync(string refreshToken, CancellationToken ct = default)
    {
        try
        {
            var found = await _db.RefreshTokens.FirstOrDefaultAsync(r => r.Token == refreshToken, ct);
            if (found is not null)
            {
                found.IsRevoked = true;
                await _db.SaveChangesAsync(ct);
            }

            var userId = found?.UserId;
            User? user = null;
            if (userId.HasValue)
                user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId.Value, ct);
            if (user is not null)
            {
                user.IsOnline = false;
                await _db.SaveChangesAsync(ct);
                await _hub.Clients.All.SendAsync("UsherOffline", new { username = user.Username, at = DateTime.UtcNow }, ct);
            }
        }
        catch
        {
            // ignore stale tokens
        }

        return ApiResponse<bool>.Ok(true, "Logged out.");
    }

    public async Task<ApiResponse<CurrentUserDto>> MeAsync(CancellationToken ct = default)
    {
        var userId = _currentUser.UserId;
        if (userId is null)
            return ApiResponse<CurrentUserDto>.Fail("Not authenticated.");

        var user = await _db.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.Id == userId, ct);
        if (user is null)
            return ApiResponse<CurrentUserDto>.Fail("User not found.");

        return ApiResponse<CurrentUserDto>.Ok(new CurrentUserDto(
            user.Id, user.FullName, user.Username, user.Email, user.Role!.Name, (UserStatusDto)(int)user.Status));
    }

    public async Task<ApiResponse<bool>> ChangePasswordAsync(string currentPassword, string newPassword, CancellationToken ct = default)
    {
        var userId = _currentUser.UserId;
        if (userId is null)
            return ApiResponse<bool>.Fail("Not authenticated.");

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId, ct);
        if (user is null)
            return ApiResponse<bool>.Fail("User not found.");

        if (!_passwordHasher.Verify(currentPassword, user.PasswordHash))
            return ApiResponse<bool>.Fail("Current password is incorrect.");

        user.PasswordHash = _passwordHasher.Hash(newPassword);
        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        await _audit.LogAsync("Password changed", "Auth", details: $"{user.Username} changed password", ct: ct);

        return ApiResponse<bool>.Ok(true, "Password changed.");
    }

    private async Task<TokenResponse> IssueTokensAsync(User user, string? deviceInfo, CancellationToken ct)
    {
        var accessToken = _tokenService.GenerateAccessToken(user.Id, user.Username, user.Role!.Name, out var expiresAt);
        var refreshToken = new RefreshToken
        {
            UserId = user.Id,
            Token = string.Empty, // placeholder replaced below
            ExpiresAt = DateTime.UtcNow.AddDays(_jwtSettings.RefreshTokenDays),
            JwtId = Guid.NewGuid().ToString(),
            DeviceInfo = deviceInfo,
            IpAddress = _currentUser.IpAddress
        };

        var refreshTokenValue = _tokenService.GenerateRefreshToken(user.Id, refreshToken.JwtId, deviceInfo ?? "", _currentUser.IpAddress ?? "", refreshToken.ExpiresAt);
        refreshToken.Token = refreshTokenValue;
        _db.RefreshTokens.Add(refreshToken);
        await _db.SaveChangesAsync(ct);

        return new TokenResponse(accessToken, refreshTokenValue, expiresAt, user.Id, user.FullName, user.Username, user.Role.Name);
    }

    public async Task SeedAsync(CancellationToken ct = default)
    {
        // Roles
        if (!await _db.Roles.AnyAsync(ct))
        {
            _db.Roles.AddRange(new[]
            {
                new Role { Type = RoleType.SuperAdmin, Name = "SuperAdmin", Description = "Full system access" },
                new Role { Type = RoleType.Admin, Name = "Admin", Description = "Manages sessions, envelopes, ushers, transactions, reports" },
                new Role { Type = RoleType.Treasurer, Name = "Treasurer", Description = "Views financial records and generates reports" },
                new Role { Type = RoleType.Usher, Name = "Usher", Description = "Scans and enters transactions" }
            });
            await _db.SaveChangesAsync(ct);
        }

        // Super Admin
        if (!await _db.Users.AnyAsync(ct))
        {
            var superAdminRole = await _db.Roles.FirstOrDefaultAsync(r => r.Type == RoleType.SuperAdmin, ct);
            if (superAdminRole is not null)
            {
                var adminUsername = _config["Seed:AdminUsername"] ?? "admin";
                var adminPassword = _config["Seed:AdminPassword"] ?? "Admin@12345";
                _db.Users.Add(new User
                {
                    FullName = "System Administrator",
                    Username = adminUsername,
                    Email = _config["Seed:AdminEmail"] ?? "admin@church.local",
                    PasswordHash = _passwordHasher.Hash(adminPassword),
                    RoleId = superAdminRole.Id,
                    Status = UserStatus.Active,
                    CreatedAt = DateTime.UtcNow
                });
                await _db.SaveChangesAsync(ct);
            }
        }

        // Church settings defaults
        if (!await _db.ChurchSettings.AnyAsync(ct))
        {
            var defaults = new Dictionary<string, string>
            {
                ["ChurchName"] = "Christ Centered Christian Church Philippines Global Incorporated",
                ["Address"] = "",
                ["Contact"] = "",
                ["Email"] = "",
                ["LogoUrl"] = ""
            };
            _db.ChurchSettings.AddRange(defaults.Select(kv => new ChurchSetting { Key = kv.Key, Value = kv.Value }));
            await _db.SaveChangesAsync(ct);
        }
    }
}
