using CTOMS.Application.Features.Dashboard.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CTOMS.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _dashboard;

    public DashboardController(IDashboardService dashboard)
    {
        _dashboard = dashboard;
    }

    [HttpGet("summary")]
    [Authorize(Roles = "SuperAdmin,Admin,Treasurer")]
    public async Task<IActionResult> Summary(CancellationToken ct)
        => Ok(await _dashboard.GetSummaryAsync(ct));

    [HttpGet("live")]
    [Authorize(Roles = "SuperAdmin,Admin,Treasurer")]
    public async Task<IActionResult> Live(CancellationToken ct)
        => Ok(await _dashboard.GetLiveCollectionAsync(ct));

    [HttpGet("active-ushers")]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<IActionResult> ActiveUshers(CancellationToken ct)
        => Ok(await _dashboard.GetActiveUsherCountAsync(ct));
}
