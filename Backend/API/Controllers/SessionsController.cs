using CTOMS.Application.Features.Sessions.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CTOMS.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SessionsController : ControllerBase
{
    private readonly ISessionService _sessions;

    public SessionsController(ISessionService sessions)
    {
        _sessions = sessions;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] SessionQuery query, CancellationToken ct)
        => Ok(await _sessions.GetAllAsync(query, ct));

    [HttpGet("active")]
    public async Task<IActionResult> GetActive(CancellationToken ct)
        => Ok(await _sessions.GetActiveAsync(ct));

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
        => Ok(await _sessions.GetByIdAsync(id, ct));

    [HttpPost]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<IActionResult> Create([FromBody] CreateSessionRequest request, CancellationToken ct)
        => Ok(await _sessions.CreateAsync(request, ct));

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateSessionRequest request, CancellationToken ct)
        => Ok(await _sessions.UpdateAsync(id, request, ct));

    [HttpPost("{id:guid}/start")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<IActionResult> Start(Guid id, CancellationToken ct)
        => Ok(await _sessions.StartAsync(id, ct));

    [HttpPost("{id:guid}/close")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<IActionResult> Close(Guid id, CancellationToken ct)
        => Ok(await _sessions.CloseAsync(id, ct));

    [HttpPatch("{id:guid}/archive")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<IActionResult> SetArchived(Guid id, [FromQuery] bool archived, CancellationToken ct)
        => Ok(await _sessions.SetArchivedAsync(id, archived, ct));
}
