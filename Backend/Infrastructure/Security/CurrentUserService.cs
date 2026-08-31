using System.Security.Claims;
using CTOMS.Application.Interfaces;
using Microsoft.AspNetCore.Http;

namespace CTOMS.Infrastructure.Security;

public class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _accessor;

    public CurrentUserService(IHttpContextAccessor accessor)
    {
        _accessor = accessor;
    }

    private ClaimsPrincipal? User => _accessor.HttpContext?.User;

    public Guid? UserId
    {
        get
        {
            var id = User?.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? User?.FindFirstValue("sub");
            return Guid.TryParse(id, out var g) ? g : null;
        }
    }

    public string? Username => User?.FindFirstValue(JwtRegisteredClaimNames.UniqueName)
                              ?? User?.FindFirstValue(ClaimTypes.Name);

    public string? Role => User?.FindFirstValue(ClaimTypes.Role);

    public string? IpAddress => _accessor.HttpContext?.Connection.RemoteIpAddress?.ToString();

    public string? DeviceInfo => _accessor.HttpContext?.Request.Headers["User-Agent"];

    public bool IsAuthenticated => User?.Identity?.IsAuthenticated == true;

    // needed because JwtRegisteredClaimNames is in System.IdentityModel.Tokens.Jwt
    private static class JwtRegisteredClaimNames
    {
        public const string UniqueName = "unique_name";
    }
}
