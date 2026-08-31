using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using CTOMS.Application.Interfaces;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace CTOMS.Infrastructure.Security;

public class TokenService : ITokenService, ITokenValidationHelper
{
    private readonly JwtSettings _settings;

    public TokenService(IOptions<JwtSettings> settings)
    {
        _settings = settings.Value;
    }

    public string GenerateAccessToken(Guid userId, string username, string role, out DateTime expiresAt)
    {
        expiresAt = DateTime.UtcNow.AddMinutes(_settings.AccessTokenMinutes);
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_settings.Key));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, userId.ToString()),
            new Claim(JwtRegisteredClaimNames.UniqueName, username),
            new Claim(ClaimTypes.Role, role),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var token = new JwtSecurityToken(
            issuer: _settings.Issuer,
            audience: _settings.Audience,
            claims: claims,
            notBefore: DateTime.UtcNow,
            expires: expiresAt,
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public string GenerateRefreshToken(Guid userId, string jwtId, string deviceInfo, string ipAddress, DateTime expiresAt)
    {
        var randomNumber = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomNumber);
        var rawToken = Convert.ToBase64String(randomNumber);

        // Embed a marker so we can locate/validate, but the raw random token is the secret
        return System.Convert.ToBase64String(
            Encoding.UTF8.GetBytes($"{rawToken}.{userId}"));
    }

    public bool TryGetPrincipalFromExpiredToken(string token, out ClaimsPrincipal principal)
    {
        principal = new ClaimsPrincipal();
        try
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_settings.Key));
            var validationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateIssuerSigningKey = true,
                ValidateLifetime = false,
                ValidIssuer = _settings.Issuer,
                ValidAudience = _settings.Audience,
                IssuerSigningKey = key
            };

            var handler = new JwtSecurityTokenHandler();
            var result = handler.ValidateToken(token, validationParameters, out var validatedToken);
            principal = result;
            return validatedToken != null;
        }
        catch
        {
            return false;
        }
    }
}
