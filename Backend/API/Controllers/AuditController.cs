using CTOMS.Application.Features.Audit.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CTOMS.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "SuperAdmin,Admin")]
public class AuditController : ControllerBase
{
    private readonly IAuditQueryService _audit;

    public AuditController(IAuditQueryService audit)
    {
        _audit = audit;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] AuditQuery query, CancellationToken ct)
        => Ok(await _audit.QueryAsync(query, ct));
}
