using CTOMS.Application.Features.Users.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CTOMS.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly IUserService _users;

    public UsersController(IUserService users)
    {
        _users = users;
    }

    [HttpGet]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<IActionResult> GetAll([FromQuery] UserQuery query, CancellationToken ct)
        => Ok(await _users.GetAllAsync(query, ct));

    [HttpGet("roles")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<IActionResult> GetRoles(CancellationToken ct)
        => Ok(await _users.GetRolesAsync(ct));

    [HttpPost]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<IActionResult> Create([FromBody] CreateUserRequest request, CancellationToken ct)
        => Ok(await _users.CreateAsync(request, ct));

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateUserRequest request, CancellationToken ct)
        => Ok(await _users.UpdateAsync(id, request, ct));

    [HttpPatch("{id:guid}/status/{status:int}")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<IActionResult> SetStatus(Guid id, int status, CancellationToken ct)
        => Ok(await _users.SetStatusAsync(id, status, ct));

    [HttpPost("{id:guid}/reset-password")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<IActionResult> ResetPassword(Guid id, [FromBody] ResetPasswordBody body, CancellationToken ct)
        => Ok(await _users.ResetPasswordAsync(id, body.NewPassword, ct));

    [HttpPatch("{id:guid}/archive")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<IActionResult> SetArchived(Guid id, [FromQuery] bool archived, CancellationToken ct)
        => Ok(await _users.SetArchivedAsync(id, archived, ct));
}

public record ResetPasswordBody(string NewPassword);
